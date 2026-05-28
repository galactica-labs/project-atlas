"""Telemetry feature engineering for the time-to-failure forecaster.

This replaces the electricity-market feature stack (fuels / weather / ENTSO-E /
Greek-holiday / solar-geometry) from the vendored renewable-energy model. The
LightGBM quantile core is unchanged; only what we feed it changes.

Domain mapping (renewable model -> Atlas):
    dam_price_eur_mwh   ->  the asset metric we forecast (e.g. supply_temperature)
    price lags/rolls    ->  metric lags/rolls
    fuel/weather drivers->  neighbour-asset metrics pulled from the AGE graph

Forecasting strategy: **direct, horizon-as-feature**. Instead of a recursive
roll-out (which compounds error), we train each quantile model to predict the
metric value `h` ticks ahead, with `h` itself as an input feature. One trained
model then produces the whole q-trajectory by sweeping `h` over the horizon.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

# lags / rolling windows expressed in MINUTES (converted to ticks at build time)
LAG_MINUTES = [1, 5, 15, 60]
ROLL_MINUTES = [5, 15, 60]


def _calendar_features(idx: pd.DatetimeIndex) -> pd.DataFrame:
    hour = idx.hour + idx.minute / 60.0
    dow = idx.dayofweek.to_numpy(dtype=float)
    month = idx.month.to_numpy(dtype=float)
    return pd.DataFrame(
        {
            "hour_sin": np.sin(2 * np.pi * hour / 24.0),
            "hour_cos": np.cos(2 * np.pi * hour / 24.0),
            "dow_sin": np.sin(2 * np.pi * dow / 7.0),
            "dow_cos": np.cos(2 * np.pi * dow / 7.0),
            "month_sin": np.sin(2 * np.pi * month / 12.0),
            "month_cos": np.cos(2 * np.pi * month / 12.0),
            "is_weekend": (dow >= 5).astype(float),
        },
        index=idx,
    )


def _min_to_ticks(minutes: int, tick_seconds: int) -> int:
    return max(1, round(minutes * 60 / tick_seconds))


def _lag_roll_features(s: pd.Series, tick_seconds: int) -> pd.DataFrame:
    out = {}
    for m in LAG_MINUTES:
        out[f"lag_{m}m"] = s.shift(_min_to_ticks(m, tick_seconds))
    for m in ROLL_MINUTES:
        w = _min_to_ticks(m, tick_seconds)
        if w < 2:  # window finer than the sample rate carries no rolling signal
            continue
        mp = max(2, w // 2)
        out[f"rollmean_{m}m"] = s.shift(1).rolling(w, min_periods=mp).mean()
        out[f"rollstd_{m}m"] = s.shift(1).rolling(w, min_periods=mp).std()
    return pd.DataFrame(out, index=s.index)


def _origin_features(
    target: pd.Series,
    neighbors: pd.DataFrame | None,
    tick_seconds: int,
) -> pd.DataFrame:
    """Everything known at origin time t (no horizon term yet)."""
    feats = [_calendar_features(target.index), _lag_roll_features(target, tick_seconds)]
    feats.append(pd.DataFrame({"current": target.values}, index=target.index))
    if neighbors is not None and not neighbors.empty:
        nb = neighbors.reindex(target.index).ffill()
        nb = nb.add_prefix("nb__")
        feats.append(nb)
    return pd.concat(feats, axis=1)


def build_supervised(
    target: pd.Series,
    neighbors: pd.DataFrame | None,
    horizons_ticks: list[int],
    tick_seconds: int,
) -> tuple[pd.DataFrame, pd.Series]:
    """Build the (X, y) training matrix for direct multi-horizon regression.

    For every origin t and every horizon h in `horizons_ticks` we emit one row:
      X = origin_features(t) + {"horizon_ticks": h, "horizon_seconds": h*tick}
      y = target(t + h)
    """
    target = target.sort_index().astype(float)
    base = _origin_features(target, neighbors, tick_seconds)

    X_parts, y_parts = [], []
    for h in horizons_ticks:
        y_h = target.shift(-h)
        Xh = base.copy()
        Xh["horizon_ticks"] = float(h)
        Xh["horizon_seconds"] = float(h * tick_seconds)
        valid = Xh.notna().all(axis=1) & y_h.notna()
        X_parts.append(Xh.loc[valid])
        y_parts.append(y_h.loc[valid])

    # multiple horizons reuse the same origin timestamp -> duplicate labels.
    # Keep X/y positionally aligned; sort chronologically for the time-split.
    X = pd.concat(X_parts)
    y = pd.concat(y_parts)
    order = np.argsort(X.index.values, kind="stable")
    X = X.iloc[order].reset_index(drop=True)
    y = y.iloc[order].reset_index(drop=True)
    return X, y


def build_inference_features(
    window: pd.Series,
    neighbors: pd.DataFrame | None,
    horizons_ticks: list[int],
    tick_seconds: int,
) -> pd.DataFrame:
    """One row per horizon for the latest origin in `window` (current state)."""
    window = window.sort_index().astype(float)
    base = _origin_features(window, neighbors, tick_seconds)
    last = base.iloc[[-1]]
    rows = []
    for h in horizons_ticks:
        r = last.copy()
        r["horizon_ticks"] = float(h)
        r["horizon_seconds"] = float(h * tick_seconds)
        rows.append(r)
    out = pd.concat(rows, ignore_index=True)
    return out

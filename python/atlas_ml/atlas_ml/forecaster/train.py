"""Training driver: one QuantileForecaster per (asset_type, metric).

Input is long-form seed telemetry (coordination doc §9.3: 30 days x 50 assets).
For each critical (asset_type, metric) pair we pool every asset of that type,
build the direct multi-horizon supervised matrix, train q05/q50/q95, and save to
    models/triton/{asset_type}_{metric}/
loadable by Triton (agents/triton/forecaster.py) via QuantileForecaster.load().
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from atlas_ml.forecaster.features import build_supervised
from atlas_ml.forecaster.model import QuantileForecaster

# (asset_type, metric) pairs Triton forecasts. ~12 critical pairs (doc §5.6).
CRITICAL_PAIRS = [
    ("chiller", "supply_temperature"),
    ("chiller", "compressor_pressure"),
    ("crah", "return_temperature"),
    ("pump", "flow_rate"),
    ("pdu", "load_pct"),
    ("ups", "battery_temperature"),
    ("gpu_pod", "inlet_temperature"),
]

# default forecast resolution: 5-min buckets, 30-min horizon (doc §5.6)
DEFAULT_TICK_SECONDS = 300
DEFAULT_HORIZON_SECONDS = 1800

REQUIRED_COLS = {"ts", "asset_id", "asset_type", "metric", "value"}


def _horizons(tick_seconds: int, horizon_seconds: int) -> list[int]:
    return list(range(1, max(1, horizon_seconds // tick_seconds) + 1))


def train_pair(
    telemetry: pd.DataFrame,
    asset_type: str,
    metric: str,
    out_root: str | Path = "models/triton",
    tick_seconds: int = DEFAULT_TICK_SECONDS,
    horizon_seconds: int = DEFAULT_HORIZON_SECONDS,
) -> Path | None:
    """Pool all assets of `asset_type`, train, save. Returns artifact dir or None."""
    sub = telemetry[(telemetry.asset_type == asset_type) & (telemetry.metric == metric)]
    if sub.empty:
        print(f"  skip {asset_type}/{metric}: no telemetry")
        return None

    horizons = _horizons(tick_seconds, horizon_seconds)
    X_parts, y_parts = [], []
    for asset_id, g in sub.groupby("asset_id"):
        s = (
            g.assign(ts=pd.to_datetime(g.ts, utc=True))
            .set_index("ts")["value"]
            .sort_index()
            .resample(f"{tick_seconds}s").mean()
            .interpolate(limit=3)
            .dropna()
        )
        if len(s) < max(horizons) + 50:
            continue
        Xa, ya = build_supervised(s, neighbors=None, horizons_ticks=horizons, tick_seconds=tick_seconds)
        X_parts.append(Xa)
        y_parts.append(ya)

    if not X_parts:
        print(f"  skip {asset_type}/{metric}: insufficient history")
        return None

    X = pd.concat(X_parts, ignore_index=True)
    y = pd.concat(y_parts, ignore_index=True)

    qf = QuantileForecaster().fit(X, y)
    out = Path(out_root) / f"{asset_type}_{metric}"
    qf.save(out)
    print(f"  trained {asset_type}/{metric}: {qf.metrics} -> {out}")
    return out


def train_all(
    telemetry: pd.DataFrame,
    pairs: list[tuple[str, str]] = CRITICAL_PAIRS,
    out_root: str | Path = "models/triton",
    tick_seconds: int = DEFAULT_TICK_SECONDS,
    horizon_seconds: int = DEFAULT_HORIZON_SECONDS,
) -> list[Path]:
    missing = REQUIRED_COLS - set(telemetry.columns)
    if missing:
        raise ValueError(f"telemetry missing columns: {missing}")
    saved = []
    for asset_type, metric in pairs:
        p = train_pair(telemetry, asset_type, metric, out_root, tick_seconds, horizon_seconds)
        if p:
            saved.append(p)
    return saved

"""Turn a quantile trajectory into Triton's time-to-failure / lifespan answer.

"When is this asset going to fail" = first time a forecast quantile crosses the
asset's failure threshold (from the manual). The three quantiles give a
calibrated remaining-useful-life interval:

    pessimistic RUL  -> the band that reaches the threshold soonest
    expected RUL     -> q50 crossing
    optimistic RUL   -> the band that reaches it latest

The width of the band (q95-q05) is the uncertainty signal the policy engine
uses to route to a human (coordination doc §2.2).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from atlas_ml.forecaster.features import build_inference_features
from atlas_ml.forecaster.model import QuantileForecaster
from atlas_ml.schemas import QuantileForecast


def _first_cross_seconds(
    traj: np.ndarray,
    threshold: float,
    direction: str,
    tick_seconds: int,
) -> int | None:
    if direction == "above":
        hits = np.where(traj >= threshold)[0]
    else:
        hits = np.where(traj <= threshold)[0]
    if len(hits) == 0:
        return None
    # trajectory index i corresponds to (i+1) ticks ahead
    return int((hits[0] + 1) * tick_seconds)


def _naive_trajectory(window: pd.Series, n_steps: int) -> np.ndarray:
    """Linear extrapolation of the recent slope — Triton's hour-3 fallback."""
    y = window.sort_index().astype(float).to_numpy()
    k = min(len(y), 12)
    if k < 2:
        return np.full(n_steps, y[-1] if len(y) else 0.0)
    x = np.arange(k)
    slope, intercept = np.polyfit(x, y[-k:], 1)
    base = intercept + slope * (k - 1)
    return base + slope * np.arange(1, n_steps + 1)


def forecast(
    forecaster: QuantileForecaster | None,
    window: pd.Series,
    metric: str,
    threshold: float,
    *,
    neighbors: pd.DataFrame | None = None,
    threshold_direction: str = "above",
    tick_seconds: int = 300,
    horizon_seconds: int = 1800,
) -> QuantileForecast:
    n_steps = max(1, horizon_seconds // tick_seconds)
    horizons = list(range(1, n_steps + 1))

    if forecaster is not None:
        Xinf = build_inference_features(window, neighbors, horizons, tick_seconds)
        q = forecaster.predict_quantiles(Xinf)
        q05, q50, q95 = q[0.05], q[0.50], q[0.95]
    else:
        q50 = _naive_trajectory(window, n_steps)
        # widen a synthetic band around the naive path so HITL still gets a signal
        spread = float(np.std(window.to_numpy()[-12:])) if len(window) >= 2 else 1.0
        spread = max(spread, 1e-3)
        q05 = q50 - 1.64 * spread
        q95 = q50 + 1.64 * spread

    soonest, latest = (q95, q05) if threshold_direction == "above" else (q05, q95)
    return QuantileForecast(
        metric=metric,
        horizon_seconds=horizon_seconds,
        q05=[float(v) for v in q05],
        q50=[float(v) for v in q50],
        q95=[float(v) for v in q95],
        threshold=threshold,
        threshold_direction=threshold_direction,
        time_to_q50_crosses_threshold=_first_cross_seconds(q50, threshold, threshold_direction, tick_seconds),
        time_to_q95_crosses_threshold=_first_cross_seconds(soonest, threshold, threshold_direction, tick_seconds),
        uncertainty_band_width=float(np.mean(np.asarray(q95) - np.asarray(q05))),
    )


def remaining_useful_life(qf: QuantileForecast, tick_seconds: int = 300) -> dict:
    """Derive the RUL interval (seconds) from a QuantileForecast.

    pessimistic = soonest-failing band crossing (== time_to_q95_* by construction)
    expected    = q50 crossing
    optimistic  = latest-failing band crossing
    None means "no failure predicted within the forecast horizon".
    """
    direction = qf.threshold_direction
    soonest, latest = (qf.q95, qf.q05) if direction == "above" else (qf.q05, qf.q95)
    return {
        "pessimistic_seconds": _first_cross_seconds(np.asarray(soonest), qf.threshold, direction, tick_seconds),
        "expected_seconds": qf.time_to_q50_crosses_threshold,
        "optimistic_seconds": _first_cross_seconds(np.asarray(latest), qf.threshold, direction, tick_seconds),
        "uncertainty_band_width": qf.uncertainty_band_width,
    }

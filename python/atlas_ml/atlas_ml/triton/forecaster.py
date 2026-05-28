"""Triton's forecaster wrapper.

Loads the per-(asset_type, metric) QuantileForecaster artifact (Agent 17's
training output), resolves the failure threshold from the catalog, and returns a
QuantileForecast. Caches loaded models. Falls back to the naive linear forecast
when no artifact exists (coordination doc hour-3 cutoff).
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from atlas_ml.assets import catalog
from atlas_ml.forecaster.model import QuantileForecaster
from atlas_ml.forecaster.predict import forecast as _forecast
from atlas_ml.schemas import QuantileForecast


class TritonForecaster:
    def __init__(self, models_root: str | Path = "models/triton",
                 tick_seconds: int = 300, horizon_seconds: int = 1800):
        self.models_root = Path(models_root)
        self.tick_seconds = tick_seconds
        self.horizon_seconds = horizon_seconds
        self._cache: dict[tuple[str, str], QuantileForecaster | None] = {}

    def _load(self, asset_type: str, metric: str) -> QuantileForecaster | None:
        key = (asset_type, metric)
        if key in self._cache:
            return self._cache[key]
        path = self.models_root / f"{asset_type}_{metric}"
        model = QuantileForecaster.load(path) if (path / "meta.json").exists() else None
        self._cache[key] = model
        return model

    def predict(self, asset_id: str, metric: str, window: pd.Series) -> QuantileForecast:
        atype = catalog.asset_type(asset_id) or "unknown"
        thr = catalog.threshold(asset_id, metric)
        threshold, direction = thr if thr else (float("inf"), "above")
        model = self._load(atype, metric)
        return _forecast(
            model, window, metric, threshold,
            threshold_direction=direction,
            tick_seconds=self.tick_seconds,
            horizon_seconds=self.horizon_seconds,
        )

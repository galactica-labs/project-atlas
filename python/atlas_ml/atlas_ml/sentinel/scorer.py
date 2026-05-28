"""Sentinel: z-score anomaly detection on the live telemetry stream.

Pure statistics, no training (coordination doc §2.1). One baseline per
(asset_id, metric). Each tick is scored against the rolling baseline; when
|z| exceeds the warn/critical thresholds an AnomalySignal is emitted and the
sample is withheld from the baseline so the fault cannot mask itself.

Wire `Sentinel.tick()` to the Redis `telemetry_tick` channel; publish the
returned AnomalySignal to `anomaly_events`. Triton consumes it.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from atlas_ml.schemas import AnomalySignal
from atlas_ml.sentinel.baseline import RollingBaseline


class Sentinel:
    def __init__(
        self,
        warn_z: float = 3.0,
        critical_z: float = 4.0,
        window: int = 360,
        min_samples: int = 30,
        seeds: dict[tuple[str, str], tuple[float, float]] | None = None,
    ):
        """seeds: {(asset_id, metric): (mean, std)} precomputed from 30-day seed."""
        self.warn_z = warn_z
        self.critical_z = critical_z
        self._window = window
        self._min_samples = min_samples
        self._seeds = seeds or {}
        self._baselines: dict[tuple[str, str], RollingBaseline] = {}

    def _baseline(self, asset_id: str, metric: str) -> RollingBaseline:
        key = (asset_id, metric)
        b = self._baselines.get(key)
        if b is None:
            seed_mean, seed_std = self._seeds.get(key, (None, None))
            b = RollingBaseline(
                window=self._window,
                min_samples=self._min_samples,
                seed_mean=seed_mean,
                seed_std=seed_std,
            )
            self._baselines[key] = b
        return b

    def tick(
        self,
        asset_id: str,
        metric: str,
        value: float,
        at: datetime | None = None,
    ) -> AnomalySignal | None:
        """Score one sample. Returns an AnomalySignal if anomalous, else None."""
        at = at or datetime.now(timezone.utc)
        b = self._baseline(asset_id, metric)

        if not b.ready():
            b.update(value)
            return None

        mean, std = b.stats()
        z = (value - mean) / std
        az = abs(z)

        if az < self.warn_z:
            b.update(value)  # normal — fold into baseline
            return None

        severity = "critical" if az >= self.critical_z else "warn"
        # do NOT update baseline: keep the fault out of the reference distribution
        return AnomalySignal(
            id=str(uuid.uuid4()),
            asset_id=asset_id,
            metric=metric,
            current_value=value,
            baseline_mean=mean,
            baseline_std=std,
            z_score=z,
            severity=severity,
            detected_at=at,
        )

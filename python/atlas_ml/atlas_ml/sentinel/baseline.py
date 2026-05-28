"""Rolling baseline per (asset_id, metric).

Seasonality matters: a chiller supply temp swings on a daily sinusoid, so a flat
global mean would false-positive every afternoon. We keep the baseline as a
rolling window over recent samples (short enough to track the diurnal cycle,
long enough to be stable) and optionally warm-start it from the 30-day seed so
Sentinel does not need a cold warm-up period (coordination doc §9.3).

Anomalous samples are NOT folded back into the baseline — otherwise a slow drift
fault would pull the mean along with it and the z-score would never fire.
"""
from __future__ import annotations

import math
from collections import deque


class RollingBaseline:
    def __init__(
        self,
        window: int = 360,           # samples kept; at 1s tick = 6 min, at 5min = 30h
        min_samples: int = 30,       # below this, z-score is not trustworthy
        seed_mean: float | None = None,
        seed_std: float | None = None,
        min_std: float = 1e-6,       # floor; avoids divide-by-zero on flat signals
    ):
        self.window = window
        self.min_samples = min_samples
        self.min_std = min_std
        self._buf: deque[float] = deque(maxlen=window)
        self._seed_mean = seed_mean
        self._seed_std = seed_std

    def ready(self) -> bool:
        return len(self._buf) >= self.min_samples or self._seed_mean is not None

    def stats(self) -> tuple[float, float]:
        """Return (mean, std). Falls back to the seed until enough live samples."""
        n = len(self._buf)
        if n >= self.min_samples:
            mean = sum(self._buf) / n
            var = sum((x - mean) ** 2 for x in self._buf) / n
            std = math.sqrt(var)
            return mean, max(std, self.min_std)
        if self._seed_mean is not None:
            return self._seed_mean, max(self._seed_std or self.min_std, self.min_std)
        # not enough data and no seed
        if n == 0:
            return 0.0, self.min_std
        mean = sum(self._buf) / n
        return mean, self.min_std

    def update(self, value: float) -> None:
        """Fold a NORMAL sample into the baseline. Skip this for anomalies."""
        self._buf.append(value)

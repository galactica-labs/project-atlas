"""Standalone synthetic telemetry — lets the ML layer be trained/tested before
Agent 3's generator and Agent 2's seed DB exist. Mirrors the patterns in
coordination doc §9.3 (daily sinusoid + correlated noise) and can inject the
demo drift fault on CHILLER-A-03 supply_temperature.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

# (asset_id, asset_type, metric, mean, daily_amp, noise_std)
DEFAULT_ASSETS = [
    ("CHILLER-A-01", "chiller", "supply_temperature", 44.0, 1.5, 0.8),
    ("CHILLER-A-02", "chiller", "supply_temperature", 44.0, 1.5, 0.8),
    ("CHILLER-A-03", "chiller", "supply_temperature", 44.0, 1.5, 0.8),
    ("CRAH-A-01", "crah", "return_temperature", 75.0, 2.0, 1.2),
    ("CRAH-A-02", "crah", "return_temperature", 75.0, 2.0, 1.2),
    ("PDU-A", "pdu", "load_pct", 72.0, 8.0, 1.5),
    ("PUMP-CHW-03", "pump", "flow_rate", 120.0, 6.0, 2.0),
]


def generate(
    days: int = 30,
    tick_seconds: int = 300,
    seed: int = 7,
    assets=DEFAULT_ASSETS,
    drift_asset: str | None = None,
    drift_per_hour: float = 2.0,
) -> pd.DataFrame:
    """Return long-form telemetry: columns [ts, asset_id, asset_type, metric, value]."""
    rng = np.random.default_rng(seed)
    n = int(days * 24 * 3600 / tick_seconds)
    idx = pd.date_range("2026-04-01", periods=n, freq=f"{tick_seconds}s", tz="UTC")
    hour = idx.hour + idx.minute / 60.0
    rows = []
    for asset_id, atype, metric, mean, amp, noise in assets:
        daily = amp * np.sin(2 * np.pi * hour / 24.0)
        ar = np.zeros(n)
        e = rng.normal(0, noise, n)
        for i in range(1, n):  # AR(1) correlated noise
            ar[i] = 0.85 * ar[i - 1] + e[i]
        val = mean + daily + ar
        if drift_asset == asset_id:
            t_hours = np.arange(n) * tick_seconds / 3600.0
            ramp_start = int(n * 0.7)
            drift = np.where(np.arange(n) >= ramp_start,
                             drift_per_hour * (t_hours - t_hours[ramp_start]), 0.0)
            val = val + drift
        rows.append(pd.DataFrame({
            "ts": idx, "asset_id": asset_id, "asset_type": atype,
            "metric": metric, "value": val,
        }))
    return pd.concat(rows, ignore_index=True)


def seed_baselines(telemetry: pd.DataFrame) -> dict[tuple[str, str], tuple[float, float]]:
    """Precompute (mean, std) per (asset_id, metric) for Sentinel warm-start."""
    out = {}
    for (aid, metric), g in telemetry.groupby(["asset_id", "metric"]):
        out[(aid, metric)] = (float(g.value.mean()), float(g.value.std()))
    return out

"""Data backends for the MCP servers.

In production these read Redis/TimescaleDB/Postgres. Standalone they synthesize
deterministic values from per-(asset_type, metric) profiles and read incident
history from the Mnemos corpus, so the MCP surface answers without the DB up.
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

from atlas_ml.assets import catalog
from atlas_ml.mnemos.store import TupleStore

# (asset_type, metric) -> (mean, daily_amp, unit)
_PROFILES = {
    ("chiller", "supply_temperature"): (44.0, 1.5, "fahrenheit"),
    ("chiller", "compressor_pressure"): (310.0, 12.0, "psi"),
    ("crah", "return_temperature"): (75.0, 2.0, "fahrenheit"),
    ("pump", "flow_rate"): (120.0, 6.0, "gpm"),
    ("pdu", "load_pct"): (72.0, 8.0, "percent"),
    ("ups", "battery_temperature"): (40.0, 3.0, "celsius"),
    ("gpu_pod", "inlet_temperature"): (24.0, 2.0, "celsius"),
}


def _value(asset_type: str, metric: str, at: datetime) -> tuple[float, str]:
    mean, amp, unit = _PROFILES.get((asset_type, metric), (0.0, 0.0, "unknown"))
    hour = at.hour + at.minute / 60.0
    val = mean + amp * math.sin(2 * math.pi * hour / 24.0)
    return round(val, 2), unit


def current(asset_id: str, metric: str, at: datetime | None = None) -> dict:
    at = at or datetime.now(timezone.utc)
    atype = catalog.asset_type(asset_id)
    if atype is None:
        return {"asset_id": asset_id, "metric": metric, "found": False}
    val, unit = _value(atype, metric, at)
    return {"asset_id": asset_id, "metric": metric, "value": val, "unit": unit,
            "at": at.isoformat(), "found": True}


def window(asset_id: str, metric: str, start: datetime, end: datetime,
           tick_seconds: int = 300) -> dict:
    atype = catalog.asset_type(asset_id)
    if atype is None:
        return {"asset_id": asset_id, "metric": metric, "found": False, "points": []}
    pts, t = [], start
    while t <= end and len(pts) < 2000:
        val, unit = _value(atype, metric, t)
        pts.append({"at": t.isoformat(), "value": val})
        t += timedelta(seconds=tick_seconds)
    return {"asset_id": asset_id, "metric": metric, "unit": _PROFILES.get((atype, metric), (0, 0, "unknown"))[2],
            "found": True, "points": pts}


# in-memory anomaly log; Sentinel appends here in the live system
_ANOMALY_LOG: list[dict] = []


def record_anomaly(signal_dict: dict) -> None:
    _ANOMALY_LOG.append(signal_dict)


def list_anomalies(since: datetime | None = None) -> list[dict]:
    if since is None:
        return list(_ANOMALY_LOG)
    return [a for a in _ANOMALY_LOG if datetime.fromisoformat(a["detected_at"]) >= since]


def incident_store() -> TupleStore:
    return TupleStore()

"""Triton service: AnomalySignal in -> TriageReport out.

Transport-agnostic. `handle()` is the pure step used by tests and by the MCP
layer. `serve()` is the Redis pub/sub loop for the live system: subscribes to
`anomaly_events`, publishes `TriageReport` JSON to `triage_events`. Redis is
imported lazily so the module works without it.
"""
from __future__ import annotations

from typing import Callable

import pandas as pd

from atlas_ml.schemas import AnomalySignal, TriageReport
from atlas_ml.triton.triage import Triton

# given (asset_id, metric) return the recent telemetry window as a Series
WindowProvider = Callable[[str, str], pd.Series]


class TritonService:
    def __init__(self, window_provider: WindowProvider, triton: Triton | None = None):
        self.window_provider = window_provider
        self.triton = triton or Triton()

    def handle(self, signal: AnomalySignal) -> TriageReport:
        window = self.window_provider(signal.asset_id, signal.metric)
        return self.triton.triage(signal, window)

    def serve(self, redis_url: str = "redis://localhost:6379",
              in_channel: str = "anomaly_events",
              out_channel: str = "triage_events") -> None:  # pragma: no cover
        import redis  # lazy
        r = redis.from_url(redis_url)
        pubsub = r.pubsub()
        pubsub.subscribe(in_channel)
        for msg in pubsub.listen():
            if msg.get("type") != "message":
                continue
            signal = AnomalySignal.model_validate_json(msg["data"])
            report = self.handle(signal)
            r.publish(out_channel, report.model_dump_json())

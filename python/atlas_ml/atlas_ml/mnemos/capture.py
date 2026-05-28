"""Mnemos: on work-order close, capture one labeled TrainingTuple.

Mnemos does NOT retrain a model (coordination doc §2.1 / cut-list #1). It is the
data-capture stage of the learning loop: it stitches together the anomaly that
fired, Triton's triage, the actions taken, the human (HITL) decisions, and the
technician's confirmed root cause into a single durable example, then fires a UI
toast. The accumulated tuples are the corpus a future nightly job trains on.
"""
from __future__ import annotations

from datetime import datetime
from typing import Callable

from atlas_ml.mnemos.store import TupleStore
from atlas_ml.schemas import (
    AnomalySignal,
    ProposedAction,
    TrainingTuple,
    TriageReport,
)


class Mnemos:
    def __init__(
        self,
        store: TupleStore | None = None,
        on_toast: Callable[[dict], None] | None = None,
    ):
        self.store = store or TupleStore()
        self._on_toast = on_toast  # fires the UI toast ("captured for training")

    def on_work_order_close(
        self,
        *,
        incident_id: str,
        anomaly: AnomalySignal,
        triage: TriageReport,
        actions: list[ProposedAction],
        confirmed_root_cause: str,
        outcome: str,
        telemetry_window_start: datetime,
        telemetry_window_end: datetime,
        parts_consumed: list[str] | None = None,
        hitl_decisions: list[dict] | None = None,
    ) -> TrainingTuple:
        tup = TrainingTuple(
            incident_id=incident_id,
            telemetry_window_start=telemetry_window_start,
            telemetry_window_end=telemetry_window_end,
            anomaly_signal=anomaly,
            triage_report=triage,
            actions_taken=actions,
            confirmed_root_cause=confirmed_root_cause,
            parts_consumed=parts_consumed or [],
            hitl_decisions=hitl_decisions or [],
            outcome=outcome,  # type: ignore[arg-type]
        )
        self.store.append(tup)

        if self._on_toast:
            hypothesis = triage.failure_mode_hypothesis
            matched = hypothesis == confirmed_root_cause
            self._on_toast(
                {
                    "type": "mnemos_capture",
                    "incident_id": incident_id,
                    "root_cause": confirmed_root_cause,
                    "hypothesis_matched": matched,
                    "corpus_size": self.store.count(),
                    "message": f"Captured incident {incident_id} for training "
                    f"({self.store.count()} examples in corpus)",
                }
            )
        return tup

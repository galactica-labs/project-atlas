"""Hephaestus: decide the action (coordination doc §2.1).

Consumes a TriageReport, pulls the relevant manual sections (RAG), and emits a
ProposedAction with action_tags the policy engine keys off. The action TYPE is
chosen by transparent rules (failure mode + urgency + confidence) so it is
auditable and deterministic; the LLM writes the rationale, citing the manual.
The action does NOT execute here — the policy engine decides whether it needs a
human, then Hermes (for dispatch) picks the technician.
"""
from __future__ import annotations

import uuid

from atlas_ml.assets import catalog
from atlas_ml.llm import LLMMessage, llm
from atlas_ml.rag import ManualRAG, rag as default_rag
from atlas_ml.schemas import ProposedAction, TriageReport

# how a failure mode is normally remediated
_REPAIR = {"compressor_bearing_wear", "refrigerant_overcharge",
           "coil_fouling_or_fan_fault", "impeller_wear_or_blockage"}
_THROTTLE = {"cooling_supply_shortfall"}
_SHUTDOWN = {"battery_thermal_runaway_risk"}
_SCHEDULE = {"load_imbalance"}

# tags per action type — what the policy engine matches on
_TAGS = {
    "dispatch_tech": ["physical_intervention"],
    "shutdown": ["physical_intervention", "service_affecting"],
    "throttle": ["physical_intervention", "service_affecting"],
    "schedule_maintenance": ["physical_intervention"],
    "wait": ["diagnostic", "read_only"],
}

IMMINENT_SECONDS = 900       # <=15 min to failure = act now
LOW_CONFIDENCE = 0.35        # wide forecast band -> monitor instead of act


class Hephaestus:
    def __init__(self, rag: ManualRAG | None = None):
        self.rag = rag or default_rag

    def _choose_action_type(self, triage: TriageReport) -> str:
        if triage.confidence < LOW_CONFIDENCE:
            return "wait"  # uncertain; keep watching (policy may still escalate)
        mode = triage.failure_mode_hypothesis
        imminent = triage.time_to_failure_seconds <= IMMINENT_SECONDS
        if mode in _SHUTDOWN:
            return "shutdown"
        if mode in _THROTTLE:
            return "throttle"
        if mode in _SCHEDULE:
            return "dispatch_tech" if imminent else "schedule_maintenance"
        if mode in _REPAIR:
            return "dispatch_tech" if imminent else "schedule_maintenance"
        return "dispatch_tech" if imminent else "schedule_maintenance"

    def propose(self, triage: TriageReport, asset_id: str) -> ProposedAction:
        asset = catalog.get(asset_id)
        asset_type = asset.asset_type if asset else "unknown"
        action_type = self._choose_action_type(triage)

        hits = self.rag.retrieve(
            f"{triage.failure_mode_hypothesis} on {asset_type} "
            f"metric {triage.quantile_forecast.metric}", k=2
        )
        citations = [h["citation"] for h in hits]
        rationale = self._rationale(triage, action_type, asset_id, hits)

        return ProposedAction(
            id=str(uuid.uuid4()),
            triage_id=triage.signal_id,
            action_type=action_type,  # type: ignore[arg-type]
            action_tags=_TAGS.get(action_type, []),
            target_asset_id=asset_id,
            rationale=rationale,
            cited_manual_sections=citations,
            agent_confidence=triage.confidence,
            requires_approval=False,  # set by the policy engine downstream
        )

    def _rationale(self, triage, action_type, asset_id, hits) -> str:
        cites = "; ".join(h["citation"] for h in hits) or "no manual match"
        prompt = (
            f"Decide-action rationale. Asset {asset_id}, failure hypothesis "
            f"{triage.failure_mode_hypothesis}, time-to-failure "
            f"{triage.time_to_failure_seconds}s, confidence {triage.confidence:.2f}. "
            f"Chosen action: {action_type}. Manual references: {cites}. "
            "Write 2-3 sentences justifying the action for the operator and audit log."
        )
        return llm.complete([LLMMessage(role="user", content=prompt)], role="agent", max_tokens=250)

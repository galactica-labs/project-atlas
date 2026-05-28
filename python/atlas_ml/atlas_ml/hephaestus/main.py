"""Hephaestus service: TriageReport in -> policy-stamped ProposedAction out.

Decides the action, then runs the active policy engine to stamp
requires_approval / approval_reason before the action moves on (to the HITL
gateway if approval is needed, else straight to Hermes for dispatch).
"""
from __future__ import annotations

from atlas_ml.hephaestus.decide import Hephaestus
from atlas_ml.policy import PolicyDecision, PolicyEngine
from atlas_ml.schemas import ProposedAction, TriageReport


class HephaestusService:
    def __init__(self, policy: PolicyEngine | None = None, hephaestus: Hephaestus | None = None):
        self.hephaestus = hephaestus or Hephaestus()
        self.policy = policy or PolicyEngine.from_template("data_center_balanced")

    def handle(self, triage: TriageReport, asset_id: str) -> tuple[ProposedAction, PolicyDecision]:
        action = self.hephaestus.propose(triage, asset_id)
        return self.policy.apply(action, triage)

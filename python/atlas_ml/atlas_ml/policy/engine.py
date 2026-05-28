"""Policy engine: evaluate a ProposedAction against a YAML rule set.

The policy file is the contract with the customer about what Atlas may do
unattended (coordination doc §5.5). Confidence alone is not enough — a rule
matches on action_type, action_tags, asset_criticality, agent_confidence, and
the forecast's uncertainty_band_width, and the FIRST matching rule wins.

Three templates ship in templates/policies/. The customer picks one and
Monaco-edits. Decision-memory promotion (Agent 14's learning loop) appends
rules with `learned: true`; this evaluator treats them identically.
"""
from __future__ import annotations

from pathlib import Path
from typing import Literal, Optional

import yaml
from pydantic import BaseModel

from atlas_ml.assets import catalog
from atlas_ml.schemas import ProposedAction, TriageReport

TEMPLATE_DIR = Path(__file__).resolve().parents[2] / "templates" / "policies"
Effect = Literal["auto_execute", "require_approval", "block"]


class PolicyDecision(BaseModel):
    effect: Effect
    matched_rule_id: Optional[str]
    approvers: list[str] = []
    reason: str = ""
    notify: list[str] = []
    digest: Optional[str] = None

    @property
    def requires_approval(self) -> bool:
        return self.effect in ("require_approval", "block")


def _in_range(value: float, spec: dict) -> bool:
    if "min" in spec and value < spec["min"]:
        return False
    if "max" in spec and value > spec["max"]:
        return False
    return True


class PolicyEngine:
    def __init__(self, rules: list[dict]):
        self.rules = rules

    @classmethod
    def from_template(cls, name: str = "data_center_balanced") -> "PolicyEngine":
        path = name if str(name).endswith(".yaml") else TEMPLATE_DIR / f"{name}.yaml"
        data = yaml.safe_load(Path(path).read_text())
        return cls(data.get("rules", []))

    def _matches(self, match: dict, action: ProposedAction,
                 criticality: str, band_width: float) -> bool:
        if "action_type" in match and match["action_type"] not in (action.action_type, "any"):
            return False
        if "action_tags" in match:
            if not set(match["action_tags"]).issubset(set(action.action_tags)):
                return False
        if "asset_criticality" in match and criticality not in match["asset_criticality"]:
            return False
        if "agent_confidence" in match and not _in_range(action.agent_confidence, match["agent_confidence"]):
            return False
        if "uncertainty_band_width" in match and not _in_range(band_width, match["uncertainty_band_width"]):
            return False
        return True

    def evaluate(self, action: ProposedAction, triage: TriageReport) -> PolicyDecision:
        asset = catalog.get(action.target_asset_id)
        criticality = asset.criticality if asset else "high"
        band_width = triage.quantile_forecast.uncertainty_band_width

        for rule in self.rules:
            if self._matches(rule.get("match", {}), action, criticality, band_width):
                return PolicyDecision(
                    effect=rule["effect"],
                    matched_rule_id=rule.get("id"),
                    approvers=rule.get("approvers", []),
                    reason=rule.get("reason", ""),
                    notify=rule.get("notify", []),
                    digest=rule.get("digest"),
                )

        # safe default: anything no rule covers gets a human
        return PolicyDecision(
            effect="require_approval", matched_rule_id=None,
            approvers=["ops_manager"],
            reason="No matching policy rule — defaulting to human review",
        )

    def apply(self, action: ProposedAction, triage: TriageReport) -> tuple[ProposedAction, PolicyDecision]:
        """Stamp requires_approval / approval_reason onto the action."""
        decision = self.evaluate(action, triage)
        action.requires_approval = decision.requires_approval
        action.approval_reason = (
            f"[{decision.matched_rule_id}] {decision.reason}" if decision.requires_approval else None
        )
        return action, decision

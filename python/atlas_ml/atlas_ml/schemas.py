"""Atlas cross-service contracts. Subset of coordination doc §4 needed by the
Sentinel / Triton-forecaster / Mnemos pipeline. Copied verbatim where the doc
defines a type; do not redefine these locally elsewhere.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class Asset(BaseModel):
    id: str
    asset_type: Literal["chiller", "crah", "pdu", "ups", "gpu_pod", "switchgear", "pump", "ahu"]
    model: str
    criticality: Literal["low", "medium", "high", "critical"]
    location: dict = {}
    manual_ids: list[str] = []


class Technician(BaseModel):
    """Stored technician profile — input to Hermes RAG + MILP."""
    id: str
    name: str
    certs: list[str] = []                  # e.g. ["EPA_608", "NFPA_70E"]
    asset_families: list[str] = []         # asset_types historically worked
    past_root_causes: list[str] = []       # free text from closed work orders
    customer_rating: float = Field(3.0, ge=1.0, le=5.0)
    home_lat: float = 0.0
    home_lng: float = 0.0
    shift_start_hour: int = 8              # local hour shift opens
    shift_end_hour: int = 18              # local hour shift closes
    currently_dispatched: bool = False
    van_parts: list[str] = []              # part SKUs on the truck
    overtime_rate: float = 1.0             # multiplier; >1 if OT


class AnomalySignal(BaseModel):
    """Sentinel output."""
    id: str
    asset_id: str
    metric: str
    current_value: float
    baseline_mean: float
    baseline_std: float
    z_score: float
    severity: Literal["info", "warn", "critical"]
    detected_at: datetime


class QuantileForecast(BaseModel):
    """Triton's LightGBM forecaster output."""
    metric: str
    horizon_seconds: int
    q05: list[float]
    q50: list[float]
    q95: list[float]
    threshold: float  # value at which the asset fails (from manual)
    threshold_direction: Literal["above", "below"] = "above"
    time_to_q50_crosses_threshold: Optional[int] = None  # seconds; None if no crossing
    time_to_q95_crosses_threshold: Optional[int] = None
    uncertainty_band_width: float  # mean(q95 - q05); gates HITL


class BlastRadiusNode(BaseModel):
    asset_id: str
    hops_from_source: int
    estimated_impact_at: datetime
    impact_type: Literal["loss_of_cooling", "loss_of_power", "loss_of_capacity", "degraded"]


class TriageReport(BaseModel):
    """Triton output."""
    signal_id: str
    failure_mode_hypothesis: str
    time_to_failure_seconds: int
    confidence: float = Field(..., ge=0.0, le=1.0)
    quantile_forecast: QuantileForecast
    blast_radius: list[BlastRadiusNode] = []
    reasoning: str = ""


class ProposedAction(BaseModel):
    """Hephaestus output (subset Mnemos needs)."""
    id: str
    triage_id: str
    action_type: Literal["dispatch_tech", "shutdown", "throttle", "wait", "schedule_maintenance"]
    action_tags: list[str] = []
    target_asset_id: str
    rationale: str = ""
    cited_manual_sections: list[str] = []
    agent_confidence: float = Field(..., ge=0.0, le=1.0)
    requires_approval: bool = False
    approval_reason: Optional[str] = None


class Dispatch(BaseModel):
    """Hermes output."""
    id: str
    action_id: str
    chosen_tech_id: str
    rag_candidates: list[str] = []        # shortlist tech_ids from vector search
    milp_alternatives: list[dict] = []    # [{tech_id, total_cost, slack}, ...]
    explanation: str = ""
    eta_minutes: int = 0
    parts_needed: list[str] = []
    parts_status: Literal["in_van", "in_warehouse", "to_order"] = "in_warehouse"
    milp_status: Literal["optimal", "fallback_rag", "infeasible"] = "optimal"


class ApprovalRequest(BaseModel):
    id: str
    action: ProposedAction
    triage: TriageReport
    dispatch: Optional[Dispatch] = None
    sent_to: list[str] = []          # e.g. ["telegram:chat_123"]
    sent_at: datetime
    expires_at: datetime


class ApprovalDecision(BaseModel):
    request_id: str
    approver_id: str
    decision: Literal["approve", "reject", "modify"]
    reason: Optional[str] = None     # required if reject/modify
    modified_action: Optional[ProposedAction] = None
    signature: str                   # HMAC of the decision for the audit ledger
    decided_at: datetime


class AuditRecord(BaseModel):
    """One link in the tamper-evident hash chain (coordination doc §2.4)."""
    seq: int
    recorded_at: datetime
    actor: str                       # who/what emitted the event (agent or user id)
    action: str                      # event type, e.g. "anomaly", "dispatch", "approval"
    payload: dict = {}
    prev_hash: str
    hash: str


class TrainingTuple(BaseModel):
    """Mnemos output — one labeled incident for the central training corpus."""
    incident_id: str
    telemetry_window_start: datetime
    telemetry_window_end: datetime
    anomaly_signal: AnomalySignal
    triage_report: TriageReport
    actions_taken: list[ProposedAction] = []
    confirmed_root_cause: str
    parts_consumed: list[str] = []
    hitl_decisions: list[dict] = []
    outcome: Literal["resolved", "escalated", "false_positive"]

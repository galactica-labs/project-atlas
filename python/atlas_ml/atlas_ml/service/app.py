"""Atlas engine HTTP API (FastAPI).

Stateful orchestration over the pipeline so the NestJS bridge / frontend can
drive a full incident: simulate an anomaly -> triage -> decide+policy ->
dispatch -> human approval -> audit. In-memory state (incidents keyed by
signal id); swap for Postgres/Redis when the DB lands.
"""
from __future__ import annotations

from datetime import timezone

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from atlas_ml.assets import _EDGES, catalog, graph
from atlas_ml.audit import AuditLedger, compliance_report, verify_chain
from atlas_ml.hephaestus.main import HephaestusService
from atlas_ml.hermes import Hermes
from atlas_ml.hitl import HITLGateway, TelegramBot
from atlas_ml.mcp_servers.backends import _PROFILES
from atlas_ml.schemas import (
    ApprovalDecision, ApprovalRequest, AnomalySignal, Asset, BlastRadiusNode,
    Dispatch, ProposedAction, TriageReport,
)
from atlas_ml.sentinel import Sentinel
from atlas_ml.synthetic import generate, seed_baselines
from atlas_ml.triton import Triton, TritonForecaster

TICK = 300
LEDGER_PATH = "data/engine_audit.jsonl"


# ── request / response models ───────────────────────────────────────────────
class SimulateReq(BaseModel):
    asset_id: str
    metric: str = "supply_temperature"


class ResolveReq(BaseModel):
    approver_id: str = "ops_manager"
    decision: str = "approve"        # approve | reject | modify
    reason: str | None = None


class Incident(BaseModel):
    signal: AnomalySignal
    triage: TriageReport


class ActionResult(BaseModel):
    action: ProposedAction
    policy_effect: str
    policy_rule: str | None
    approvers: list[str] = []


class IncidentSummary(BaseModel):
    signal_id: str
    asset_id: str
    metric: str
    z_score: float
    severity: str
    failure_mode: str
    confidence: float
    time_to_failure_seconds: int
    detected_at: str


class DependenciesResponse(BaseModel):
    asset_id: str
    dependencies: list[str]
    dependents: list[str]


# ── engine ──────────────────────────────────────────────────────────────────
class Engine:
    def __init__(self):
        self.triton = Triton(TritonForecaster(models_root="models/triton",
                                              tick_seconds=TICK, horizon_seconds=3600))
        self.hephaestus = HephaestusService()
        self.hermes = Hermes()
        self.audit = AuditLedger(LEDGER_PATH)
        self.incidents: dict[str, dict] = {}
        self._baselines: dict = {}
        self._gateways: dict[str, HITLGateway] = {}
        self._approval_to_signal: dict[str, str] = {}

    def warmup(self):
        from atlas_ml.forecaster.train import train_all
        history = generate(days=30, tick_seconds=TICK, drift_asset=None, seed=7)
        self._baselines = seed_baselines(history)
        try:
            train_all(history, out_root="models/triton", tick_seconds=TICK)
        except Exception as e:  # naive-forecast fallback still works
            print(f"[engine] training skipped: {e}")

    def _profile(self, asset_id: str, metric: str):
        atype = catalog.asset_type(asset_id)
        prof = _PROFILES.get((atype, metric)) if atype else None
        if prof is None:
            return None
        mean, amp, _unit = prof
        return atype, mean, amp

    def simulate(self, asset_id: str, metric: str) -> Incident:
        prof = self._profile(asset_id, metric)
        if prof is None:
            raise HTTPException(404, f"no profile for {asset_id}/{metric}")
        atype, mean, amp = prof
        assets = [(asset_id, atype, metric, mean, amp, max(amp * 0.5, 0.8))]
        live = generate(days=2, tick_seconds=TICK, seed=99, assets=assets,
                        drift_asset=asset_id, drift_per_hour=max(amp * 4.0, 8.0))
        sentinel = Sentinel(seeds=self._baselines)
        stream = (live.assign(ts=lambda d: pd.to_datetime(d.ts, utc=True))
                  .sort_values("ts"))
        signal = None
        for r in stream.itertuples():
            s = sentinel.tick(asset_id, metric, float(r.value),
                              at=r.ts.to_pydatetime().replace(tzinfo=timezone.utc))
            if s and s.severity == "critical":
                signal = s
                break
        if signal is None:
            raise HTTPException(422, "no critical anomaly produced")

        window = stream[stream.ts <= signal.detected_at].set_index("ts")["value"].tail(60)
        triage = self.triton.triage(signal, window)
        self.incidents[signal.id] = {"signal": signal, "triage": triage,
                                     "window_start": window.index[0].to_pydatetime(),
                                     "action": None, "dispatch": None}
        self.audit.append("sentinel", "anomaly",
                          {"asset_id": asset_id, "z": round(signal.z_score, 2)})
        self.audit.append("triton", "triage",
                          {"failure_mode": triage.failure_mode_hypothesis,
                           "ttf_s": triage.time_to_failure_seconds})
        return Incident(signal=signal, triage=triage)

    def _require(self, signal_id: str) -> dict:
        rec = self.incidents.get(signal_id)
        if rec is None:
            raise HTTPException(404, f"unknown incident {signal_id}")
        return rec

    def decide(self, signal_id: str) -> ActionResult:
        rec = self._require(signal_id)
        action, decision = self.hephaestus.handle(rec["triage"], rec["signal"].asset_id)
        rec["action"] = action
        self.audit.append("hephaestus", "proposed_action",
                          {"action_type": action.action_type, "policy_rule": decision.matched_rule_id})
        return ActionResult(action=action, policy_effect=decision.effect,
                            policy_rule=decision.matched_rule_id, approvers=decision.approvers)

    def dispatch(self, signal_id: str) -> Dispatch:
        rec = self._require(signal_id)
        if rec["action"] is None:
            self.decide(signal_id)
        disp = self.hermes.dispatch(rec["action"], rec["triage"])
        rec["dispatch"] = disp
        self.audit.append("hermes", "dispatch_proposed",
                          {"tech_id": disp.chosen_tech_id, "eta_min": disp.eta_minutes})
        return disp

    def submit_approval(self, signal_id: str) -> ApprovalRequest:
        rec = self._require(signal_id)
        if rec["action"] is None:
            self.decide(signal_id)
        if rec["dispatch"] is None:
            self.dispatch(signal_id)

        def on_resolved(req: ApprovalRequest, dec: ApprovalDecision):
            self.audit.append("hitl", "approval",
                              {"decision": dec.decision, "approver": dec.approver_id})
            if dec.decision == "approve":
                self.audit.append("hermes", "dispatch_executed",
                                  {"tech_id": req.dispatch.chosen_tech_id})

        gateway = HITLGateway(notifier=TelegramBot(), on_resolved=on_resolved)
        req = gateway.submit(rec["action"], rec["triage"], rec["dispatch"])
        self._gateways[req.id] = gateway
        self._approval_to_signal[req.id] = signal_id
        return req

    def resolve_approval(self, request_id: str, r: ResolveReq) -> ApprovalDecision:
        gateway = self._gateways.get(request_id)
        if gateway is None:
            raise HTTPException(404, f"unknown approval request {request_id}")
        return gateway.resolve(request_id, r.approver_id, r.decision, reason=r.reason)


engine = Engine()
app = FastAPI(title="Atlas Engine", version="0.1.0")


@app.on_event("startup")
def _startup():
    engine.warmup()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "incidents": len(engine.incidents)}


@app.get("/assets")
def list_assets() -> dict:
    return {"assets": [a.model_dump() for a in catalog._by_id.values()]}


@app.get("/assets/{asset_id}")
def get_asset(asset_id: str) -> Asset:
    a = catalog.get(asset_id)
    if a is None:
        raise HTTPException(404, f"unknown asset {asset_id}")
    return a


@app.get("/assets/{asset_id}/blast-radius")
def asset_blast_radius(asset_id: str, hops: int = 3) -> dict:
    from datetime import datetime
    nodes: list[BlastRadiusNode] = graph.blast_radius(
        asset_id, time_to_failure_seconds=1800,
        detected_at=datetime.now(timezone.utc), max_hops=hops)
    return {"asset_id": asset_id, "nodes": [n.model_dump(mode="json") for n in nodes]}


@app.get("/assets/{asset_id}/dependencies")
def asset_dependencies(asset_id: str) -> DependenciesResponse:
    return DependenciesResponse(
        asset_id=asset_id,
        dependencies=[s for s, d, _ in _EDGES if d == asset_id],
        dependents=[d for s, d, _ in _EDGES if s == asset_id],
    )


@app.post("/incidents/simulate")
def incidents_simulate(req: SimulateReq) -> Incident:
    return engine.simulate(req.asset_id, req.metric)


@app.get("/incidents")
def incidents_list() -> dict:
    out = []
    for sid, rec in engine.incidents.items():
        s, t = rec["signal"], rec["triage"]
        out.append(IncidentSummary(
            signal_id=sid, asset_id=s.asset_id, metric=s.metric,
            z_score=round(s.z_score, 2), severity=s.severity,
            failure_mode=t.failure_mode_hypothesis, confidence=round(t.confidence, 2),
            time_to_failure_seconds=t.time_to_failure_seconds,
            detected_at=s.detected_at.isoformat(),
        ).model_dump())
    return {"incidents": out}


@app.post("/incidents/{signal_id}/action")
def incident_action(signal_id: str) -> ActionResult:
    return engine.decide(signal_id)


@app.post("/incidents/{signal_id}/dispatch")
def incident_dispatch(signal_id: str) -> Dispatch:
    return engine.dispatch(signal_id)


@app.post("/incidents/{signal_id}/approval")
def incident_approval(signal_id: str) -> ApprovalRequest:
    return engine.submit_approval(signal_id)


@app.post("/approvals/{request_id}/resolve")
def approval_resolve(request_id: str, req: ResolveReq) -> ApprovalDecision:
    return engine.resolve_approval(request_id, req)


@app.get("/audit/verify")
def audit_verify() -> dict:
    return verify_chain(LEDGER_PATH)


@app.get("/audit/report")
def audit_report() -> dict:
    return compliance_report(out_path="reports/engine_compliance", ledger_path=LEDGER_PATH)

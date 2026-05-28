"""End-to-end smoke: synthetic drift -> Sentinel -> forecast (RUL) -> Mnemos.

Exercises the whole ML layer without DB/Redis. Works with or without LightGBM
(linear fallback). This is also the demo cascade backbone for CHILLER-A-03.
"""
import sys
from datetime import timezone
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from atlas_ml.forecaster.predict import remaining_useful_life
from atlas_ml.forecaster.train import train_pair
from atlas_ml.mnemos import Mnemos
from atlas_ml.sentinel import Sentinel
from atlas_ml.synthetic import generate, seed_baselines
from atlas_ml.triton import Triton, TritonForecaster
from atlas_ml.hephaestus.main import HephaestusService
from atlas_ml.hermes import Hermes
from atlas_ml.hitl import HITLGateway, TelegramBot
from atlas_ml.audit import AuditLedger, compliance_report, verify_chain

TICK = 300
DRIFT = "CHILLER-A-03"
METRIC = "supply_temperature"
THRESHOLD = 50.0  # chiller fails above 50F supply temp (demo manual value)


def main():
    print("== generate 30-day CLEAN history (training) ==")
    history = generate(days=30, tick_seconds=TICK, drift_asset=None, seed=7)

    print("== generate live incident episode (drift on CHILLER-A-03) ==")
    live = generate(days=2, tick_seconds=TICK, drift_asset=DRIFT, drift_per_hour=4.0, seed=99)

    print("== train forecaster on clean history (chiller/supply_temperature) ==")
    train_pair(history, "chiller", METRIC, out_root="models/triton", tick_seconds=TICK)

    print("== Sentinel: replay CHILLER-A-03 live stream ==")
    baselines = seed_baselines(history)  # warm-start from clean history
    sentinel = Sentinel(seeds=baselines)
    stream = (
        live[(live.asset_id == DRIFT) & (live.metric == METRIC)]
        .assign(ts=lambda d: pd.to_datetime(d.ts, utc=True))
        .sort_values("ts")
    )
    signal = None
    for r in stream.itertuples():
        s = sentinel.tick(DRIFT, METRIC, float(r.value), at=r.ts.to_pydatetime().replace(tzinfo=timezone.utc))
        if s and s.severity == "critical":
            signal = s
            break
    if signal is None:
        print("  no critical anomaly fired"); return
    audit = AuditLedger("data/audit_ledger.jsonl")
    audit.append("sentinel", "anomaly", {"asset_id": signal.asset_id, "z": round(signal.z_score, 2)})
    print(f"  ANOMALY z={signal.z_score:.2f} value={signal.current_value:.2f} at {signal.detected_at}")

    print("== Triton: triage (forecast + blast radius + narrative) ==")
    window = stream[stream.ts <= signal.detected_at].set_index("ts")["value"].tail(60)
    triton = Triton(TritonForecaster(models_root="models/triton", tick_seconds=TICK,
                                     horizon_seconds=3600))
    triage = triton.triage(signal, window)
    fc = triage.quantile_forecast
    rul = remaining_useful_life(fc, tick_seconds=TICK)
    print(f"  hypothesis={triage.failure_mode_hypothesis} confidence={triage.confidence:.2f}")
    print(f"  time_to_failure={triage.time_to_failure_seconds}s band width={fc.uncertainty_band_width:.2f}")
    print(f"  RUL pessimistic={rul['pessimistic_seconds']}s expected={rul['expected_seconds']}s "
          f"optimistic={rul['optimistic_seconds']}s")
    print(f"  blast_radius={[b.asset_id for b in triage.blast_radius]}")
    print(f"  reasoning: {triage.reasoning}")

    print("== Hephaestus: decide action + policy (balanced) ==")
    action, decision = HephaestusService().handle(triage, signal.asset_id)
    print(f"  action={action.action_type} tags={action.action_tags}")
    print(f"  cited={action.cited_manual_sections}")
    print(f"  policy effect={decision.effect} rule={decision.matched_rule_id} "
          f"approvers={decision.approvers} requires_approval={action.requires_approval}")
    print(f"  rationale: {action.rationale}")
    audit.append("triton", "triage", {"failure_mode": triage.failure_mode_hypothesis,
                                       "ttf_s": triage.time_to_failure_seconds})
    audit.append("hephaestus", "proposed_action",
                 {"action_type": action.action_type, "policy_rule": decision.matched_rule_id})

    print("== Hermes: RAG -> MILP dispatch (proposal) ==")
    dispatch = Hermes().dispatch(action, triage)  # incident_at default = daytime shift
    print(f"  RAG shortlist={dispatch.rag_candidates}")
    print(f"  chosen={dispatch.chosen_tech_id} eta={dispatch.eta_minutes}min "
          f"parts={dispatch.parts_status} status={dispatch.milp_status}")
    print(f"  MILP alternatives={dispatch.milp_alternatives}")

    hitl_log = []
    if action.requires_approval:
        print("== HITL: policy paused action, asking human via Telegram ==")
        executed = {"ok": False}

        def on_resolved(req, dec):
            audit.append("hitl", "approval",
                         {"decision": dec.decision, "approver": dec.approver_id})
            if dec.decision == "approve":
                executed["ok"] = True
                audit.append("hermes", "dispatch",
                             {"tech_id": req.dispatch.chosen_tech_id, "eta_min": req.dispatch.eta_minutes})
                print(f"  RESUMED: dispatch {req.dispatch.chosen_tech_id} executed "
                      f"(approver {dec.approver_id}, sig {dec.signature[:12]}…)")
            else:
                print(f"  ABORTED: {dec.decision} ({dec.reason})")

        bot = TelegramBot()  # offline unless ATLAS_TELEGRAM_TOKEN set
        gateway = HITLGateway(notifier=bot, on_resolved=on_resolved)
        req = gateway.submit(action, triage, dispatch)
        print(f"  pending request {req.id} sent_to={req.sent_to}")
        dec = bot.simulate_decision(req.id, gateway, approver_id="ops_manager", decision="approve")
        hitl_log = [{"decision": dec.decision, "approver": dec.approver_id, "signature": dec.signature}]
    else:
        print("== auto_execute: no approval needed ==")
        hitl_log = [{"decision": "auto_execute"}]

    print("== Mnemos: capture closed work order ==")
    mnemos = Mnemos(on_toast=lambda t: print(f"  TOAST: {t['message']}"))
    mnemos.on_work_order_close(
        incident_id="INC-DEMO-1", anomaly=signal, triage=triage, actions=[action],
        confirmed_root_cause="compressor_bearing_wear", outcome="resolved",
        telemetry_window_start=window.index[0].to_pydatetime(),
        telemetry_window_end=signal.detected_at,
        parts_consumed=["BEARING-30XA-001"],
        hitl_decisions=hitl_log,
    )
    print("== failure patterns (central corpus) ==")
    print(" ", mnemos.store.failure_patterns())

    print("== Audit ledger: verify chain + compliance report ==")
    print(" ", verify_chain("data/audit_ledger.jsonl"))
    rep = compliance_report(out_path="reports/compliance",
                            ledger_path="data/audit_ledger.jsonl")
    print(f"  integrity={rep['chain_integrity']} events={rep['total_events']} "
          f"by_action={rep['by_action']}")
    print(f"  report html={rep['html_path']} pdf={rep['pdf_path']}")


if __name__ == "__main__":
    main()

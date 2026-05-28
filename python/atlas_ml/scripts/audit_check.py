"""Audit ledger demo: build a chain, verify, tamper a row, re-verify, report."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from atlas_ml.audit import AuditLedger, compliance_report, verify_chain

LEDGER = "data/audit_demo.jsonl"


def main():
    Path(LEDGER).unlink(missing_ok=True)
    led = AuditLedger(LEDGER)

    print("== append events ==")
    led.append("sentinel", "anomaly", {"asset_id": "CHILLER-A-03", "z_score": 4.41})
    led.append("triton", "triage", {"failure_mode": "compressor_bearing_wear", "ttf_s": 300})
    led.append("hephaestus", "proposed_action", {"action_type": "dispatch_tech"})
    led.append("hitl", "approval", {"decision": "approve", "approver": "ops_manager"})
    led.append("hermes", "dispatch", {"tech_id": "TECH-01", "eta_min": 1})
    print(f"  {len(led.all())} records, head hash {led.last().hash[:16]}…")

    print("== verify (clean) ==")
    print(" ", verify_chain(LEDGER))

    print("== tamper row #3 (flip approval -> reject) ==")
    lines = Path(LEDGER).read_text().splitlines()
    rec = json.loads(lines[3])
    rec["payload"]["decision"] = "reject"      # change body, leave hash as-is
    lines[3] = json.dumps(rec)
    Path(LEDGER).write_text("\n".join(lines) + "\n")

    print("== verify (tampered) ==")
    print(" ", verify_chain(LEDGER))

    print("== compliance report ==")
    summary = compliance_report(out_path="reports/compliance_demo", ledger_path=LEDGER)
    print(f"  integrity={summary['chain_integrity']} events={summary['total_events']}")
    print(f"  html={summary['html_path']} pdf={summary['pdf_path']}")


if __name__ == "__main__":
    main()

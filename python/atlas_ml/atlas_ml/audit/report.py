"""Compliance report — 1-pager over the audit ledger (coordination doc §6 A15).

Summarizes events by type, lists approval decisions, and states chain integrity
(from the verifier). Writes HTML always; also a PDF when WeasyPrint is installed
(cut-list #2: if WeasyPrint is unavailable, the HTML/template still demos).
"""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from atlas_ml.audit.ledger import AuditLedger
from atlas_ml.audit.verify import verify_records


def _summary(records, since=None) -> dict:
    if since:
        records = [r for r in records if r.recorded_at >= since]
    by_action = Counter(r.action for r in records)
    approvals = [r for r in records if r.action == "approval"]
    integrity = verify_records(records)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "window_start": records[0].recorded_at.isoformat() if records else None,
        "window_end": records[-1].recorded_at.isoformat() if records else None,
        "total_events": len(records),
        "by_action": dict(by_action),
        "approval_decisions": [
            {"seq": r.seq, "decision": r.payload.get("decision"),
             "approver": r.payload.get("approver"), "at": r.recorded_at.isoformat()}
            for r in approvals
        ],
        "chain_integrity": "VERIFIED" if integrity["valid"] else "COMPROMISED",
        "integrity_issues": integrity["issues"],
    }


def _html(s: dict) -> str:
    rows = "".join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in s["by_action"].items())
    appr = "".join(
        f"<li>#{a['seq']} {a['decision']} by {a['approver']} at {a['at']}</li>"
        for a in s["approval_decisions"]
    ) or "<li>none</li>"
    badge = "#0a0" if s["chain_integrity"] == "VERIFIED" else "#c00"
    return f"""<!doctype html><html><head><meta charset="utf-8">
<style>body{{font-family:sans-serif;margin:40px}}h1{{margin-bottom:0}}
.badge{{color:#fff;background:{badge};padding:2px 10px;border-radius:4px}}
table{{border-collapse:collapse}}td{{border:1px solid #ccc;padding:4px 10px}}</style></head>
<body>
<h1>Atlas Compliance Report</h1>
<p>Generated {s['generated_at']}</p>
<p>Window: {s['window_start']} → {s['window_end']}</p>
<p>Chain integrity: <span class="badge">{s['chain_integrity']}</span> ({s['total_events']} events)</p>
<h2>Events by type</h2><table><tr><th>Action</th><th>Count</th></tr>{rows}</table>
<h2>Approval decisions</h2><ul>{appr}</ul>
</body></html>"""


def compliance_report(out_path: str | Path = "reports/compliance",
                      ledger_path: str | Path = "data/audit_ledger.jsonl",
                      since: datetime | None = None) -> dict:
    records = AuditLedger(ledger_path).all()
    summary = _summary(records, since)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    html = _html(summary)
    Path(f"{out}.html").write_text(html)
    summary["html_path"] = f"{out}.html"
    try:
        from weasyprint import HTML  # lazy, optional
        HTML(string=html).write_pdf(f"{out}.pdf")
        summary["pdf_path"] = f"{out}.pdf"
    except Exception:
        summary["pdf_path"] = None  # cut-list #2: HTML only
    return summary

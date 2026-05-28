"""Verify the audit hash chain. Flags tampering, reordering, and broken links."""
from __future__ import annotations

from pathlib import Path

from atlas_ml.audit.ledger import GENESIS_HASH, AuditLedger, record_hash
from atlas_ml.schemas import AuditRecord


def verify_records(records: list[AuditRecord]) -> dict:
    issues: list[dict] = []
    prev_hash = GENESIS_HASH
    for i, r in enumerate(records):
        recomputed = record_hash(
            r.seq, r.recorded_at.isoformat(), r.actor, r.action, r.payload, r.prev_hash
        )
        if r.prev_hash != prev_hash:
            issues.append({"seq": r.seq, "error": "broken_link",
                           "detail": f"prev_hash {r.prev_hash[:12]}… != expected {prev_hash[:12]}…"})
        if recomputed != r.hash:
            issues.append({"seq": r.seq, "error": "tampered",
                           "detail": "stored hash does not match recomputed body hash"})
        if r.seq != i:
            issues.append({"seq": r.seq, "error": "bad_sequence", "detail": f"expected seq {i}"})
        prev_hash = r.hash
    return {"valid": not issues, "n_records": len(records), "issues": issues}


def verify_chain(path: str | Path = "data/audit_ledger.jsonl") -> dict:
    return verify_records(AuditLedger(path).all())

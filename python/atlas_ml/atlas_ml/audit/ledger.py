"""Hash-chained audit ledger (no blockchain — coordination doc §1 rule 7).

Every record commits to the one before it: `hash = sha256(prev_hash + body)`,
where `body` is the canonical JSON of (seq, recorded_at, actor, action,
payload). Changing any past record's body changes its hash, which breaks every
following `prev_hash` link — that is what the verifier detects.

Append-only JSONL for the hackathon; the identical scheme runs as a Postgres
BEFORE INSERT trigger in audit_trigger.sql when the DB is up.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from atlas_ml.schemas import AuditRecord

GENESIS_HASH = "0" * 64


def _body(seq: int, recorded_at: str, actor: str, action: str, payload: dict) -> str:
    return json.dumps(
        {"seq": seq, "recorded_at": recorded_at, "actor": actor,
         "action": action, "payload": payload},
        sort_keys=True, separators=(",", ":"), default=str,
    )


def record_hash(seq: int, recorded_at: str, actor: str, action: str,
                payload: dict, prev_hash: str) -> str:
    return hashlib.sha256((prev_hash + _body(seq, recorded_at, actor, action, payload)).encode()).hexdigest()


class AuditLedger:
    def __init__(self, path: str | Path = "data/audit_ledger.jsonl"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def all(self) -> list[AuditRecord]:
        if not self.path.exists():
            return []
        return [AuditRecord.model_validate_json(ln) for ln in self.path.read_text().splitlines() if ln.strip()]

    def last(self) -> AuditRecord | None:
        records = self.all()
        return records[-1] if records else None

    def append(self, actor: str, action: str, payload: dict | None = None) -> AuditRecord:
        prev = self.last()
        seq = (prev.seq + 1) if prev else 0
        prev_hash = prev.hash if prev else GENESIS_HASH
        recorded_at = datetime.now(timezone.utc)
        rec = AuditRecord(
            seq=seq, recorded_at=recorded_at, actor=actor, action=action,
            payload=payload or {}, prev_hash=prev_hash,
            hash=record_hash(seq, recorded_at.isoformat(), actor, action, payload or {}, prev_hash),
        )
        with self.path.open("a") as f:
            f.write(rec.model_dump_json() + "\n")
        return rec

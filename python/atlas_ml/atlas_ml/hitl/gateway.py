"""HITL gateway — pause a risky action, ask a human, resume on their decision.

When the policy engine marks an action `require_approval`, the gateway parks it
as a pending ApprovalRequest, fires a notifier (Telegram bot, or any Notifier),
and waits. The notifier's button callback calls `resolve()`, which signs an
ApprovalDecision (HMAC, for the audit ledger), clears the pending state, and
runs the `on_resolved` callback — that callback resumes the chain (e.g. hand the
approved action to Hermes for dispatch).

Pending state is in-memory here (coordination doc §6: Redis pending-state for
the real system; Azure Durable Functions is voiceover only). Swap `_pending`
for Redis `hitl_pending` with no interface change.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Callable, Protocol

from atlas_ml.schemas import (
    ApprovalDecision,
    ApprovalRequest,
    Dispatch,
    ProposedAction,
    TriageReport,
)


class Notifier(Protocol):
    """Anything that can deliver an ApprovalRequest to a human and offer
    Approve/Reject buttons. Returns the addresses it sent to."""
    def send_approval(self, request: ApprovalRequest) -> list[str]: ...


OnResolved = Callable[[ApprovalRequest, ApprovalDecision], None]


def _secret() -> bytes:
    return os.getenv("ATLAS_HITL_SECRET", "atlas-dev-secret").encode()


def sign_decision(request_id: str, approver_id: str, decision: str, decided_at: datetime) -> str:
    msg = f"{request_id}|{approver_id}|{decision}|{decided_at.isoformat()}".encode()
    return hmac.new(_secret(), msg, hashlib.sha256).hexdigest()


class HITLGateway:
    def __init__(self, notifier: Notifier, on_resolved: OnResolved | None = None,
                 ttl_minutes: int = 15):
        self.notifier = notifier
        self.on_resolved = on_resolved
        self.ttl = timedelta(minutes=ttl_minutes)
        self._pending: dict[str, ApprovalRequest] = {}

    def submit(self, action: ProposedAction, triage: TriageReport,
               dispatch: Dispatch | None = None) -> ApprovalRequest:
        now = datetime.now(timezone.utc)
        req = ApprovalRequest(
            id=str(uuid.uuid4()), action=action, triage=triage, dispatch=dispatch,
            sent_at=now, expires_at=now + self.ttl,
        )
        req.sent_to = self.notifier.send_approval(req)
        self._pending[req.id] = req
        return req

    def pending(self, request_id: str) -> ApprovalRequest | None:
        return self._pending.get(request_id)

    def resolve(self, request_id: str, approver_id: str,
                decision: str, reason: str | None = None,
                modified_action: ProposedAction | None = None) -> ApprovalDecision:
        req = self._pending.get(request_id)
        if req is None:
            raise KeyError(f"no pending request {request_id} (expired or already resolved)")
        if decision in ("reject", "modify") and not reason:
            raise ValueError(f"reason required for decision={decision}")

        now = datetime.now(timezone.utc)
        dec = ApprovalDecision(
            request_id=request_id, approver_id=approver_id, decision=decision,  # type: ignore[arg-type]
            reason=reason, modified_action=modified_action,
            signature=sign_decision(request_id, approver_id, decision, now),
            decided_at=now,
        )
        del self._pending[request_id]
        if self.on_resolved:
            self.on_resolved(req, dec)
        return dec

    def expire_stale(self) -> list[str]:
        now = datetime.now(timezone.utc)
        stale = [rid for rid, r in self._pending.items() if r.expires_at < now]
        for rid in stale:
            del self._pending[rid]
        return stale

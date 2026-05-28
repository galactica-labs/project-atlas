"""Telegram bot notifier for HITL approvals.

Posts the full reasoning trace with an inline Approve / Reject keyboard. The
button callback carries `"{request_id}:{decision}"`; `handle_callback()` parses
it and drives `HITLGateway.resolve()`, which resumes the chain.

No token (`ATLAS_TELEGRAM_TOKEN` unset) -> offline mode: the message is printed
to the console and `send_approval` still returns an address, so the in-app
Approve button (coordination doc §12 fallback) and `simulate_decision()` work
for the demo without network.
"""
from __future__ import annotations

import os

from atlas_ml.schemas import ApprovalDecision, ApprovalRequest

API = "https://api.telegram.org/bot{token}/{method}"


def _format(req: ApprovalRequest) -> str:
    a, t = req.action, req.triage
    fc = t.quantile_forecast
    lines = [
        "⚠️ *Atlas approval needed*",
        f"Asset: `{a.target_asset_id}`  ({t.failure_mode_hypothesis})",
        f"Action: *{a.action_type}*  tags={a.action_tags}",
        f"Forecast: q50 crosses in {fc.time_to_q50_crosses_threshold}s, "
        f"q95 in {fc.time_to_q95_crosses_threshold}s, band {fc.uncertainty_band_width:.2f}",
        f"Confidence: {a.agent_confidence:.2f}",
        f"Why approval: {a.approval_reason or 'policy'}",
    ]
    if req.dispatch:
        lines.append(f"Proposed tech: `{req.dispatch.chosen_tech_id}` "
                     f"(ETA {req.dispatch.eta_minutes}min, parts {req.dispatch.parts_status})")
    lines.append(f"_Rationale:_ {a.rationale}")
    return "\n".join(lines)


def _keyboard(req_id: str) -> dict:
    return {"inline_keyboard": [[
        {"text": "✅ Approve", "callback_data": f"{req_id}:approve"},
        {"text": "❌ Reject", "callback_data": f"{req_id}:reject"},
    ]]}


class TelegramBot:
    def __init__(self, token: str | None = None, chat_ids: list[str] | None = None):
        self.token = token or os.getenv("ATLAS_TELEGRAM_TOKEN")
        self.chat_ids = chat_ids or [c for c in os.getenv("ATLAS_TELEGRAM_CHATS", "").split(",") if c]

    # ── Notifier protocol ───────────────────────────────────────────────
    def send_approval(self, request: ApprovalRequest) -> list[str]:
        text, kb = _format(request), _keyboard(request.id)
        if not self.token or not self.chat_ids:
            print("[telegram offline] would send approval request:")
            print(text)
            print(f"buttons: Approve|Reject  (callback {request.id}:approve / :reject)")
            return ["console:offline"]
        import requests  # lazy
        sent = []
        for chat in self.chat_ids:
            requests.post(
                API.format(token=self.token, method="sendMessage"),
                json={"chat_id": chat, "text": text, "parse_mode": "Markdown",
                      "reply_markup": kb}, timeout=10,
            )
            sent.append(f"telegram:{chat}")
        return sent

    # ── inbound webhook ─────────────────────────────────────────────────
    @staticmethod
    def handle_callback(update: dict, gateway, reason: str | None = None) -> ApprovalDecision:
        """Parse a Telegram callback_query update and resolve the request."""
        cq = update["callback_query"]
        request_id, decision = cq["data"].split(":", 1)
        approver_id = str(cq["from"]["id"])
        if decision == "reject" and not reason:
            reason = "Rejected by approver via Telegram"
        return gateway.resolve(request_id, approver_id, decision, reason=reason)

    @staticmethod
    def simulate_decision(request_id: str, gateway, approver_id: str = "ops_manager",
                          decision: str = "approve", reason: str | None = None) -> ApprovalDecision:
        """Demo/in-app-button path: resolve without a live Telegram round-trip."""
        if decision == "reject" and not reason:
            reason = "Rejected via in-app button"
        return gateway.resolve(request_id, approver_id, decision, reason=reason)

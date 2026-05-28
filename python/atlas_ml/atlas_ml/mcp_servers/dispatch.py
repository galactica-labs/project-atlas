"""mcp_dispatch — propose/confirm a technician dispatch, open a ticket.

`propose_dispatch` runs the real Hermes RAG->MILP pick so an external agent gets
the same optimal assignment the internal chain would. It builds a minimal but
valid TriageReport (threshold from the catalog) to feed Hermes.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import uuid
from datetime import datetime, timezone

from mcp.server.fastmcp import FastMCP

from atlas_ml.assets import catalog
from atlas_ml.hermes import Hermes
from atlas_ml.schemas import ProposedAction, QuantileForecast, TriageReport

mcp = FastMCP("atlas-dispatch")
_hermes = Hermes()


def _minimal_triage(asset_id: str, failure_mode: str) -> TriageReport:
    thr = catalog.threshold(asset_id, "supply_temperature") or (100.0, "above")
    fc = QuantileForecast(
        metric="supply_temperature", horizon_seconds=1800,
        q05=[0.0], q50=[0.0], q95=[0.0], threshold=thr[0],
        threshold_direction=thr[1], time_to_q95_crosses_threshold=900,
        uncertainty_band_width=0.1,
    )
    return TriageReport(
        signal_id=str(uuid.uuid4()), failure_mode_hypothesis=failure_mode,
        time_to_failure_seconds=900, confidence=0.8, quantile_forecast=fc,
        blast_radius=[], reasoning="external MCP dispatch request",
    )


@mcp.tool()
def propose_dispatch(asset_id: str, failure_mode_hypothesis: str) -> dict:
    """Pick the optimal technician (RAG shortlist -> MILP) for a failure on an asset."""
    triage = _minimal_triage(asset_id, failure_mode_hypothesis)
    action = ProposedAction(
        id=str(uuid.uuid4()), triage_id=triage.signal_id, action_type="dispatch_tech",
        action_tags=["physical_intervention"], target_asset_id=asset_id,
        agent_confidence=triage.confidence,
    )
    return _hermes.dispatch(action, triage).model_dump(mode="json")


@mcp.tool()
def confirm_dispatch(dispatch_id: str, approver: str) -> dict:
    """Confirm a proposed dispatch; returns an HMAC-signed confirmation for audit."""
    at = datetime.now(timezone.utc)
    secret = os.getenv("ATLAS_HITL_SECRET", "atlas-dev-secret").encode()
    sig = hmac.new(secret, f"{dispatch_id}|{approver}|{at.isoformat()}".encode(),
                   hashlib.sha256).hexdigest()
    return {"dispatch_id": dispatch_id, "approver": approver, "confirmed": True,
            "signature": sig, "confirmed_at": at.isoformat()}


@mcp.tool()
def create_ticket(asset_id: str, action_type: str, summary: str) -> dict:
    """Open a work-order ticket for an asset."""
    asset = catalog.get(asset_id)
    return {"ticket_id": f"WO-{uuid.uuid4().hex[:8].upper()}", "asset_id": asset_id,
            "asset_known": asset is not None, "action_type": action_type,
            "summary": summary, "status": "open",
            "created_at": datetime.now(timezone.utc).isoformat()}


if __name__ == "__main__":
    mcp.run()

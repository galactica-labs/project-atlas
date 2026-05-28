"""mcp_history — past incidents, similar failures, technician track record.

Reads the Mnemos training corpus (closed incidents) + the technician roster.
"""
from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from atlas_ml.mcp_servers import backends
from atlas_ml.technicians import roster

mcp = FastMCP("atlas-history")


def _incident_summary(t) -> dict:
    return {
        "incident_id": t.incident_id,
        "asset_id": t.anomaly_signal.asset_id,
        "failure_mode": t.triage_report.failure_mode_hypothesis,
        "confirmed_root_cause": t.confirmed_root_cause,
        "outcome": t.outcome,
        "parts_consumed": t.parts_consumed,
        "window": [t.telemetry_window_start.isoformat(), t.telemetry_window_end.isoformat()],
    }


@mcp.tool()
def past_incidents(asset_id: str, limit: int = 10) -> list[dict]:
    """Closed incidents for an asset, most recent first."""
    tuples = backends.incident_store().all()
    hits = [t for t in tuples if t.anomaly_signal.asset_id == asset_id]
    return [_incident_summary(t) for t in hits[-limit:][::-1]]


@mcp.tool()
def similar_failures(failure_mode: str, limit: int = 5) -> list[dict]:
    """Past incidents whose confirmed root cause matches a failure mode."""
    tuples = backends.incident_store().all()
    hits = [t for t in tuples
            if failure_mode in (t.confirmed_root_cause, t.triage_report.failure_mode_hypothesis)]
    return [_incident_summary(t) for t in hits[-limit:][::-1]]


@mcp.tool()
def tech_history(tech_id: str) -> dict:
    """A technician's profile + the root causes they've resolved."""
    t = roster.get(tech_id)
    if not t:
        return {"tech_id": tech_id, "found": False}
    return {"tech_id": tech_id, "found": True, "name": t.name, "certs": t.certs,
            "asset_families": t.asset_families, "past_root_causes": t.past_root_causes,
            "customer_rating": t.customer_rating}


if __name__ == "__main__":
    mcp.run()

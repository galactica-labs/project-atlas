"""mcp_telemetry — live readings + anomaly feed."""
from __future__ import annotations

from datetime import datetime

from mcp.server.fastmcp import FastMCP

from atlas_ml.mcp_servers import backends

mcp = FastMCP("atlas-telemetry")


@mcp.tool()
def get_current(asset_id: str, metric: str) -> dict:
    """Latest reading for an asset metric."""
    return backends.current(asset_id, metric)


@mcp.tool()
def get_window(asset_id: str, metric: str, start: str, end: str) -> dict:
    """Time series for an asset metric between ISO timestamps `start` and `end`."""
    return backends.window(asset_id, metric, datetime.fromisoformat(start), datetime.fromisoformat(end))


@mcp.tool()
def list_anomalies(since: str | None = None) -> list[dict]:
    """Anomalies detected since an ISO timestamp (all if omitted)."""
    return backends.list_anomalies(datetime.fromisoformat(since) if since else None)


if __name__ == "__main__":
    mcp.run()

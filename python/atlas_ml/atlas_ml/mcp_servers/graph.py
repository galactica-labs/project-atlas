"""mcp_graph — asset metadata + dependency traversal."""
from __future__ import annotations

from datetime import datetime, timezone

from mcp.server.fastmcp import FastMCP

from atlas_ml.assets import _EDGES, catalog, graph

mcp = FastMCP("atlas-graph")


@mcp.tool()
def get_asset(id: str) -> dict:
    """Asset metadata (type, model, criticality)."""
    a = catalog.get(id)
    return a.model_dump() if a else {"id": id, "found": False}


@mcp.tool()
def blast_radius(asset_id: str, hops: int = 3) -> list[dict]:
    """Downstream assets affected if `asset_id` fails, within `hops`."""
    nodes = graph.blast_radius(asset_id, time_to_failure_seconds=1800,
                               detected_at=datetime.now(timezone.utc), max_hops=hops)
    return [n.model_dump(mode="json") for n in nodes]


@mcp.tool()
def dependencies_of(asset_id: str) -> list[str]:
    """Direct upstream assets that feed `asset_id` (what it depends on)."""
    return [src for src, dst, _ in _EDGES if dst == asset_id]


@mcp.tool()
def dependents_of(asset_id: str) -> list[str]:
    """Direct downstream assets fed by `asset_id` (what depends on it)."""
    return [dst for src, dst, _ in _EDGES if src == asset_id]


if __name__ == "__main__":
    mcp.run()

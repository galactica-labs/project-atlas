"""Smoke-check the 5 MCP servers by invoking representative tools in-process."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from atlas_ml.mcp_servers import telemetry, graph, parts, history, dispatch


async def call(server, name, **kwargs):
    res = await server.mcp.call_tool(name, kwargs)
    # FastMCP returns (content, structured) in recent versions
    structured = res[1] if isinstance(res, tuple) else res
    print(f"  {server.mcp.name}.{name} -> {structured}")


async def main():
    print("== mcp_telemetry ==")
    await call(telemetry, "get_current", asset_id="CHILLER-A-03", metric="supply_temperature")
    await call(telemetry, "list_anomalies")

    print("== mcp_graph ==")
    await call(graph, "get_asset", id="CHILLER-A-03")
    await call(graph, "blast_radius", asset_id="CHILLER-A-03", hops=3)
    await call(graph, "dependents_of", asset_id="PUMP-CHW-03")
    await call(graph, "dependencies_of", asset_id="PUMP-CHW-03")

    print("== mcp_parts ==")
    await call(parts, "check_stock", part_sku="BEARING-30XA-001")
    await call(parts, "nearest_warehouse", part_sku="COIL-CW080")
    await call(parts, "compatible_parts", asset_model="Carrier 30XA-1102")

    print("== mcp_history ==")
    await call(history, "past_incidents", asset_id="CHILLER-A-03")
    await call(history, "tech_history", tech_id="TECH-01")

    print("== mcp_dispatch ==")
    await call(dispatch, "propose_dispatch", asset_id="CHILLER-A-03",
               failure_mode_hypothesis="compressor_bearing_wear")
    await call(dispatch, "create_ticket", asset_id="CHILLER-A-03",
               action_type="dispatch_tech", summary="bearing wear")


if __name__ == "__main__":
    asyncio.run(main())

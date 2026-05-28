"""mcp_parts — stock, warehouse proximity, compatibility."""
from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from atlas_ml import parts as P
from atlas_ml.parts import SITE_FALLBACK_LAT, SITE_FALLBACK_LNG

mcp = FastMCP("atlas-parts")


@mcp.tool()
def check_stock(part_sku: str) -> dict:
    """On-hand stock and stocking warehouses for a SKU."""
    return P.check_stock(part_sku)


@mcp.tool()
def nearest_warehouse(part_sku: str, lat: float = SITE_FALLBACK_LAT,
                      lng: float = SITE_FALLBACK_LNG) -> dict:
    """Closest warehouse stocking the SKU to a lat/lng (defaults to the demo site)."""
    return P.nearest_warehouse(part_sku, lat, lng)


@mcp.tool()
def compatible_parts(asset_model: str) -> dict:
    """SKUs compatible with an asset model."""
    return P.compatible_parts(asset_model)


if __name__ == "__main__":
    mcp.run()

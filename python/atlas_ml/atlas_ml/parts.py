"""Seed parts + warehouse catalog (stand-in for the `parts` tables).

Backs the mcp_parts server. Maps SKUs to stock/warehouses and asset models to
their compatible SKUs.
"""
from __future__ import annotations

import math

# sku -> {"name", "stock", "warehouses": [warehouse_id, ...]}
PARTS = {
    "BEARING-30XA-001": {"name": "Carrier 30XA compressor bearing", "stock": 4, "warehouses": ["WH-ATH-01"]},
    "FILTER-DRIER-30XA": {"name": "Carrier 30XA filter drier", "stock": 12, "warehouses": ["WH-ATH-01", "WH-THE-01"]},
    "SEAL-NK100": {"name": "Grundfos NK100 mechanical seal", "stock": 7, "warehouses": ["WH-ATH-01"]},
    "COIL-CW080": {"name": "Stulz CW-080 coil", "stock": 2, "warehouses": ["WH-THE-01"]},
    "FAN-EC-080": {"name": "Stulz EC fan module", "stock": 5, "warehouses": ["WH-ATH-01"]},
    "BATT-9395-MOD": {"name": "Eaton 9395 battery module", "stock": 3, "warehouses": ["WH-ATH-01"]},
}

# demo data-center site location (used when a caller omits lat/lng)
SITE_FALLBACK_LAT, SITE_FALLBACK_LNG = 37.9838, 23.7275

# warehouse_id -> {"name", "lat", "lng"}
WAREHOUSES = {
    "WH-ATH-01": {"name": "Athens Central", "lat": 37.9838, "lng": 23.7275},
    "WH-THE-01": {"name": "Thessaloniki North", "lat": 40.6401, "lng": 22.9444},
}

# asset model -> compatible SKUs
COMPATIBLE = {
    "Carrier 30XA-1102": ["BEARING-30XA-001", "FILTER-DRIER-30XA"],
    "Grundfos NK 100-200": ["SEAL-NK100"],
    "Stulz CW-080": ["COIL-CW080", "FAN-EC-080"],
    "Eaton 9395": ["BATT-9395-MOD"],
}


def haversine_km(lat1, lng1, lat2, lng2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))


def check_stock(sku: str) -> dict:
    p = PARTS.get(sku)
    if not p:
        return {"sku": sku, "found": False, "stock": 0, "warehouses": []}
    return {"sku": sku, "found": True, "name": p["name"], "stock": p["stock"],
            "warehouses": p["warehouses"]}


def nearest_warehouse(sku: str, lat: float, lng: float) -> dict:
    p = PARTS.get(sku)
    if not p or not p["warehouses"]:
        return {"sku": sku, "found": False}
    best = min(
        p["warehouses"],
        key=lambda w: haversine_km(lat, lng, WAREHOUSES[w]["lat"], WAREHOUSES[w]["lng"]),
    )
    wh = WAREHOUSES[best]
    return {"sku": sku, "found": True, "warehouse_id": best, "name": wh["name"],
            "distance_km": round(haversine_km(lat, lng, wh["lat"], wh["lng"]), 1)}


def compatible_parts(asset_model: str) -> dict:
    return {"asset_model": asset_model, "skus": COMPATIBLE.get(asset_model, [])}

"""What a job needs: certs by asset_type, parts by failure mode. The manual/BOM
would supply these in production; seeded here for the hackathon."""
from __future__ import annotations

# hard cert requirement per asset_type (MILP feasibility)
REQUIRED_CERTS = {
    "chiller": ["EPA_608", "NFPA_70E"],
    "crah": ["EPA_608"],
    "pump": [],
    "ahu": ["EPA_608"],
    "pdu": ["NFPA_70E"],
    "ups": ["NFPA_70E"],
    "switchgear": ["NFPA_70E"],
    "gpu_pod": ["NFPA_70E"],
}

# parts a failure mode consumes (drives parts_status + warehouse-detour delay)
REQUIRED_PARTS = {
    "compressor_bearing_wear": ["BEARING-30XA-001"],
    "refrigerant_overcharge": [],
    "coil_fouling_or_fan_fault": [],
    "impeller_wear_or_blockage": ["SEAL-NK100"],
    "load_imbalance": [],
    "battery_thermal_runaway_risk": [],
    "cooling_supply_shortfall": [],
    "anomalous_drift": [],
}

# all assets at one demo site (catalog locations are empty in seed)
SITE_LAT, SITE_LNG = 37.9838, 23.7275
WAREHOUSE_DETOUR_MIN = 35.0  # added ETA when a needed part is not in the van

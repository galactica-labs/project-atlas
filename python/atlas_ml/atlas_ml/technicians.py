"""Seed technician roster (coordination doc §9.4: 8 techs).

Stand-in for the Postgres `technicians` + pgvector `tech_embeddings` tables.
Tuned so the chiller incident has two strong fits — one is busy, so MILP must
pick the other — plus near-misses (no cert / no part / wrong shift) that the
hard constraints rule out. Swap `TechRoster` for a DB query when Agent 2 lands;
the Technician schema is the contract.
"""
from __future__ import annotations

from atlas_ml.schemas import Technician

_TECHS = [
    Technician(
        id="TECH-01", name="Alice Nkemdiche", certs=["EPA_608", "NFPA_70E", "CFC"],
        asset_families=["chiller", "pump"],
        past_root_causes=["compressor_bearing_wear", "refrigerant_overcharge", "impeller_wear_or_blockage"],
        customer_rating=4.8, home_lat=37.98, home_lng=23.73,
        shift_start_hour=7, shift_end_hour=19, currently_dispatched=False,
        van_parts=["BEARING-30XA-001", "FILTER-DRIER-30XA"], overtime_rate=1.0,
    ),
    Technician(
        id="TECH-02", name="Bob Carmichael", certs=["EPA_608", "NFPA_70E", "CFC"],
        asset_families=["chiller"],
        past_root_causes=["compressor_bearing_wear", "compressor_bearing_wear"],
        customer_rating=4.9, home_lat=37.99, home_lng=23.74,
        shift_start_hour=7, shift_end_hour=19, currently_dispatched=True,  # busy
        van_parts=["BEARING-30XA-001"], overtime_rate=1.0,
    ),
    Technician(
        id="TECH-03", name="Carlos Vega", certs=["EPA_608", "CFC"],
        asset_families=["chiller", "crah"],
        past_root_causes=["coil_fouling_or_fan_fault", "refrigerant_overcharge"],
        customer_rating=4.2, home_lat=37.95, home_lng=23.70,
        shift_start_hour=8, shift_end_hour=18, currently_dispatched=False,
        van_parts=[], overtime_rate=1.0,  # lacks bearing part -> warehouse detour
    ),
    Technician(
        id="TECH-04", name="Dana Wu", certs=["EPA_608"],
        asset_families=["crah", "pump", "ahu"],
        past_root_causes=["impeller_wear_or_blockage", "coil_fouling_or_fan_fault"],
        customer_rating=4.5, home_lat=37.90, home_lng=23.65,
        shift_start_hour=8, shift_end_hour=18, currently_dispatched=False,
        van_parts=["SEAL-NK100"], overtime_rate=1.0,
    ),
    Technician(
        id="TECH-05", name="Evan Brooks", certs=["NFPA_70E"],
        asset_families=["pdu", "ups", "switchgear"],
        past_root_causes=["load_imbalance", "battery_thermal_runaway_risk"],
        customer_rating=4.6, home_lat=38.01, home_lng=23.78,
        shift_start_hour=7, shift_end_hour=19, currently_dispatched=False,
        van_parts=[], overtime_rate=1.0,  # no refrigerant cert -> fails chiller hard constraint
    ),
    Technician(
        id="TECH-06", name="Fatima Reyes", certs=["EPA_608", "NFPA_70E"],
        asset_families=["chiller", "pdu"],
        past_root_causes=["load_imbalance"],
        customer_rating=3.4, home_lat=37.80, home_lng=23.55,
        shift_start_hour=8, shift_end_hour=18, currently_dispatched=False,
        van_parts=[], overtime_rate=1.2,
    ),
    Technician(
        id="TECH-07", name="Grace Liang", certs=["EPA_608", "NFPA_70E", "CFC"],
        asset_families=["chiller"],
        past_root_causes=["compressor_bearing_wear"],
        customer_rating=4.7, home_lat=37.97, home_lng=23.72,
        shift_start_hour=22, shift_end_hour=6, currently_dispatched=False,  # night shift
        van_parts=["BEARING-30XA-001"], overtime_rate=1.5,
    ),
    Technician(
        id="TECH-08", name="Hiro Tanaka", certs=["EPA_608"],
        asset_families=["pump", "ahu"],
        past_root_causes=["impeller_wear_or_blockage"],
        customer_rating=4.3, home_lat=38.05, home_lng=23.80,
        shift_start_hour=8, shift_end_hour=18, currently_dispatched=False,
        van_parts=[], overtime_rate=1.0,
    ),
]


class TechRoster:
    def __init__(self, techs: list[Technician] | None = None):
        self.techs = techs if techs is not None else list(_TECHS)

    def all(self) -> list[Technician]:
        return self.techs

    def get(self, tech_id: str) -> Technician | None:
        return next((t for t in self.techs if t.id == tech_id), None)


roster = TechRoster()

"""Seed asset catalog + dependency graph + failure thresholds.

Stand-in for Agent 2's Postgres + Apache AGE until the DB is up. Encodes the
subset of coordination doc §9.1/§9.2 the reasoning chain needs: asset_type and
criticality lookup, the FEEDS/DEPENDS_ON edges for blast radius, and per
(asset_type, metric) failure thresholds (which the manual would supply).

Swap `AssetCatalog`/`DependencyGraph` for AGE Cypher queries when AGE lands —
the BlastRadiusNode output contract is unchanged.
"""
from __future__ import annotations

from atlas_ml.schemas import Asset, BlastRadiusNode
from datetime import datetime, timedelta

# (asset_id, asset_type, model, criticality)
_ASSETS = [
    ("CHILLER-A-01", "chiller", "Carrier 30XA-1102", "critical"),
    ("CHILLER-A-02", "chiller", "Carrier 30XA-1102", "critical"),
    ("CHILLER-A-03", "chiller", "Carrier 30XA-1102", "critical"),
    ("PUMP-CHW-01", "pump", "Grundfos NK 100-200", "high"),
    ("PUMP-CHW-02", "pump", "Grundfos NK 100-200", "high"),
    ("PUMP-CHW-03", "pump", "Grundfos NK 100-200", "high"),
    ("PUMP-CHW-04", "pump", "Grundfos NK 100-200", "high"),
    ("CRAH-A-01", "crah", "Stulz CW-080", "high"),
    ("CRAH-A-02", "crah", "Stulz CW-080", "high"),
    ("CRAH-A-03", "crah", "Stulz CW-080", "high"),
    ("CRAH-A-04", "crah", "Stulz CW-080", "high"),
    ("CRAH-B-01", "crah", "Stulz CW-080", "high"),
    ("CRAH-B-02", "crah", "Stulz CW-080", "high"),
    ("CRAH-B-03", "crah", "Stulz CW-080", "high"),
    ("CRAH-B-04", "crah", "Stulz CW-080", "high"),
    ("SWG-MAIN", "switchgear", "Schneider Masterpact", "critical"),
    ("SWG-BACKUP", "switchgear", "Schneider Masterpact", "critical"),
    ("UPS-MAIN", "ups", "Eaton 9395", "critical"),
    ("UPS-BACKUP", "ups", "Eaton 9395", "critical"),
    ("PDU-A", "pdu", "Vertiv 250kVA", "critical"),
    ("PDU-B", "pdu", "Vertiv 250kVA", "critical"),
    ("PDU-C", "pdu", "Vertiv 250kVA", "critical"),
    ("PDU-D", "pdu", "Vertiv 250kVA", "critical"),
    ("POD-01", "gpu_pod", "NVIDIA DGX H100", "critical"),
    ("POD-02", "gpu_pod", "NVIDIA DGX H100", "critical"),
    ("POD-03", "gpu_pod", "NVIDIA DGX H100", "critical"),
    ("POD-04", "gpu_pod", "NVIDIA DGX H100", "critical"),
    ("POD-05", "gpu_pod", "NVIDIA DGX H100", "critical"),
    ("POD-06", "gpu_pod", "NVIDIA DGX H100", "critical"),
]

# (src, dst, kind) — kind drives the BlastRadiusNode.impact_type
_EDGES = [
    # power chain
    ("SWG-MAIN", "UPS-MAIN", "power"), ("UPS-MAIN", "PDU-A", "power"),
    ("UPS-MAIN", "PDU-B", "power"), ("SWG-BACKUP", "UPS-BACKUP", "power"),
    ("UPS-BACKUP", "PDU-C", "power"), ("UPS-BACKUP", "PDU-D", "power"),
    ("PDU-A", "POD-01", "power"), ("PDU-A", "POD-02", "power"),
    ("PDU-B", "POD-03", "power"), ("PDU-B", "POD-04", "power"),
    ("PDU-C", "POD-05", "power"), ("PDU-D", "POD-06", "power"),
    # cooling chain
    ("CHILLER-A-01", "PUMP-CHW-01", "cooling"), ("CHILLER-A-02", "PUMP-CHW-02", "cooling"),
    ("CHILLER-A-03", "PUMP-CHW-03", "cooling"), ("CHILLER-A-03", "PUMP-CHW-04", "cooling"),
    ("PUMP-CHW-01", "CRAH-A-01", "cooling"), ("PUMP-CHW-01", "CRAH-A-02", "cooling"),
    ("PUMP-CHW-02", "CRAH-A-03", "cooling"), ("PUMP-CHW-02", "CRAH-A-04", "cooling"),
    ("PUMP-CHW-03", "CRAH-B-01", "cooling"), ("PUMP-CHW-03", "CRAH-B-02", "cooling"),
    ("PUMP-CHW-04", "CRAH-B-03", "cooling"), ("PUMP-CHW-04", "CRAH-B-04", "cooling"),
    # cooling dependency: CRAH feeds cooling to the pods in its row
    ("CRAH-B-01", "POD-05", "capacity"), ("CRAH-B-02", "POD-05", "capacity"),
    ("CRAH-B-03", "POD-06", "capacity"), ("CRAH-B-04", "POD-06", "capacity"),
]

# (asset_type, metric) -> (threshold, direction). direction = failure side.
_THRESHOLDS = {
    ("chiller", "supply_temperature"): (50.0, "above"),
    ("chiller", "compressor_pressure"): (380.0, "above"),
    ("crah", "return_temperature"): (85.0, "above"),
    ("pump", "flow_rate"): (80.0, "below"),
    ("pdu", "load_pct"): (95.0, "above"),
    ("ups", "battery_temperature"): (60.0, "above"),
    ("gpu_pod", "inlet_temperature"): (35.0, "above"),
}

_IMPACT_BY_KIND = {
    "power": "loss_of_power",
    "cooling": "loss_of_cooling",
    "capacity": "loss_of_capacity",
}


class AssetCatalog:
    def __init__(self):
        self._by_id = {
            a[0]: Asset(id=a[0], asset_type=a[1], model=a[2], criticality=a[3])
            for a in _ASSETS
        }

    def get(self, asset_id: str) -> Asset | None:
        return self._by_id.get(asset_id)

    def asset_type(self, asset_id: str) -> str | None:
        a = self._by_id.get(asset_id)
        return a.asset_type if a else None

    def threshold(self, asset_id: str, metric: str) -> tuple[float, str] | None:
        atype = self.asset_type(asset_id)
        return _THRESHOLDS.get((atype, metric)) if atype else None


class DependencyGraph:
    def __init__(self):
        self._adj: dict[str, list[tuple[str, str]]] = {}
        for src, dst, kind in _EDGES:
            self._adj.setdefault(src, []).append((dst, kind))

    def blast_radius(
        self,
        source_id: str,
        time_to_failure_seconds: int,
        detected_at: datetime,
        max_hops: int = 3,
    ) -> list[BlastRadiusNode]:
        """BFS downstream. Each hop's impact lands a fraction of the source's
        time-to-failure later (cooling/power propagation is not instantaneous)."""
        ttf = max(time_to_failure_seconds, 1)
        per_hop = ttf / max(max_hops, 1)
        out: list[BlastRadiusNode] = []
        seen = {source_id}
        frontier = [(source_id, 0, "cooling")]
        while frontier:
            node, hops, _ = frontier.pop(0)
            if hops >= max_hops:
                continue
            for dst, kind in self._adj.get(node, []):
                if dst in seen:
                    continue
                seen.add(dst)
                h = hops + 1
                out.append(BlastRadiusNode(
                    asset_id=dst,
                    hops_from_source=h,
                    estimated_impact_at=detected_at + timedelta(seconds=per_hop * h),
                    impact_type=_IMPACT_BY_KIND.get(kind, "degraded"),
                ))
                frontier.append((dst, h, kind))
        return out


catalog = AssetCatalog()
graph = DependencyGraph()

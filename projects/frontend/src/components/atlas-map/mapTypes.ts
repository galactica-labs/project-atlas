export type FloorId = "floor-b" | "floor-a" | "floor-c";

export interface FloorMeta {
  id: FloorId;
  name: string;
  shortLabel: string;
  description: string;
  color: string;
}

export const FLOOR_META: Record<FloorId, FloorMeta> = {
  "floor-b": {
    id: "floor-b",
    name: "Floor B",
    shortLabel: "B",
    description: "Main Data Hall — Ground Level",
    color: "#334155",
  },
  "floor-a": {
    id: "floor-a",
    name: "Floor A",
    shortLabel: "A",
    description: "Network Ops — Upper Level",
    color: "#1e3a5f",
  },
  "floor-c": {
    id: "floor-c",
    name: "Floor C",
    shortLabel: "C",
    description: "Mechanical — Basement",
    color: "#32200a",
  },
};

export type AssetType =
  | "rack"
  | "pdu"
  | "ups"
  | "crac"
  | "sensor"
  | "generator"
  | "switch"
  | "cooling_unit"
  | "firewall"
  | "patch_panel"
  | "chiller"
  | "battery"
  | "switchgear";

export type AssetStatus = "normal" | "warning" | "critical" | "offline";

export type AssetCriticality = "low" | "medium" | "high" | "critical";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  coordinates: [number, number];
  zoneId: string;
  floorId: FloorId;
  criticality: AssetCriticality;
  metadata: Record<string, string | number>;
}

export type EdgeType = "FEEDS" | "DEPENDS_ON" | "CONNECTED_TO";

export type EdgeResource = "power" | "cooling" | "network" | "dependency";

export interface DependencyEdge {
  id: string;
  sourceAssetId: string;
  targetAssetId: string;
  type: EdgeType;
  resource: EdgeResource;
  criticality: AssetCriticality;
  minutesToImpact?: number;
  activeInIncident: boolean;
}

export type ZoneType =
  | "hall"
  | "row"
  | "electrical"
  | "cooling"
  | "restricted"
  | "corridor"
  | "network"
  | "noc"
  | "ups_room"
  | "patch_bay"
  | "generator"
  | "chiller_plant"
  | "battery_room"
  | "switchgear";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  polygon: [number, number][];
  metadata: Record<string, string | number>;
}

export interface FloorData {
  id: FloorId;
  zones: Zone[];
  assets: Asset[];
  edges: DependencyEdge[];
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  message: string;
  severity: "info" | "warning" | "critical";
}

export interface LayerVisibility {
  power: boolean;
  cooling: boolean;
  network: boolean;
  dependency: boolean;
  labels: boolean;
  criticalPathOnly: boolean;
}

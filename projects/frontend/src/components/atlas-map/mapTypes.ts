export type AssetType =
  | "rack"
  | "pdu"
  | "ups"
  | "crac"
  | "sensor"
  | "generator"
  | "switch"
  | "cooling_unit";

export type AssetStatus = "normal" | "warning" | "critical" | "offline";

export type AssetCriticality = "low" | "medium" | "high" | "critical";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  coordinates: [number, number]; // facility x, y
  zoneId: string;
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

export type ZoneType = "hall" | "row" | "electrical" | "cooling" | "restricted" | "corridor";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  polygon: [number, number][]; // facility coordinates
  metadata: Record<string, string | number>;
}

export interface TimelineEvent {
  id: string;
  timestamp: number; // relative ms from incident start
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

export interface FloorPlanState {
  selectedAssetId: string | null;
  incidentActive: boolean;
  incidentAssetOverrides: Record<string, AssetStatus>;
  incidentEdgeOverrides: Record<string, boolean>;
  layerVisibility: LayerVisibility;
  timelineEvents: TimelineEvent[];
}

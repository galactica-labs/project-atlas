export type AssetStatus = "normal" | "warning" | "critical" | "offline";

export type AssetType =
  | "rack"
  | "crac"
  | "pdu"
  | "ups"
  | "switch"
  | "sensor"
  | "generator"
  | "cooling_unit";

export type DependencyResource = "power" | "cooling" | "network" | "dependency";

export type ViewMode = "overview" | "focus" | "incident";

export type Asset3D = {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  position: [number, number, number];
  rotation?: [number, number, number];
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  zoneId: string;
  criticality: number;
  metadata?: Record<string, unknown>;
};

export type DependencyEdge3D = {
  id: string;
  sourceAssetId: string;
  targetAssetId: string;
  type: "FEEDS" | "DEPENDS_ON" | "CONNECTED_TO";
  resource: DependencyResource;
  criticality: number;
  minutesToImpact?: number;
  activeInIncident?: boolean;
};

export type Zone3D = {
  id: string;
  name: string;
  color: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
};

export type TimelineEvent = {
  id: string;
  timestamp: string;
  message: string;
  severity: "info" | "warning" | "critical";
};

export type BlastRadiusItem = {
  assetId: string;
  assetName: string;
  impact: string;
  minutesToImpact: number;
};

export type CameraFocusRequest =
  | { type: "overview" }
  | { type: "asset"; assetId: string }
  | { type: "incident"; rootAssetId: string; affectedAssetIds: string[] }
  | { type: "cluster"; assetIds: string[] };

export type VisibleLayers = {
  power: boolean;
  cooling: boolean;
  network: boolean;
  dependency: boolean;
  labels: boolean;
  criticalPathOnly: boolean;
  grid: boolean;
  zoneBoundaries: boolean;
};

import type { AssetStatus, DependencyResource } from "./sceneTypes";

export const STATUS_COLORS: Record<AssetStatus, string> = {
  normal: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
  offline: "#3f3f46",
};

export const STATUS_EMISSIVE: Record<AssetStatus, string> = {
  normal: "#052e0a",
  warning: "#451a00",
  critical: "#450a0a",
  offline: "#000000",
};

export const STATUS_EMISSIVE_INTENSITY: Record<AssetStatus, number> = {
  normal: 0.08,
  warning: 0.25,
  critical: 0.5,
  offline: 0,
};

export const RESOURCE_COLORS: Record<DependencyResource, string> = {
  power: "#eab308",
  cooling: "#22d3ee",
  network: "#a855f7",
  dependency: "#f97316",
};

export const ASSET_BODY_COLOR = "#111111";
export const ASSET_DETAIL_COLOR = "#1c1c1c";
export const FLOOR_COLOR = "#080808";
export const FLOOR_GRID_COLOR = "#ffffff";
export const FLOOR_GRID_OPACITY = 0.035;
export const ZONE_OPACITY = 0.05;
export const SELECTION_RING_COLOR = "#ffffff";
export const HOVER_EMISSIVE = "#1a1a1a";

// Zone floor tint colors
export const ZONE_FLOOR_TINTS: Record<string, { color: string; opacity: number }> = {
  "cooling-zone": { color: "#0c4a6e", opacity: 0.18 },
  "electrical-zone": { color: "#451a03", opacity: 0.18 },
  "network-zone": { color: "#2e1065", opacity: 0.18 },
  "cold-aisle": { color: "#083344", opacity: 0.22 },
  "hot-aisle-c": { color: "#3d1200", opacity: 0.1 },
  "hot-aisle-d": { color: "#3d1200", opacity: 0.1 },
  "row-c": { color: "#0f172a", opacity: 0.08 },
  "row-d": { color: "#0f172a", opacity: 0.08 },
  "hall-b": { color: "#111827", opacity: 0.04 },
};

export const ZONE_COLORS: Record<string, string> = {
  "hall-b": "#334155",
  "row-c": "#1e3a5f",
  "row-d": "#1e3a5f",
  "cooling-zone": "#083344",
  "electrical-zone": "#32200a",
  "network-zone": "#1a0a3a",
  corridor: "#1c1c1c",
};

// Incident overlay colors
export const INCIDENT_ZONE_GLOW = "#ff4400";
export const INCIDENT_ZONE_GLOW_OPACITY = 0.15;

// Wall colors
export const WALL_COLOR = "#1a1a1a";
export const WALL_OPACITY = 0.25;
export const WALL_EMISSIVE = "#0a0a0a";
export const DIVIDER_COLOR = "#252525";
export const DIVIDER_OPACITY = 0.3;

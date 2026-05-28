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

export const ASSET_BODY_COLOR = "#141414";
export const ASSET_DETAIL_COLOR = "#1e1e1e";
export const FLOOR_COLOR = "#0a0a0a";
export const FLOOR_GRID_COLOR = "#ffffff";
export const FLOOR_GRID_OPACITY = 0.04;
export const ZONE_OPACITY = 0.04;
export const SELECTION_RING_COLOR = "#ffffff";
export const HOVER_EMISSIVE = "#1a1a1a";

export const ZONE_COLORS: Record<string, string> = {
  "hall-b": "#334155",
  "row-c": "#1e3a5f",
  "row-d": "#1e3a5f",
  "cooling-zone": "#083344",
  "electrical-zone": "#32200a",
  "network-zone": "#1a0a3a",
};

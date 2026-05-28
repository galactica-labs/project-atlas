// Color tokens matching the ATLAS design system
export const COLORS = {
  bg: "#05070A",
  panel: "#0B0F16",
  panelBorder: "#1A2232",
  border: "#202A36",
  borderStrong: "#334155",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#64748B",

  // Status
  normal: "#22C55E",
  warning: "#F59E0B",
  critical: "#EF4444",
  offline: "#6B7280",

  // Resources
  power: "#FACC15",
  cooling: "#38BDF8",
  network: "#A78BFA",
  dependency: "#F97316",

  // Incident
  rootFailure: "#EF4444",
  affectedWarning: "#F59E0B",
  activePath: "#FB7185",
} as const;

// Mapbox custom style — pure dark background, no real-world tiles
export const MAP_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#05070A" },
    },
  ],
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
};

// Status color expression for circle layer
export const STATUS_COLOR_EXPR = [
  "case",
  ["==", ["get", "status"], "critical"],
  COLORS.critical,
  ["==", ["get", "status"], "warning"],
  COLORS.warning,
  ["==", ["get", "status"], "offline"],
  COLORS.offline,
  COLORS.normal,
] as mapboxgl.ExpressionSpecification;

// Circle radius by asset type
export const ASSET_RADIUS_EXPR = [
  "case",
  ["==", ["get", "assetType"], "crac"],
  9,
  ["==", ["get", "assetType"], "chiller"],
  9,
  ["==", ["get", "assetType"], "ups"],
  8,
  ["==", ["get", "assetType"], "generator"],
  8,
  ["==", ["get", "assetType"], "switchgear"],
  7,
  ["==", ["get", "assetType"], "rack"],
  6,
  ["==", ["get", "assetType"], "pdu"],
  5,
  ["==", ["get", "assetType"], "switch"],
  5,
  ["==", ["get", "assetType"], "firewall"],
  7,
  ["==", ["get", "assetType"], "battery"],
  6,
  ["==", ["get", "assetType"], "patch_panel"],
  5,
  ["==", ["get", "assetType"], "sensor"],
  4,
  5,
] as mapboxgl.ExpressionSpecification;

// Edge opacity: active paths are bright, inactive are dim
export const EDGE_OPACITY_EXPR = [
  "case",
  ["==", ["get", "activeInIncident"], 1],
  0.92,
  0.15,
] as mapboxgl.ExpressionSpecification;

// Edge width: active paths are thicker
export const EDGE_WIDTH_EXPR = [
  "case",
  ["==", ["get", "activeInIncident"], 1],
  3.5,
  1.5,
] as mapboxgl.ExpressionSpecification;

// Label text size
export const LABEL_SIZE = 10;

// Layer IDs
export const LAYER_IDS = {
  zonesFill: "zones-fill",
  zonesOutline: "zones-outline",
  zoneLabels: "zone-labels",
  edgesPower: "edges-power",
  edgesCooling: "edges-cooling",
  edgesNetwork: "edges-network",
  edgesDependency: "edges-dependency",
  assetsBase: "assets-base",
  assetsSelectedRing: "assets-selected-ring",
  assetsHover: "assets-hover",
  assetsLabels: "assets-labels",
} as const;

export const SOURCE_IDS = {
  zones: "zones",
  assets: "assets",
  edges: "edges",
} as const;

// Zone fill color expression
export const ZONE_FILL_EXPR = [
  "match",
  ["get", "zoneType"],
  "hall",
  "rgba(14,18,24,0.92)",
  "row",
  "rgba(30,41,59,0.30)",
  "electrical",
  "rgba(250,204,21,0.07)",
  "cooling",
  "rgba(56,189,248,0.07)",
  "network",
  "rgba(167,139,250,0.07)",
  "noc",
  "rgba(56,189,248,0.06)",
  "ups_room",
  "rgba(250,204,21,0.06)",
  "patch_bay",
  "rgba(100,116,139,0.06)",
  "generator",
  "rgba(250,204,21,0.06)",
  "chiller_plant",
  "rgba(56,189,248,0.08)",
  "battery_room",
  "rgba(250,204,21,0.05)",
  "switchgear",
  "rgba(239,68,68,0.06)",
  "restricted",
  "rgba(239,68,68,0.07)",
  "corridor",
  "rgba(14,18,24,0.55)",
  "rgba(14,18,24,0.50)",
] as mapboxgl.ExpressionSpecification;

// Zone outline color expression
export const ZONE_OUTLINE_EXPR = [
  "match",
  ["get", "zoneType"],
  "hall",
  "#202A36",
  "row",
  "#334155",
  "electrical",
  "rgba(250,204,21,0.40)",
  "cooling",
  "rgba(56,189,248,0.40)",
  "network",
  "rgba(167,139,250,0.40)",
  "noc",
  "rgba(56,189,248,0.35)",
  "ups_room",
  "rgba(250,204,21,0.30)",
  "patch_bay",
  "rgba(100,116,139,0.30)",
  "generator",
  "rgba(250,204,21,0.35)",
  "chiller_plant",
  "rgba(56,189,248,0.40)",
  "battery_room",
  "rgba(250,204,21,0.30)",
  "switchgear",
  "rgba(239,68,68,0.45)",
  "restricted",
  "rgba(239,68,68,0.50)",
  "corridor",
  "#202A36",
  "#202A36",
] as mapboxgl.ExpressionSpecification;

// Zone label color expression
export const ZONE_LABEL_COLOR_EXPR = [
  "match",
  ["get", "zoneType"],
  "cooling",
  "rgba(56,189,248,0.55)",
  "chiller_plant",
  "rgba(56,189,248,0.55)",
  "electrical",
  "rgba(250,204,21,0.55)",
  "generator",
  "rgba(250,204,21,0.55)",
  "ups_room",
  "rgba(250,204,21,0.50)",
  "battery_room",
  "rgba(250,204,21,0.45)",
  "switchgear",
  "rgba(239,68,68,0.55)",
  "network",
  "rgba(167,139,250,0.55)",
  "noc",
  "rgba(56,189,248,0.50)",
  "row",
  "rgba(100,116,139,0.55)",
  "rgba(60,70,85,0.50)",
] as mapboxgl.ExpressionSpecification;

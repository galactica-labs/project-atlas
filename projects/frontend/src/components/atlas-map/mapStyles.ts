// Color constants matching the ATLAS design system
export const COLORS = {
  bg: "#05070A",
  panel: "#0E1218",
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

// Zone fill colors (very subtle)
export const ZONE_FILL_COLORS: Record<string, string> = {
  hall: "rgba(14, 18, 24, 0.95)",
  row: "rgba(30, 41, 59, 0.35)",
  electrical: "rgba(250, 204, 21, 0.06)",
  cooling: "rgba(56, 189, 248, 0.06)",
  restricted: "rgba(239, 68, 68, 0.06)",
  corridor: "rgba(14, 18, 24, 0.5)",
};

// Zone border colors
export const ZONE_BORDER_COLORS: Record<string, string> = {
  hall: "#202A36",
  row: "#334155",
  electrical: "rgba(250, 204, 21, 0.4)",
  cooling: "rgba(56, 189, 248, 0.4)",
  restricted: "rgba(239, 68, 68, 0.5)",
  corridor: "#202A36",
};

// Mapbox custom style spec (no tiles, pure dark background)
export const MAP_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#05070A",
      },
    },
    {
      id: "grid",
      type: "background",
      paint: {
        "background-color": "transparent",
        "background-opacity": 0,
      },
    },
  ],
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
};

// Mapbox status color expression for circle layer
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

// Mapbox circle radius by asset type
export const ASSET_RADIUS_EXPR = [
  "case",
  ["==", ["get", "assetType"], "crac"],
  8,
  ["==", ["get", "assetType"], "ups"],
  7,
  ["==", ["get", "assetType"], "generator"],
  7,
  ["==", ["get", "assetType"], "rack"],
  6,
  ["==", ["get", "assetType"], "pdu"],
  5,
  ["==", ["get", "assetType"], "switch"],
  5,
  ["==", ["get", "assetType"], "sensor"],
  4,
  5,
] as mapboxgl.ExpressionSpecification;

// Edge color by resource type
export const edgeColor = (resource: string): string => {
  const map: Record<string, string> = {
    power: COLORS.power,
    cooling: COLORS.cooling,
    network: COLORS.network,
    dependency: COLORS.dependency,
  };
  return map[resource] ?? COLORS.dependency;
};

// Edge opacity expression (active vs inactive)
export const EDGE_OPACITY_EXPR = [
  "case",
  ["==", ["get", "activeInIncident"], 1],
  0.92,
  0.18,
] as mapboxgl.ExpressionSpecification;

// Edge width expression
export const EDGE_WIDTH_EXPR = [
  "case",
  ["==", ["get", "activeInIncident"], 1],
  3,
  1.5,
] as mapboxgl.ExpressionSpecification;

// Asset label text size
export const LABEL_SIZE = 10;

// Layer IDs used throughout the map
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

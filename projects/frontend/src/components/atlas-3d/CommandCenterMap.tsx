import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef } from "react";
import type { Asset, Incident } from "../../data/mock";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

// ── Coordinate system ─────────────────────────────────────────────────────────
// Facility space: 100 × 100 units → small synthetic lng/lat region
const ORIGIN_LNG = 23.7275;
const ORIGIN_LAT = 37.9838;
const SCALE = 0.0000195;

function toLngLat(x: number, y: number): [number, number] {
  return [ORIGIN_LNG + x * SCALE, ORIGIN_LAT + y * SCALE];
}

// ── Zone layout: [x1, y1, x2, y2] in facility units ──────────────────────────
// Each floor divides the 100×100 space into labelled zone rectangles
const ZONE_RECTS: Record<string, Record<string, [number, number, number, number]>> = {
  Mechanical: {
    Electrical: [2, 2, 98, 30],
    "Backup Power": [2, 33, 98, 61],
    "Chiller Plant": [2, 64, 98, 98],
  },
  "Hall A": {
    "Cooling Bay A": [2, 2, 98, 20],
    "Compute Row A": [2, 23, 98, 51],
    "Compute Row B": [2, 54, 98, 82],
    "Power & Network A": [2, 85, 98, 98],
  },
  "Hall B": {
    "Cooling Bay B": [2, 2, 98, 20],
    "Compute Row C": [2, 23, 98, 51],
    "Compute Row D": [2, 54, 98, 82],
    "Power & Network B": [2, 85, 98, 98],
  },
};

// Semantic zone type → color bucket (used in Mapbox expressions)
const ZONE_TYPE_MAP: Record<string, string> = {
  Electrical: "electrical",
  "Backup Power": "power",
  "Chiller Plant": "cooling",
  "Cooling Bay A": "cooling",
  "Cooling Bay B": "cooling",
  "Compute Row A": "compute",
  "Compute Row B": "compute",
  "Compute Row C": "compute",
  "Compute Row D": "compute",
  "Power & Network A": "network",
  "Power & Network B": "network",
};

const ZONE_PURPOSE_COPY: Record<string, string> = {
  Electrical: "Switchgear + transformers",
  "Backup Power": "Generators, UPS + batteries",
  "Chiller Plant": "Chillers, towers + CHW pumps",
  "Cooling Bay A": "CRAH air handling",
  "Cooling Bay B": "CRAH air handling",
  "Compute Row A": "CPU rack line",
  "Compute Row B": "GPU pods + racks",
  "Compute Row C": "GPU pod cluster",
  "Compute Row D": "Rack compute line",
  "Power & Network A": "PDUs + core switching",
  "Power & Network B": "PDUs + distribution switching",
};

type MachineIconKey =
  | "battery"
  | "chiller"
  | "coolingTower"
  | "crah"
  | "generator"
  | "gpuPod"
  | "networkSwitch"
  | "pdu"
  | "pump"
  | "rack"
  | "switchgear"
  | "transformer"
  | "ups";

const MACHINE_ICON_IMAGE_IDS: Record<MachineIconKey, string> = {
  battery: "cc-machine-battery",
  chiller: "cc-machine-chiller",
  coolingTower: "cc-machine-cooling-tower",
  crah: "cc-machine-crah",
  generator: "cc-machine-generator",
  gpuPod: "cc-machine-gpu-pod",
  networkSwitch: "cc-machine-network-switch",
  pdu: "cc-machine-pdu",
  pump: "cc-machine-pump",
  rack: "cc-machine-rack",
  switchgear: "cc-machine-switchgear",
  transformer: "cc-machine-transformer",
  ups: "cc-machine-ups",
};

const MACHINE_ICON_GLYPHS: Record<MachineIconKey, string> = {
  battery: "🔋",
  chiller: "❄",
  coolingTower: "🌬",
  crah: "🌬",
  generator: "⚙",
  gpuPod: "🖥",
  networkSwitch: "📡",
  pdu: "🔌",
  pump: "🌀",
  rack: "🗄",
  switchgear: "⚡",
  transformer: "🔁",
  ups: "🔋",
};

function machineIconKey(asset: Asset): MachineIconKey {
  const id = asset.id.toLowerCase();
  const name = asset.name.toLowerCase();

  if (id.startsWith("swg")) return "switchgear";
  if (id.startsWith("xfmr")) return "transformer";
  if (id.startsWith("gen-")) return "generator";
  if (id.startsWith("ups")) return "ups";
  if (id.startsWith("batt")) return "battery";
  if (id.startsWith("pdu")) return "pdu";
  if (id.startsWith("ct-")) return "coolingTower";
  if (id.startsWith("pump-")) return "pump";
  if (name.startsWith("crah")) return "crah";
  if (name.startsWith("chiller")) return "chiller";
  if (id.startsWith("pod-")) return "gpuPod";
  if (id.startsWith("rack-")) return "rack";
  if (id.includes("sw")) return "networkSwitch";

  if (asset.type === "Cooling") return "chiller";
  if (asset.type === "Compute") return "rack";
  if (asset.type === "Network") return "networkSwitch";

  return "switchgear";
}

function buildMachineIconImage(glyph: string): ImageData | null {
  const size = 32;
  const pixelRatio = 2;
  const canvas = document.createElement("canvas");
  canvas.width = size * pixelRatio;
  canvas.height = size * pixelRatio;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(pixelRatio, pixelRatio);
  ctx.clearRect(0, 0, size, size);
  ctx.font = '19px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(2, 6, 23, 0.95)";
  ctx.shadowBlur = 4;
  ctx.fillText(glyph, size / 2, size / 2 + 1);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function ensureMachineIcons(map: mapboxgl.Map) {
  for (const [key, imageId] of Object.entries(MACHINE_ICON_IMAGE_IDS) as [
    MachineIconKey,
    string,
  ][]) {
    if (map.hasImage(imageId)) continue;

    const icon = buildMachineIconImage(MACHINE_ICON_GLYPHS[key]);
    if (icon) map.addImage(imageId, icon, { pixelRatio: 2 });
  }
}

// ── Mapbox style ──────────────────────────────────────────────────────────────
const MAP_STYLE: mapboxgl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#060606" } }],
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
};

// ── Colors ────────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  normal: "#22C55E",
  warning: "#F59E0B",
  critical: "#EF4444",
  offline: "#6B7280",
};

// ── GeoJSON builders ──────────────────────────────────────────────────────────

type FloorKey = "Mechanical" | "Hall A" | "Hall B";

function assetCoord(asset: Asset, floor: FloorKey): [number, number] | null {
  const rect = ZONE_RECTS[floor]?.[asset.zone];
  if (!rect) return null;
  const [x1, y1, x2, y2] = rect;
  const ax = x1 + (asset.x / 100) * (x2 - x1);
  const ay = y1 + (asset.y / 100) * (y2 - y1);
  return toLngLat(ax, ay);
}

function buildZonesGeoJSON(floor: FloorKey): GeoJSON.FeatureCollection {
  const rects = ZONE_RECTS[floor] ?? {};
  return {
    type: "FeatureCollection",
    features: Object.entries(rects).map(([name, [x1, y1, x2, y2]]) => ({
      type: "Feature",
      id: `zone-${name}`,
      properties: {
        name,
        purpose: ZONE_PURPOSE_COPY[name] ?? "Facility operations",
        zoneType: ZONE_TYPE_MAP[name] ?? "default",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            toLngLat(x1, y1),
            toLngLat(x2, y1),
            toLngLat(x2, y2),
            toLngLat(x1, y2),
            toLngLat(x1, y1),
          ],
        ],
      },
    })),
  };
}

function buildAssetsGeoJSON(
  assets: Asset[],
  floor: FloorKey,
  incident: Incident | undefined,
  litNodes: Set<string>
): GeoJSON.FeatureCollection {
  const floorAssets = assets.filter((a) => a.floor === floor);
  const features: GeoJSON.Feature[] = [];

  for (const a of floorAssets) {
    const coord = assetCoord(a, floor);
    if (!coord) continue;

    const isSource = incident?.assetId === a.id;
    const isBlast = litNodes.has(a.id);
    const status = isSource ? "critical" : isBlast ? "warning" : a.status;

    features.push({
      type: "Feature",
      id: a.id,
      properties: {
        id: a.id,
        name: a.name,
        assetType: a.type.toLowerCase(),
        machineIcon: MACHINE_ICON_IMAGE_IDS[machineIconKey(a)],
        status,
        isSource: isSource ? 1 : 0,
        isBlast: isBlast ? 1 : 0,
      },
      geometry: { type: "Point", coordinates: coord },
    });
  }

  return { type: "FeatureCollection", features };
}

function buildEdgesGeoJSON(
  assets: Asset[],
  floor: FloorKey,
  incident: Incident | undefined,
  litNodes: Set<string>
): GeoJSON.FeatureCollection {
  const floorAssets = assets.filter((a) => a.floor === floor);
  const coordMap = new Map<string, [number, number]>();
  for (const a of floorAssets) {
    const c = assetCoord(a, floor);
    if (c) coordMap.set(a.id, c);
  }

  const features: GeoJSON.Feature[] = [];
  const added = new Set<string>();

  for (const a of floorAssets) {
    const tgtCoord = coordMap.get(a.id);
    if (!tgtCoord) continue;

    for (const depId of a.dependsOn) {
      const srcCoord = coordMap.get(depId);
      if (!srcCoord) continue;

      const edgeKey = [depId, a.id].sort().join("--");
      if (added.has(edgeKey)) continue;
      added.add(edgeKey);

      const isBlastEdge =
        incident &&
        (litNodes.has(a.id) || a.id === incident.assetId) &&
        (litNodes.has(depId) || depId === incident.assetId);

      // Determine resource type from the source asset's type
      const srcAsset = floorAssets.find((x) => x.id === depId);
      const resource = srcAsset?.type === "Cooling" ? "cooling" : "power";

      features.push({
        type: "Feature",
        id: edgeKey,
        properties: {
          id: edgeKey,
          resource,
          isBlast: isBlastEdge ? 1 : 0,
        },
        geometry: { type: "LineString", coordinates: [srcCoord, tgtCoord] },
      });
    }
  }

  // Additional blast-radius edges from incident root to targets not already connected
  if (incident) {
    const rootCoord = coordMap.get(incident.assetId);
    if (rootCoord) {
      for (const tid of incident.blastRadius) {
        const tgtCoord = coordMap.get(tid);
        if (!tgtCoord) continue;
        const edgeKey = [incident.assetId, tid].sort().join("--");
        if (added.has(edgeKey)) continue;
        added.add(edgeKey);
        features.push({
          type: "Feature",
          id: `blast-${edgeKey}`,
          properties: { id: `blast-${edgeKey}`, resource: "blast", isBlast: 1 },
          geometry: { type: "LineString", coordinates: [rootCoord, tgtCoord] },
        });
      }
    }
  }

  return { type: "FeatureCollection", features };
}

// ── Layer helpers ─────────────────────────────────────────────────────────────

const ZONE_FILL_EXPR: mapboxgl.ExpressionSpecification = [
  "match",
  ["get", "zoneType"],
  "electrical",
  "rgba(250,204,21,0.07)",
  "power",
  "rgba(251,146,60,0.07)",
  "cooling",
  "rgba(56,189,248,0.07)",
  "compute",
  "rgba(34,197,94,0.06)",
  "network",
  "rgba(167,139,250,0.07)",
  "rgba(20,24,30,0.6)",
];

const ZONE_OUTLINE_EXPR: mapboxgl.ExpressionSpecification = [
  "match",
  ["get", "zoneType"],
  "electrical",
  "rgba(250,204,21,0.35)",
  "power",
  "rgba(251,146,60,0.35)",
  "cooling",
  "rgba(56,189,248,0.35)",
  "compute",
  "rgba(34,197,94,0.28)",
  "network",
  "rgba(167,139,250,0.35)",
  "rgba(40,50,65,0.5)",
];

const ZONE_LABEL_COLOR_EXPR: mapboxgl.ExpressionSpecification = [
  "match",
  ["get", "zoneType"],
  "electrical",
  "rgba(250,204,21,0.50)",
  "power",
  "rgba(251,146,60,0.50)",
  "cooling",
  "rgba(56,189,248,0.50)",
  "compute",
  "rgba(34,197,94,0.45)",
  "network",
  "rgba(167,139,250,0.50)",
  "rgba(100,116,139,0.45)",
];

const ZONE_LABEL_TEXT_EXPR: mapboxgl.ExpressionSpecification = [
  "format",
  ["get", "name"],
  { "font-scale": 1 },
  "\n",
  {},
  ["get", "purpose"],
  { "font-scale": 0.82 },
];

const ASSET_RADIUS_EXPR: mapboxgl.ExpressionSpecification = [
  "case",
  ["==", ["get", "isSource"], 1],
  11,
  ["==", ["get", "assetType"], "cooling"],
  9,
  ["==", ["get", "assetType"], "power"],
  8,
  ["==", ["get", "assetType"], "compute"],
  7,
  7,
];

const STATUS_COLOR_EXPR: mapboxgl.ExpressionSpecification = [
  "case",
  ["==", ["get", "status"], "critical"],
  STATUS_COLORS.critical,
  ["==", ["get", "status"], "warning"],
  STATUS_COLORS.warning,
  ["==", ["get", "status"], "offline"],
  STATUS_COLORS.offline,
  STATUS_COLORS.normal,
];

const EDGE_NORMAL_COLOR_EXPR: mapboxgl.ExpressionSpecification = [
  "match",
  ["get", "resource"],
  "cooling",
  "rgba(56,189,248,0.12)",
  "power",
  "rgba(250,204,21,0.10)",
  "rgba(255,255,255,0.06)",
];

const EDGE_BLAST_COLOR_EXPR: mapboxgl.ExpressionSpecification = [
  "match",
  ["get", "resource"],
  "cooling",
  "#38BDF8",
  "blast",
  "#EF4444",
  "#F59E0B",
];

// ── Facilities bounds ─────────────────────────────────────────────────────────

function facilityBounds(): [[number, number], [number, number]] {
  return [toLngLat(-8, -8), toLngLat(108, 108)];
}

// ── Source + layer IDs ────────────────────────────────────────────────────────

const SRC = { zones: "cc-zones", assets: "cc-assets", edges: "cc-edges" } as const;
const LYR = {
  zonesFill: "cc-zones-fill",
  zonesOutline: "cc-zones-outline",
  zonesLabels: "cc-zones-labels",
  edgesNormal: "cc-edges-normal",
  edgesBlast: "cc-edges-blast",
  assets: "cc-assets",
  assetIcons: "cc-asset-icons",
  assetRing: "cc-asset-ring",
  assetHover: "cc-asset-hover",
  assetLabels: "cc-asset-labels",
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  assets: Asset[];
  incident: Incident | undefined;
  litNodes: Set<string>;
  activeFloor: FloorKey;
  onAssetClick: (assetId: string) => void;
}

export default function CommandCenterMap({
  assets,
  incident,
  litNodes,
  activeFloor,
  onAssetClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const loadedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Always-current refs — safe to read from the one-shot init effect
  const assetsRef = useRef(assets);
  const activeFloorRef = useRef(activeFloor);
  const onAssetClickRef = useRef(onAssetClick);
  assetsRef.current = assets;
  activeFloorRef.current = activeFloor;
  onAssetClickRef.current = onAssetClick;

  // Stable refresh: reads from closure (re-created when deps change)
  const refreshSources = useCallback(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    (map.getSource(SRC.zones) as mapboxgl.GeoJSONSource | undefined)?.setData(
      buildZonesGeoJSON(activeFloor)
    );
    (map.getSource(SRC.assets) as mapboxgl.GeoJSONSource | undefined)?.setData(
      buildAssetsGeoJSON(assets, activeFloor, incident, litNodes)
    );
    (map.getSource(SRC.edges) as mapboxgl.GeoJSONSource | undefined)?.setData(
      buildEdgesGeoJSON(assets, activeFloor, incident, litNodes)
    );
  }, [assets, activeFloor, incident, litNodes]);

  useEffect(() => {
    refreshSources();
  }, [refreshSources]);

  // Fit camera when floor changes
  const prevFloor = useRef(activeFloor);
  useEffect(() => {
    if (activeFloor !== prevFloor.current && mapRef.current && loadedRef.current) {
      prevFloor.current = activeFloor;
      mapRef.current.fitBounds(facilityBounds(), { padding: 24, duration: 500 });
    }
  }, [activeFloor]);

  // Pulse blast edges + source asset
  useEffect(() => {
    let phase = 0;
    const tick = () => {
      phase += 0.08;
      const opacity = 0.45 + Math.sin(phase) * 0.45;
      const strokeOpacity = 0.3 + Math.sin(phase) * 0.3;
      const map = mapRef.current;
      if (map && loadedRef.current) {
        if (map.getLayer(LYR.edgesBlast)) {
          map.setPaintProperty(LYR.edgesBlast, "line-opacity", opacity);
        }
        if (map.getLayer(LYR.assetRing)) {
          map.setPaintProperty(LYR.assetRing, "circle-stroke-opacity", strokeOpacity);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Initialize map — runs once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !TOKEN) return;

    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: toLngLat(50, 50),
      zoom: 14,
      minZoom: 12,
      maxZoom: 19,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      loadedRef.current = true;
      ensureMachineIcons(map);

      // ── Sources (use refs so the one-shot init always reads latest values) ──
      const floor0 = activeFloorRef.current;
      const assets0 = assetsRef.current;
      map.addSource(SRC.zones, { type: "geojson", data: buildZonesGeoJSON(floor0) });
      map.addSource(SRC.edges, {
        type: "geojson",
        data: buildEdgesGeoJSON(assets0, floor0, undefined, new Set()),
      });
      map.addSource(SRC.assets, {
        type: "geojson",
        data: buildAssetsGeoJSON(assets0, floor0, undefined, new Set()),
      });

      // ── Zone fill ─────────────────────────────────────────────────────────
      map.addLayer({
        id: LYR.zonesFill,
        type: "fill",
        source: SRC.zones,
        paint: { "fill-color": ZONE_FILL_EXPR, "fill-opacity": 1 },
      });

      // ── Zone outline ──────────────────────────────────────────────────────
      map.addLayer({
        id: LYR.zonesOutline,
        type: "line",
        source: SRC.zones,
        paint: { "line-color": ZONE_OUTLINE_EXPR, "line-width": 1 },
      });

      // ── Zone labels ───────────────────────────────────────────────────────
      map.addLayer({
        id: LYR.zonesLabels,
        type: "symbol",
        source: SRC.zones,
        layout: {
          "text-field": ZONE_LABEL_TEXT_EXPR,
          "text-size": 10,
          "text-anchor": "center",
          "text-justify": "center",
          "text-line-height": 1.1,
          "text-max-width": 10,
          "text-allow-overlap": true,
          "text-font": ["literal", ["Open Sans Regular"]],
        },
        paint: {
          "text-color": ZONE_LABEL_COLOR_EXPR,
          "text-halo-color": "#060606",
          "text-halo-width": 1.5,
        },
      });

      // ── Normal dependency edges ───────────────────────────────────────────
      map.addLayer({
        id: LYR.edgesNormal,
        type: "line",
        source: SRC.edges,
        filter: ["==", ["get", "isBlast"], 0],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": EDGE_NORMAL_COLOR_EXPR,
          "line-width": 1,
          "line-opacity": 1,
        },
      });

      // ── Blast / active edges ──────────────────────────────────────────────
      map.addLayer({
        id: LYR.edgesBlast,
        type: "line",
        source: SRC.edges,
        filter: ["==", ["get", "isBlast"], 1],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": EDGE_BLAST_COLOR_EXPR,
          "line-width": 2.5,
          "line-opacity": 0.7,
          "line-dasharray": ["literal", [4, 3]] as unknown as mapboxgl.ExpressionSpecification,
        },
      });

      // ── Asset circles ─────────────────────────────────────────────────────
      map.addLayer({
        id: LYR.assets,
        type: "circle",
        source: SRC.assets,
        paint: {
          "circle-color": STATUS_COLOR_EXPR,
          "circle-radius": ASSET_RADIUS_EXPR,
          "circle-opacity": 0.92,
          "circle-stroke-width": [
            "case",
            ["==", ["get", "status"], "critical"],
            2,
            ["==", ["get", "status"], "warning"],
            1.5,
            0.5,
          ] as mapboxgl.ExpressionSpecification,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "status"], "critical"],
            "rgba(239,68,68,0.5)",
            ["==", ["get", "status"], "warning"],
            "rgba(245,158,11,0.4)",
            "rgba(255,255,255,0.08)",
          ] as mapboxgl.ExpressionSpecification,
        },
      });

      // ── Machine icons ──────────────────────────────────────────────────────
      map.addLayer({
        id: LYR.assetIcons,
        type: "symbol",
        source: SRC.assets,
        layout: {
          "icon-image": ["get", "machineIcon"] as mapboxgl.ExpressionSpecification,
          "icon-size": 1,
          "icon-anchor": "center",
          "icon-ignore-placement": true,
          "icon-allow-overlap": true,
        },
      });

      // ── Source / blast ring ────────────────────────────────────────────────
      map.addLayer({
        id: LYR.assetRing,
        type: "circle",
        source: SRC.assets,
        filter: ["any", ["==", ["get", "isSource"], 1], ["==", ["get", "isBlast"], 1]],
        paint: {
          "circle-color": "transparent",
          "circle-radius": [
            "case",
            ["==", ["get", "isSource"], 1],
            16,
            13,
          ] as mapboxgl.ExpressionSpecification,
          "circle-stroke-width": [
            "case",
            ["==", ["get", "isSource"], 1],
            2,
            1.5,
          ] as mapboxgl.ExpressionSpecification,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "isSource"], 1],
            "#EF4444",
            "#F59E0B",
          ] as mapboxgl.ExpressionSpecification,
          "circle-opacity": 0,
          "circle-stroke-opacity": 0.65,
        },
      });

      // ── Hover highlight ───────────────────────────────────────────────────
      map.addLayer({
        id: LYR.assetHover,
        type: "circle",
        source: SRC.assets,
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "circle-color": "transparent",
          "circle-radius": 13,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(248,250,252,0.5)",
          "circle-opacity": 0,
          "circle-stroke-opacity": 0.7,
        },
      });

      // ── Asset labels ──────────────────────────────────────────────────────
      map.addLayer({
        id: LYR.assetLabels,
        type: "symbol",
        source: SRC.assets,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 9,
          "text-anchor": "top",
          "text-offset": [0, 1.1],
          "text-font": ["literal", ["Open Sans Regular"]],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": [
            "case",
            ["==", ["get", "status"], "critical"],
            "#EF4444",
            ["==", ["get", "status"], "warning"],
            "#F59E0B",
            "rgba(203,213,225,0.7)",
          ] as mapboxgl.ExpressionSpecification,
          "text-halo-color": "#060606",
          "text-halo-width": 1.5,
        },
      });

      // ── Interactions ──────────────────────────────────────────────────────
      map.on("click", LYR.assets, (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) onAssetClickRef.current(id);
      });

      map.on("click", (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: [LYR.assets] });
        if (!hits.length) onAssetClickRef.current("");
      });

      map.on("mouseenter", LYR.assets, (e) => {
        map.getCanvas().style.cursor = "pointer";
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id && map.getLayer(LYR.assetHover)) {
          map.setFilter(LYR.assetHover, ["==", ["get", "id"], id]);
        }
      });

      map.on("mouseleave", LYR.assets, () => {
        map.getCanvas().style.cursor = "";
        if (map.getLayer(LYR.assetHover)) {
          map.setFilter(LYR.assetHover, ["==", ["get", "id"], "__none__"]);
        }
      });

      // Fit after layers are added
      map.fitBounds(facilityBounds(), { padding: 24, animate: false });
    });

    return () => {
      loadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!TOKEN) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[#060606]">
        <p className="text-[11px] font-mono text-zinc-700">
          Set <code className="text-amber-500">VITE_MAPBOX_TOKEN</code> to enable map view
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}

import type { GeoJSON } from "geojson";
import type { Asset, DependencyEdge, Zone } from "./mapTypes";

// Facility coordinate space: 200 × 100 units
// Maps to a small synthetic lng/lat region (no real-world geography)
const ORIGIN_LNG = 23.7275;
const ORIGIN_LAT = 37.9838;
const SCALE = 0.000018;

export function facilityToLngLat(x: number, y: number): [number, number] {
  return [ORIGIN_LNG + x * SCALE, ORIGIN_LAT + y * SCALE];
}

// Bounds with padding so perimeter walls are always visible
export function facilityBounds(): [[number, number], [number, number]] {
  return [facilityToLngLat(-15, -12), facilityToLngLat(215, 112)];
}

export function facilityCenter(): [number, number] {
  return facilityToLngLat(100, 50);
}

// Build GeoJSON FeatureCollection for zones
export function buildZonesGeoJSON(zones: Zone[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: zones.map((z) => ({
      type: "Feature",
      id: z.id,
      properties: {
        id: z.id,
        name: z.name,
        zoneType: z.type,
      },
      geometry: {
        type: "Polygon",
        coordinates: [z.polygon.map(([x, y]) => facilityToLngLat(x, y))],
      },
    })),
  };
}

// Build GeoJSON FeatureCollection for assets
export function buildAssetsGeoJSON(
  assets: Asset[],
  selectedId: string | null,
  overrides: Record<string, string>
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: assets.map((a) => {
      const status = overrides[a.id] ?? a.status;
      return {
        type: "Feature",
        id: a.id,
        properties: {
          id: a.id,
          name: a.name,
          assetType: a.type,
          status,
          criticality: a.criticality,
          zoneId: a.zoneId,
          selected: a.id === selectedId ? 1 : 0,
        },
        geometry: {
          type: "Point",
          coordinates: facilityToLngLat(...a.coordinates),
        },
      };
    }),
  };
}

// Build GeoJSON FeatureCollection for edges
// Edges that reference assets not in the provided list are silently skipped
// (this handles cross-floor edges naturally)
export function buildEdgesGeoJSON(
  edges: DependencyEdge[],
  assets: Asset[],
  edgeOverrides: Record<string, boolean>
): GeoJSON.FeatureCollection {
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  return {
    type: "FeatureCollection",
    features: edges.flatMap((e) => {
      const src = assetMap.get(e.sourceAssetId);
      const tgt = assetMap.get(e.targetAssetId);
      if (!src || !tgt) return [];

      const active = edgeOverrides[e.id] ?? e.activeInIncident;

      return [
        {
          type: "Feature" as const,
          id: e.id,
          properties: {
            id: e.id,
            resource: e.resource,
            edgeType: e.type,
            criticality: e.criticality,
            activeInIncident: active ? 1 : 0,
            minutesToImpact: e.minutesToImpact ?? -1,
          },
          geometry: {
            type: "LineString" as const,
            coordinates: [
              facilityToLngLat(...src.coordinates),
              facilityToLngLat(...tgt.coordinates),
            ],
          },
        },
      ];
    }),
  };
}

export function getAssetById(assets: Asset[], id: string): Asset | undefined {
  return assets.find((a) => a.id === id);
}

export function getUpstreamDeps(edges: DependencyEdge[], assetId: string): DependencyEdge[] {
  return edges.filter((e) => e.targetAssetId === assetId);
}

export function getDownstreamDeps(edges: DependencyEdge[], assetId: string): DependencyEdge[] {
  return edges.filter((e) => e.sourceAssetId === assetId);
}

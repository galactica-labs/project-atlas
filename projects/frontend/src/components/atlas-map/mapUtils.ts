import type { GeoJSON } from "geojson";
import type { Asset, DependencyEdge, Zone } from "./mapTypes";

// Synthetic facility coordinate origin and scale
// Facility units (0-120 wide, 0-80 tall) map to a small lng/lat area
const ORIGIN_LNG = 23.7275;
const ORIGIN_LAT = 37.9838;
const SCALE = 0.00002;

export function facilityToLngLat(x: number, y: number): [number, number] {
  return [ORIGIN_LNG + x * SCALE, ORIGIN_LAT + y * SCALE];
}

export function facilityBounds() {
  const sw = facilityToLngLat(-5, -5);
  const ne = facilityToLngLat(125, 85);
  return [sw, ne] as [[number, number], [number, number]];
}

export function facilityCenter(): [number, number] {
  return facilityToLngLat(60, 40);
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

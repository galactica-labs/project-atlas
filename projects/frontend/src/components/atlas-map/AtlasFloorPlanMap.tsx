import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { useFloorPlanStore } from "./floorPlanStore";
import { ASSETS, EDGES, ZONES } from "./mapData";
import {
  ASSET_RADIUS_EXPR,
  COLORS,
  EDGE_OPACITY_EXPR,
  EDGE_WIDTH_EXPR,
  LABEL_SIZE,
  LAYER_IDS,
  MAP_STYLE,
  SOURCE_IDS,
  STATUS_COLOR_EXPR,
} from "./mapStyles";
import {
  buildAssetsGeoJSON,
  buildEdgesGeoJSON,
  buildZonesGeoJSON,
  facilityBounds,
  facilityCenter,
} from "./mapUtils";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export default function AtlasFloorPlanMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapLoadedRef = useRef(false);

  const selectedAssetId = useFloorPlanStore((s) => s.selectedAssetId);
  const incidentAssetOverrides = useFloorPlanStore((s) => s.incidentAssetOverrides);
  const incidentEdgeOverrides = useFloorPlanStore((s) => s.incidentEdgeOverrides);
  const layerVisibility = useFloorPlanStore((s) => s.layerVisibility);
  const _selectAsset = useFloorPlanStore((s) => s.selectAsset);
  const _setHoveredAsset = useFloorPlanStore((s) => s.setHoveredAsset);

  // Update sources when data changes
  const refreshSources = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const zonesSource = map.getSource(SOURCE_IDS.zones) as mapboxgl.GeoJSONSource;
    const assetsSource = map.getSource(SOURCE_IDS.assets) as mapboxgl.GeoJSONSource;
    const edgesSource = map.getSource(SOURCE_IDS.edges) as mapboxgl.GeoJSONSource;

    if (zonesSource) zonesSource.setData(buildZonesGeoJSON(ZONES));
    if (assetsSource)
      assetsSource.setData(buildAssetsGeoJSON(ASSETS, selectedAssetId, incidentAssetOverrides));
    if (edgesSource) edgesSource.setData(buildEdgesGeoJSON(EDGES, ASSETS, incidentEdgeOverrides));
  }, [selectedAssetId, incidentAssetOverrides, incidentEdgeOverrides]);

  // Layer visibility updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const setVis = (id: string, visible: boolean) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    };

    setVis(LAYER_IDS.edgesPower, layerVisibility.power);
    setVis(LAYER_IDS.edgesCooling, layerVisibility.cooling);
    setVis(LAYER_IDS.edgesNetwork, layerVisibility.network);
    setVis(LAYER_IDS.edgesDependency, layerVisibility.dependency);
    setVis(LAYER_IDS.assetsLabels, layerVisibility.labels);

    // Critical path only: hide non-active edges
    if (layerVisibility.criticalPathOnly) {
      const activeLayers = [
        LAYER_IDS.edgesPower,
        LAYER_IDS.edgesCooling,
        LAYER_IDS.edgesNetwork,
        LAYER_IDS.edgesDependency,
      ];
      for (const lid of activeLayers) {
        if (map.getLayer(lid)) {
          map.setFilter(lid, ["==", ["get", "activeInIncident"], 1]);
        }
      }
    } else {
      // Restore default filters (resource-based)
      if (map.getLayer(LAYER_IDS.edgesPower))
        map.setFilter(LAYER_IDS.edgesPower, ["==", ["get", "resource"], "power"]);
      if (map.getLayer(LAYER_IDS.edgesCooling))
        map.setFilter(LAYER_IDS.edgesCooling, ["==", ["get", "resource"], "cooling"]);
      if (map.getLayer(LAYER_IDS.edgesNetwork))
        map.setFilter(LAYER_IDS.edgesNetwork, ["==", ["get", "resource"], "network"]);
      if (map.getLayer(LAYER_IDS.edgesDependency))
        map.setFilter(LAYER_IDS.edgesDependency, ["==", ["get", "resource"], "dependency"]);
    }
  }, [layerVisibility]);

  // Refresh GeoJSON sources when state changes
  useEffect(() => {
    refreshSources();
  }, [refreshSources]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!TOKEN) {
      // Token missing — render error in container
      return;
    }

    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE as mapboxgl.StyleSpecification,
      center: facilityCenter(),
      zoom: 14.5,
      minZoom: 13,
      maxZoom: 18,
      maxBounds: facilityBounds(),
      attributionControl: false,
      logoPosition: "bottom-right",
    });

    mapRef.current = map;

    map.on("load", () => {
      mapLoadedRef.current = true;

      // ── Sources ──────────────────────────────────────────────────────────
      map.addSource(SOURCE_IDS.zones, {
        type: "geojson",
        data: buildZonesGeoJSON(ZONES),
      });
      map.addSource(SOURCE_IDS.edges, {
        type: "geojson",
        data: buildEdgesGeoJSON(EDGES, ASSETS, {}),
      });
      map.addSource(SOURCE_IDS.assets, {
        type: "geojson",
        data: buildAssetsGeoJSON(ASSETS, null, {}),
      });

      // ── Zone fill ────────────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.zonesFill,
        type: "fill",
        source: SOURCE_IDS.zones,
        paint: {
          "fill-color": [
            "match",
            ["get", "zoneType"],
            "hall",
            "rgba(14,18,24,0.95)",
            "row",
            "rgba(30,41,59,0.35)",
            "electrical",
            "rgba(250,204,21,0.08)",
            "cooling",
            "rgba(56,189,248,0.08)",
            "restricted",
            "rgba(239,68,68,0.08)",
            "corridor",
            "rgba(14,18,24,0.6)",
            "rgba(14,18,24,0.5)",
          ],
          "fill-opacity": 1,
        },
      });

      // ── Zone outlines ─────────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.zonesOutline,
        type: "line",
        source: SOURCE_IDS.zones,
        paint: {
          "line-color": [
            "match",
            ["get", "zoneType"],
            "hall",
            "#202A36",
            "row",
            "#334155",
            "electrical",
            "rgba(250,204,21,0.45)",
            "cooling",
            "rgba(56,189,248,0.45)",
            "restricted",
            "rgba(239,68,68,0.55)",
            "#202A36",
          ],
          "line-width": [
            "match",
            ["get", "zoneType"],
            "hall",
            1.5,
            "row",
            1,
            "electrical",
            1,
            "cooling",
            1,
            1,
          ],
          "line-dasharray": [
            "case",
            ["==", ["get", "zoneType"], "restricted"],
            ["literal", [4, 3]],
            ["literal", [1]],
          ] as unknown as mapboxgl.ExpressionSpecification,
        },
      });

      // ── Zone labels ───────────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.zoneLabels,
        type: "symbol",
        source: SOURCE_IDS.zones,
        filter: ["!=", ["get", "zoneType"], "corridor"],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 9,
          "text-anchor": "top-left",
          "text-offset": [0.5, 0.5],
          "text-font": ["literal", ["Open Sans Regular"]],
        },
        paint: {
          "text-color": [
            "match",
            ["get", "zoneType"],
            "cooling",
            "rgba(56,189,248,0.5)",
            "electrical",
            "rgba(250,204,21,0.5)",
            "rgba(100,116,139,0.6)",
          ],
        },
      });

      // ── Dependency edges (resource-specific layers) ───────────────────────
      const edgeLayerDefs: [string, string, string][] = [
        [LAYER_IDS.edgesPower, "power", COLORS.power],
        [LAYER_IDS.edgesCooling, "cooling", COLORS.cooling],
        [LAYER_IDS.edgesNetwork, "network", COLORS.network],
        [LAYER_IDS.edgesDependency, "dependency", COLORS.dependency],
      ];

      for (const [layerId, resource, color] of edgeLayerDefs) {
        map.addLayer({
          id: layerId,
          type: "line",
          source: SOURCE_IDS.edges,
          filter: ["==", ["get", "resource"], resource],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": [
              "case",
              ["==", ["get", "activeInIncident"], 1],
              resource === "cooling" ? "#7DD3FC" : color,
              color,
            ],
            "line-opacity": EDGE_OPACITY_EXPR,
            "line-width": EDGE_WIDTH_EXPR,
            "line-dasharray":
              resource === "network"
                ? (["literal", [3, 2]] as unknown as mapboxgl.ExpressionSpecification)
                : (["literal", [1]] as unknown as mapboxgl.ExpressionSpecification),
          },
        });
      }

      // ── Asset base circles ─────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.assetsBase,
        type: "circle",
        source: SOURCE_IDS.assets,
        paint: {
          "circle-color": STATUS_COLOR_EXPR,
          "circle-radius": ASSET_RADIUS_EXPR,
          "circle-opacity": ["case", ["==", ["get", "status"], "offline"], 0.4, 0.9],
          "circle-stroke-width": ["case", ["==", ["get", "criticality"], "critical"], 1.5, 0.5],
          "circle-stroke-color": [
            "case",
            ["==", ["get", "status"], "critical"],
            "rgba(239,68,68,0.5)",
            ["==", ["get", "status"], "warning"],
            "rgba(245,158,11,0.4)",
            "rgba(255,255,255,0.1)",
          ],
        },
      });

      // ── Selected asset ring ────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.assetsSelectedRing,
        type: "circle",
        source: SOURCE_IDS.assets,
        filter: ["==", ["get", "selected"], 1],
        paint: {
          "circle-color": "transparent",
          "circle-radius": [
            "case",
            ["==", ["get", "assetType"], "crac"],
            14,
            ["==", ["get", "assetType"], "ups"],
            13,
            12,
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#F8FAFC",
          "circle-opacity": 0,
          "circle-stroke-opacity": 0.85,
        },
      });

      // ── Asset hover highlight ──────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.assetsHover,
        type: "circle",
        source: SOURCE_IDS.assets,
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "circle-color": "transparent",
          "circle-radius": ["case", ["==", ["get", "assetType"], "crac"], 12, 10],
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(248,250,252,0.5)",
          "circle-opacity": 0,
          "circle-stroke-opacity": 0.7,
        },
      });

      // ── Asset labels ──────────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.assetsLabels,
        type: "symbol",
        source: SOURCE_IDS.assets,
        layout: {
          "text-field": ["get", "name"],
          "text-size": LABEL_SIZE,
          "text-anchor": "top",
          "text-offset": [0, 1.2],
          "text-font": ["literal", ["Open Sans Regular"]],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": [
            "case",
            ["==", ["get", "status"], "critical"],
            COLORS.critical,
            ["==", ["get", "status"], "warning"],
            COLORS.warning,
            "rgba(203,213,225,0.7)",
          ],
          "text-halo-color": "#05070A",
          "text-halo-width": 1,
        },
      });

      // ── Interactions ──────────────────────────────────────────────────────
      map.on("click", LAYER_IDS.assetsBase, (e) => {
        if (!e.features?.length) return;
        const id = e.features[0].properties?.id as string;
        useFloorPlanStore.getState().selectAsset(id);
      });

      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [LAYER_IDS.assetsBase],
        });
        if (!features.length) {
          useFloorPlanStore.getState().selectAsset(null);
        }
      });

      map.on("mouseenter", LAYER_IDS.assetsBase, (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features?.[0]) {
          const id = e.features[0].properties?.id as string;
          useFloorPlanStore.getState().setHoveredAsset(id);
          if (map.getLayer(LAYER_IDS.assetsHover)) {
            map.setFilter(LAYER_IDS.assetsHover, ["==", ["get", "id"], id]);
          }
        }
      });

      map.on("mouseleave", LAYER_IDS.assetsBase, () => {
        map.getCanvas().style.cursor = "";
        useFloorPlanStore.getState().setHoveredAsset(null);
        if (map.getLayer(LAYER_IDS.assetsHover)) {
          map.setFilter(LAYER_IDS.assetsHover, ["==", ["get", "id"], "__none__"]);
        }
      });

      // Apply initial visibility
      const vis = useFloorPlanStore.getState().layerVisibility;
      map.setLayoutProperty(
        LAYER_IDS.edgesDependency,
        "visibility",
        vis.dependency ? "visible" : "none"
      );
    });

    return () => {
      mapLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!TOKEN) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#05070A] text-center px-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
          <span className="text-amber-400 text-lg">!</span>
        </div>
        <p className="text-[13px] font-semibold text-zinc-300 mb-1">Mapbox token missing</p>
        <p className="text-[11px] text-zinc-600 max-w-xs">
          Set{" "}
          <code className="text-amber-400 font-mono bg-amber-500/10 px-1 rounded">
            VITE_MAPBOX_TOKEN
          </code>{" "}
          in your <code className="font-mono">.env</code> file to enable the floor-plan view.
        </p>
        <p className="text-[10px] text-zinc-700 mt-3 font-mono">Get a free token at mapbox.com</p>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}

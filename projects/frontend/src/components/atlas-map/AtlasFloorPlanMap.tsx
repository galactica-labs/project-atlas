import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef } from "react";
import { useFloorPlanStore } from "./floorPlanStore";
import { FLOORS } from "./mapData";
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
  ZONE_FILL_EXPR,
  ZONE_LABEL_COLOR_EXPR,
  ZONE_OUTLINE_EXPR,
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

  const activeFloorId = useFloorPlanStore((s) => s.activeFloorId);
  const selectedAssetId = useFloorPlanStore((s) => s.selectedAssetId);
  const incidentAssetOverrides = useFloorPlanStore((s) => s.incidentAssetOverrides);
  const incidentEdgeOverrides = useFloorPlanStore((s) => s.incidentEdgeOverrides);
  const layerVisibility = useFloorPlanStore((s) => s.layerVisibility);

  // Refresh GeoJSON sources from current store state
  const refreshSources = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    const floor = FLOORS[activeFloorId];
    (map.getSource(SOURCE_IDS.zones) as mapboxgl.GeoJSONSource | undefined)?.setData(
      buildZonesGeoJSON(floor.zones)
    );
    (map.getSource(SOURCE_IDS.assets) as mapboxgl.GeoJSONSource | undefined)?.setData(
      buildAssetsGeoJSON(floor.assets, selectedAssetId, incidentAssetOverrides)
    );
    (map.getSource(SOURCE_IDS.edges) as mapboxgl.GeoJSONSource | undefined)?.setData(
      buildEdgesGeoJSON(floor.edges, floor.assets, incidentEdgeOverrides)
    );
  }, [activeFloorId, selectedAssetId, incidentAssetOverrides, incidentEdgeOverrides]);

  // Re-run when any data changes; when floor changes also fit the camera
  const prevFloorRef = useRef(activeFloorId);
  useEffect(() => {
    refreshSources();
    if (activeFloorId !== prevFloorRef.current) {
      prevFloorRef.current = activeFloorId;
      if (mapRef.current && mapLoadedRef.current) {
        mapRef.current.fitBounds(facilityBounds(), { padding: 30, duration: 600 });
      }
    }
  }, [refreshSources, activeFloorId]);

  // Layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const setVis = (id: string, visible: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    };

    setVis(LAYER_IDS.edgesPower, layerVisibility.power);
    setVis(LAYER_IDS.edgesCooling, layerVisibility.cooling);
    setVis(LAYER_IDS.edgesNetwork, layerVisibility.network);
    setVis(LAYER_IDS.edgesDependency, layerVisibility.dependency);
    setVis(LAYER_IDS.assetsLabels, layerVisibility.labels);

    const edgeLayers = [
      LAYER_IDS.edgesPower,
      LAYER_IDS.edgesCooling,
      LAYER_IDS.edgesNetwork,
      LAYER_IDS.edgesDependency,
    ];

    if (layerVisibility.criticalPathOnly) {
      for (const lid of edgeLayers) {
        if (map.getLayer(lid)) map.setFilter(lid, ["==", ["get", "activeInIncident"], 1]);
      }
    } else {
      const resourceMap: Record<string, string> = {
        [LAYER_IDS.edgesPower]: "power",
        [LAYER_IDS.edgesCooling]: "cooling",
        [LAYER_IDS.edgesNetwork]: "network",
        [LAYER_IDS.edgesDependency]: "dependency",
      };
      for (const lid of edgeLayers) {
        if (map.getLayer(lid)) map.setFilter(lid, ["==", ["get", "resource"], resourceMap[lid]]);
      }
    }
  }, [layerVisibility]);

  // Initialize map once on mount; empty dep array is intentional
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !TOKEN) return;

    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: facilityCenter(),
      zoom: 14,
      minZoom: 12,
      maxZoom: 19,
      maxBounds: [
        facilityBounds()[0].map((v, i) => v - (i === 0 ? 0.001 : 0.001)) as [number, number],
        facilityBounds()[1].map((v, i) => v + (i === 0 ? 0.001 : 0.001)) as [number, number],
      ],
      attributionControl: false,
      logoPosition: "bottom-right",
    });

    mapRef.current = map;

    map.on("load", () => {
      mapLoadedRef.current = true;

      // Read initial floor data
      const initialFloor = FLOORS[useFloorPlanStore.getState().activeFloorId];

      // ── Sources ──────────────────────────────────────────────────────────────
      map.addSource(SOURCE_IDS.zones, {
        type: "geojson",
        data: buildZonesGeoJSON(initialFloor.zones),
      });
      map.addSource(SOURCE_IDS.edges, {
        type: "geojson",
        data: buildEdgesGeoJSON(initialFloor.edges, initialFloor.assets, {}),
      });
      map.addSource(SOURCE_IDS.assets, {
        type: "geojson",
        data: buildAssetsGeoJSON(initialFloor.assets, null, {}),
      });

      // ── Zone fill ──────────────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.zonesFill,
        type: "fill",
        source: SOURCE_IDS.zones,
        paint: {
          "fill-color": ZONE_FILL_EXPR,
          "fill-opacity": 1,
        },
      });

      // ── Zone outlines ──────────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.zonesOutline,
        type: "line",
        source: SOURCE_IDS.zones,
        paint: {
          "line-color": ZONE_OUTLINE_EXPR,
          "line-width": [
            "match",
            ["get", "zoneType"],
            "hall",
            1.5,
            "row",
            1,
            "corridor",
            0.5,
            1,
          ] as mapboxgl.ExpressionSpecification,
          "line-dasharray": [
            "case",
            ["==", ["get", "zoneType"], "restricted"],
            ["literal", [4, 3]],
            ["literal", [1]],
          ] as unknown as mapboxgl.ExpressionSpecification,
        },
      });

      // ── Zone labels ────────────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.zoneLabels,
        type: "symbol",
        source: SOURCE_IDS.zones,
        filter: ["!in", ["get", "zoneType"], ["literal", ["corridor", "hall"]]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 9,
          "text-anchor": "top-left",
          "text-offset": [0.5, 0.5],
          "text-font": ["literal", ["Open Sans Regular"]],
        },
        paint: {
          "text-color": ZONE_LABEL_COLOR_EXPR,
          "text-halo-color": "#05070A",
          "text-halo-width": 1,
        },
      });

      // ── Dependency edge layers ─────────────────────────────────────────────
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
          layout: { "line-cap": "round", "line-join": "round" },
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

      // Apply initial layer visibility from store
      const vis = useFloorPlanStore.getState().layerVisibility;
      if (!vis.dependency && map.getLayer(LAYER_IDS.edgesDependency)) {
        map.setLayoutProperty(LAYER_IDS.edgesDependency, "visibility", "none");
      }

      // ── Asset circles ──────────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.assetsBase,
        type: "circle",
        source: SOURCE_IDS.assets,
        paint: {
          "circle-color": STATUS_COLOR_EXPR,
          "circle-radius": ASSET_RADIUS_EXPR,
          "circle-opacity": ["case", ["==", ["get", "status"], "offline"], 0.4, 0.9],
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
            "rgba(239,68,68,0.6)",
            ["==", ["get", "status"], "warning"],
            "rgba(245,158,11,0.5)",
            "rgba(255,255,255,0.08)",
          ] as mapboxgl.ExpressionSpecification,
        },
      });

      // ── Selected ring ──────────────────────────────────────────────────────
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
            15,
            ["==", ["get", "assetType"], "chiller"],
            15,
            ["==", ["get", "assetType"], "ups"],
            14,
            13,
          ] as mapboxgl.ExpressionSpecification,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#F8FAFC",
          "circle-opacity": 0,
          "circle-stroke-opacity": 0.85,
        },
      });

      // ── Hover highlight ────────────────────────────────────────────────────
      map.addLayer({
        id: LAYER_IDS.assetsHover,
        type: "circle",
        source: SOURCE_IDS.assets,
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "circle-color": "transparent",
          "circle-radius": [
            "case",
            ["in", ["get", "assetType"], ["literal", ["crac", "chiller", "generator", "ups"]]],
            13,
            11,
          ] as mapboxgl.ExpressionSpecification,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(248,250,252,0.5)",
          "circle-opacity": 0,
          "circle-stroke-opacity": 0.7,
        },
      });

      // ── Asset labels ───────────────────────────────────────────────────────
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
            "rgba(203,213,225,0.75)",
          ] as mapboxgl.ExpressionSpecification,
          "text-halo-color": "#05070A",
          "text-halo-width": 1.5,
        },
      });

      // ── Interactions ───────────────────────────────────────────────────────
      map.on("click", LAYER_IDS.assetsBase, (e) => {
        if (!e.features?.length) return;
        const id = e.features[0].properties?.id as string;
        useFloorPlanStore.getState().selectAsset(id);
      });

      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.assetsBase] });
        if (!features.length) useFloorPlanStore.getState().selectAsset(null);
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

      // ── Fit to facility after all layers are added ─────────────────────────
      map.fitBounds(facilityBounds(), { padding: 30, animate: false });
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
          <span className="text-amber-400 text-xl font-bold">!</span>
        </div>
        <p className="text-[13px] font-semibold text-zinc-300 mb-1">Mapbox token missing</p>
        <p className="text-[11px] text-zinc-600 max-w-xs leading-relaxed">
          Set{" "}
          <code className="text-amber-400 font-mono bg-amber-500/10 px-1 rounded">
            VITE_MAPBOX_TOKEN
          </code>{" "}
          in your <code className="font-mono">.env</code> file to enable the floor plan view.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}

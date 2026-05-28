import { create } from "zustand";
import { CRAC07_INCIDENT, FLOORS } from "./mapData";
import type { AssetStatus, FloorId, LayerVisibility, TimelineEvent } from "./mapTypes";

interface FloorPlanStore {
  // Floor
  activeFloorId: FloorId;
  setFloor: (id: FloorId) => void;

  // Selection
  selectedAssetId: string | null;
  hoveredAssetId: string | null;
  selectAsset: (id: string | null) => void;
  setHoveredAsset: (id: string | null) => void;

  // Incident
  incidentActive: boolean;
  incidentAssetOverrides: Record<string, AssetStatus>;
  incidentEdgeOverrides: Record<string, boolean>;
  timelineEvents: TimelineEvent[];
  simulateCrac07Failure: () => void;
  resetIncident: () => void;

  // Layers
  layerVisibility: LayerVisibility;
  toggleLayer: (key: keyof LayerVisibility) => void;
}

let cascadeTimers: ReturnType<typeof setTimeout>[] = [];

export const useFloorPlanStore = create<FloorPlanStore>((set, _get) => ({
  // Floor
  activeFloorId: "floor-b",
  setFloor: (id) =>
    set((s) => ({
      activeFloorId: id,
      // Clear selection when switching floors (selected asset may not exist on new floor)
      selectedAssetId: FLOORS[id].assets.find((a) => a.id === s.selectedAssetId)
        ? s.selectedAssetId
        : null,
    })),

  // Selection
  selectedAssetId: null,
  hoveredAssetId: null,
  selectAsset: (id) => set({ selectedAssetId: id }),
  setHoveredAsset: (id) => set({ hoveredAssetId: id }),

  // Incident
  incidentActive: false,
  incidentAssetOverrides: {},
  incidentEdgeOverrides: {},
  timelineEvents: [],

  simulateCrac07Failure: () => {
    cascadeTimers.forEach(clearTimeout);
    cascadeTimers = [];

    set({
      incidentActive: true,
      activeFloorId: "floor-b",
      incidentAssetOverrides: {},
      incidentEdgeOverrides: {},
      timelineEvents: [],
      selectedAssetId: "crac-07",
    });

    const startTime = Date.now();
    for (const step of CRAC07_INCIDENT) {
      const t = setTimeout(() => {
        set((state) => ({
          incidentAssetOverrides: {
            ...state.incidentAssetOverrides,
            [step.assetId]: step.status,
          },
          incidentEdgeOverrides: {
            ...state.incidentEdgeOverrides,
            ...Object.fromEntries(step.edgeIds.map((id) => [id, true])),
          },
          timelineEvents: [
            ...state.timelineEvents,
            {
              id: `${step.assetId}-${step.delayMs}`,
              timestamp: Date.now() - startTime,
              message: step.message,
              severity: step.status === "critical" ? "critical" : "warning",
            } satisfies TimelineEvent,
          ],
        }));
      }, step.delayMs);
      cascadeTimers.push(t);
    }
  },

  resetIncident: () => {
    cascadeTimers.forEach(clearTimeout);
    cascadeTimers = [];
    set({
      incidentActive: false,
      incidentAssetOverrides: {},
      incidentEdgeOverrides: {},
      timelineEvents: [],
      selectedAssetId: null,
    });
  },

  // Layers
  layerVisibility: {
    power: true,
    cooling: true,
    network: true,
    dependency: false,
    labels: true,
    criticalPathOnly: false,
  },
  toggleLayer: (key) =>
    set((state) => ({
      layerVisibility: { ...state.layerVisibility, [key]: !state.layerVisibility[key] },
    })),
}));

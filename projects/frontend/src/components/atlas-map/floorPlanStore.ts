import { create } from "zustand";
import { CRAC07_INCIDENT } from "./mapData";
import type { AssetStatus, LayerVisibility, TimelineEvent } from "./mapTypes";

interface FloorPlanStore {
  selectedAssetId: string | null;
  incidentActive: boolean;
  incidentAssetOverrides: Record<string, AssetStatus>;
  incidentEdgeOverrides: Record<string, boolean>;
  layerVisibility: LayerVisibility;
  timelineEvents: TimelineEvent[];
  hoveredAssetId: string | null;

  selectAsset: (id: string | null) => void;
  setHoveredAsset: (id: string | null) => void;
  simulateCrac07Failure: () => void;
  resetIncident: () => void;
  toggleLayer: (key: keyof LayerVisibility) => void;
}

let cascadeTimers: ReturnType<typeof setTimeout>[] = [];

export const useFloorPlanStore = create<FloorPlanStore>((set) => ({
  selectedAssetId: null,
  incidentActive: false,
  incidentAssetOverrides: {},
  incidentEdgeOverrides: {},
  layerVisibility: {
    power: true,
    cooling: true,
    network: true,
    dependency: false,
    labels: true,
    criticalPathOnly: false,
  },
  timelineEvents: [],
  hoveredAssetId: null,

  selectAsset: (id) => set({ selectedAssetId: id }),

  setHoveredAsset: (id) => set({ hoveredAssetId: id }),

  simulateCrac07Failure: () => {
    // Clear any running cascade
    cascadeTimers.forEach(clearTimeout);
    cascadeTimers = [];

    // Reset to clean incident state first
    set({
      incidentActive: true,
      incidentAssetOverrides: {},
      incidentEdgeOverrides: {},
      timelineEvents: [],
      selectedAssetId: "crac-07",
    });

    // Schedule cascade steps
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
            },
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

  toggleLayer: (key) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [key]: !state.layerVisibility[key],
      },
    })),
}));

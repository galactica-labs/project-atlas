import { create } from "zustand";
import type { FloorId3D } from "./sceneData";
import { CRAC07_BLAST_RADIUS, CRAC07_INCIDENT_EDGES, FLOORS_3D } from "./sceneData";
import type {
  AssetStatus,
  BlastRadiusItem,
  CameraFocusRequest,
  TimelineEvent,
  ViewMode,
  VisibleLayers,
} from "./sceneTypes";
import { formatTimestamp } from "./sceneUtils";

type State = {
  activeFloorId: FloorId3D;
  selectedAssetId: string | null;
  hoveredAssetId: string | null;
  viewMode: ViewMode;
  activeIncidentId: string | null;
  assetStatuses: Record<string, AssetStatus>;
  activeEdgeIds: string[];
  visibleLayers: VisibleLayers;
  timelineEvents: TimelineEvent[];
  blastRadiusItems: BlastRadiusItem[];
  cameraFocusRequest: CameraFocusRequest | null;
};

type Actions = {
  setActiveFloor: (id: FloorId3D) => void;
  selectAsset: (id: string | null) => void;
  hoverAsset: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  simulateCRAC07Failure: () => void;
  resetSimulation: () => void;
  toggleLayer: (layer: keyof VisibleLayers) => void;
  clearCameraRequest: () => void;
  requestCameraFocus: (req: CameraFocusRequest) => void;
};

const defaultStatuses = (floorId: FloorId3D = "hall-b"): Record<string, AssetStatus> =>
  Object.fromEntries(FLOORS_3D[floorId].assets.map((a) => [a.id, a.status]));

const DEFAULT_LAYERS: VisibleLayers = {
  power: true,
  cooling: true,
  network: true,
  dependency: true,
  labels: true,
  criticalPathOnly: false,
  grid: true,
  zoneBoundaries: true,
};

let _incidentTimers: ReturnType<typeof setTimeout>[] = [];

export const useCommandCenterStore = create<State & Actions>((set, _get) => ({
  activeFloorId: "hall-b",
  selectedAssetId: null,
  hoveredAssetId: null,
  viewMode: "overview",
  activeIncidentId: null,
  assetStatuses: defaultStatuses(),
  activeEdgeIds: [],
  visibleLayers: DEFAULT_LAYERS,
  timelineEvents: [],
  blastRadiusItems: [],
  cameraFocusRequest: null,

  setActiveFloor: (id) => {
    _incidentTimers.forEach(clearTimeout);
    _incidentTimers = [];
    set({
      activeFloorId: id,
      selectedAssetId: null,
      hoveredAssetId: null,
      viewMode: "overview",
      activeIncidentId: null,
      assetStatuses: defaultStatuses(id),
      activeEdgeIds: [],
      blastRadiusItems: [],
      timelineEvents: [],
      cameraFocusRequest: { type: "overview" },
    });
  },

  selectAsset: (id) => set({ selectedAssetId: id }),
  hoverAsset: (id) => set({ hoveredAssetId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),

  requestCameraFocus: (req) => set({ cameraFocusRequest: req }),
  clearCameraRequest: () => set({ cameraFocusRequest: null }),

  toggleLayer: (layer) =>
    set((s) => ({
      visibleLayers: { ...s.visibleLayers, [layer]: !s.visibleLayers[layer] },
    })),

  simulateCRAC07Failure: () => {
    _incidentTimers.forEach(clearTimeout);
    _incidentTimers = [];

    const affectedRackIds = CRAC07_BLAST_RADIUS.map((b) => b.assetId);
    const now = new Date();

    // Step 1: flag CRAC-07
    set((s) => ({
      viewMode: "incident",
      activeIncidentId: "crac07-failure",
      selectedAssetId: "crac-07",
      assetStatuses: { ...s.assetStatuses, "crac-07": "critical" },
      activeEdgeIds: CRAC07_INCIDENT_EDGES,
      blastRadiusItems: CRAC07_BLAST_RADIUS,
      timelineEvents: [
        {
          id: "evt-1",
          timestamp: formatTimestamp(now),
          message: "Sentinel flagged CRAC-07 thermal anomaly — compressor EFF at 12%",
          severity: "critical",
        },
      ],
      cameraFocusRequest: {
        type: "incident",
        rootAssetId: "crac-07",
        affectedAssetIds: affectedRackIds,
      },
    }));

    // Step 2: blast radius computed
    _incidentTimers.push(
      setTimeout(() => {
        set((s) => ({
          timelineEvents: [
            ...s.timelineEvents,
            {
              id: "evt-2",
              timestamp: formatTimestamp(new Date()),
              message: "Blast radius computed — 6 racks in Row C at risk",
              severity: "warning",
            },
          ],
        }));
      }, 900)
    );

    // Step 3: first racks go warning
    _incidentTimers.push(
      setTimeout(() => {
        set((s) => ({
          assetStatuses: {
            ...s.assetStatuses,
            "rack-c12": "warning",
            "rack-c13": "warning",
            "sensor-c1": "warning",
            "sensor-c2": "warning",
          },
          timelineEvents: [
            ...s.timelineEvents,
            {
              id: "evt-3",
              timestamp: formatTimestamp(new Date()),
              message: "Rack C12, C13 marked WARNING — inlet temp rising",
              severity: "warning",
            },
          ],
        }));
      }, 1800)
    );

    // Step 4: rack-c14 goes critical
    _incidentTimers.push(
      setTimeout(() => {
        set((s) => ({
          assetStatuses: {
            ...s.assetStatuses,
            "rack-c14": "critical",
            "rack-c15": "warning",
          },
          timelineEvents: [
            ...s.timelineEvents,
            {
              id: "evt-4",
              timestamp: formatTimestamp(new Date()),
              message: "Rack C14 marked CRITICAL — thermal throttle imminent",
              severity: "critical",
            },
          ],
        }));
      }, 2800)
    );

    // Step 5: dispatch recommendation
    _incidentTimers.push(
      setTimeout(() => {
        set((s) => ({
          timelineEvents: [
            ...s.timelineEvents,
            {
              id: "evt-5",
              timestamp: formatTimestamp(new Date()),
              message:
                "Hermes: dispatch technician to Cooling Zone — CRAC-07 compressor replacement",
              severity: "info",
            },
          ],
        }));
      }, 4200)
    );
  },

  resetSimulation: () => {
    _incidentTimers.forEach(clearTimeout);
    _incidentTimers = [];
    set({
      selectedAssetId: null,
      hoveredAssetId: null,
      viewMode: "overview",
      activeIncidentId: null,
      assetStatuses: defaultStatuses(),
      activeEdgeIds: [],
      blastRadiusItems: [],
      timelineEvents: [],
      cameraFocusRequest: { type: "overview" },
    });
  },
}));

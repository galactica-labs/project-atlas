import type { Asset, DependencyEdge, Zone } from "./mapTypes";

// ─── Zones ───────────────────────────────────────────────────────────────────

export const ZONES: Zone[] = [
  {
    id: "hall-b",
    name: "Hall B",
    type: "hall",
    polygon: [
      [0, 0],
      [120, 0],
      [120, 80],
      [0, 80],
      [0, 0],
    ],
    metadata: { sqft: 9600 },
  },
  {
    id: "cooling-zone",
    name: "Cooling Zone",
    type: "cooling",
    polygon: [
      [2, 2],
      [58, 2],
      [58, 32],
      [2, 32],
      [2, 2],
    ],
    metadata: { units: 1 },
  },
  {
    id: "electrical-zone",
    name: "Electrical Zone",
    type: "electrical",
    polygon: [
      [62, 2],
      [118, 2],
      [118, 32],
      [62, 32],
      [62, 2],
    ],
    metadata: { circuits: 4 },
  },
  {
    id: "corridor",
    name: "Corridor",
    type: "corridor",
    polygon: [
      [2, 34],
      [118, 34],
      [118, 38],
      [2, 38],
      [2, 34],
    ],
    metadata: {},
  },
  {
    id: "row-c",
    name: "Row C",
    type: "row",
    polygon: [
      [2, 40],
      [58, 40],
      [58, 78],
      [2, 78],
      [2, 40],
    ],
    metadata: { racks: 4 },
  },
  {
    id: "row-d",
    name: "Row D",
    type: "row",
    polygon: [
      [62, 40],
      [118, 40],
      [118, 78],
      [62, 78],
      [62, 40],
    ],
    metadata: { racks: 4 },
  },
];

// ─── Assets ──────────────────────────────────────────────────────────────────

export const ASSETS: Asset[] = [
  // Cooling Zone
  {
    id: "crac-07",
    name: "CRAC-07",
    type: "crac",
    status: "normal",
    coordinates: [30, 17],
    zoneId: "cooling-zone",
    criticality: "critical",
    metadata: { model: "Liebert DS", capacity_kw: 30, airflow_cfm: 4200 },
  },
  {
    id: "sensor-01",
    name: "Sensor-01",
    type: "sensor",
    status: "normal",
    coordinates: [10, 25],
    zoneId: "cooling-zone",
    criticality: "medium",
    metadata: { metric: "temp", unit: "°C", value: 18.4 },
  },
  {
    id: "sensor-02",
    name: "Sensor-02",
    type: "sensor",
    status: "normal",
    coordinates: [50, 10],
    zoneId: "cooling-zone",
    criticality: "medium",
    metadata: { metric: "humidity", unit: "%", value: 42 },
  },

  // Electrical Zone
  {
    id: "ups-01",
    name: "UPS-01",
    type: "ups",
    status: "normal",
    coordinates: [75, 17],
    zoneId: "electrical-zone",
    criticality: "critical",
    metadata: { model: "APC Symmetra", capacity_kva: 80, load_pct: 68 },
  },
  {
    id: "generator-01",
    name: "GEN-01",
    type: "generator",
    status: "normal",
    coordinates: [108, 17],
    zoneId: "electrical-zone",
    criticality: "high",
    metadata: { model: "Cummins C550D5", capacity_kw: 550, fuel_pct: 91 },
  },
  {
    id: "sensor-03",
    name: "Sensor-03",
    type: "sensor",
    status: "normal",
    coordinates: [90, 28],
    zoneId: "electrical-zone",
    criticality: "low",
    metadata: { metric: "voltage", unit: "V", value: 208 },
  },

  // Row C
  {
    id: "pdu-01",
    name: "PDU-01",
    type: "pdu",
    status: "normal",
    coordinates: [12, 52],
    zoneId: "row-c",
    criticality: "high",
    metadata: { circuits: 12, load_pct: 72 },
  },
  {
    id: "switch-01",
    name: "SW-01",
    type: "switch",
    status: "normal",
    coordinates: [12, 65],
    zoneId: "row-c",
    criticality: "high",
    metadata: { model: "Arista 7050SX", ports: 48, speed_gbps: 25 },
  },
  {
    id: "rack-c01",
    name: "Rack-C01",
    type: "rack",
    status: "normal",
    coordinates: [28, 45],
    zoneId: "row-c",
    criticality: "high",
    metadata: { u_total: 42, u_used: 38, power_kw: 12.4 },
  },
  {
    id: "rack-c02",
    name: "Rack-C02",
    type: "rack",
    status: "normal",
    coordinates: [40, 45],
    zoneId: "row-c",
    criticality: "high",
    metadata: { u_total: 42, u_used: 36, power_kw: 11.8 },
  },
  {
    id: "rack-c03",
    name: "Rack-C03",
    type: "rack",
    status: "normal",
    coordinates: [28, 70],
    zoneId: "row-c",
    criticality: "medium",
    metadata: { u_total: 42, u_used: 30, power_kw: 9.2 },
  },
  {
    id: "rack-c04",
    name: "Rack-C04",
    type: "rack",
    status: "normal",
    coordinates: [40, 70],
    zoneId: "row-c",
    criticality: "medium",
    metadata: { u_total: 42, u_used: 28, power_kw: 8.7 },
  },

  // Row D
  {
    id: "pdu-02",
    name: "PDU-02",
    type: "pdu",
    status: "normal",
    coordinates: [72, 52],
    zoneId: "row-d",
    criticality: "high",
    metadata: { circuits: 12, load_pct: 65 },
  },
  {
    id: "switch-02",
    name: "SW-02",
    type: "switch",
    status: "normal",
    coordinates: [72, 65],
    zoneId: "row-d",
    criticality: "high",
    metadata: { model: "Arista 7050SX", ports: 48, speed_gbps: 25 },
  },
  {
    id: "rack-d01",
    name: "Rack-D01",
    type: "rack",
    status: "normal",
    coordinates: [88, 45],
    zoneId: "row-d",
    criticality: "high",
    metadata: { u_total: 42, u_used: 40, power_kw: 14.1 },
  },
  {
    id: "rack-d02",
    name: "Rack-D02",
    type: "rack",
    status: "normal",
    coordinates: [100, 45],
    zoneId: "row-d",
    criticality: "high",
    metadata: { u_total: 42, u_used: 38, power_kw: 13.5 },
  },
  {
    id: "rack-d03",
    name: "Rack-D03",
    type: "rack",
    status: "normal",
    coordinates: [88, 70],
    zoneId: "row-d",
    criticality: "medium",
    metadata: { u_total: 42, u_used: 32, power_kw: 10.4 },
  },
  {
    id: "rack-d04",
    name: "Rack-D04",
    type: "rack",
    status: "normal",
    coordinates: [100, 70],
    zoneId: "row-d",
    criticality: "medium",
    metadata: { u_total: 42, u_used: 29, power_kw: 9.1 },
  },
  {
    id: "sensor-04",
    name: "Sensor-04",
    type: "sensor",
    status: "normal",
    coordinates: [110, 75],
    zoneId: "row-d",
    criticality: "low",
    metadata: { metric: "temp", unit: "°C", value: 21.6 },
  },
];

// ─── Dependency Edges ─────────────────────────────────────────────────────────
// FEEDS = source actively supplies resource to target
// DEPENDS_ON = target is dependent on source
// CONNECTED_TO = peer relationship (network)

export const EDGES: DependencyEdge[] = [
  // Generator → UPS (power backup)
  {
    id: "gen01-ups01",
    sourceAssetId: "generator-01",
    targetAssetId: "ups-01",
    type: "FEEDS",
    resource: "power",
    criticality: "critical",
    activeInIncident: false,
  },

  // UPS → PDU-01
  {
    id: "ups01-pdu01",
    sourceAssetId: "ups-01",
    targetAssetId: "pdu-01",
    type: "FEEDS",
    resource: "power",
    criticality: "critical",
    activeInIncident: false,
  },

  // UPS → PDU-02
  {
    id: "ups01-pdu02",
    sourceAssetId: "ups-01",
    targetAssetId: "pdu-02",
    type: "FEEDS",
    resource: "power",
    criticality: "critical",
    activeInIncident: false,
  },

  // PDU-01 → Rack-C01
  {
    id: "pdu01-rack-c01",
    sourceAssetId: "pdu-01",
    targetAssetId: "rack-c01",
    type: "FEEDS",
    resource: "power",
    criticality: "high",
    activeInIncident: false,
  },
  // PDU-01 → Rack-C02
  {
    id: "pdu01-rack-c02",
    sourceAssetId: "pdu-01",
    targetAssetId: "rack-c02",
    type: "FEEDS",
    resource: "power",
    criticality: "high",
    activeInIncident: false,
  },
  // PDU-01 → Rack-C03
  {
    id: "pdu01-rack-c03",
    sourceAssetId: "pdu-01",
    targetAssetId: "rack-c03",
    type: "FEEDS",
    resource: "power",
    criticality: "medium",
    activeInIncident: false,
  },
  // PDU-01 → Rack-C04
  {
    id: "pdu01-rack-c04",
    sourceAssetId: "pdu-01",
    targetAssetId: "rack-c04",
    type: "FEEDS",
    resource: "power",
    criticality: "medium",
    activeInIncident: false,
  },

  // PDU-02 → Rack-D01
  {
    id: "pdu02-rack-d01",
    sourceAssetId: "pdu-02",
    targetAssetId: "rack-d01",
    type: "FEEDS",
    resource: "power",
    criticality: "high",
    activeInIncident: false,
  },
  // PDU-02 → Rack-D02
  {
    id: "pdu02-rack-d02",
    sourceAssetId: "pdu-02",
    targetAssetId: "rack-d02",
    type: "FEEDS",
    resource: "power",
    criticality: "high",
    activeInIncident: false,
  },
  // PDU-02 → Rack-D03
  {
    id: "pdu02-rack-d03",
    sourceAssetId: "pdu-02",
    targetAssetId: "rack-d03",
    type: "FEEDS",
    resource: "power",
    criticality: "medium",
    activeInIncident: false,
  },
  // PDU-02 → Rack-D04
  {
    id: "pdu02-rack-d04",
    sourceAssetId: "pdu-02",
    targetAssetId: "rack-d04",
    type: "FEEDS",
    resource: "power",
    criticality: "medium",
    activeInIncident: false,
  },

  // CRAC-07 cooling → Row C racks
  {
    id: "crac07-rack-c01",
    sourceAssetId: "crac-07",
    targetAssetId: "rack-c01",
    type: "FEEDS",
    resource: "cooling",
    criticality: "critical",
    minutesToImpact: 14,
    activeInIncident: false,
  },
  {
    id: "crac07-rack-c02",
    sourceAssetId: "crac-07",
    targetAssetId: "rack-c02",
    type: "FEEDS",
    resource: "cooling",
    criticality: "critical",
    minutesToImpact: 16,
    activeInIncident: false,
  },
  {
    id: "crac07-rack-c03",
    sourceAssetId: "crac-07",
    targetAssetId: "rack-c03",
    type: "FEEDS",
    resource: "cooling",
    criticality: "high",
    minutesToImpact: 21,
    activeInIncident: false,
  },
  {
    id: "crac07-rack-c04",
    sourceAssetId: "crac-07",
    targetAssetId: "rack-c04",
    type: "FEEDS",
    resource: "cooling",
    criticality: "high",
    minutesToImpact: 29,
    activeInIncident: false,
  },

  // CRAC-07 cooling → Row D racks
  {
    id: "crac07-rack-d01",
    sourceAssetId: "crac-07",
    targetAssetId: "rack-d01",
    type: "FEEDS",
    resource: "cooling",
    criticality: "critical",
    minutesToImpact: 14,
    activeInIncident: false,
  },
  {
    id: "crac07-rack-d02",
    sourceAssetId: "crac-07",
    targetAssetId: "rack-d02",
    type: "FEEDS",
    resource: "cooling",
    criticality: "critical",
    minutesToImpact: 16,
    activeInIncident: false,
  },
  {
    id: "crac07-rack-d03",
    sourceAssetId: "crac-07",
    targetAssetId: "rack-d03",
    type: "FEEDS",
    resource: "cooling",
    criticality: "high",
    minutesToImpact: 21,
    activeInIncident: false,
  },
  {
    id: "crac07-rack-d04",
    sourceAssetId: "crac-07",
    targetAssetId: "rack-d04",
    type: "FEEDS",
    resource: "cooling",
    criticality: "high",
    minutesToImpact: 29,
    activeInIncident: false,
  },

  // Network: SW-01 ↔ Row C racks
  {
    id: "sw01-rack-c01",
    sourceAssetId: "switch-01",
    targetAssetId: "rack-c01",
    type: "CONNECTED_TO",
    resource: "network",
    criticality: "high",
    activeInIncident: false,
  },
  {
    id: "sw01-rack-c02",
    sourceAssetId: "switch-01",
    targetAssetId: "rack-c02",
    type: "CONNECTED_TO",
    resource: "network",
    criticality: "high",
    activeInIncident: false,
  },
  {
    id: "sw01-rack-c03",
    sourceAssetId: "switch-01",
    targetAssetId: "rack-c03",
    type: "CONNECTED_TO",
    resource: "network",
    criticality: "medium",
    activeInIncident: false,
  },
  {
    id: "sw01-rack-c04",
    sourceAssetId: "switch-01",
    targetAssetId: "rack-c04",
    type: "CONNECTED_TO",
    resource: "network",
    criticality: "medium",
    activeInIncident: false,
  },

  // Network: SW-02 ↔ Row D racks
  {
    id: "sw02-rack-d01",
    sourceAssetId: "switch-02",
    targetAssetId: "rack-d01",
    type: "CONNECTED_TO",
    resource: "network",
    criticality: "high",
    activeInIncident: false,
  },
  {
    id: "sw02-rack-d02",
    sourceAssetId: "switch-02",
    targetAssetId: "rack-d02",
    type: "CONNECTED_TO",
    resource: "network",
    criticality: "high",
    activeInIncident: false,
  },
  {
    id: "sw02-rack-d03",
    sourceAssetId: "switch-02",
    targetAssetId: "rack-d03",
    type: "CONNECTED_TO",
    resource: "network",
    criticality: "medium",
    activeInIncident: false,
  },
  {
    id: "sw02-rack-d04",
    sourceAssetId: "switch-02",
    targetAssetId: "rack-d04",
    type: "CONNECTED_TO",
    resource: "network",
    criticality: "medium",
    activeInIncident: false,
  },

  // Sensor dependency edges
  {
    id: "sensor01-crac07",
    sourceAssetId: "sensor-01",
    targetAssetId: "crac-07",
    type: "DEPENDS_ON",
    resource: "dependency",
    criticality: "medium",
    activeInIncident: false,
  },
  {
    id: "sensor02-crac07",
    sourceAssetId: "sensor-02",
    targetAssetId: "crac-07",
    type: "DEPENDS_ON",
    resource: "dependency",
    criticality: "medium",
    activeInIncident: false,
  },
];

// ─── Incident definition ──────────────────────────────────────────────────────
// Which assets get affected and in what order when CRAC-07 fails

export interface IncidentStep {
  delayMs: number;
  assetId: string;
  status: "warning" | "critical";
  edgeIds: string[];
  message: string;
  minutesToImpact?: number;
}

export const CRAC07_INCIDENT: IncidentStep[] = [
  {
    delayMs: 0,
    assetId: "crac-07",
    status: "critical",
    edgeIds: [],
    message: "CRAC-07 compressor failure detected — thermal output collapsed",
  },
  {
    delayMs: 400,
    assetId: "rack-c01",
    status: "warning",
    edgeIds: ["crac07-rack-c01"],
    message: "Rack-C01 inlet temp rising — cooling loss T+14 min",
    minutesToImpact: 14,
  },
  {
    delayMs: 700,
    assetId: "rack-d01",
    status: "warning",
    edgeIds: ["crac07-rack-d01"],
    message: "Rack-D01 inlet temp rising — cooling loss T+14 min",
    minutesToImpact: 14,
  },
  {
    delayMs: 1000,
    assetId: "rack-c02",
    status: "warning",
    edgeIds: ["crac07-rack-c02"],
    message: "Rack-C02 thermal anomaly — T+16 min to threshold",
    minutesToImpact: 16,
  },
  {
    delayMs: 1300,
    assetId: "rack-d02",
    status: "warning",
    edgeIds: ["crac07-rack-d02"],
    message: "Rack-D02 thermal anomaly — T+16 min to threshold",
    minutesToImpact: 16,
  },
  {
    delayMs: 1700,
    assetId: "rack-c03",
    status: "warning",
    edgeIds: ["crac07-rack-c03"],
    message: "Rack-C03 entering thermal risk window — T+21 min",
    minutesToImpact: 21,
  },
  {
    delayMs: 2000,
    assetId: "rack-d03",
    status: "warning",
    edgeIds: ["crac07-rack-d03"],
    message: "Rack-D03 entering thermal risk window — T+21 min",
    minutesToImpact: 21,
  },
  {
    delayMs: 2400,
    assetId: "rack-c04",
    status: "critical",
    edgeIds: ["crac07-rack-c04"],
    message: "Rack-C04 CRITICAL — emergency shutdown risk T+29 min",
    minutesToImpact: 29,
  },
  {
    delayMs: 2700,
    assetId: "rack-d04",
    status: "critical",
    edgeIds: ["crac07-rack-d04"],
    message: "Rack-D04 CRITICAL — emergency shutdown risk T+29 min",
    minutesToImpact: 29,
  },
];

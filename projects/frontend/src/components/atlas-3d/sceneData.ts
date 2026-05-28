import type { Asset3D, DependencyEdge3D, Zone3D } from "./sceneTypes";

// ─── Rack dimensions ────────────────────────────────────
const RACK_DIM = { width: 1.2, height: 4.5, depth: 1.4 };
const CRAC_DIM = { width: 3.5, height: 2.2, depth: 2.0 };
const PDU_DIM = { width: 1.2, height: 2.0, depth: 1.0 };
const UPS_DIM = { width: 2.5, height: 2.2, depth: 1.5 };
const SW_DIM = { width: 1.4, height: 0.5, depth: 0.8 };
const SENS_DIM = { width: 0.25, height: 0.25, depth: 0.25 };

// ─── Hall B floor: x [-15,15], z [-10,10] ───────────────
// Row C at z=-3.5 (8 racks, x from -10.5 to 0, spacing 1.5)
// Row D at z= 3.5 (8 racks, same x)
// CRAC-07/08 in Cooling Zone (east wall, x≈11)
// UPS/PDU in Electrical Zone (west wall, x≈-12)
// Switches in Network Zone (z≈-8)

const ROW_C_Z = -3.5;
const ROW_D_Z = 3.5;
const RACK_Y = RACK_DIM.height / 2;
const RACK_XS = [-10.5, -9.0, -7.5, -6.0, -4.5, -3.0, -1.5, 0.0];

export const SCENE_ASSETS: Asset3D[] = [
  // ─── Row C Racks ─────────────────────────────────────
  ...RACK_XS.map((x, i) => ({
    id: `rack-c${12 + i}`,
    name: `Rack C${12 + i}`,
    type: "rack" as const,
    status: "normal" as const,
    position: [x, RACK_Y, ROW_C_Z] as [number, number, number],
    dimensions: RACK_DIM,
    zoneId: "row-c",
    criticality: 8,
    metadata: {
      row: "C",
      slot: i + 1,
      powerDraw: `${4.2 + i * 0.3}kW`,
      temperature: `${21 + i * 0.2}°C`,
    },
  })),

  // ─── Row D Racks ─────────────────────────────────────
  ...RACK_XS.map((x, i) => ({
    id: `rack-d0${i + 1}`,
    name: `Rack D0${i + 1}`,
    type: "rack" as const,
    status: "normal" as const,
    position: [x, RACK_Y, ROW_D_Z] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
    dimensions: RACK_DIM,
    zoneId: "row-d",
    criticality: 7,
    metadata: {
      row: "D",
      slot: i + 1,
      powerDraw: `${3.8 + i * 0.2}kW`,
      temperature: `${20 + i * 0.15}°C`,
    },
  })),

  // ─── CRAC Units ──────────────────────────────────────
  {
    id: "crac-07",
    name: "CRAC-07",
    type: "crac",
    status: "normal",
    position: [11, CRAC_DIM.height / 2, -3],
    dimensions: CRAC_DIM,
    zoneId: "cooling-zone",
    criticality: 10,
    metadata: {
      model: "Stulz CyberAir 3",
      capacityKW: 45,
      supplyTemp: "16°C",
      airflow: "5,800 CFM",
    },
  },
  {
    id: "crac-08",
    name: "CRAC-08",
    type: "crac",
    status: "normal",
    position: [11, CRAC_DIM.height / 2, 3],
    rotation: [0, Math.PI, 0] as [number, number, number],
    dimensions: CRAC_DIM,
    zoneId: "cooling-zone",
    criticality: 9,
    metadata: {
      model: "Stulz CyberAir 3",
      capacityKW: 45,
      supplyTemp: "16°C",
      airflow: "5,800 CFM",
    },
  },

  // ─── UPS ─────────────────────────────────────────────
  {
    id: "ups-01",
    name: "UPS-01",
    type: "ups",
    status: "normal",
    position: [-12.5, UPS_DIM.height / 2, 0],
    dimensions: UPS_DIM,
    zoneId: "electrical-zone",
    criticality: 10,
    metadata: { model: "Eaton 9PX", capacityKVA: 20, batteryRuntime: "12 min", loadPercent: "67%" },
  },

  // ─── PDUs ────────────────────────────────────────────
  {
    id: "pdu-01",
    name: "PDU-01",
    type: "pdu",
    status: "normal",
    position: [-11.5, PDU_DIM.height / 2, -3.5],
    dimensions: PDU_DIM,
    zoneId: "electrical-zone",
    criticality: 9,
    metadata: { model: "Raritan PX3", circuits: 24, loadAmps: "32A", inputKW: "6.2kW" },
  },
  {
    id: "pdu-02",
    name: "PDU-02",
    type: "pdu",
    status: "normal",
    position: [-11.5, PDU_DIM.height / 2, 3.5],
    dimensions: PDU_DIM,
    zoneId: "electrical-zone",
    criticality: 9,
    metadata: { model: "Raritan PX3", circuits: 24, loadAmps: "28A", inputKW: "5.8kW" },
  },

  // ─── Switches ────────────────────────────────────────
  {
    id: "switch-01",
    name: "Switch-01",
    type: "switch",
    status: "normal",
    position: [-2.5, SW_DIM.height / 2, -8],
    dimensions: SW_DIM,
    zoneId: "network-zone",
    criticality: 8,
    metadata: { model: "Cisco Nexus 9348", ports: 48, speed: "25G", uplink: "100G" },
  },
  {
    id: "switch-02",
    name: "Switch-02",
    type: "switch",
    status: "normal",
    position: [2.0, SW_DIM.height / 2, -8],
    dimensions: SW_DIM,
    zoneId: "network-zone",
    criticality: 8,
    metadata: { model: "Cisco Nexus 9348", ports: 48, speed: "25G", uplink: "100G" },
  },

  // ─── Sensors ─────────────────────────────────────────
  {
    id: "sensor-c1",
    name: "Temp Sensor C1",
    type: "sensor",
    status: "normal",
    position: [-9.0, 4.7, ROW_C_Z - 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-c",
    criticality: 4,
    metadata: { reading: "21.4°C", threshold: "35°C" },
  },
  {
    id: "sensor-c2",
    name: "Temp Sensor C2",
    type: "sensor",
    status: "normal",
    position: [-4.5, 4.7, ROW_C_Z - 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-c",
    criticality: 4,
    metadata: { reading: "22.1°C", threshold: "35°C" },
  },
  {
    id: "sensor-d1",
    name: "Temp Sensor D1",
    type: "sensor",
    status: "normal",
    position: [-9.0, 4.7, ROW_D_Z + 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-d",
    criticality: 4,
    metadata: { reading: "20.8°C", threshold: "35°C" },
  },
  {
    id: "sensor-d2",
    name: "Temp Sensor D2",
    type: "sensor",
    status: "normal",
    position: [-4.5, 4.7, ROW_D_Z + 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-d",
    criticality: 4,
    metadata: { reading: "21.2°C", threshold: "35°C" },
  },
];

// ─── Dependency edges ────────────────────────────────────
export const SCENE_EDGES: DependencyEdge3D[] = [
  // CRAC-07 cooling-feeds Row C racks
  ...RACK_XS.map((_, i) => ({
    id: `cooling-crac07-rack-c${12 + i}`,
    sourceAssetId: "crac-07",
    targetAssetId: `rack-c${12 + i}`,
    type: "FEEDS" as const,
    resource: "cooling" as const,
    criticality: 9,
    minutesToImpact: 14 + i * 2,
  })),

  // CRAC-08 cooling-feeds Row D racks
  ...RACK_XS.map((_, i) => ({
    id: `cooling-crac08-rack-d0${i + 1}`,
    sourceAssetId: "crac-08",
    targetAssetId: `rack-d0${i + 1}`,
    type: "FEEDS" as const,
    resource: "cooling" as const,
    criticality: 8,
    minutesToImpact: 18 + i * 2,
  })),

  // UPS-01 powers PDU-01 and PDU-02
  {
    id: "power-ups01-pdu01",
    sourceAssetId: "ups-01",
    targetAssetId: "pdu-01",
    type: "FEEDS",
    resource: "power",
    criticality: 10,
  },
  {
    id: "power-ups01-pdu02",
    sourceAssetId: "ups-01",
    targetAssetId: "pdu-02",
    type: "FEEDS",
    resource: "power",
    criticality: 10,
  },

  // PDU-01 powers Row C racks
  ...RACK_XS.map((_, i) => ({
    id: `power-pdu01-rack-c${12 + i}`,
    sourceAssetId: "pdu-01",
    targetAssetId: `rack-c${12 + i}`,
    type: "FEEDS" as const,
    resource: "power" as const,
    criticality: 9,
  })),

  // PDU-02 powers Row D racks
  ...RACK_XS.map((_, i) => ({
    id: `power-pdu02-rack-d0${i + 1}`,
    sourceAssetId: "pdu-02",
    targetAssetId: `rack-d0${i + 1}`,
    type: "FEEDS" as const,
    resource: "power" as const,
    criticality: 8,
  })),

  // Switch-01 connects to Row C racks
  ...RACK_XS.map((_, i) => ({
    id: `net-sw01-rack-c${12 + i}`,
    sourceAssetId: "switch-01",
    targetAssetId: `rack-c${12 + i}`,
    type: "CONNECTED_TO" as const,
    resource: "network" as const,
    criticality: 7,
  })),

  // Switch-02 connects to Row D racks
  ...RACK_XS.map((_, i) => ({
    id: `net-sw02-rack-d0${i + 1}`,
    sourceAssetId: "switch-02",
    targetAssetId: `rack-d0${i + 1}`,
    type: "CONNECTED_TO" as const,
    resource: "network" as const,
    criticality: 7,
  })),
];

export const SCENE_ZONES: Zone3D[] = [
  {
    id: "hall-b",
    name: "Hall B",
    type: "data_hall",
    color: "#334155",
    bounds: { minX: -15, maxX: 15, minZ: -10, maxZ: 10 },
  },
  {
    id: "row-c",
    name: "Row C",
    type: "rack_row",
    color: "#1e3a5f",
    bounds: { minX: -12, maxX: 2, minZ: -5, maxZ: -2 },
  },
  {
    id: "row-d",
    name: "Row D",
    type: "rack_row",
    color: "#1e3a5f",
    bounds: { minX: -12, maxX: 2, minZ: 2, maxZ: 5 },
  },
  {
    id: "cooling-zone",
    name: "Cooling Zone",
    type: "cooling",
    color: "#083344",
    bounds: { minX: 9, maxX: 14, minZ: -6, maxZ: 6 },
  },
  {
    id: "electrical-zone",
    name: "Electrical Zone",
    type: "electrical",
    color: "#32200a",
    bounds: { minX: -15, maxX: -10, minZ: -6, maxZ: 6 },
  },
  {
    id: "network-zone",
    name: "Network Zone",
    type: "network",
    color: "#1a0a3a",
    bounds: { minX: -5, maxX: 5, minZ: -10, maxZ: -6.5 },
  },
  {
    id: "service-corridor",
    name: "Service Corridor",
    type: "corridor",
    color: "#1c1c1c",
    bounds: { minX: 3, maxX: 9, minZ: -10, maxZ: 10 },
  },
];

// ─── Hall A floor data (Network Ops) ────────────────────
const ROW_A_Z = -3.5;
const ROW_B_Z = 3.5;

export const SCENE_ASSETS_HALL_A: Asset3D[] = [
  // Row A Racks
  ...RACK_XS.map((x, i) => ({
    id: `rack-a0${i + 1}`,
    name: `Rack A0${i + 1}`,
    type: "rack" as const,
    status: "normal" as const,
    position: [x, RACK_Y, ROW_A_Z] as [number, number, number],
    dimensions: RACK_DIM,
    zoneId: "row-a",
    criticality: 8,
    metadata: {
      row: "A",
      slot: i + 1,
      powerDraw: `${3.9 + i * 0.25}kW`,
      temperature: `${20.5 + i * 0.2}°C`,
    },
  })),
  // Row B Racks
  ...RACK_XS.map((x, i) => ({
    id: `rack-b0${i + 1}`,
    name: `Rack B0${i + 1}`,
    type: "rack" as const,
    status: "normal" as const,
    position: [x, RACK_Y, ROW_B_Z] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
    dimensions: RACK_DIM,
    zoneId: "row-b",
    criticality: 7,
    metadata: {
      row: "B",
      slot: i + 1,
      powerDraw: `${3.5 + i * 0.2}kW`,
      temperature: `${19.8 + i * 0.15}°C`,
    },
  })),
  // CRAC Units
  {
    id: "crac-05",
    name: "CRAC-05",
    type: "crac",
    status: "normal",
    position: [11, CRAC_DIM.height / 2, -3],
    dimensions: CRAC_DIM,
    zoneId: "cooling-zone",
    criticality: 10,
    metadata: {
      model: "Stulz CyberAir 3",
      capacityKW: 45,
      supplyTemp: "15°C",
      airflow: "5,800 CFM",
    },
  },
  {
    id: "crac-06",
    name: "CRAC-06",
    type: "crac",
    status: "normal",
    position: [11, CRAC_DIM.height / 2, 3],
    rotation: [0, Math.PI, 0] as [number, number, number],
    dimensions: CRAC_DIM,
    zoneId: "cooling-zone",
    criticality: 9,
    metadata: {
      model: "Stulz CyberAir 3",
      capacityKW: 45,
      supplyTemp: "15°C",
      airflow: "5,800 CFM",
    },
  },
  // UPS
  {
    id: "ups-03",
    name: "UPS-03",
    type: "ups",
    status: "normal",
    position: [-12.5, UPS_DIM.height / 2, 0],
    dimensions: UPS_DIM,
    zoneId: "electrical-zone",
    criticality: 10,
    metadata: {
      model: "APC Symmetra LX",
      capacityKVA: 16,
      batteryRuntime: "10 min",
      loadPercent: "58%",
    },
  },
  // PDUs
  {
    id: "pdu-03",
    name: "PDU-03",
    type: "pdu",
    status: "normal",
    position: [-11.5, PDU_DIM.height / 2, -3.5],
    dimensions: PDU_DIM,
    zoneId: "electrical-zone",
    criticality: 9,
    metadata: { model: "Raritan PX3", circuits: 24, loadAmps: "29A", inputKW: "5.6kW" },
  },
  {
    id: "pdu-04",
    name: "PDU-04",
    type: "pdu",
    status: "normal",
    position: [-11.5, PDU_DIM.height / 2, 3.5],
    dimensions: PDU_DIM,
    zoneId: "electrical-zone",
    criticality: 9,
    metadata: { model: "Raritan PX3", circuits: 24, loadAmps: "25A", inputKW: "5.1kW" },
  },
  // Switches
  {
    id: "switch-03",
    name: "Switch-03",
    type: "switch",
    status: "normal",
    position: [-2.5, SW_DIM.height / 2, -8],
    dimensions: SW_DIM,
    zoneId: "network-zone",
    criticality: 8,
    metadata: { model: "Arista 7050SX3", ports: 48, speed: "100G", uplink: "400G" },
  },
  {
    id: "switch-04",
    name: "Switch-04",
    type: "switch",
    status: "normal",
    position: [2.0, SW_DIM.height / 2, -8],
    dimensions: SW_DIM,
    zoneId: "network-zone",
    criticality: 8,
    metadata: { model: "Arista 7050SX3", ports: 48, speed: "100G", uplink: "400G" },
  },
  // Sensors
  {
    id: "sensor-a1",
    name: "Temp Sensor A1",
    type: "sensor",
    status: "normal",
    position: [-9.0, 4.7, ROW_A_Z - 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-a",
    criticality: 4,
    metadata: { reading: "20.5°C", threshold: "35°C" },
  },
  {
    id: "sensor-a2",
    name: "Temp Sensor A2",
    type: "sensor",
    status: "normal",
    position: [-4.5, 4.7, ROW_A_Z - 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-a",
    criticality: 4,
    metadata: { reading: "21.3°C", threshold: "35°C" },
  },
  {
    id: "sensor-b1",
    name: "Temp Sensor B1",
    type: "sensor",
    status: "normal",
    position: [-9.0, 4.7, ROW_B_Z + 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-b",
    criticality: 4,
    metadata: { reading: "19.9°C", threshold: "35°C" },
  },
  {
    id: "sensor-b2",
    name: "Temp Sensor B2",
    type: "sensor",
    status: "normal",
    position: [-4.5, 4.7, ROW_B_Z + 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-b",
    criticality: 4,
    metadata: { reading: "20.6°C", threshold: "35°C" },
  },
];

export const SCENE_EDGES_HALL_A: DependencyEdge3D[] = [
  ...RACK_XS.map((_, i) => ({
    id: `cooling-crac05-rack-a0${i + 1}`,
    sourceAssetId: "crac-05",
    targetAssetId: `rack-a0${i + 1}`,
    type: "FEEDS" as const,
    resource: "cooling" as const,
    criticality: 9,
    minutesToImpact: 14 + i * 2,
  })),
  ...RACK_XS.map((_, i) => ({
    id: `cooling-crac06-rack-b0${i + 1}`,
    sourceAssetId: "crac-06",
    targetAssetId: `rack-b0${i + 1}`,
    type: "FEEDS" as const,
    resource: "cooling" as const,
    criticality: 8,
    minutesToImpact: 18 + i * 2,
  })),
  {
    id: "power-ups03-pdu03",
    sourceAssetId: "ups-03",
    targetAssetId: "pdu-03",
    type: "FEEDS",
    resource: "power",
    criticality: 10,
  },
  {
    id: "power-ups03-pdu04",
    sourceAssetId: "ups-03",
    targetAssetId: "pdu-04",
    type: "FEEDS",
    resource: "power",
    criticality: 10,
  },
  ...RACK_XS.map((_, i) => ({
    id: `power-pdu03-rack-a0${i + 1}`,
    sourceAssetId: "pdu-03",
    targetAssetId: `rack-a0${i + 1}`,
    type: "FEEDS" as const,
    resource: "power" as const,
    criticality: 9,
  })),
  ...RACK_XS.map((_, i) => ({
    id: `power-pdu04-rack-b0${i + 1}`,
    sourceAssetId: "pdu-04",
    targetAssetId: `rack-b0${i + 1}`,
    type: "FEEDS" as const,
    resource: "power" as const,
    criticality: 8,
  })),
  ...RACK_XS.map((_, i) => ({
    id: `net-sw03-rack-a0${i + 1}`,
    sourceAssetId: "switch-03",
    targetAssetId: `rack-a0${i + 1}`,
    type: "CONNECTED_TO" as const,
    resource: "network" as const,
    criticality: 7,
  })),
  ...RACK_XS.map((_, i) => ({
    id: `net-sw04-rack-b0${i + 1}`,
    sourceAssetId: "switch-04",
    targetAssetId: `rack-b0${i + 1}`,
    type: "CONNECTED_TO" as const,
    resource: "network" as const,
    criticality: 7,
  })),
];

export const SCENE_ZONES_HALL_A: Zone3D[] = [
  {
    id: "hall-a",
    name: "Hall A",
    type: "data_hall",
    color: "#1e3a5f",
    bounds: { minX: -15, maxX: 15, minZ: -10, maxZ: 10 },
  },
  {
    id: "row-a",
    name: "Row A",
    type: "rack_row",
    color: "#0c2a4f",
    bounds: { minX: -12, maxX: 2, minZ: -5, maxZ: -2 },
  },
  {
    id: "row-b",
    name: "Row B",
    type: "rack_row",
    color: "#0c2a4f",
    bounds: { minX: -12, maxX: 2, minZ: 2, maxZ: 5 },
  },
  {
    id: "cooling-zone",
    name: "Cooling Zone",
    type: "cooling",
    color: "#083344",
    bounds: { minX: 9, maxX: 14, minZ: -6, maxZ: 6 },
  },
  {
    id: "electrical-zone",
    name: "Electrical Zone",
    type: "electrical",
    color: "#32200a",
    bounds: { minX: -15, maxX: -10, minZ: -6, maxZ: 6 },
  },
  {
    id: "network-zone",
    name: "Network Zone",
    type: "network",
    color: "#1a0a3a",
    bounds: { minX: -5, maxX: 5, minZ: -10, maxZ: -6.5 },
  },
  {
    id: "service-corridor",
    name: "Service Corridor",
    type: "corridor",
    color: "#1c1c1c",
    bounds: { minX: 3, maxX: 9, minZ: -10, maxZ: 10 },
  },
];

// ─── Hall C floor data (HPC Cluster) ────────────────────
const ROW_E_Z = -3.5;
const ROW_F_Z = 3.5;

export const SCENE_ASSETS_HALL_C: Asset3D[] = [
  // Row E Racks
  ...RACK_XS.map((x, i) => ({
    id: `rack-e0${i + 1}`,
    name: `Rack E0${i + 1}`,
    type: "rack" as const,
    status: "normal" as const,
    position: [x, RACK_Y, ROW_E_Z] as [number, number, number],
    dimensions: RACK_DIM,
    zoneId: "row-e",
    criticality: 8,
    metadata: {
      row: "E",
      slot: i + 1,
      powerDraw: `${5.1 + i * 0.4}kW`,
      temperature: `${22.2 + i * 0.25}°C`,
    },
  })),
  // Row F Racks
  ...RACK_XS.map((x, i) => ({
    id: `rack-f0${i + 1}`,
    name: `Rack F0${i + 1}`,
    type: "rack" as const,
    status: "normal" as const,
    position: [x, RACK_Y, ROW_F_Z] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
    dimensions: RACK_DIM,
    zoneId: "row-f",
    criticality: 7,
    metadata: {
      row: "F",
      slot: i + 1,
      powerDraw: `${4.7 + i * 0.35}kW`,
      temperature: `${21.5 + i * 0.2}°C`,
    },
  })),
  // CRAC Units
  {
    id: "crac-01",
    name: "CRAC-01",
    type: "crac",
    status: "normal",
    position: [11, CRAC_DIM.height / 2, -3],
    dimensions: CRAC_DIM,
    zoneId: "cooling-zone",
    criticality: 10,
    metadata: { model: "Liebert DS", capacityKW: 52, supplyTemp: "14°C", airflow: "6,200 CFM" },
  },
  {
    id: "crac-02",
    name: "CRAC-02",
    type: "crac",
    status: "normal",
    position: [11, CRAC_DIM.height / 2, 3],
    rotation: [0, Math.PI, 0] as [number, number, number],
    dimensions: CRAC_DIM,
    zoneId: "cooling-zone",
    criticality: 9,
    metadata: { model: "Liebert DS", capacityKW: 52, supplyTemp: "14°C", airflow: "6,200 CFM" },
  },
  // UPS
  {
    id: "ups-02",
    name: "UPS-02",
    type: "ups",
    status: "normal",
    position: [-12.5, UPS_DIM.height / 2, 0],
    dimensions: UPS_DIM,
    zoneId: "electrical-zone",
    criticality: 10,
    metadata: {
      model: "Eaton 9PX 20kVA",
      capacityKVA: 20,
      batteryRuntime: "14 min",
      loadPercent: "72%",
    },
  },
  // PDUs
  {
    id: "pdu-05",
    name: "PDU-05",
    type: "pdu",
    status: "normal",
    position: [-11.5, PDU_DIM.height / 2, -3.5],
    dimensions: PDU_DIM,
    zoneId: "electrical-zone",
    criticality: 9,
    metadata: { model: "Vertiv MPH2", circuits: 24, loadAmps: "36A", inputKW: "7.1kW" },
  },
  {
    id: "pdu-06",
    name: "PDU-06",
    type: "pdu",
    status: "normal",
    position: [-11.5, PDU_DIM.height / 2, 3.5],
    dimensions: PDU_DIM,
    zoneId: "electrical-zone",
    criticality: 9,
    metadata: { model: "Vertiv MPH2", circuits: 24, loadAmps: "33A", inputKW: "6.6kW" },
  },
  // Switches
  {
    id: "switch-05",
    name: "Switch-05",
    type: "switch",
    status: "normal",
    position: [-2.5, SW_DIM.height / 2, -8],
    dimensions: SW_DIM,
    zoneId: "network-zone",
    criticality: 8,
    metadata: { model: "Cisco Nexus 93600", ports: 32, speed: "400G", uplink: "400G" },
  },
  {
    id: "switch-06",
    name: "Switch-06",
    type: "switch",
    status: "normal",
    position: [2.0, SW_DIM.height / 2, -8],
    dimensions: SW_DIM,
    zoneId: "network-zone",
    criticality: 8,
    metadata: { model: "Cisco Nexus 93600", ports: 32, speed: "400G", uplink: "400G" },
  },
  // Sensors
  {
    id: "sensor-e1",
    name: "Temp Sensor E1",
    type: "sensor",
    status: "normal",
    position: [-9.0, 4.7, ROW_E_Z - 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-e",
    criticality: 4,
    metadata: { reading: "22.2°C", threshold: "35°C" },
  },
  {
    id: "sensor-e2",
    name: "Temp Sensor E2",
    type: "sensor",
    status: "normal",
    position: [-4.5, 4.7, ROW_E_Z - 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-e",
    criticality: 4,
    metadata: { reading: "23.1°C", threshold: "35°C" },
  },
  {
    id: "sensor-f1",
    name: "Temp Sensor F1",
    type: "sensor",
    status: "normal",
    position: [-9.0, 4.7, ROW_F_Z + 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-f",
    criticality: 4,
    metadata: { reading: "21.8°C", threshold: "35°C" },
  },
  {
    id: "sensor-f2",
    name: "Temp Sensor F2",
    type: "sensor",
    status: "normal",
    position: [-4.5, 4.7, ROW_F_Z + 0.8],
    dimensions: SENS_DIM,
    zoneId: "row-f",
    criticality: 4,
    metadata: { reading: "22.5°C", threshold: "35°C" },
  },
];

export const SCENE_EDGES_HALL_C: DependencyEdge3D[] = [
  ...RACK_XS.map((_, i) => ({
    id: `cooling-crac01-rack-e0${i + 1}`,
    sourceAssetId: "crac-01",
    targetAssetId: `rack-e0${i + 1}`,
    type: "FEEDS" as const,
    resource: "cooling" as const,
    criticality: 9,
    minutesToImpact: 12 + i * 2,
  })),
  ...RACK_XS.map((_, i) => ({
    id: `cooling-crac02-rack-f0${i + 1}`,
    sourceAssetId: "crac-02",
    targetAssetId: `rack-f0${i + 1}`,
    type: "FEEDS" as const,
    resource: "cooling" as const,
    criticality: 8,
    minutesToImpact: 16 + i * 2,
  })),
  {
    id: "power-ups02-pdu05",
    sourceAssetId: "ups-02",
    targetAssetId: "pdu-05",
    type: "FEEDS",
    resource: "power",
    criticality: 10,
  },
  {
    id: "power-ups02-pdu06",
    sourceAssetId: "ups-02",
    targetAssetId: "pdu-06",
    type: "FEEDS",
    resource: "power",
    criticality: 10,
  },
  ...RACK_XS.map((_, i) => ({
    id: `power-pdu05-rack-e0${i + 1}`,
    sourceAssetId: "pdu-05",
    targetAssetId: `rack-e0${i + 1}`,
    type: "FEEDS" as const,
    resource: "power" as const,
    criticality: 9,
  })),
  ...RACK_XS.map((_, i) => ({
    id: `power-pdu06-rack-f0${i + 1}`,
    sourceAssetId: "pdu-06",
    targetAssetId: `rack-f0${i + 1}`,
    type: "FEEDS" as const,
    resource: "power" as const,
    criticality: 8,
  })),
  ...RACK_XS.map((_, i) => ({
    id: `net-sw05-rack-e0${i + 1}`,
    sourceAssetId: "switch-05",
    targetAssetId: `rack-e0${i + 1}`,
    type: "CONNECTED_TO" as const,
    resource: "network" as const,
    criticality: 7,
  })),
  ...RACK_XS.map((_, i) => ({
    id: `net-sw06-rack-f0${i + 1}`,
    sourceAssetId: "switch-06",
    targetAssetId: `rack-f0${i + 1}`,
    type: "CONNECTED_TO" as const,
    resource: "network" as const,
    criticality: 7,
  })),
];

export const SCENE_ZONES_HALL_C: Zone3D[] = [
  {
    id: "hall-c",
    name: "Hall C",
    type: "data_hall",
    color: "#1a2e1a",
    bounds: { minX: -15, maxX: 15, minZ: -10, maxZ: 10 },
  },
  {
    id: "row-e",
    name: "Row E",
    type: "rack_row",
    color: "#0f2a0f",
    bounds: { minX: -12, maxX: 2, minZ: -5, maxZ: -2 },
  },
  {
    id: "row-f",
    name: "Row F",
    type: "rack_row",
    color: "#0f2a0f",
    bounds: { minX: -12, maxX: 2, minZ: 2, maxZ: 5 },
  },
  {
    id: "cooling-zone",
    name: "Cooling Zone",
    type: "cooling",
    color: "#083344",
    bounds: { minX: 9, maxX: 14, minZ: -6, maxZ: 6 },
  },
  {
    id: "electrical-zone",
    name: "Electrical Zone",
    type: "electrical",
    color: "#32200a",
    bounds: { minX: -15, maxX: -10, minZ: -6, maxZ: 6 },
  },
  {
    id: "network-zone",
    name: "Network Zone",
    type: "network",
    color: "#1a0a3a",
    bounds: { minX: -5, maxX: 5, minZ: -10, maxZ: -6.5 },
  },
  {
    id: "service-corridor",
    name: "Service Corridor",
    type: "corridor",
    color: "#1c1c1c",
    bounds: { minX: 3, maxX: 9, minZ: -10, maxZ: 10 },
  },
];

// ─── Floor registry ──────────────────────────────────────
export type FloorId3D = "hall-b" | "hall-a" | "hall-c";

export const FLOORS_3D: Record<
  FloorId3D,
  {
    id: FloorId3D;
    label: string;
    shortLabel: string;
    subtitle: string;
    assets: Asset3D[];
    edges: DependencyEdge3D[];
    zones: Zone3D[];
  }
> = {
  "hall-b": {
    id: "hall-b",
    label: "Hall B",
    shortLabel: "B",
    subtitle: "Main Data Hall",
    assets: SCENE_ASSETS,
    edges: SCENE_EDGES,
    zones: SCENE_ZONES,
  },
  "hall-a": {
    id: "hall-a",
    label: "Hall A",
    shortLabel: "A",
    subtitle: "Network Ops",
    assets: SCENE_ASSETS_HALL_A,
    edges: SCENE_EDGES_HALL_A,
    zones: SCENE_ZONES_HALL_A,
  },
  "hall-c": {
    id: "hall-c",
    label: "Hall C",
    shortLabel: "C",
    subtitle: "HPC Cluster",
    assets: SCENE_ASSETS_HALL_C,
    edges: SCENE_EDGES_HALL_C,
    zones: SCENE_ZONES_HALL_C,
  },
};

// Incident blast radius for CRAC-07 failure
export const CRAC07_BLAST_RADIUS = [
  {
    assetId: "rack-c12",
    assetName: "Rack C12",
    impact: "Cooling loss — thermal threshold in 14 min",
    minutesToImpact: 14,
  },
  {
    assetId: "rack-c13",
    assetName: "Rack C13",
    impact: "Cooling loss — thermal threshold in 16 min",
    minutesToImpact: 16,
  },
  {
    assetId: "rack-c14",
    assetName: "Rack C14",
    impact: "Thermal throttle — workload degradation",
    minutesToImpact: 21,
  },
  {
    assetId: "rack-c15",
    assetName: "Rack C15",
    impact: "Emergency shutdown risk",
    minutesToImpact: 29,
  },
  {
    assetId: "rack-c16",
    assetName: "Rack C16",
    impact: "Elevated temperature — monitoring",
    minutesToImpact: 38,
  },
  {
    assetId: "rack-c17",
    assetName: "Rack C17",
    impact: "Elevated temperature — monitoring",
    minutesToImpact: 42,
  },
  {
    assetId: "rack-c18",
    assetName: "Rack C18",
    impact: "Elevated temperature — monitoring",
    minutesToImpact: 47,
  },
  {
    assetId: "rack-c19",
    assetName: "Rack C19",
    impact: "Distal — minimal impact expected",
    minutesToImpact: 55,
  },
];

export const CRAC07_INCIDENT_EDGES = SCENE_EDGES.filter(
  (e) => e.sourceAssetId === "crac-07" && e.resource === "cooling"
).map((e) => e.id);

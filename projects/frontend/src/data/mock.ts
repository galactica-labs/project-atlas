export type AssetStatus = "normal" | "warning" | "critical" | "offline";

export interface Asset {
  id: string;
  name: string;
  type: string;
  status: AssetStatus;
  x: number;
  y: number;
  criticality: "high" | "medium" | "low";
  floor: "Mechanical" | "Hall A" | "Hall B";
  zone: string;
  telemetry: { metric: string; value: number; unit: string; trend: "up" | "down" | "stable" }[];
  dependsOn: string[];
}

export interface Technician {
  id: string;
  name: string;
  avatar: string;
  status: "available" | "on-site" | "transit";
  certifications: string[];
  location: string;
  eta?: string;
}

export interface Incident {
  id: string;
  assetId: string;
  severity: "critical" | "high" | "medium";
  detectedAt: string;
  prediction: string;
  confidence: number;
  ttf: number;
  blastRadius: string[];
  recommendedAction: string;
  status: "open" | "dispatched" | "hitl-pending" | "resolved";
}

export interface Job {
  id: string;
  incidentId: string;
  technicianId: string;
  assetId: string;
  status: "assigned" | "en-route" | "on-site" | "closed";
  priority: "critical" | "high" | "medium";
  title: string;
  description: string;
  steps: { id: string; label: string; completed: boolean }[];
  assignedAt: string;
  eta: string;
  partsRequired: string[];
}

// ────────────────────────────────────────────────────────────────
// FLOOR: Mechanical  (B1 – Basement Plant Room)
// ────────────────────────────────────────────────────────────────

// Zone: Electrical — Switchgear & Transformers
// Zone: Backup Power — UPS, Generators, Batteries
// Zone: Chiller Plant — Chillers, Cooling Towers, CHW Pumps

export const assets: Asset[] = [
  // ── Electrical ────────────────────────────────────────────────
  {
    id: "swg-main",
    name: "SWG-MAIN",
    type: "Power",
    status: "normal",
    x: 12,
    y: 50,
    criticality: "high",
    floor: "Mechanical",
    zone: "Electrical",
    dependsOn: [],
    telemetry: [{ metric: "Voltage", value: 480, unit: "V", trend: "stable" }],
  },
  {
    id: "swg-backup",
    name: "SWG-BACKUP",
    type: "Power",
    status: "normal",
    x: 32,
    y: 50,
    criticality: "high",
    floor: "Mechanical",
    zone: "Electrical",
    dependsOn: [],
    telemetry: [{ metric: "Voltage", value: 480, unit: "V", trend: "stable" }],
  },
  {
    id: "xfmr-01",
    name: "XFMR-01",
    type: "Power",
    status: "normal",
    x: 56,
    y: 50,
    criticality: "high",
    floor: "Mechanical",
    zone: "Electrical",
    dependsOn: ["swg-main"],
    telemetry: [
      { metric: "Primary V", value: 13800, unit: "V", trend: "stable" },
      { metric: "Load", value: 64, unit: "%", trend: "stable" },
    ],
  },
  {
    id: "xfmr-02",
    name: "XFMR-02",
    type: "Power",
    status: "normal",
    x: 80,
    y: 50,
    criticality: "high",
    floor: "Mechanical",
    zone: "Electrical",
    dependsOn: ["swg-backup"],
    telemetry: [
      { metric: "Primary V", value: 13800, unit: "V", trend: "stable" },
      { metric: "Load", value: 22, unit: "%", trend: "stable" },
    ],
  },

  // ── Backup Power ──────────────────────────────────────────────
  {
    id: "gen-01",
    name: "GEN-01",
    type: "Power",
    status: "normal",
    x: 10,
    y: 50,
    criticality: "high",
    floor: "Mechanical",
    zone: "Backup Power",
    dependsOn: [],
    telemetry: [
      { metric: "Fuel Level", value: 88, unit: "%", trend: "stable" },
      { metric: "Last Test", value: 3, unit: "d ago", trend: "stable" },
    ],
  },
  {
    id: "gen-02",
    name: "GEN-02",
    type: "Power",
    status: "normal",
    x: 26,
    y: 50,
    criticality: "high",
    floor: "Mechanical",
    zone: "Backup Power",
    dependsOn: [],
    telemetry: [
      { metric: "Fuel Level", value: 91, unit: "%", trend: "stable" },
      { metric: "Last Test", value: 3, unit: "d ago", trend: "stable" },
    ],
  },
  {
    id: "ups-main",
    name: "UPS-MAIN",
    type: "Power",
    status: "normal",
    x: 48,
    y: 50,
    criticality: "high",
    floor: "Mechanical",
    zone: "Backup Power",
    dependsOn: ["swg-main"],
    telemetry: [
      { metric: "Load", value: 71, unit: "%", trend: "stable" },
      { metric: "Battery", value: 100, unit: "%", trend: "stable" },
    ],
  },
  {
    id: "ups-backup",
    name: "UPS-BACKUP",
    type: "Power",
    status: "normal",
    x: 65,
    y: 50,
    criticality: "high",
    floor: "Mechanical",
    zone: "Backup Power",
    dependsOn: ["swg-backup"],
    telemetry: [{ metric: "Load", value: 18, unit: "%", trend: "stable" }],
  },
  {
    id: "batt-01",
    name: "BATT-BANK-01",
    type: "Power",
    status: "normal",
    x: 82,
    y: 50,
    criticality: "high",
    floor: "Mechanical",
    zone: "Backup Power",
    dependsOn: ["ups-main"],
    telemetry: [
      { metric: "Capacity", value: 100, unit: "%", trend: "stable" },
      { metric: "Cell Temp", value: 22.4, unit: "°C", trend: "stable" },
    ],
  },

  // ── Chiller Plant — Cooling Towers ────────────────────────────
  {
    id: "ct-01",
    name: "COOL-TWR-01",
    type: "Cooling",
    status: "normal",
    x: 10,
    y: 25,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: [],
    telemetry: [
      { metric: "Leaving Water", value: 24.1, unit: "°C", trend: "stable" },
      { metric: "Fan Speed", value: 55, unit: "%", trend: "stable" },
    ],
  },
  {
    id: "ct-02",
    name: "COOL-TWR-02",
    type: "Cooling",
    status: "normal",
    x: 28,
    y: 25,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: [],
    telemetry: [
      { metric: "Leaving Water", value: 24.3, unit: "°C", trend: "stable" },
      { metric: "Fan Speed", value: 52, unit: "%", trend: "stable" },
    ],
  },

  // ── Chiller Plant — Chillers ──────────────────────────────────
  {
    id: "chiller-a-01",
    name: "CHILLER-A-01",
    type: "Cooling",
    status: "normal",
    x: 10,
    y: 60,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: ["ct-01"],
    telemetry: [
      { metric: "CHW Supply Temp", value: 6.8, unit: "°C", trend: "stable" },
      { metric: "Flow Rate", value: 148, unit: "GPM", trend: "stable" },
    ],
  },
  {
    id: "chiller-a-02",
    name: "CHILLER-A-02",
    type: "Cooling",
    status: "normal",
    x: 26,
    y: 60,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: ["ct-01"],
    telemetry: [
      { metric: "CHW Supply Temp", value: 7.1, unit: "°C", trend: "stable" },
      { metric: "Flow Rate", value: 152, unit: "GPM", trend: "stable" },
    ],
  },
  {
    id: "chiller-a-03",
    name: "CHILLER-A-03",
    type: "Cooling",
    status: "critical",
    x: 44,
    y: 60,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: ["ct-02"],
    telemetry: [
      { metric: "CHW Supply Temp", value: 11.2, unit: "°C", trend: "up" },
      { metric: "Flow Rate", value: 89, unit: "GPM", trend: "down" },
      { metric: "Compressor Load", value: 97, unit: "%", trend: "up" },
    ],
  },
  {
    id: "chiller-b-01",
    name: "CHILLER-B-01",
    type: "Cooling",
    status: "normal",
    x: 62,
    y: 60,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: ["ct-02"],
    telemetry: [
      { metric: "CHW Supply Temp", value: 7.3, unit: "°C", trend: "stable" },
      { metric: "Flow Rate", value: 138, unit: "GPM", trend: "stable" },
    ],
  },
  {
    id: "chiller-b-02",
    name: "CHILLER-B-02",
    type: "Cooling",
    status: "normal",
    x: 80,
    y: 60,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: ["ct-02"],
    telemetry: [
      { metric: "CHW Supply Temp", value: 7.0, unit: "°C", trend: "stable" },
      { metric: "Flow Rate", value: 144, unit: "GPM", trend: "stable" },
    ],
  },

  // ── Chiller Plant — CHW Pumps ─────────────────────────────────
  {
    id: "pump-chw-01",
    name: "PUMP-CHW-01",
    type: "Cooling",
    status: "normal",
    x: 13,
    y: 88,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: ["chiller-a-01"],
    telemetry: [{ metric: "Flow Rate", value: 144, unit: "GPM", trend: "stable" }],
  },
  {
    id: "pump-chw-02",
    name: "PUMP-CHW-02",
    type: "Cooling",
    status: "normal",
    x: 30,
    y: 88,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: ["chiller-a-02"],
    telemetry: [{ metric: "Flow Rate", value: 149, unit: "GPM", trend: "stable" }],
  },
  {
    id: "pump-chw-03",
    name: "PUMP-CHW-03",
    type: "Cooling",
    status: "warning",
    x: 48,
    y: 88,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: ["chiller-a-03"],
    telemetry: [{ metric: "Flow Rate", value: 61, unit: "GPM", trend: "down" }],
  },
  {
    id: "pump-chw-04",
    name: "PUMP-CHW-04",
    type: "Cooling",
    status: "warning",
    x: 65,
    y: 88,
    criticality: "high",
    floor: "Mechanical",
    zone: "Chiller Plant",
    dependsOn: ["chiller-a-03"],
    telemetry: [{ metric: "Flow Rate", value: 58, unit: "GPM", trend: "down" }],
  },

  // ────────────────────────────────────────────────────────────────
  // FLOOR: Hall A  (F1 – Primary Compute / CPU Cluster)
  // ────────────────────────────────────────────────────────────────

  // Zone: Cooling Bay A — CRAH units
  // Zone: Compute Row A — CPU server racks
  // Zone: Compute Row B — GPU pods + overflow racks
  // Zone: Power & Network A — PDUs & core switches

  // ── Cooling Bay A — CRAH Units ───────────────────────────────
  {
    id: "crah-a-01",
    name: "CRAH-A-01",
    type: "Cooling",
    status: "normal",
    x: 10,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Cooling Bay A",
    dependsOn: ["chiller-a-01"],
    telemetry: [
      { metric: "Supply Air Temp", value: 18.1, unit: "°C", trend: "stable" },
      { metric: "Return Air Temp", value: 26.4, unit: "°C", trend: "stable" },
      { metric: "Fan Speed", value: 68, unit: "%", trend: "stable" },
    ],
  },
  {
    id: "crah-a-02",
    name: "CRAH-A-02",
    type: "Cooling",
    status: "normal",
    x: 26,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Cooling Bay A",
    dependsOn: ["chiller-a-01"],
    telemetry: [
      { metric: "Supply Air Temp", value: 18.3, unit: "°C", trend: "stable" },
      { metric: "Return Air Temp", value: 26.7, unit: "°C", trend: "stable" },
    ],
  },
  {
    id: "crah-a-03",
    name: "CRAH-A-03",
    type: "Cooling",
    status: "normal",
    x: 42,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Cooling Bay A",
    dependsOn: ["chiller-a-02"],
    telemetry: [
      { metric: "Supply Air Temp", value: 18.0, unit: "°C", trend: "stable" },
      { metric: "Return Air Temp", value: 26.2, unit: "°C", trend: "stable" },
    ],
  },
  {
    id: "crah-a-04",
    name: "CRAH-A-04",
    type: "Cooling",
    status: "normal",
    x: 58,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Cooling Bay A",
    dependsOn: ["chiller-a-02"],
    telemetry: [{ metric: "Supply Air Temp", value: 17.9, unit: "°C", trend: "stable" }],
  },
  {
    id: "crah-a-05",
    name: "CRAH-A-05",
    type: "Cooling",
    status: "normal",
    x: 74,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Cooling Bay A",
    dependsOn: ["chiller-b-01"],
    telemetry: [
      { metric: "Supply Air Temp", value: 18.2, unit: "°C", trend: "stable" },
      { metric: "Fan Speed", value: 62, unit: "%", trend: "stable" },
    ],
  },

  // ── Compute Row A — CPU Server Racks ─────────────────────────
  {
    id: "rack-a01",
    name: "RACK-A01",
    type: "Compute",
    status: "normal",
    x: 8,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Compute Row A",
    dependsOn: ["crah-a-01", "pdu-a"],
    telemetry: [
      { metric: "Inlet Temp", value: 21.2, unit: "°C", trend: "stable" },
      { metric: "Power Draw", value: 6.8, unit: "kW", trend: "stable" },
    ],
  },
  {
    id: "rack-a02",
    name: "RACK-A02",
    type: "Compute",
    status: "normal",
    x: 19,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Compute Row A",
    dependsOn: ["crah-a-01", "pdu-a"],
    telemetry: [{ metric: "Inlet Temp", value: 21.5, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-a03",
    name: "RACK-A03",
    type: "Compute",
    status: "normal",
    x: 30,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Compute Row A",
    dependsOn: ["crah-a-02", "pdu-a"],
    telemetry: [{ metric: "Inlet Temp", value: 21.9, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-a04",
    name: "RACK-A04",
    type: "Compute",
    status: "normal",
    x: 41,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Compute Row A",
    dependsOn: ["crah-a-02", "pdu-a"],
    telemetry: [{ metric: "Inlet Temp", value: 22.1, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-a05",
    name: "RACK-A05",
    type: "Compute",
    status: "normal",
    x: 52,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Compute Row A",
    dependsOn: ["crah-a-03", "pdu-b"],
    telemetry: [{ metric: "Inlet Temp", value: 21.4, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-a06",
    name: "RACK-A06",
    type: "Compute",
    status: "normal",
    x: 63,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Compute Row A",
    dependsOn: ["crah-a-03", "pdu-b"],
    telemetry: [{ metric: "Inlet Temp", value: 21.8, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-a07",
    name: "RACK-A07",
    type: "Compute",
    status: "normal",
    x: 74,
    y: 50,
    criticality: "medium",
    floor: "Hall A",
    zone: "Compute Row A",
    dependsOn: ["crah-a-04", "pdu-b"],
    telemetry: [{ metric: "Inlet Temp", value: 20.9, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-a08",
    name: "RACK-A08",
    type: "Compute",
    status: "normal",
    x: 85,
    y: 50,
    criticality: "medium",
    floor: "Hall A",
    zone: "Compute Row A",
    dependsOn: ["crah-a-04", "pdu-b"],
    telemetry: [{ metric: "Inlet Temp", value: 20.7, unit: "°C", trend: "stable" }],
  },

  // ── Compute Row B — GPU Pods & Racks ─────────────────────────
  {
    id: "pod-01",
    name: "POD-01",
    type: "Compute",
    status: "normal",
    x: 8,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Compute Row B",
    dependsOn: ["crah-a-01", "pdu-a"],
    telemetry: [
      { metric: "GPU Inlet Temp", value: 24.1, unit: "°C", trend: "stable" },
      { metric: "Power Draw", value: 142, unit: "kW", trend: "stable" },
    ],
  },
  {
    id: "pod-02",
    name: "POD-02",
    type: "Compute",
    status: "normal",
    x: 24,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Compute Row B",
    dependsOn: ["crah-a-02", "pdu-a"],
    telemetry: [{ metric: "GPU Inlet Temp", value: 23.8, unit: "°C", trend: "stable" }],
  },
  {
    id: "pod-03",
    name: "POD-03",
    type: "Compute",
    status: "normal",
    x: 40,
    y: 50,
    criticality: "medium",
    floor: "Hall A",
    zone: "Compute Row B",
    dependsOn: ["crah-a-03", "pdu-b"],
    telemetry: [{ metric: "GPU Inlet Temp", value: 24.3, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-b01",
    name: "RACK-B01",
    type: "Compute",
    status: "normal",
    x: 58,
    y: 50,
    criticality: "medium",
    floor: "Hall A",
    zone: "Compute Row B",
    dependsOn: ["crah-a-04", "pdu-b"],
    telemetry: [{ metric: "Inlet Temp", value: 21.1, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-b02",
    name: "RACK-B02",
    type: "Compute",
    status: "normal",
    x: 72,
    y: 50,
    criticality: "medium",
    floor: "Hall A",
    zone: "Compute Row B",
    dependsOn: ["crah-a-05", "pdu-b"],
    telemetry: [{ metric: "Inlet Temp", value: 21.4, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-b03",
    name: "RACK-B03",
    type: "Compute",
    status: "normal",
    x: 86,
    y: 50,
    criticality: "medium",
    floor: "Hall A",
    zone: "Compute Row B",
    dependsOn: ["crah-a-05", "pdu-b"],
    telemetry: [{ metric: "Inlet Temp", value: 21.7, unit: "°C", trend: "stable" }],
  },

  // ── Power & Network A — PDUs & Core Switches ──────────────────
  {
    id: "pdu-a",
    name: "PDU-A",
    type: "Power",
    status: "normal",
    x: 12,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Power & Network A",
    dependsOn: ["ups-main"],
    telemetry: [{ metric: "Current", value: 38, unit: "A", trend: "stable" }],
  },
  {
    id: "pdu-b",
    name: "PDU-B",
    type: "Power",
    status: "normal",
    x: 30,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Power & Network A",
    dependsOn: ["ups-main"],
    telemetry: [{ metric: "Current", value: 41, unit: "A", trend: "stable" }],
  },
  {
    id: "core-sw-01",
    name: "CORE-SW-01",
    type: "Network",
    status: "normal",
    x: 60,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Power & Network A",
    dependsOn: ["ups-main"],
    telemetry: [
      { metric: "Throughput", value: 84, unit: "Gbps", trend: "stable" },
      { metric: "CPU", value: 12, unit: "%", trend: "stable" },
    ],
  },
  {
    id: "core-sw-02",
    name: "CORE-SW-02",
    type: "Network",
    status: "normal",
    x: 78,
    y: 50,
    criticality: "high",
    floor: "Hall A",
    zone: "Power & Network A",
    dependsOn: ["ups-main"],
    telemetry: [
      { metric: "Throughput", value: 71, unit: "Gbps", trend: "stable" },
      { metric: "CPU", value: 9, unit: "%", trend: "stable" },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // FLOOR: Hall B  (F2 – HPC / GPU Cluster)
  // ────────────────────────────────────────────────────────────────

  // Zone: Cooling Bay B — CRAH units (blast-radius affected)
  // Zone: Compute Row C — GPU pods (blast-radius affected)
  // Zone: Compute Row D — Rack compute
  // Zone: Power & Network B — PDUs & distribution switches

  // ── Cooling Bay B — CRAH Units (warning: blast radius) ────────
  {
    id: "crah-b-01",
    name: "CRAH-B-01",
    type: "Cooling",
    status: "warning",
    x: 12,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Cooling Bay B",
    dependsOn: ["chiller-a-03", "pump-chw-03"],
    telemetry: [
      { metric: "Supply Air Temp", value: 21.4, unit: "°C", trend: "up" },
      { metric: "Return Air Temp", value: 29.8, unit: "°C", trend: "up" },
      { metric: "Fan Speed", value: 88, unit: "%", trend: "up" },
    ],
  },
  {
    id: "crah-b-02",
    name: "CRAH-B-02",
    type: "Cooling",
    status: "warning",
    x: 30,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Cooling Bay B",
    dependsOn: ["chiller-a-03", "pump-chw-03"],
    telemetry: [{ metric: "Supply Air Temp", value: 22.1, unit: "°C", trend: "up" }],
  },
  {
    id: "crah-b-03",
    name: "CRAH-B-03",
    type: "Cooling",
    status: "warning",
    x: 48,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Cooling Bay B",
    dependsOn: ["chiller-a-03", "pump-chw-04"],
    telemetry: [{ metric: "Supply Air Temp", value: 21.9, unit: "°C", trend: "up" }],
  },
  {
    id: "crah-b-04",
    name: "CRAH-B-04",
    type: "Cooling",
    status: "warning",
    x: 66,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Cooling Bay B",
    dependsOn: ["chiller-a-03", "pump-chw-04"],
    telemetry: [{ metric: "Supply Air Temp", value: 21.7, unit: "°C", trend: "up" }],
  },

  // ── Compute Row C — GPU Pods (warning: blast radius) ──────────
  {
    id: "pod-04",
    name: "POD-04",
    type: "Compute",
    status: "normal",
    x: 12,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Compute Row C",
    dependsOn: ["crah-b-01", "pdu-c"],
    telemetry: [{ metric: "GPU Inlet Temp", value: 25.2, unit: "°C", trend: "stable" }],
  },
  {
    id: "pod-05",
    name: "POD-05",
    type: "Compute",
    status: "warning",
    x: 32,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Compute Row C",
    dependsOn: ["crah-b-02", "pdu-c"],
    telemetry: [
      { metric: "GPU Inlet Temp", value: 28.6, unit: "°C", trend: "up" },
      { metric: "Power Draw", value: 187, unit: "kW", trend: "up" },
    ],
  },
  {
    id: "pod-06",
    name: "POD-06",
    type: "Compute",
    status: "warning",
    x: 52,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Compute Row C",
    dependsOn: ["crah-b-03", "pdu-d"],
    telemetry: [{ metric: "GPU Inlet Temp", value: 27.9, unit: "°C", trend: "up" }],
  },

  // ── Compute Row D — Rack Compute ──────────────────────────────
  {
    id: "rack-c01",
    name: "RACK-C01",
    type: "Compute",
    status: "normal",
    x: 8,
    y: 50,
    criticality: "medium",
    floor: "Hall B",
    zone: "Compute Row D",
    dependsOn: ["crah-b-04", "pdu-c"],
    telemetry: [{ metric: "Inlet Temp", value: 22.3, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-c02",
    name: "RACK-C02",
    type: "Compute",
    status: "normal",
    x: 22,
    y: 50,
    criticality: "medium",
    floor: "Hall B",
    zone: "Compute Row D",
    dependsOn: ["crah-b-04", "pdu-c"],
    telemetry: [{ metric: "Inlet Temp", value: 22.7, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-c03",
    name: "RACK-C03",
    type: "Compute",
    status: "normal",
    x: 36,
    y: 50,
    criticality: "medium",
    floor: "Hall B",
    zone: "Compute Row D",
    dependsOn: ["crah-b-04", "pdu-d"],
    telemetry: [{ metric: "Inlet Temp", value: 22.5, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-c04",
    name: "RACK-C04",
    type: "Compute",
    status: "normal",
    x: 50,
    y: 50,
    criticality: "medium",
    floor: "Hall B",
    zone: "Compute Row D",
    dependsOn: ["crah-b-04", "pdu-d"],
    telemetry: [{ metric: "Inlet Temp", value: 22.1, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-c05",
    name: "RACK-C05",
    type: "Compute",
    status: "normal",
    x: 64,
    y: 50,
    criticality: "medium",
    floor: "Hall B",
    zone: "Compute Row D",
    dependsOn: ["crah-b-03", "pdu-d"],
    telemetry: [{ metric: "Inlet Temp", value: 21.8, unit: "°C", trend: "stable" }],
  },
  {
    id: "rack-c06",
    name: "RACK-C06",
    type: "Compute",
    status: "normal",
    x: 78,
    y: 50,
    criticality: "medium",
    floor: "Hall B",
    zone: "Compute Row D",
    dependsOn: ["crah-b-03", "pdu-d"],
    telemetry: [{ metric: "Inlet Temp", value: 21.6, unit: "°C", trend: "stable" }],
  },

  // ── Power & Network B — PDUs & Distribution Switches ─────────
  {
    id: "pdu-c",
    name: "PDU-C",
    type: "Power",
    status: "normal",
    x: 12,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Power & Network B",
    dependsOn: ["ups-backup"],
    telemetry: [{ metric: "Current", value: 44, unit: "A", trend: "stable" }],
  },
  {
    id: "pdu-d",
    name: "PDU-D",
    type: "Power",
    status: "normal",
    x: 30,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Power & Network B",
    dependsOn: ["ups-backup"],
    telemetry: [{ metric: "Current", value: 39, unit: "A", trend: "stable" }],
  },
  {
    id: "dist-sw-01",
    name: "DIST-SW-01",
    type: "Network",
    status: "normal",
    x: 60,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Power & Network B",
    dependsOn: ["core-sw-01"],
    telemetry: [
      { metric: "Throughput", value: 48, unit: "Gbps", trend: "stable" },
      { metric: "CPU", value: 8, unit: "%", trend: "stable" },
    ],
  },
  {
    id: "dist-sw-02",
    name: "DIST-SW-02",
    type: "Network",
    status: "normal",
    x: 78,
    y: 50,
    criticality: "high",
    floor: "Hall B",
    zone: "Power & Network B",
    dependsOn: ["core-sw-02"],
    telemetry: [
      { metric: "Throughput", value: 41, unit: "Gbps", trend: "stable" },
      { metric: "CPU", value: 7, unit: "%", trend: "stable" },
    ],
  },
];

export const technicians: Technician[] = [
  {
    id: "t1",
    name: "Marcus Chen",
    avatar: "MC",
    status: "available",
    certifications: ["HVAC-R", "NFPA-70E", "EPA-608", "Chiller-Certified"],
    location: "On-site Depot",
    eta: "8 min",
  },
  {
    id: "t2",
    name: "Sarah Okafor",
    avatar: "SO",
    status: "transit",
    certifications: ["HVAC-R", "CRAC-Certified", "BMS"],
    location: "4.2 km away",
    eta: "14 min",
  },
  {
    id: "t3",
    name: "Javier Ruiz",
    avatar: "JR",
    status: "on-site",
    certifications: ["NFPA-70E", "UPS-Certified"],
    location: "Hall B",
    eta: undefined,
  },
];

export const incidents: Incident[] = [
  {
    id: "inc-001",
    assetId: "chiller-a-03",
    severity: "critical",
    detectedAt: "14:32:18",
    prediction:
      "Chilled water supply temperature at 11.2°C (+4.1σ above 30-day baseline). Compressor load 97%. Flow rate dropped 39% in 14 min — pattern matches refrigerant loss in 94 prior cases. q50 forecast crosses 12°C threshold in 18 min.",
    confidence: 0.94,
    ttf: 23,
    blastRadius: [
      "pump-chw-03",
      "pump-chw-04",
      "crah-b-01",
      "crah-b-02",
      "crah-b-03",
      "crah-b-04",
      "pod-05",
      "pod-06",
    ],
    recommendedAction:
      "Dispatch HVAC-certified technician to inspect CHILLER-A-03 refrigerant circuit and compressor. Activate CHILLER-A-01/02 to absorb Zone B cooling load. PUMP-CHW-03/04 bypass valves to engage standby loop.",
    status: "hitl-pending",
  },
];

export const jobs: Job[] = [
  {
    id: "job-001",
    incidentId: "inc-001",
    technicianId: "t1",
    assetId: "chiller-a-03",
    status: "on-site",
    priority: "critical",
    title: "CHILLER-A-03 — Refrigerant Circuit Inspection",
    description:
      "Anomaly detected by Sentinel agent. Triton quantile forecast predicts thermal threshold breach in 18 min (q50). Hephaestus dispatched via RAG→MILP. Inspect refrigerant circuit, CHW pump isolation, compressor motor health.",
    steps: [
      { id: "s1", label: "Confirm site arrival — scan CHILLER-A-03 asset tag", completed: true },
      { id: "s2", label: "Verify LOTO applied — electrical and CHW isolation", completed: true },
      {
        id: "s3",
        label: "Check refrigerant pressure — high-side and low-side gauges",
        completed: false,
      },
      { id: "s4", label: "Inspect compressor motor amperage draw", completed: false },
      { id: "s5", label: "Verify PUMP-CHW-03/04 bypass valve engagement", completed: false },
      {
        id: "s6",
        label: "Confirm CHILLER-A-01/02 have absorbed Hall B cooling load",
        completed: false,
      },
      { id: "s7", label: "Log findings — root cause + parts used", completed: false },
    ],
    assignedAt: "14:34:00",
    eta: "14:42:00",
    partsRequired: [
      "Refrigerant R-410A (3 lbs)",
      "TXV Expansion Valve (Carrier 38HDC)",
      "Compressor contactor 3P-40A",
    ],
  },
];

// Cascade delay in minutes from CHILLER-A-03 failure
export const cascadeDelays: Record<string, number> = {
  "pump-chw-03": 4,
  "pump-chw-04": 6,
  "crah-b-01": 11,
  "crah-b-02": 12,
  "crah-b-03": 13,
  "crah-b-04": 14,
  "pod-05": 18,
  "pod-06": 22,
};

// Historical telemetry for CHILLER-A-03 chilled water supply temp
export const telemetryHistory = Array.from({ length: 48 }, (_, i) => {
  const anomalyStart = 36;
  const base = 7.0 + Math.sin(i * 0.25) * 0.4;
  const anomaly = i > anomalyStart ? (i - anomalyStart) * 0.37 : 0;
  return {
    time: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
    chwTemp: parseFloat((base + anomaly).toFixed(2)),
    baseline: 7.2,
    q05: null as number | null,
    q50: null as number | null,
    q95: null as number | null,
  };
});

// Quantile forecast from LightGBM forecaster
export const forecastData = [
  { time: "now", actual: 11.2, q05: 11.2, q50: 11.2, q95: 11.2, threshold: 12.0 },
  { time: "+5m", actual: null, q05: 11.1, q50: 11.7, q95: 12.3, threshold: 12.0 },
  { time: "+10m", actual: null, q05: 11.3, q50: 12.0, q95: 12.9, threshold: 12.0 },
  { time: "+11m", actual: null, q05: 11.4, q50: 12.1, q95: 13.1, threshold: 12.0 },
  { time: "+15m", actual: null, q05: 11.6, q50: 12.6, q95: 14.0, threshold: 12.0 },
  { time: "+18m", actual: null, q05: 11.9, q50: 13.2, q95: 14.8, threshold: 12.0 },
  { time: "+20m", actual: null, q05: 12.1, q50: 13.7, q95: 15.6, threshold: 12.0 },
  { time: "+25m", actual: null, q05: 12.4, q50: 14.4, q95: 16.7, threshold: 12.0 },
  { time: "+30m", actual: null, q05: 12.9, q50: 15.3, q95: 17.9, threshold: 12.0 },
];

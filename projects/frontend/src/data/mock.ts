export type AssetStatus = "normal" | "warning" | "critical" | "offline";

export interface Asset {
  id: string;
  name: string;
  type: string;
  status: AssetStatus;
  x: number;
  y: number;
  criticality: "high" | "medium" | "low";
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

// Real asset layout: Zone A (CRAH-A + POD-01..03), Zone B (CRAH-B + POD-04..06), Mechanical (Chillers, Pumps, UPS, PDU)
export const assets: Asset[] = [
  // Zone A — CRAH cooling units
  {
    id: "crah-a-01",
    name: "CRAH-A-01",
    type: "Cooling",
    status: "normal",
    x: 13,
    y: 11,
    criticality: "high",
    zone: "Zone A",
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
    y: 11,
    criticality: "high",
    zone: "Zone A",
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
    x: 13,
    y: 26,
    criticality: "high",
    zone: "Zone A",
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
    x: 26,
    y: 26,
    criticality: "high",
    zone: "Zone A",
    dependsOn: ["chiller-a-02"],
    telemetry: [{ metric: "Supply Air Temp", value: 17.9, unit: "°C", trend: "stable" }],
  },
  // Zone A — GPU/compute pods
  {
    id: "pod-01",
    name: "POD-01",
    type: "Compute",
    status: "normal",
    x: 52,
    y: 10,
    criticality: "high",
    zone: "Zone A",
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
    x: 67,
    y: 10,
    criticality: "high",
    zone: "Zone A",
    dependsOn: ["crah-a-02", "pdu-a"],
    telemetry: [{ metric: "GPU Inlet Temp", value: 23.8, unit: "°C", trend: "stable" }],
  },
  {
    id: "pod-03",
    name: "POD-03",
    type: "Compute",
    status: "normal",
    x: 82,
    y: 10,
    criticality: "medium",
    zone: "Zone A",
    dependsOn: ["crah-a-03", "pdu-b"],
    telemetry: [{ metric: "GPU Inlet Temp", value: 24.3, unit: "°C", trend: "stable" }],
  },

  // Zone B — CRAH cooling units (blast radius targets)
  {
    id: "crah-b-01",
    name: "CRAH-B-01",
    type: "Cooling",
    status: "warning",
    x: 13,
    y: 42,
    criticality: "high",
    zone: "Zone B",
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
    x: 26,
    y: 42,
    criticality: "high",
    zone: "Zone B",
    dependsOn: ["chiller-a-03", "pump-chw-03"],
    telemetry: [{ metric: "Supply Air Temp", value: 22.1, unit: "°C", trend: "up" }],
  },
  {
    id: "crah-b-03",
    name: "CRAH-B-03",
    type: "Cooling",
    status: "warning",
    x: 13,
    y: 57,
    criticality: "high",
    zone: "Zone B",
    dependsOn: ["chiller-a-03", "pump-chw-04"],
    telemetry: [{ metric: "Supply Air Temp", value: 21.9, unit: "°C", trend: "up" }],
  },
  {
    id: "crah-b-04",
    name: "CRAH-B-04",
    type: "Cooling",
    status: "warning",
    x: 26,
    y: 57,
    criticality: "high",
    zone: "Zone B",
    dependsOn: ["chiller-a-03", "pump-chw-04"],
    telemetry: [{ metric: "Supply Air Temp", value: 21.7, unit: "°C", trend: "up" }],
  },
  // Zone B — GPU/compute pods
  {
    id: "pod-04",
    name: "POD-04",
    type: "Compute",
    status: "normal",
    x: 52,
    y: 42,
    criticality: "high",
    zone: "Zone B",
    dependsOn: ["crah-b-01", "pdu-c"],
    telemetry: [{ metric: "GPU Inlet Temp", value: 25.2, unit: "°C", trend: "stable" }],
  },
  {
    id: "pod-05",
    name: "POD-05",
    type: "Compute",
    status: "warning",
    x: 67,
    y: 42,
    criticality: "high",
    zone: "Zone B",
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
    x: 82,
    y: 42,
    criticality: "high",
    zone: "Zone B",
    dependsOn: ["crah-b-03", "pdu-d"],
    telemetry: [{ metric: "GPU Inlet Temp", value: 27.9, unit: "°C", trend: "up" }],
  },

  // Mechanical — Chillers
  {
    id: "chiller-a-01",
    name: "CHILLER-A-01",
    type: "Cooling",
    status: "normal",
    x: 10,
    y: 75,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: [],
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
    x: 23,
    y: 75,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: [],
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
    x: 37,
    y: 75,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: [],
    telemetry: [
      { metric: "CHW Supply Temp", value: 11.2, unit: "°C", trend: "up" },
      { metric: "Flow Rate", value: 89, unit: "GPM", trend: "down" },
      { metric: "Compressor Load", value: 97, unit: "%", trend: "up" },
    ],
  },

  // Mechanical — CHW Pumps
  {
    id: "pump-chw-01",
    name: "PUMP-CHW-01",
    type: "Cooling",
    status: "normal",
    x: 10,
    y: 88,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: ["chiller-a-01"],
    telemetry: [{ metric: "Flow Rate", value: 144, unit: "GPM", trend: "stable" }],
  },
  {
    id: "pump-chw-02",
    name: "PUMP-CHW-02",
    type: "Cooling",
    status: "normal",
    x: 23,
    y: 88,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: ["chiller-a-02"],
    telemetry: [{ metric: "Flow Rate", value: 149, unit: "GPM", trend: "stable" }],
  },
  {
    id: "pump-chw-03",
    name: "PUMP-CHW-03",
    type: "Cooling",
    status: "warning",
    x: 50,
    y: 75,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: ["chiller-a-03"],
    telemetry: [{ metric: "Flow Rate", value: 61, unit: "GPM", trend: "down" }],
  },
  {
    id: "pump-chw-04",
    name: "PUMP-CHW-04",
    type: "Cooling",
    status: "warning",
    x: 62,
    y: 75,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: ["chiller-a-03"],
    telemetry: [{ metric: "Flow Rate", value: 58, unit: "GPM", trend: "down" }],
  },

  // Mechanical — UPS + PDUs
  {
    id: "ups-main",
    name: "UPS-MAIN",
    type: "Power",
    status: "normal",
    x: 75,
    y: 75,
    criticality: "high",
    zone: "Mechanical",
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
    x: 87,
    y: 75,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: ["swg-backup"],
    telemetry: [{ metric: "Load", value: 18, unit: "%", trend: "stable" }],
  },
  {
    id: "pdu-a",
    name: "PDU-A",
    type: "Power",
    status: "normal",
    x: 75,
    y: 88,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: ["ups-main"],
    telemetry: [{ metric: "Current", value: 38, unit: "A", trend: "stable" }],
  },
  {
    id: "pdu-b",
    name: "PDU-B",
    type: "Power",
    status: "normal",
    x: 87,
    y: 88,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: ["ups-main"],
    telemetry: [{ metric: "Current", value: 41, unit: "A", trend: "stable" }],
  },
  {
    id: "swg-main",
    name: "SWG-MAIN",
    type: "Power",
    status: "normal",
    x: 50,
    y: 88,
    criticality: "high",
    zone: "Mechanical",
    dependsOn: [],
    telemetry: [{ metric: "Voltage", value: 480, unit: "V", trend: "stable" }],
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
    location: "Zone B",
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
        label: "Confirm CHILLER-A-01/02 have absorbed Zone B cooling load",
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
// Normal baseline: ~7°C; anomaly starts at index 36 (t=-12 from now); current: 11.2°C
export const telemetryHistory = Array.from({ length: 48 }, (_, i) => {
  const anomalyStart = 36;
  const base = 7.0 + Math.sin(i * 0.25) * 0.4;
  const anomaly = i > anomalyStart ? (i - anomalyStart) * 0.37 : 0;
  return {
    time: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
    chwTemp: parseFloat((base + anomaly).toFixed(2)),
    baseline: 7.2,
    // Quantile forecast fields (null for historical, populated in forecastData)
    q05: null as number | null,
    q50: null as number | null,
    q95: null as number | null,
  };
});

// Quantile forecast from LightGBM forecaster (projected forward from 'now')
// q50 crosses 12°C threshold at +18min; q95 crosses at +11min
export const forecastData = [
  { time: "now", actual: 11.2, q05: 11.2, q50: 11.2, q95: 11.2, threshold: 12.0 },
  { time: "+5m", actual: null, q05: 11.1, q50: 11.7, q95: 12.3, threshold: 12.0 },
  { time: "+10m", actual: null, q05: 11.3, q50: 12.0, q95: 12.9, threshold: 12.0 },
  { time: "+11m", actual: null, q05: 11.4, q50: 12.1, q95: 13.1, threshold: 12.0 }, // q95 crosses
  { time: "+15m", actual: null, q05: 11.6, q50: 12.6, q95: 14.0, threshold: 12.0 },
  { time: "+18m", actual: null, q05: 11.9, q50: 13.2, q95: 14.8, threshold: 12.0 }, // q50 crosses
  { time: "+20m", actual: null, q05: 12.1, q50: 13.7, q95: 15.6, threshold: 12.0 },
  { time: "+25m", actual: null, q05: 12.4, q50: 14.4, q95: 16.7, threshold: 12.0 },
  { time: "+30m", actual: null, q05: 12.9, q50: 15.3, q95: 17.9, threshold: 12.0 },
];

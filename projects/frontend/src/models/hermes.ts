import type { Asset, Incident, Job, Technician } from "../data/mock";

const REQUIRED_CERTS: Array<{ test: (a: Asset) => boolean; certs: string[] }> = [
  { test: (a) => a.zone === "Chiller Plant", certs: ["HVAC-R", "EPA-608", "Chiller-Certified"] },
  { test: (a) => a.zone.includes("Cooling Bay"), certs: ["HVAC-R", "CRAC-Certified"] },
  {
    test: (a) => a.type === "Power" && a.zone.includes("Backup"),
    certs: ["NFPA-70E", "UPS-Certified"],
  },
  { test: (a) => a.type === "Power", certs: ["NFPA-70E"] },
];

export function getRequiredCerts(asset: Asset): string[] {
  for (const rule of REQUIRED_CERTS) {
    if (rule.test(asset)) return rule.certs;
  }
  return [];
}

export function scoreMatch(tech: Technician, required: string[]): number {
  if (required.length === 0) return 0.5;
  const matched = required.filter((c) => tech.certifications.includes(c)).length;
  const certScore = matched / required.length;
  const statusBonus = tech.status === "available" ? 0.2 : tech.status === "on-site" ? 0.1 : 0.05;
  return Math.min(0.99, certScore * 0.8 + statusBonus);
}

function generateSteps(asset: Asset): Job["steps"] {
  if (asset.zone === "Chiller Plant") {
    return [
      { id: "s1", label: `Confirm site arrival — scan ${asset.name} asset tag`, completed: true },
      { id: "s2", label: "Verify LOTO applied — electrical and CHW isolation", completed: true },
      {
        id: "s3",
        label: "Check refrigerant pressure — high-side and low-side gauges",
        completed: false,
      },
      { id: "s4", label: "Inspect compressor motor amperage draw", completed: false },
      { id: "s5", label: "Verify CHW pump bypass valve engagement", completed: false },
      { id: "s6", label: "Confirm standby chillers have absorbed cooling load", completed: false },
      { id: "s7", label: "Log findings — root cause + parts used", completed: false },
    ];
  }
  if (asset.zone.includes("Cooling Bay")) {
    return [
      { id: "s1", label: `Confirm site arrival — scan ${asset.name} asset tag`, completed: false },
      { id: "s2", label: "Verify cooling supply temperature and fan speeds", completed: false },
      { id: "s3", label: "Inspect CHW valve position and flow", completed: false },
      { id: "s4", label: "Log findings", completed: false },
    ];
  }
  return [
    { id: "s1", label: `Confirm site arrival — scan ${asset.name} asset tag`, completed: false },
    { id: "s2", label: "Inspect equipment for faults", completed: false },
    { id: "s3", label: "Log findings", completed: false },
  ];
}

function generateParts(asset: Asset): string[] {
  if (asset.zone === "Chiller Plant") {
    return [
      "Refrigerant R-410A (3 lbs)",
      "TXV Expansion Valve (Carrier 38HDC)",
      "Compressor contactor 3P-40A",
    ];
  }
  if (asset.zone.includes("Backup Power")) {
    return ["Battery module 48V (2× required)", "Bypass switch assembly"];
  }
  return [];
}

function generateRecommendedAction(
  asset: Asset,
  blastRadius: string[],
  tech: Technician,
  allAssets: Asset[]
): string {
  const certs = getRequiredCerts(asset);
  const certStr = certs.slice(0, 2).join(", ");
  const blastNames = blastRadius
    .slice(0, 4)
    .map((id) => allAssets.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  if (asset.zone === "Chiller Plant") {
    const standbys = allAssets
      .filter((a) => a.zone === "Chiller Plant" && a.id !== asset.id && a.status === "normal")
      .map((a) => a.name)
      .slice(0, 2)
      .join("/");
    return (
      `Dispatch ${certStr}-certified technician to inspect ${asset.name} refrigerant circuit and compressor. ` +
      `Activate ${standbys || "standby units"} to absorb Zone B cooling load. ` +
      `${blastNames ? `${blastNames} bypass valves to engage standby loop.` : ""}`
    );
  }
  return (
    `Dispatch ${certStr || "qualified"} technician to service ${asset.name}. ` +
    `Monitor dependent systems: ${blastNames || "downstream assets"}.`
  );
}

export interface HermesOutput {
  job: Job;
  recommendedAction: string;
  matchScore: number;
  technician: Technician;
}

let _jobCounter = 1;

export function runHermes(
  incident: Omit<Incident, "recommendedAction"> & { blastRadius: string[] },
  asset: Asset,
  technicians: Technician[],
  allAssets: Asset[]
): HermesOutput {
  _jobCounter = 1;
  const required = getRequiredCerts(asset);
  const scored = technicians
    .map((t) => ({ tech: t, score: scoreMatch(t, required) }))
    .sort((a, b) => b.score - a.score);

  const { tech, score } = scored[0];
  const matchScore = Math.round(score * 100);

  const etaMinutes = parseInt(tech.eta?.replace(/\D/g, "") ?? "10", 10);
  const [h, m] = incident.detectedAt.split(":").map(Number);
  const etaTotal = h * 60 + m + etaMinutes;
  const etaStr = `${String(Math.floor(etaTotal / 60) % 24).padStart(2, "0")}:${String(etaTotal % 60).padStart(2, "0")}:00`;

  const job: Job = {
    id: `job-${String(_jobCounter++).padStart(3, "0")}`,
    incidentId: incident.id,
    technicianId: tech.id,
    assetId: asset.id,
    status: "on-site",
    priority: incident.severity === "critical" ? "critical" : "high",
    title: `${asset.name} — ${asset.zone === "Chiller Plant" ? "Refrigerant Circuit Inspection" : "System Inspection"}`,
    description: `Anomaly detected by Sentinel agent. Triton quantile forecast predicts thermal threshold breach in ${incident.ttf} min (q50). ${tech.name} dispatched via Hermes RAG→MILP. Inspect ${asset.zone === "Chiller Plant" ? "refrigerant circuit, CHW pump isolation, compressor motor health" : "system per asset profile"}.`,
    steps: generateSteps(asset),
    assignedAt: incident.detectedAt,
    eta: etaStr,
    partsRequired: generateParts(asset),
  };

  return {
    job,
    recommendedAction: generateRecommendedAction(asset, incident.blastRadius, tech, allAssets),
    matchScore,
    technician: tech,
  };
}

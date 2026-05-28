import type { Asset, Incident, Job, Technician } from "../data/mock";
import { runHephaestus } from "./hephaestus";
import { runHermes } from "./hermes";
import { runSentinel } from "./sentinel";
import { type ForecastPoint, runTriton } from "./triton";

export type { ForecastPoint };

export interface PipelineResult {
  incidents: Incident[];
  jobs: Job[];
  cascadeDelays: Record<string, number>;
  forecastData: ForecastPoint[];
  pipelineOutputs: Record<string, string>;
  tritonMeta: { q50BreachMin: number; q95BreachMin: number };
}

export function runPipeline(assets: Asset[], technicians: Technician[]): PipelineResult {
  const sentinelResults = runSentinel(assets);

  const incidents: Incident[] = [];
  const jobs: Job[] = [];
  let cascadeDelays: Record<string, number> = {};
  let forecastData: ForecastPoint[] = [];
  let tritonMeta = { q50BreachMin: 18, q95BreachMin: 11 };
  const pipelineOutputs: Record<string, string> = {};

  for (const { incident: stub, meta } of sentinelResults) {
    const asset = assets.find((a) => a.id === stub.assetId)!;

    // Hephaestus: compute blast radius + cascade delays from dependency graph
    const heph = runHephaestus(stub.assetId, assets);

    // Triton: compute quantile forecast from live telemetry
    const compressor = asset.telemetry.find((t) => t.metric === "Compressor Load");
    const triton = runTriton(meta.primaryValue, meta.primaryThreshold, compressor?.value ?? 70);

    // Assemble incident with blast radius (required by Hermes for recommendedAction)
    const incWithBlast: Omit<Incident, "recommendedAction"> & { blastRadius: string[] } = {
      ...stub,
      blastRadius: heph.blastRadius,
    };

    // Hermes: match best technician, generate job + recommendedAction
    const hermes = runHermes(incWithBlast, asset, technicians, assets);

    incidents.push({ ...incWithBlast, recommendedAction: hermes.recommendedAction });
    jobs.push(hermes.job);

    // Use first incident's computed forecast as the primary display data
    if (incidents.length === 1) {
      cascadeDelays = heph.cascadeDelays;
      forecastData = triton.forecastData;
      tritonMeta = {
        q50BreachMin: triton.q50BreachMin ?? stub.ttf,
        q95BreachMin: triton.q95BreachMin ?? Math.round(stub.ttf * 0.6),
      };
    }

    const incId = stub.id;
    const topImpact = heph.blastRadius
      .slice(0, 4)
      .map((id) => assets.find((a) => a.id === id)?.name ?? id)
      .join(" → ");

    const matchedCerts = hermes.technician.certifications.slice(0, 2).join(", ");

    pipelineOutputs[`${incId}-sentinel`] =
      `+${meta.sigma}σ deviation · thermal runaway pattern · ${(stub.confidence * 100).toFixed(0)} prior pattern matches`;
    pipelineOutputs[`${incId}-triton`] =
      `q50 breach in ${tritonMeta.q50BreachMin}m · q95 breach in ${tritonMeta.q95BreachMin}m · LightGBM p=${stub.confidence}`;
    pipelineOutputs[`${incId}-hephaestus`] =
      `${topImpact} · ${heph.blastRadius.length + 1} systems at risk`;
    pipelineOutputs[`${incId}-hermes`] =
      `${hermes.technician.name} matched (${matchedCerts}) · Parts confirmed in stock`;
  }

  return { incidents, jobs, cascadeDelays, forecastData, pipelineOutputs, tritonMeta };
}

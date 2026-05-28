import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type Asset,
  type Incident,
  type Job,
  assets as seedAssets,
  technicians as seedTechnicians,
  telemetryHistory,
} from "../data/mock";
import type { Incident as BackendIncidentDto } from "../lib/atlasApi";
import { atlasApi } from "../lib/atlasApi";
import {
  buildForecastPoints,
  buildTritonMeta,
  fToC,
  type LiveChartPoint,
  type LogEntry,
  type TelemetryBatch,
} from "../lib/streams";
import { type ForecastPoint, runPipeline } from "../models/pipeline";

const MAX_CHART = 30;
const MAX_LOGS = 100;
const CHILLER_BACKEND_ID = "CHILLER-A-03";
const CHILLER_METRIC = "supply_temperature";
/** Baseline supply temperature for CHILLER-A-03 in °F (44 °F ≈ 6.67 °C). */
const CHILLER_BASELINE_F = 44;

type Role = "ops" | "supervisor" | "tech";

interface AppState {
  role: Role;
  setRole: (r: Role) => void;
  assets: Asset[];
  incidents: Incident[];
  jobs: Job[];
  activeIncidentId: string | null;
  setActiveIncident: (id: string | null) => void;
  activeJobId: string | null;
  setActiveJob: (id: string | null) => void;
  hitlApproved: boolean;
  approveHitl: () => void;
  forecastData: ForecastPoint[];
  cascadeDelays: Record<string, number>;
  pipelineOutputs: Record<string, string>;
  tritonMeta: { q50BreachMin: number; q95BreachMin: number };
  /** Sentinel log entries from the live /logs/stream SSE feed. */
  logs: LogEntry[];
  /** Rolling 30-point buffer fed by the live /telemetry/stream SSE feed. */
  liveChart: LiveChartPoint[];
}

// Run the JS model pipeline once at module load time for the initial state.
const initialPipeline = runPipeline(seedAssets, seedTechnicians);

// Seed the chart buffer from mock data so the chart isn't blank on first render.
const initialChart: LiveChartPoint[] = (telemetryHistory as { time: string; chwTemp: number }[])
  .slice(-MAX_CHART)
  .map((p) => ({ time: p.time, chwTemp: p.chwTemp, baseline: fToC(CHILLER_BASELINE_F) }));

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("ops");
  const [assets] = useState(seedAssets);
  const [incidents, setIncidents] = useState(initialPipeline.incidents);
  const [jobs] = useState(initialPipeline.jobs);
  const [activeIncidentId, setActiveIncident] = useState<string | null>(null);
  const [activeJobId, setActiveJob] = useState<string | null>(null);
  const [hitlApproved, setHitlApproved] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastPoint[]>(initialPipeline.forecastData);
  const [cascadeDelays] = useState(initialPipeline.cascadeDelays);
  const [pipelineOutputs] = useState(initialPipeline.pipelineOutputs);
  const [tritonMeta, setTritonMeta] = useState(initialPipeline.tritonMeta);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [liveChart, setLiveChart] = useState<LiveChartPoint[]>(initialChart);

  // ── fetch real quantile forecast from backend on mount ──────────────────
  useEffect(() => {
    atlasApi
      .simulateIncident(CHILLER_BACKEND_ID, CHILLER_METRIC)
      .then((raw) => {
        const incident = raw as BackendIncidentDto;
        const forecast = incident.triage.quantile_forecast;
        const currentC = fToC(incident.signal.current_value);
        setForecastData(buildForecastPoints(forecast, currentC));
        setTritonMeta(buildTritonMeta(forecast));
      })
      .catch(() => {
        // Backend unavailable — JS-computed forecast stays as fallback.
      });
  }, []);

  // ── live telemetry SSE ──────────────────────────────────────────────────
  useEffect(() => {
    const es = new EventSource("/api/pipeline/telemetry/stream");

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const batch = JSON.parse(e.data) as TelemetryBatch;
        const tick = batch.ticks.find(
          (t) => t.asset_id === CHILLER_BACKEND_ID && t.metric === CHILLER_METRIC
        );
        if (!tick) return;

        const chwTemp = fToC(tick.value);
        const time = new Date(batch.ts).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        setLiveChart((prev) => {
          const next = [...prev, { time, chwTemp, baseline: fToC(CHILLER_BASELINE_F) }];
          return next.length > MAX_CHART ? next.slice(-MAX_CHART) : next;
        });
      } catch {
        // skip malformed SSE frames
      }
    };

    return () => es.close();
  }, []);

  // ── live logs SSE ──────────────────────────────────────────────────────
  useEffect(() => {
    const es = new EventSource("/api/pipeline/logs/stream");

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const entry = JSON.parse(e.data) as LogEntry;
        setLogs((prev) => {
          const next = [...prev, entry];
          return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
        });
      } catch {
        // skip malformed SSE frames
      }
    };

    return () => es.close();
  }, []);

  function approveHitl() {
    setHitlApproved(true);
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === activeIncidentId || (!activeIncidentId && i.status === "hitl-pending")
          ? { ...i, status: "dispatched" }
          : i
      )
    );
  }

  return createElement(AppContext.Provider, {
    value: {
      role,
      setRole,
      assets,
      incidents,
      jobs,
      activeIncidentId,
      setActiveIncident,
      activeJobId,
      setActiveJob,
      hitlApproved,
      approveHitl,
      forecastData,
      cascadeDelays,
      pipelineOutputs,
      tritonMeta,
      logs,
      liveChart,
    },
    children,
  });
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

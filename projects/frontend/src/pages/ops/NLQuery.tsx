import {
  ArrowRight,
  Brain,
  CaretRight,
  ChartLineUp,
  CheckCircle,
  Circle,
  ClockCountdown,
  MagnifyingGlass,
  Robot,
  Spinner,
  Warning,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useRef, useState } from "react";
import { assets, incidents, jobs, technicians } from "../../data/mock";

// ── Types ─────────────────────────────────────────────────────────────────

type PipelineStep = "sentinel" | "triton" | "hermes";
type ResultType = "asset-list" | "cascade" | "technician" | "forecast" | "generic";

interface PipelineState {
  step: PipelineStep | "done" | "idle";
  durations: Partial<Record<PipelineStep, number>>;
}

interface QueryResult {
  type: ResultType;
  summary: string;
  data: unknown;
}

// ── Example queries ────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  "Which assets are in a critical or warning state?",
  "Show me the blast radius of the active incident",
  "Who is the nearest available technician?",
  "What is the thermal forecast for CHILLER-A-03?",
  "List all cooling assets on Hall B",
];

// ── Pipeline config ────────────────────────────────────────────────────────

const PIPELINE_AGENTS = [
  {
    id: "sentinel" as PipelineStep,
    name: "Sentinel",
    short: "SEN",
    color: "#3b82f6",
    label: "Anomaly Detection",
  },
  {
    id: "triton" as PipelineStep,
    name: "Triton",
    short: "TRI",
    color: "#8b5cf6",
    label: "Quantile Forecast",
  },
  {
    id: "hermes" as PipelineStep,
    name: "Hermes",
    short: "HRM",
    color: "#10b981",
    label: "Query Resolution",
  },
];

// ── Query resolver ─────────────────────────────────────────────────────────

function resolveQuery(q: string): QueryResult {
  const lower = q.toLowerCase();

  // blast radius / cascade
  if (lower.includes("blast") || lower.includes("cascade") || lower.includes("incident")) {
    const inc = incidents[0];
    const affected = inc.blastRadius.map((id) => assets.find((a) => a.id === id)).filter(Boolean);
    return {
      type: "cascade",
      summary: `Active incident on ${assets.find((a) => a.id === inc.assetId)?.name}. ${inc.blastRadius.length} assets in blast radius.`,
      data: { incident: inc, affected },
    };
  }

  // technician
  if (
    lower.includes("technician") ||
    lower.includes("dispatch") ||
    lower.includes("nearest") ||
    lower.includes("available")
  ) {
    const avail = technicians.filter((t) => t.status === "available" || t.status === "transit");
    return {
      type: "technician",
      summary: `${avail.length} technician${avail.length !== 1 ? "s" : ""} available or in transit.`,
      data: { technicians: avail, job: jobs[0] },
    };
  }

  // forecast
  if (
    lower.includes("forecast") ||
    lower.includes("thermal") ||
    lower.includes("temp") ||
    lower.includes("predict")
  ) {
    return {
      type: "forecast",
      summary: "Quantile forecast from Triton LightGBM model for CHILLER-A-03.",
      data: { asset: assets.find((a) => a.id === "chiller-a-03"), ttf: 23, confidence: 0.94 },
    };
  }

  // asset list (critical/warning or type-based)
  const statusFilter = lower.includes("critical")
    ? "critical"
    : lower.includes("warning")
      ? "warning"
      : lower.includes("offline")
        ? "offline"
        : lower.includes("normal")
          ? "normal"
          : null;

  const typeFilter = lower.includes("cooling")
    ? "Cooling"
    : lower.includes("power")
      ? "Power"
      : lower.includes("compute")
        ? "Compute"
        : lower.includes("network")
          ? "Network"
          : null;

  const floorFilter = lower.includes("hall b")
    ? "Hall B"
    : lower.includes("hall a")
      ? "Hall A"
      : lower.includes("mechanical")
        ? "Mechanical"
        : null;

  if (statusFilter || typeFilter || floorFilter) {
    const result = assets.filter((a) => {
      if (statusFilter && a.status !== statusFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (floorFilter && a.floor !== floorFilter) return false;
      return true;
    });
    return {
      type: "asset-list",
      summary: `Found ${result.length} asset${result.length !== 1 ? "s" : ""} matching your query.`,
      data: { assets: result.slice(0, 12) },
    };
  }

  // generic fallback
  return {
    type: "generic",
    summary: `Queried ${assets.length} assets, ${incidents.length} active incident${incidents.length !== 1 ? "s" : ""}, ${technicians.length} technicians across 3 floors.`,
    data: {
      stats: {
        assets: assets.length,
        critical: assets.filter((a) => a.status === "critical").length,
        warning: assets.filter((a) => a.status === "warning").length,
        incidents: incidents.length,
      },
    },
  };
}

// ── Status badge ──────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  normal: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
  offline: "bg-zinc-600",
};
const STATUS_TEXT: Record<string, string> = {
  normal: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-red-400",
  offline: "text-zinc-500",
};

// ── Result renderers ──────────────────────────────────────────────────────

function ResultAssetList({ data }: { data: { assets: typeof assets } }) {
  return (
    <div className="space-y-1.5">
      {data.assets.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[a.status]}`} />
          <span className="text-[11px] font-mono font-semibold text-white w-[110px] flex-shrink-0">
            {a.name}
          </span>
          <span className="text-[9px] font-mono text-zinc-600 flex-1 truncate">
            {a.floor} · {a.zone}
          </span>
          <span className={`text-[9px] font-mono ${STATUS_TEXT[a.status]}`}>{a.status}</span>
        </motion.div>
      ))}
    </div>
  );
}

function ResultCascade({
  data,
}: {
  data: { incident: (typeof incidents)[0]; affected: ((typeof assets)[0] | undefined)[] };
}) {
  return (
    <div className="space-y-2">
      {/* incident card */}
      <div className="relative overflow-hidden rounded-xl border border-red-500/25 bg-red-500/[0.04] px-3.5 py-3">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-500/40 to-transparent" />
        <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-gradient-to-b from-red-500/80 to-transparent" />
        <div className="flex items-center gap-2 mb-1.5">
          <Warning size={10} weight="fill" className="text-red-400" />
          <span className="text-[10px] font-semibold text-red-300">
            {data.incident.severity.toUpperCase()} · {data.incident.confidence * 100}% confidence
          </span>
          <span className="ml-auto text-[11px] font-mono font-bold text-red-400 tabular-nums">
            {data.incident.ttf}m TTF
          </span>
        </div>
        <p className="text-[8px] text-zinc-500 leading-relaxed line-clamp-2">
          {data.incident.prediction}
        </p>
      </div>
      {/* blast radius */}
      <div>
        <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.15em] mb-1.5">
          Blast Radius
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(data.affected.filter(Boolean) as NonNullable<(typeof data.affected)[0]>[]).map(
            (a, i) => (
              <motion.span
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="flex items-center gap-1 text-[8px] font-mono px-2 py-1 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] text-amber-400"
              >
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {a.name}
              </motion.span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ResultTechnician({
  data,
}: {
  data: { technicians: typeof technicians; job: (typeof jobs)[0] };
}) {
  const statusColor = {
    available: "text-emerald-400",
    transit: "text-sky-400",
    "on-site": "text-amber-400",
  };
  const statusDot = {
    available: "bg-emerald-400",
    transit: "bg-sky-400",
    "on-site": "bg-amber-400",
  };

  return (
    <div className="space-y-2">
      {data.technicians.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07, duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
        >
          <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-semibold text-zinc-300">{t.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-white">{t.name}</p>
            <p className="text-[8px] text-zinc-600 font-mono mt-0.5">
              {t.certifications.slice(0, 2).join(" · ")}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`flex items-center gap-1 justify-end ${statusColor[t.status]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[t.status]}`} />
              <span className="text-[9px] font-mono">{t.status}</span>
            </div>
            {t.eta && <p className="text-[8px] font-mono text-zinc-700 mt-0.5">{t.eta}</p>}
          </div>
        </motion.div>
      ))}
      {data.job && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <ClockCountdown size={9} className="text-zinc-600" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              Active Job
            </span>
          </div>
          <p className="text-[10px] text-zinc-300 font-semibold mt-1">{data.job.title}</p>
          <p className="text-[8px] text-zinc-700 font-mono mt-0.5">
            ETA: {data.job.eta} · {data.job.status}
          </p>
        </div>
      )}
    </div>
  );
}

function ResultForecast({
  data,
}: {
  data: { asset: (typeof assets)[0] | undefined; ttf: number; confidence: number };
}) {
  if (!data.asset) return null;
  const t = data.asset.telemetry[0];
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-[#0c0505] px-3.5 py-3">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-500/30 to-transparent" />
        <div className="flex items-center gap-2 mb-2">
          <ChartLineUp size={10} weight="fill" className="text-red-400" />
          <span className="text-[10px] font-semibold text-white">{data.asset.name}</span>
          <span className="ml-auto text-[9px] font-mono text-red-400">
            {(data.confidence * 100).toFixed(0)}% conf
          </span>
        </div>
        {t && (
          <div className="flex items-end gap-1.5 mb-2">
            <span className="text-[28px] font-semibold text-red-400 leading-none tabular-nums font-mono">
              {t.value.toFixed(1)}
            </span>
            <span className="text-[12px] text-zinc-500 mb-0.5">{t.unit}</span>
            <span className="text-[9px] text-red-400 ml-1 mb-0.5">↑</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "q50 +18m", value: "13.2°C", color: "text-red-400" },
            { label: "TTF", value: `${data.ttf}m`, color: "text-amber-400" },
            { label: "Threshold", value: "12.0°C", color: "text-zinc-500" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-2 py-1.5"
            >
              <p className={`text-[11px] font-mono font-semibold tabular-nums ${s.color}`}>
                {s.value}
              </p>
              <p className="text-[7px] font-mono text-zinc-700 uppercase tracking-wider mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.15em] mb-1.5">
          Affected Assets
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["PUMP-CHW-03", "PUMP-CHW-04", "CRAH-B-01", "CRAH-B-02", "POD-05"].map((n, i) => (
            <motion.span
              key={n}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="text-[8px] font-mono px-2 py-1 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] text-amber-400"
            >
              {n}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultGeneric({
  data,
}: {
  data: { stats: { assets: number; critical: number; warning: number; incidents: number } };
}) {
  const { stats } = data;
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: "Total Assets", value: stats.assets, color: "text-zinc-300" },
        { label: "Incidents", value: stats.incidents, color: "text-red-400" },
        { label: "Critical", value: stats.critical, color: "text-red-400" },
        { label: "Warning", value: stats.warning, color: "text-amber-400" },
      ].map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.25 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
        >
          <p className={`text-[22px] font-semibold tabular-nums leading-none ${s.color}`}>
            {s.value}
          </p>
          <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.12em] mt-1">
            {s.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Pipeline indicator ────────────────────────────────────────────────────

const STEP_ORDER: PipelineStep[] = ["sentinel", "triton", "hermes"];

function PipelineBar({ state }: { state: PipelineState }) {
  const currentIdx =
    state.step === "idle"
      ? -1
      : state.step === "done"
        ? 3
        : STEP_ORDER.indexOf(state.step as PipelineStep);

  return (
    <div className="flex items-center">
      {PIPELINE_AGENTS.map((agent, i) => {
        const done = currentIdx > i || state.step === "done";
        const active = currentIdx === i;
        return (
          <Fragment key={agent.id}>
            {i > 0 && (
              <div
                className="flex-1 h-px transition-all duration-500"
                style={{
                  background:
                    done || active
                      ? `linear-gradient(90deg, ${PIPELINE_AGENTS[i - 1].color}60, ${agent.color}40)`
                      : "rgba(255,255,255,0.05)",
                }}
              />
            )}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-400"
                style={{
                  backgroundColor: done
                    ? `${agent.color}22`
                    : active
                      ? `${agent.color}15`
                      : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${done ? agent.color : active ? `${agent.color}60` : "rgba(255,255,255,0.08)"}`,
                  boxShadow: done || active ? `0 0 12px ${agent.color}44` : "none",
                }}
              >
                {done ? (
                  <CheckCircle size={11} weight="fill" style={{ color: agent.color }} />
                ) : active ? (
                  <Spinner size={10} className="animate-spin" style={{ color: agent.color }} />
                ) : (
                  <Circle size={8} style={{ color: "rgba(255,255,255,0.15)" }} />
                )}
              </div>
              <div className="text-center">
                <p
                  className="text-[8px] font-mono font-semibold"
                  style={{ color: done || active ? agent.color : "rgba(255,255,255,0.2)" }}
                >
                  {agent.short}
                </p>
                <p className="text-[7px] font-mono text-zinc-700 leading-none mt-0.5 hidden sm:block">
                  {agent.label}
                </p>
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function NLQuery() {
  const [query, setQuery] = useState("");
  const [pipeline, setPipeline] = useState<PipelineState>({ step: "idle", durations: {} });
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<{ query: string; result: QueryResult }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function runQuery(q: string) {
    if (!q.trim()) return;
    setResult(null);
    setPipeline({ step: "sentinel", durations: {} });

    const resolved = resolveQuery(q);

    // simulate pipeline steps
    const stepDurations: Partial<Record<PipelineStep, number>> = {};
    for (const step of STEP_ORDER) {
      const d = 420 + Math.random() * 340;
      stepDurations[step] = d;
      await new Promise((res) => setTimeout(res, d));
      setPipeline((prev) => ({
        step: STEP_ORDER[STEP_ORDER.indexOf(step) + 1] ?? "done",
        durations: { ...prev.durations, [step]: d },
      }));
    }

    setResult(resolved);
    setHistory((prev) => [{ query: q, result: resolved }, ...prev.slice(0, 4)]);
  }

  function submit(q: string) {
    setQuery(q);
    runQuery(q);
  }

  return (
    <div className="flex h-full bg-[#050505] overflow-hidden">
      {/* ── Left — history ─────────────────────────────────────── */}
      <div className="hidden lg:flex w-[200px] flex-shrink-0 flex-col border-r border-white/[0.05] py-4 overflow-hidden">
        <div className="px-3 mb-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-[2px] h-3.5 rounded-full bg-violet-500/70" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.18em]">
              History
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence>
            {history.length === 0 ? (
              <p className="text-[9px] font-mono text-zinc-800 px-2">No queries yet</p>
            ) : (
              history.map((h, _i) => (
                <motion.button
                  key={`${h.query}-${h.result.type}`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => submit(h.query)}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/[0.03] transition-colors duration-150 mb-1"
                >
                  <p className="text-[8px] text-zinc-500 font-mono leading-relaxed line-clamp-2">
                    {h.query}
                  </p>
                  <p className="text-[7px] text-zinc-700 font-mono mt-0.5 uppercase tracking-wider">
                    {h.result.type}
                  </p>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Main ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* header */}
        <div className="px-5 pt-4 pb-3.5 border-b border-white/[0.05] flex-shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Robot size={12} weight="light" className="text-zinc-600" />
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.18em]">
              Natural Language Query
            </span>
          </div>
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            Ask anything about your facility in plain English.
          </p>
        </div>

        {/* pipeline */}
        <div className="px-5 py-3.5 border-b border-white/[0.04] flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={9} weight="light" className="text-zinc-700" />
            <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-[0.18em]">
              Agent Pipeline
            </span>
          </div>
          <PipelineBar state={pipeline} />
        </div>

        {/* query input */}
        <div className="px-5 py-3.5 border-b border-white/[0.04] flex-shrink-0">
          <div className="relative flex items-center gap-3 rounded-xl border border-white/[0.09] bg-[#070707] px-4 py-3 focus-within:border-white/[0.18] transition-colors duration-200">
            <MagnifyingGlass size={13} className="text-zinc-600 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit(query)}
              placeholder="Which assets are critical right now?"
              className="flex-1 bg-transparent text-[12px] text-zinc-200 placeholder:text-zinc-700 outline-none font-mono"
              // biome-ignore lint/a11y/noAutofocus: query page intentionally focuses input on mount
              autoFocus
            />
            <button
              type="button"
              onClick={() => submit(query)}
              disabled={!query.trim() || (pipeline.step !== "idle" && pipeline.step !== "done")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.09] text-[9px] font-mono text-zinc-400 hover:text-white hover:bg-white/[0.09] hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              Run <ArrowRight size={8} weight="bold" />
            </button>
          </div>

          {/* example queries */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submit(q)}
                className="flex items-center gap-1 text-[8px] font-mono text-zinc-700 hover:text-zinc-400 px-2 py-1 rounded-lg border border-white/[0.04] hover:border-white/[0.09] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-200"
              >
                <CaretRight size={6} weight="bold" />
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* result area */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">
            {pipeline.step !== "idle" && !result && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full gap-3"
              >
                <div className="w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                  <Spinner size={16} className="animate-spin text-zinc-600" />
                </div>
                <p className="text-[10px] font-mono text-zinc-700">
                  {pipeline.step === "sentinel" && "Sentinel scanning telemetry anomalies…"}
                  {pipeline.step === "triton" && "Triton computing quantile forecast…"}
                  {pipeline.step === "hermes" && "Hermes resolving query against knowledge graph…"}
                </p>
              </motion.div>
            )}

            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* summary */}
                <div className="flex items-start gap-2.5 mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                  <p className="text-[11px] text-zinc-300 leading-relaxed">{result.summary}</p>
                </div>

                {/* type-specific results */}
                {result.type === "asset-list" && (
                  <ResultAssetList
                    data={result.data as Parameters<typeof ResultAssetList>[0]["data"]}
                  />
                )}
                {result.type === "cascade" && (
                  <ResultCascade
                    data={result.data as Parameters<typeof ResultCascade>[0]["data"]}
                  />
                )}
                {result.type === "technician" && (
                  <ResultTechnician
                    data={result.data as Parameters<typeof ResultTechnician>[0]["data"]}
                  />
                )}
                {result.type === "forecast" && (
                  <ResultForecast
                    data={result.data as Parameters<typeof ResultForecast>[0]["data"]}
                  />
                )}
                {result.type === "generic" && (
                  <ResultGeneric
                    data={result.data as Parameters<typeof ResultGeneric>[0]["data"]}
                  />
                )}
              </motion.div>
            )}

            {pipeline.step === "idle" && !result && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-3 text-center"
              >
                <div className="w-12 h-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                  <Brain size={20} weight="light" className="text-zinc-700" />
                </div>
                <div>
                  <p className="text-[11px] text-zinc-600 font-mono">
                    Ask your facility a question
                  </p>
                  <p className="text-[9px] text-zinc-800 font-mono mt-1">
                    Powered by Sentinel · Triton · Hermes
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

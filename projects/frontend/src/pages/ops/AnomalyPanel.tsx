import { ArrowRight, Brain, CaretRight, Cpu, Lightning, TrendUp, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { assets as allAssets } from "../../data/mock";
import { useApp } from "../../store/appStore";

interface Props {
  incidentId: string;
  onClose: () => void;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}
function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const filtered = payload.filter((p) => p.value != null);
  return (
    <div className="bg-[#0c0c0c] border border-white/[0.1] rounded-lg px-2.5 py-1.5 shadow-xl">
      <p className="text-[9px] text-zinc-600 font-mono mb-1">{label}</p>
      {filtered.map((p) => (
        <p key={p.name} className="text-[10px] font-mono font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed(1)}°C
        </p>
      ))}
    </div>
  );
}

const AGENT_META = [
  { id: "sentinel", name: "Sentinel", role: "Anomaly Detection", color: "blue", status: "done" },
  { id: "triton", name: "Triton", role: "Quantile Forecast", color: "violet", status: "done" },
  {
    id: "hephaestus",
    name: "Hephaestus",
    role: "Impact Analysis",
    color: "orange",
    status: "done",
  },
  { id: "hermes", name: "Hermes", role: "RAG → MILP Dispatch", color: "emerald", status: "done" },
  {
    id: "mnemos",
    name: "Mnemos",
    role: "Training Capture",
    color: "amber",
    status: "waiting",
    staticOutput: "Awaiting work order close — training tuple will be captured",
  },
] as const;

const agentDot: Record<string, string> = {
  blue: "bg-blue-500/15 ring-blue-500/40",
  violet: "bg-violet-500/15 ring-violet-500/35",
  orange: "bg-orange-500/15 ring-orange-500/30",
  emerald: "bg-emerald-500/15 ring-emerald-500/30",
  amber: "bg-amber-500/15 ring-amber-500/25",
};
const agentBar: Record<string, string> = {
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  orange: "bg-orange-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};
const agentText: Record<string, string> = {
  blue: "text-blue-400",
  violet: "text-violet-400",
  orange: "text-orange-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
};

function SectionLabel({
  icon,
  label,
  sub,
  accentColor = "bg-zinc-600",
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className={`w-[2px] h-3.5 rounded-full ${accentColor}`} />
      {icon}
      <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.16em] font-bold flex-1">
        {label}
      </p>
      {sub && <span className="text-[8px] text-zinc-700 font-mono">{sub}</span>}
    </div>
  );
}

export default function AnomalyPanel({ incidentId, onClose }: Props) {
  const { incidents, forecastData, cascadeDelays, pipelineOutputs, tritonMeta } = useApp();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(false);
  const [showAgents, setShowAgents] = useState(true);

  const incident = incidents.find((i) => i.id === incidentId);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!incident) return null;

  const sourceAsset = allAssets.find((a) => a.id === incident.assetId);
  const threshold = forecastData[0]?.threshold ?? 12.0;

  // Build agent pipeline with computed outputs from the pipeline run
  const agentPipeline = AGENT_META.map((m) => ({
    ...m,
    output:
      "staticOutput" in m
        ? m.staticOutput
        : (pipelineOutputs[`${incidentId}-${m.id}`] ?? "Analysis complete"),
  }));

  // Quantile breach labels from Triton
  const q50Label = `+${tritonMeta.q50BreachMin}m`;
  const q95Label = `+${tritonMeta.q95BreachMin}m`;
  const q05BreachMin = forecastData.findIndex((d) => d.q05 !== null && d.q05 >= threshold);
  const q05Label = q05BreachMin >= 0 ? forecastData[q05BreachMin].time : "+30m";

  // Blast radius chain from computed incident data (sorted by cascade delay)
  const cascadeChain = incident.blastRadius;
  const ttf = Math.max(0, incident.ttf - Math.floor(tick / 60));
  const confPct = (incident.confidence * 100).toFixed(0);
  const urgencyPct = Math.min(100, Math.max(0, (1 - ttf / 60) * 100));

  return (
    <div
      className={`fixed inset-0 z-50 md:static md:inset-auto md:z-auto md:w-[440px] md:border-l border-white/[0.05] bg-[#040404] flex flex-col overflow-y-auto md:flex-shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ scrollbarWidth: "none" }}
    >
      {/* ── Header ── */}
      <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.05] flex-shrink-0 overflow-hidden">
        {/* Red ambient glow */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-72 h-28 bg-red-500/[0.07] rounded-full blur-3xl pointer-events-none" />
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/55 to-transparent" />
        {/* Left edge accent */}
        <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-gradient-to-b from-red-500/70 via-red-500/30 to-transparent" />

        <div className="relative flex items-start justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-pulse-red" />
            <span className="text-[9px] text-red-400 font-bold uppercase tracking-[0.2em] font-mono">
              Critical Anomaly
            </span>
            <span className="text-[8px] text-zinc-700 font-mono">· INC-001</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] flex items-center justify-center text-zinc-600 hover:text-white transition-all duration-200"
          >
            <X size={11} weight="bold" />
          </button>
        </div>

        <div className="relative">
          <h2 className="text-[20px] font-semibold tracking-tight text-white leading-none">
            {sourceAsset?.name}
          </h2>
          <p className="text-[11px] text-zinc-600 mt-1 font-mono">
            {incident.detectedAt} · {sourceAsset?.zone} · CHW Supply Temp
          </p>
        </div>
      </div>

      {/* ── TTF + Confidence Hero ── */}
      <div className="mx-5 mt-4">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.18)",
            boxShadow: "0 0 30px rgba(239,68,68,0.06)",
          }}
        >
          {/* Scan line effect */}
          <div className="scan-line opacity-20" />
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-500/40 via-red-500/20 to-transparent" />

          <div className="px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[8px] text-zinc-600 uppercase tracking-[0.2em] font-bold font-mono mb-1.5">
                  q50 Time to Threshold
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-[54px] font-semibold tracking-[-0.04em] tabular-nums text-red-400 leading-none">
                    {ttf}
                  </span>
                  <span className="text-[15px] font-medium text-red-500/50 pb-2">min</span>
                </div>
              </div>
              <div className="text-right pb-1">
                <p className="text-[8px] text-zinc-600 uppercase tracking-[0.2em] font-bold font-mono mb-1.5">
                  Confidence
                </p>
                <p className="text-[32px] font-semibold tracking-tighter tabular-nums text-white leading-none">
                  {confPct}%
                </p>
              </div>
            </div>

            {/* Quantile callouts */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-red-500/[0.09] border border-red-500/20 rounded-lg px-2.5 py-1">
                <span className="text-[8px] font-mono font-bold text-red-400">q95</span>
                <span className="text-[8px] text-zinc-600 font-mono">breach</span>
                <span className="text-[9px] font-mono font-bold text-red-300">{q95Label}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-500/[0.09] border border-amber-500/18 rounded-lg px-2.5 py-1">
                <span className="text-[8px] font-mono font-bold text-amber-400">q50</span>
                <span className="text-[8px] text-zinc-600 font-mono">breach</span>
                <span className="text-[9px] font-mono font-bold text-amber-300">{q50Label}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-800/50 border border-white/[0.05] rounded-lg px-2.5 py-1">
                <span className="text-[8px] font-mono font-bold text-zinc-600">q05</span>
                <span className="text-[8px] text-zinc-700 font-mono">breach</span>
                <span className="text-[9px] font-mono font-bold text-zinc-600">{q05Label}</span>
              </div>
            </div>

            {/* Urgency bar */}
            <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${urgencyPct}%`,
                  background:
                    "linear-gradient(90deg, rgba(239,68,68,0.4) 0%, rgba(239,68,68,1) 100%)",
                  transition: "width 1s ease",
                }}
              />
            </div>
            <p className="text-[8px] text-zinc-700 font-mono mt-1.5">
              Thermal runaway pattern · {urgencyPct.toFixed(0)}% urgency
            </p>
          </div>
        </div>
      </div>

      {/* ── Quantile Forecast Chart ── */}
      <div className="px-5 mt-3.5">
        <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#060606] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.14em]">
              Quantile Forecast · CHW Temp
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[8px] text-zinc-700 font-mono">
                <span className="w-2 h-0.5 bg-red-400/60 rounded inline-block" />
                q95
              </span>
              <span className="flex items-center gap-1 text-[8px] text-zinc-700 font-mono">
                <span className="w-2 h-0.5 bg-amber-400 rounded inline-block" />
                q50
              </span>
              <span className="flex items-center gap-1 text-[8px] text-zinc-700 font-mono">
                <span className="w-2 h-0.5 bg-zinc-600 rounded inline-block" />
                q05
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <ComposedChart data={forecastData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="q95Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="q50Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                tickMargin={3}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                width={22}
                tickFormatter={(v) => `${v}°`}
              />
              <ReTooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
              />
              <ReferenceLine
                y={threshold}
                stroke="rgba(239,68,68,0.35)"
                strokeDasharray="3 3"
                label={{
                  value: `${threshold}°C`,
                  position: "right",
                  fontSize: 7,
                  fill: "rgba(239,68,68,0.55)",
                  fontFamily: "monospace",
                }}
              />
              <Area
                type="monotone"
                dataKey="q95"
                name="q95"
                stroke="rgba(239,68,68,0.55)"
                strokeWidth={1}
                strokeDasharray="3 2"
                fill="url(#q95Grad)"
                dot={false}
                activeDot={false}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="q50"
                name="q50"
                stroke="#f59e0b"
                strokeWidth={1.5}
                fill="url(#q50Grad)"
                dot={false}
                activeDot={{ r: 2.5, fill: "#f59e0b", strokeWidth: 0 }}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="q05"
                name="q05"
                stroke="rgba(113,113,122,0.5)"
                strokeWidth={1}
                strokeDasharray="2 2"
                fill="none"
                dot={false}
                activeDot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="actual"
                stroke="#f87171"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#f87171", strokeWidth: 0 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Agent Pipeline ── */}
      <div className="px-5 mt-4">
        <button
          type="button"
          onClick={() => setShowAgents((s) => !s)}
          className="flex items-center gap-2 w-full mb-2.5 group"
        >
          <div className="w-[2px] h-3.5 rounded-full bg-zinc-700" />
          <Brain size={10} weight="light" className="text-zinc-600 flex-shrink-0" />
          <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.16em] font-bold flex-1 text-left">
            Agent Pipeline
          </p>
          <span className="text-[8px] text-zinc-700 font-mono">5 agents</span>
          <ArrowRight
            size={9}
            weight="bold"
            className={`text-zinc-700 transition-transform duration-300 ${showAgents ? "rotate-90" : ""}`}
          />
        </button>

        {showAgents && (
          <div className="fade-up rounded-xl overflow-hidden border border-white/[0.06] bg-[#060606] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="px-4 py-4">
              <div className="relative pl-6">
                <div className="absolute left-[9px] top-3 bottom-3 w-px bg-white/[0.05]" />
                <div className="space-y-3.5">
                  {agentPipeline.map((agent) => (
                    <div key={agent.id} className="relative flex gap-3">
                      <div
                        className={`absolute -left-6 rounded-full ring-1 flex items-center justify-center flex-shrink-0 z-10 ${agentDot[agent.color]}`}
                        style={{ background: "rgba(0,0,0,0.85)", width: "18px", height: "18px" }}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${agentBar[agent.color]} ${agent.status === "waiting" ? "opacity-30" : "opacity-80"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p
                            className={`text-[10px] font-bold tracking-[0.1em] uppercase ${agent.status === "waiting" ? "text-zinc-600" : agentText[agent.color]}`}
                          >
                            {agent.name}
                          </p>
                          <span className="text-[8px] text-zinc-700 font-mono">· {agent.role}</span>
                          {agent.status === "waiting" && (
                            <span className="text-[7px] text-amber-600 font-bold uppercase tracking-wide border border-amber-500/20 bg-amber-500/8 px-1.5 py-0.5 rounded">
                              pending
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] leading-relaxed font-mono ${agent.status === "waiting" ? "text-zinc-700" : "text-zinc-500"}`}
                        >
                          {agent.output}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Blast Radius Chain ── */}
      <div className="px-5 mt-4">
        <SectionLabel
          icon={<TrendUp size={10} weight="light" className="text-orange-500" />}
          label="Blast Radius"
          sub={`${cascadeChain.length + 1} systems`}
          accentColor="bg-orange-500/60"
        />

        <div className="relative pl-6">
          <div className="absolute left-[9px] top-4 bottom-4 w-px bg-white/[0.05]" />

          {/* Source node */}
          <div className="relative flex items-center gap-3 py-1.5">
            <div
              className="absolute -left-6 rounded-full bg-red-500/15 ring-1 ring-red-500/55 flex items-center justify-center z-10"
              style={{ width: "18px", height: "18px" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 status-pulse-red" />
            </div>
            <span className="text-[8px] font-mono font-bold text-red-500 w-9 flex-shrink-0 tabular-nums">
              now
            </span>
            <span className="text-[11px] text-white font-semibold font-mono">
              {sourceAsset?.name}
            </span>
            <span className="ml-auto text-[9px] text-zinc-700 font-mono">{sourceAsset?.zone}</span>
          </div>

          {cascadeChain.map((id) => {
            const a = allAssets.find((x) => x.id === id);
            const delay = cascadeDelays[id] ?? 0;
            const isPump = id.startsWith("pump");
            const isCrah = id.startsWith("crah-b");
            const hotColor = isPump
              ? "text-orange-600"
              : isCrah
                ? "text-amber-600"
                : "text-red-700";
            const dotBg = isPump
              ? "bg-orange-500/10 ring-orange-500/20"
              : isCrah
                ? "bg-amber-500/10 ring-amber-500/18"
                : "bg-red-500/8 ring-red-500/15";
            const dotFill = isPump
              ? "bg-orange-500/50"
              : isCrah
                ? "bg-amber-500/40"
                : "bg-red-500/30";
            return (
              <div key={id} className="relative flex items-center gap-3 py-1.5">
                <div
                  className={`absolute -left-6 rounded-full ring-1 flex items-center justify-center z-10 ${dotBg}`}
                  style={{ width: "18px", height: "18px" }}
                >
                  <div className={`w-1 h-1 rounded-full ${dotFill}`} />
                </div>
                <span
                  className={`text-[8px] font-mono font-bold w-9 flex-shrink-0 tabular-nums ${hotColor}`}
                >
                  +{delay}m
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">{a?.name}</span>
                <span className="ml-auto text-[9px] text-zinc-700 font-mono">{a?.zone}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recommended Action ── */}
      <div className="px-5 mt-4">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(59,130,246,0.03)",
            border: "1px solid rgba(59,130,246,0.12)",
          }}
        >
          {/* Top accent */}
          <div className="h-px w-full bg-gradient-to-r from-blue-500/25 to-transparent" />
          <div className="p-3.5">
            <div className="flex items-start gap-2.5">
              <Lightning size={12} weight="light" className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[8px] text-zinc-600 font-mono uppercase tracking-[0.16em] mb-1.5">
                  Hermes Recommendation
                </p>
                <p className="text-[11px] text-zinc-300 leading-[1.7]">
                  {incident.recommendedAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="px-5 mt-4 pb-6 space-y-2">
        <button
          type="button"
          onClick={() => navigate("/ops/dispatch")}
          className="w-full group flex items-center justify-center gap-2 bg-white text-black text-[13px] font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-all duration-200 active:scale-[0.98]"
        >
          View Dispatch Plan
          <span className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200">
            <CaretRight size={10} weight="bold" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/supervisor")}
          className="w-full flex items-center justify-center gap-2 bg-amber-500/[0.07] border border-amber-500/20 text-amber-300 text-[13px] font-semibold py-3.5 rounded-xl hover:bg-amber-500/[0.12] transition-all duration-200 active:scale-[0.98] group"
        >
          <Cpu size={13} weight="light" />
          Send to Supervisor · HITL Required
          <ArrowRight
            size={11}
            weight="bold"
            className="group-hover:translate-x-0.5 transition-transform duration-200 ml-auto"
          />
        </button>
      </div>
    </div>
  );
}

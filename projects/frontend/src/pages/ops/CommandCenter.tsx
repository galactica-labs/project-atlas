import { ArrowRight, ArrowUpRight, Brain, Warning } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
} from "recharts";
import CommandCenterZoneView from "../../components/ops/CommandCenterZoneView";
import { DATACENTER_FLOORS, type FloorKey } from "../../components/ops/commandCenterLayout";
import { useApp } from "../../store/appStore";
import AnomalyPanel from "./AnomalyPanel";

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const h = t.getHours().toString().padStart(2, "0"),
    m = t.getMinutes().toString().padStart(2, "0"),
    s = t.getSeconds().toString().padStart(2, "0");
  return (
    <span className="font-mono text-[11px] text-zinc-500 tabular-nums tracking-[0.08em]">
      {h}:{m}:{s}
    </span>
  );
}

function useCountUp(target: number, d = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let f: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / d, 1);
      setCount(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) f = requestAnimationFrame(tick);
    };
    f = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(f);
  }, [target, d]);
  return count;
}

export default function CommandCenter() {
  const { assets, incidents, activeIncidentId, setActiveIncident, cascadeDelays, liveChart } =
    useApp();
  const navigate = useNavigate();
  const [litNodes, setLitNodes] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const [activeFloor, setActiveFloor] = useState<FloorKey>("Mechanical");

  const incident = incidents.find((i) => i.id === activeIncidentId);
  const criticalIncident = incidents.find((i) => i.severity === "critical");

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!incident) {
      setLitNodes(new Set());
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    incident.blastRadius.forEach((id) => {
      timers.push(
        setTimeout(
          () => setLitNodes((prev) => new Set([...prev, id])),
          (cascadeDelays[id] ?? 5) * 400
        )
      );
    });
    return () => {
      timers.forEach(clearTimeout);
      setLitNodes(new Set());
    };
  }, [incident, cascadeDelays]);

  const online = assets.filter((a) => a.status !== "offline").length;
  const activeInc = incidents.filter((i) => i.status !== "resolved").length;
  const hitlPending = incidents.filter((i) => i.status === "hitl-pending").length;
  const ttf = criticalIncident ? Math.max(0, criticalIncident.ttf - Math.floor(tick / 60)) : 0;

  const onlineCount = useCountUp(online);
  const incCount = useCountUp(activeInc);

  const kpis = [
    {
      label: "Online",
      value: `${onlineCount}/${assets.length}`,
      colorClass: "text-emerald-400",
      accentColor: "bg-emerald-500",
      glow: "rgba(52,211,153,0.08)",
    },
    {
      label: "Incidents",
      value: String(incCount),
      colorClass: activeInc > 0 ? "text-red-400" : "text-emerald-400",
      accentColor: activeInc > 0 ? "bg-red-500" : "bg-emerald-500",
      glow: activeInc > 0 ? "rgba(239,68,68,0.10)" : "rgba(52,211,153,0.06)",
    },
    {
      label: "Approvals",
      value: String(hitlPending),
      colorClass: hitlPending > 0 ? "text-amber-400" : "text-zinc-500",
      accentColor: hitlPending > 0 ? "bg-amber-500" : "bg-zinc-700",
      glow: hitlPending > 0 ? "rgba(245,158,11,0.08)" : "transparent",
    },
    {
      label: "PUE",
      value: "1.38",
      colorClass: "text-sky-400",
      accentColor: "bg-sky-500",
      glow: "rgba(56,189,248,0.06)",
    },
  ];

  return (
    <div className="flex md:h-full bg-[#050505] md:overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 md:overflow-hidden">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="px-5 pt-3.5 pb-3 border-b border-white/[0.05] flex-shrink-0">
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Live badge */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-emerald-500 font-mono">
                  Live
                </span>
              </div>

              <span className="hidden sm:block w-px h-3.5 bg-white/[0.08]" />

              {/* Facility identity */}
              <div className="hidden sm:flex items-center gap-2 text-[11px]">
                <span className="text-zinc-500 font-mono tracking-wider">DC-01</span>
                <span className="text-zinc-700">·</span>
                <span className="text-zinc-400">Facility Alpha</span>
              </div>

              {/* Critical badge */}
              {criticalIncident && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/[0.08] border border-red-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-pulse-red" />
                  <span className="text-[9px] text-red-400 font-bold uppercase tracking-[0.16em] font-mono">
                    1 Critical
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <LiveClock />
              <button
                type="button"
                onClick={() => navigate("/ops/incidents")}
                className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors duration-200 font-mono"
              >
                All incidents <ArrowUpRight size={9} weight="bold" />
              </button>
            </div>
          </div>

          {/* KPI tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {kpis.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="relative overflow-hidden bg-[#070707] rounded-xl border border-white/[0.06] px-3.5 py-3"
                style={{ boxShadow: `0 0 24px ${k.glow}, inset 0 1px 0 rgba(255,255,255,0.03)` }}
              >
                {/* Left accent bar */}
                <div
                  className={`absolute left-0 inset-y-3 w-[2.5px] rounded-r-full opacity-75 ${k.accentColor}`}
                />
                <p
                  className={`text-[24px] font-semibold tracking-[-0.04em] tabular-nums leading-none ${k.colorClass}`}
                >
                  {k.value}
                </p>
                <p className="text-[9px] text-zinc-600 mt-1.5 font-mono uppercase tracking-[0.12em] leading-none">
                  {k.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Critical banner ───────────────────────────────────── */}
        {criticalIncident && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setActiveIncident(criticalIncident.id)}
            className="mx-5 mt-2.5 flex-shrink-0 text-left"
          >
            <div className="relative overflow-hidden rounded-xl border border-red-500/25 hover:border-red-500/45 bg-[#0c0505] transition-all duration-300 group">
              {/* Scan line */}
              <div className="scan-line opacity-25" />
              {/* Left edge */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-red-500/90 via-red-500/50 to-transparent" />
              {/* Top glow line */}
              <div className="absolute top-0 left-6 right-0 h-px bg-gradient-to-r from-red-500/35 to-transparent" />

              <div className="flex items-center gap-3 px-4 py-2.5 pl-5">
                <Warning size={12} weight="fill" className="text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white leading-none">
                    CHILLER-A-03 — CHW supply rising · compressor at 97%
                  </p>
                  <p className="text-[9px] text-zinc-600 mt-0.5 font-mono leading-none">
                    <span className="text-red-400 font-bold tabular-nums">{ttf}m</span> to threshold
                    ·{" "}
                    <span className="text-amber-400">
                      {(criticalIncident.confidence * 100).toFixed(0)}% confidence
                    </span>{" "}
                    · 8 systems at risk
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[9px] text-red-400 font-semibold font-mono uppercase tracking-widest">
                    View
                  </span>
                  <ArrowRight
                    size={9}
                    weight="bold"
                    className="text-red-400 group-hover:translate-x-0.5 transition-transform duration-200"
                  />
                </div>
              </div>
            </div>
          </motion.button>
        )}

        {/* ── Floor selector tabs ───────────────────────────────── */}
        <div className="mx-5 mt-2.5 flex-shrink-0">
          <div className="flex items-center gap-1 p-1 bg-[#070707] rounded-xl border border-white/[0.05]">
            {(
              Object.entries(DATACENTER_FLOORS) as [
                FloorKey,
                (typeof DATACENTER_FLOORS)[FloorKey],
              ][]
            ).map(([key, cfg]) => {
              const isActive = activeFloor === key;
              const hasAlert = !!(key === "Mechanical" && criticalIncident);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFloor(key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-[10px] text-[10px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.07] text-white border border-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-opacity duration-200 ${
                      hasAlert ? "bg-red-400 status-pulse-red" : cfg.indicatorColor
                    } ${isActive ? "opacity-90" : "opacity-40"}`}
                  />
                  <span className="font-mono tracking-wider">{cfg.shortLabel}</span>
                  <span className="hidden md:block text-[9px] opacity-50">{cfg.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main canvas + right panel ─────────────────────────── */}
        <div
          className="flex flex-col lg:grid md:flex-1 md:min-h-0 mt-2.5 mx-5 mb-5 gap-3 md:overflow-hidden"
          style={{ gridTemplateColumns: "1fr 306px" }}
        >
          {/* Zone visualization */}
          <div
            className="relative rounded-2xl overflow-hidden border border-white/[0.05] bg-[#050708]"
            style={{ minHeight: "300px" }}
          >
            {/* Corner targeting brackets */}
            <span className="pointer-events-none absolute top-2.5 left-2.5 w-5 h-5 border-t border-l border-white/[0.15] rounded-tl z-10" />
            <span className="pointer-events-none absolute top-2.5 right-2.5 w-5 h-5 border-t border-r border-white/[0.15] rounded-tr z-10" />
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 w-5 h-5 border-b border-l border-white/[0.15] rounded-bl z-10" />
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 w-5 h-5 border-b border-r border-white/[0.15] rounded-br z-10" />

            <CommandCenterZoneView
              assets={assets}
              incident={incident}
              litNodes={litNodes}
              activeFloor={activeFloor}
              onAssetClick={(id) => {
                const inc = incidents.find((i) => i.assetId === id || i.blastRadius.includes(id));
                if (inc) setActiveIncident(inc.id);
              }}
            />
          </div>

          {/* ── Right panel ───────────────────────────────────── */}
          <div className="flex flex-col gap-2.5 md:min-h-0 md:overflow-hidden">
            {/* Telemetry chart */}
            <div
              className="rounded-2xl border border-white/[0.05] bg-[#060607] flex-shrink-0 overflow-hidden"
              style={{ height: 186 }}
            >
              <div className="px-4 pt-3 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 status-pulse-red" />
                    <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.14em]">
                      CHILLER-A-03 · CHW Temp
                    </p>
                  </div>
                  <span className="text-[11px] text-red-400 font-mono font-bold tabular-nums">
                    {(
                      liveChart[liveChart.length - 1]?.chwTemp ??
                      assets.find((a) => a.id === "chiller-a-03")?.telemetry[0].value ??
                      0
                    ).toFixed(1)}
                    °C
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={152}>
                <AreaChart data={liveChart} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
                    interval={8}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReTooltip
                    contentStyle={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      fontSize: 10,
                    }}
                  />
                  <ReferenceLine
                    x={liveChart[Math.floor(liveChart.length / 2)]?.time}
                    stroke="rgba(239,68,68,0.22)"
                    strokeDasharray="3 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="chwTemp"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    fill="url(#g1)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Active incidents + agent pipeline */}
            <div className="flex-1 rounded-2xl border border-white/[0.05] bg-[#060607] overflow-hidden flex flex-col">
              {/* Section header */}
              <div className="px-4 pt-3 pb-2 border-b border-white/[0.04] flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-[2px] h-3.5 rounded-full bg-red-500/60" />
                  <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.15em]">
                    Active Incidents
                  </p>
                </div>
                <span className="text-[8px] font-mono text-zinc-700">{incidents.length} open</span>
              </div>

              <div
                className="md:flex-1 max-h-72 md:max-h-none overflow-y-auto p-3 space-y-2"
                style={{ scrollbarWidth: "none" }}
              >
                <AnimatePresence>
                  {incidents.map((inc, i) => {
                    const asset = assets.find((a) => a.id === inc.assetId);
                    const isCrit = inc.severity === "critical";
                    return (
                      <motion.button
                        key={inc.id}
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                        onClick={() => setActiveIncident(inc.id)}
                        className={`w-full text-left rounded-xl border overflow-hidden transition-all duration-300 ${
                          isCrit
                            ? "border-red-500/22 bg-red-500/[0.04] hover:border-red-500/45 hover:bg-red-500/[0.07]"
                            : "border-amber-500/18 bg-amber-500/[0.03] hover:border-amber-500/38 hover:bg-amber-500/[0.06]"
                        }`}
                      >
                        {/* Top accent gradient */}
                        <div
                          className={`h-px w-full ${
                            isCrit
                              ? "bg-gradient-to-r from-red-500/50 to-transparent"
                              : "bg-gradient-to-r from-amber-500/40 to-transparent"
                          }`}
                        />
                        <div className="px-3 py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Warning
                                size={10}
                                weight="fill"
                                className={isCrit ? "text-red-400" : "text-amber-400"}
                              />
                              <p className="text-[11px] font-semibold text-white truncate">
                                {asset?.name}
                              </p>
                            </div>
                            <p
                              className={`text-[13px] font-bold font-mono tabular-nums flex-shrink-0 ${
                                isCrit ? "text-red-400" : "text-amber-400"
                              }`}
                            >
                              {inc.ttf}m
                            </p>
                          </div>
                          <p className="text-[9px] text-zinc-600 mt-1 font-mono leading-none">
                            {inc.detectedAt} · {asset?.zone} · {asset?.floor}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>

                {/* Agent pipeline mini-vis */}
                <div className="mt-1 rounded-xl border border-white/[0.05] bg-white/[0.015]">
                  <div className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Brain size={9} weight="light" className="text-zinc-600" />
                      <p className="text-[8px] text-zinc-600 font-mono uppercase tracking-[0.15em]">
                        Agent Pipeline
                      </p>
                    </div>
                    <div className="flex items-center">
                      {[
                        { name: "Sentinel", short: "SEN", color: "#3b82f6", done: true },
                        { name: "Triton", short: "TRI", color: "#8b5cf6", done: true },
                        { name: "Hephaestus", short: "HEP", color: "#f97316", done: true },
                        { name: "Hermes", short: "HRM", color: "#10b981", done: true },
                        { name: "Mnemos", short: "MNM", color: "#f59e0b", done: false },
                      ].map((a, i) => (
                        <div key={a.name} className="flex items-center flex-1 min-w-0">
                          {i > 0 && (
                            <div
                              className="flex-1 h-px"
                              style={{
                                background: a.done
                                  ? `linear-gradient(90deg, ${a.color}60, ${a.color}30)`
                                  : "rgba(255,255,255,0.06)",
                              }}
                            />
                          )}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: a.done ? a.color : "transparent",
                                border: `1.5px solid ${a.done ? a.color : "rgba(255,255,255,0.12)"}`,
                                boxShadow: a.done ? `0 0 7px ${a.color}55` : "none",
                              }}
                            />
                            <span className="text-[6px] text-zinc-700 font-mono leading-none">
                              {a.short}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="p-3 pt-0 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => navigate("/ops/dispatch")}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/[0.07] bg-white/[0.02] text-[9px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] hover:border-white/[0.11] transition-all duration-200 font-mono uppercase tracking-widest"
                >
                  Dispatch Plan <ArrowRight size={8} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly panel */}
      {activeIncidentId && (
        <AnomalyPanel incidentId={activeIncidentId} onClose={() => setActiveIncident(null)} />
      )}
    </div>
  );
}

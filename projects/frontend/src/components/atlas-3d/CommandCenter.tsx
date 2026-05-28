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
import { CommandCenterFloorGraph } from "../../components/atlas-3d/CommandCenterFloorGraph";
import {
  DATACENTER_FLOORS,
  type FloorKey,
  ZONE_INDICATOR_COLORS,
} from "../../components/atlas-3d/commandCenterFloorData";
import { cascadeDelays, telemetryHistory } from "../../data/mock";
import AnomalyPanel from "../../pages/ops/AnomalyPanel";
import { useApp } from "../../store/appStore";

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
    <span className="font-mono text-[11px] text-zinc-600 tabular-nums tracking-widest">
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

const chartData = telemetryHistory.slice(18);

export default function CommandCenter() {
  const { assets, incidents, activeIncidentId, setActiveIncident } = useApp();
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
  }, [incident]);

  const online = assets.filter((a) => a.status !== "offline").length;
  const activeInc = incidents.filter((i) => i.status !== "resolved").length;
  const hitlPending = incidents.filter((i) => i.status === "hitl-pending").length;
  const ttf = criticalIncident ? Math.max(0, criticalIncident.ttf - Math.floor(tick / 60)) : 0;

  const onlineCount = useCountUp(online);
  const incCount = useCountUp(activeInc);

  const kpis = [
    { label: "Online", value: `${onlineCount}/${assets.length}`, color: "emerald" },
    { label: "Incidents", value: String(incCount), color: activeInc > 0 ? "red" : "emerald" },
    { label: "Approvals", value: String(hitlPending), color: hitlPending > 0 ? "amber" : "zinc" },
    { label: "PUE", value: "1.38", color: "blue" },
  ];

  const colorMap: Record<string, string> = {
    emerald: "text-emerald-300",
    red: "text-red-300",
    amber: "text-amber-300",
    blue: "text-blue-300",
    zinc: "text-zinc-400",
  };

  const floorZones = Object.entries(DATACENTER_FLOORS[activeFloor].zones);

  return (
    <div className="flex h-full bg-[#050505] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 md:px-5 pt-3 md:pt-4 pb-3 border-b border-white/[0.05] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-emerald-500">
                Live
              </span>
              <span className="hidden sm:block w-px h-3 bg-white/[0.08]" />
              <span className="hidden sm:block text-[11px] text-zinc-400 font-medium">
                Facility Alpha
              </span>
              <span className="hidden sm:block text-[11px] text-zinc-700">·</span>
              <span className="hidden sm:block text-[11px] text-zinc-600 font-mono">DC-01</span>
              {criticalIncident && (
                <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />1 Critical
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LiveClock />
              <button
                type="button"
                onClick={() => navigate("/ops/incidents")}
                className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors duration-200"
              >
                All incidents <ArrowUpRight size={9} weight="bold" />
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {kpis.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="bg-white/[0.02] rounded-xl px-3.5 py-2.5 ring-1 ring-white/[0.06]"
              >
                <p
                  className={`text-[20px] font-semibold tracking-tighter tabular-nums leading-none ${colorMap[k.color]}`}
                >
                  {k.value}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 leading-none">{k.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Critical banner */}
        {criticalIncident && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setActiveIncident(criticalIncident.id)}
            className="mx-4 md:mx-5 mt-2.5 flex-shrink-0"
          >
            <div className="relative overflow-hidden p-[1.5px] rounded-xl bg-red-500/[0.05] ring-1 ring-red-500/25 hover:ring-red-500/50 transition-all duration-300">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500/60 rounded-l-sm" />
              <div className="bg-red-500/[0.03] rounded-[10px] px-4 py-2 flex items-center gap-3">
                <Warning size={12} weight="fill" className="text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] font-semibold text-white leading-none">
                    CHILLER-A-03 — CHW supply rising · compressor at 97%
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-none">
                    <span className="text-red-400 font-bold font-mono tabular-nums">{ttf}m</span> to
                    threshold ·{" "}
                    <span className="text-amber-400">
                      {(criticalIncident.confidence * 100).toFixed(0)}%
                    </span>{" "}
                    confidence
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[9px] text-red-400 font-semibold">Investigate</span>
                  <ArrowRight size={9} weight="bold" className="text-red-400" />
                </div>
              </div>
            </div>
          </motion.button>
        )}

        {/* Floor selector tabs */}
        <div className="mx-4 md:mx-5 mt-2.5 flex-shrink-0">
          <div className="flex items-center gap-1 p-1 bg-white/[0.02] rounded-xl ring-1 ring-white/[0.05]">
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
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.08] text-white ring-1 ring-white/[0.10]"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasAlert ? "bg-red-400 animate-pulse" : cfg.indicatorColor} opacity-70`}
                  />
                  <span className="hidden sm:block font-mono">{cfg.shortLabel}</span>
                  <span className="hidden md:block text-[9px] opacity-70">{cfg.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main: canvas + right panel */}
        <div
          className="flex-1 flex flex-col lg:grid min-h-0 mt-2.5 mx-4 md:mx-5 mb-4 md:mb-5 gap-3 overflow-hidden"
          style={{ gridTemplateColumns: "1fr 320px" }}
        >
          {/* 3D floor graph */}
          <div
            className="relative rounded-2xl overflow-hidden ring-1 ring-white/[0.05] bg-[#060606]"
            style={{ minHeight: "300px" }}
          >
            <CommandCenterFloorGraph
              assets={assets}
              incident={incident}
              litNodes={litNodes}
              activeFloor={activeFloor}
              onAssetClick={(id) => {
                const inc = incidents.find((i) => i.assetId === id || i.blastRadius.includes(id));
                if (inc) setActiveIncident(inc.id);
              }}
            />

            {/* Floor label */}
            <div className="absolute top-3 left-3 max-w-[260px] pointer-events-none">
              <div className="rounded-xl border border-white/[0.06] bg-black/45 px-3 py-2 backdrop-blur-sm">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                  {DATACENTER_FLOORS[activeFloor].label}
                </span>
                <p className="mt-1 text-[11px] font-medium text-zinc-200">
                  {DATACENTER_FLOORS[activeFloor].subtitle}
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
                  Zones are labeled by operational role, and node icons now identify the machine
                  category on the map.
                </p>
              </div>
            </div>

            {/* Zone legend */}
            <div className="absolute bottom-3 left-3 max-w-[320px] pointer-events-none">
              <div className="rounded-xl border border-white/[0.06] bg-black/45 px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-zinc-600">
                  Zone Functions
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {floorZones.map(([zoneName, zoneCfg]) => (
                    <div key={zoneName} className="flex items-start gap-2">
                      <div
                        className={`mt-1.5 h-1.5 w-1.5 rounded-full ${ZONE_INDICATOR_COLORS[zoneCfg.zone] ?? "bg-zinc-500"} opacity-90`}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium leading-none text-zinc-200">
                          {zoneName}
                        </p>
                        <p className="mt-1 text-[9px] leading-relaxed text-zinc-500">
                          {zoneCfg.purpose}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-2.5 min-h-0 overflow-hidden">
            {/* Telemetry chart */}
            <div
              className="rounded-2xl ring-1 ring-white/[0.05] bg-[#060606] flex-shrink-0"
              style={{ height: 190 }}
            >
              <div className="px-4 pt-3 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                    <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">
                      CHILLER-A-03 · CHW Temp
                    </p>
                  </div>
                  <span className="text-[10px] text-red-400 font-mono font-bold tabular-nums">
                    {assets.find((a) => a.id === "chiller-a-03")?.telemetry[0].value.toFixed(1)}°C
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={155}>
                <AreaChart data={chartData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 7, fill: "#52525b", fontFamily: "monospace" }}
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
                    x={chartData[18]?.time}
                    stroke="rgba(239,68,68,0.3)"
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

            {/* Incidents */}
            <div className="flex-1 rounded-2xl ring-1 ring-white/[0.05] bg-[#060606] overflow-hidden flex flex-col">
              <div className="px-4 pt-3 pb-2 border-b border-white/[0.05] flex-shrink-0">
                <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">
                  Active Incidents
                </p>
              </div>
              <div
                className="flex-1 overflow-y-auto p-3 space-y-2"
                style={{ scrollbarWidth: "none" }}
              >
                <AnimatePresence>
                  {incidents.map((inc, i) => {
                    const asset = assets.find((a) => a.id === inc.assetId);
                    const isCrit = inc.severity === "critical";
                    return (
                      <motion.button
                        key={inc.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                        onClick={() => setActiveIncident(inc.id)}
                        className={`w-full text-left p-[1.5px] rounded-xl ring-1 transition-all duration-300 ${isCrit ? "ring-red-500/28 bg-red-500/[0.04] hover:ring-red-500/50" : "ring-amber-500/22 bg-amber-500/[0.03] hover:ring-amber-500/40"}`}
                      >
                        <div className="rounded-[10px] px-3 py-2.5">
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
                              className={`text-[12px] font-bold font-mono tabular-nums ${isCrit ? "text-red-400" : "text-amber-400"}`}
                            >
                              {inc.ttf}m
                            </p>
                          </div>
                          <p className="text-[9px] text-zinc-600 mt-1 leading-none">
                            {inc.detectedAt} · {asset?.zone} · {asset?.floor}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>

                {/* Agent pipeline */}
                <div className="mt-1 p-[1.5px] bg-white/[0.01] rounded-xl ring-1 ring-white/[0.05]">
                  <div className="rounded-[10px] px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain size={9} weight="light" className="text-zinc-600" />
                      <p className="text-[8px] text-zinc-700 font-mono uppercase tracking-wider">
                        Agent Pipeline
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { name: "Sentinel", color: "bg-blue-500", done: true },
                        { name: "Triton", color: "bg-violet-500", done: true },
                        { name: "Hephaestus", color: "bg-orange-500", done: true },
                        { name: "Hermes", color: "bg-emerald-500", done: true },
                        { name: "Mnemos", color: "bg-amber-500", done: false },
                      ].map((a, i) => (
                        <div key={a.name} className="flex items-center gap-0.5">
                          {i > 0 && <div className="w-2.5 h-px bg-white/[0.07]" />}
                          <div className="flex flex-col items-center gap-0.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${a.done ? a.color : "bg-zinc-700"} ${a.done ? "opacity-80" : "opacity-30"}`}
                            />
                            <span className="text-[6px] text-zinc-700 font-mono">{a.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 pt-0">
                <button
                  type="button"
                  onClick={() => navigate("/ops/dispatch")}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/[0.07] bg-white/[0.02] text-[11px] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all duration-200"
                >
                  Dispatch Plan <ArrowRight size={9} weight="bold" />
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

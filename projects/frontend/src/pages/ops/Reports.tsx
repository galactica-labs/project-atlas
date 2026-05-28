import { ChartLine, CheckCircle, Lightning, Thermometer, Warning } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  assets,
  forecastData,
  incidents,
  jobs,
  technicians,
  telemetryHistory,
} from "../../data/mock";

// ── Derived data ──────────────────────────────────────────────────────────

const healthByFloor = (["Mechanical", "Hall A", "Hall B"] as const).map((floor) => {
  const floorAssets = assets.filter((a) => a.floor === floor);
  return {
    floor: floor === "Mechanical" ? "Mech" : floor,
    normal: floorAssets.filter((a) => a.status === "normal").length,
    warning: floorAssets.filter((a) => a.status === "warning").length,
    critical: floorAssets.filter((a) => a.status === "critical").length,
    offline: floorAssets.filter((a) => a.status === "offline").length,
  };
});

const thermalTrend = telemetryHistory.slice(30).map((t) => ({
  time: t.time,
  temp: t.chwTemp,
  baseline: t.baseline,
}));

const pueTrend = Array.from({ length: 18 }, (_, i) => ({
  time: `${String(6 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
  pue: parseFloat((1.34 + Math.sin(i * 0.4) * 0.04 + (i > 12 ? (i - 12) * 0.004 : 0)).toFixed(3)),
  target: 1.38,
}));

const cascadeRisk = [
  { asset: "CHW-03", delay: 0, risk: 100, color: "#ef4444" },
  { asset: "P-03", delay: 4, risk: 88, color: "#ef4444" },
  { asset: "P-04", delay: 6, risk: 82, color: "#f97316" },
  { asset: "CRAH-B1", delay: 11, risk: 74, color: "#f97316" },
  { asset: "CRAH-B2", delay: 12, risk: 70, color: "#f59e0b" },
  { asset: "POD-05", delay: 18, risk: 58, color: "#f59e0b" },
  { asset: "POD-06", delay: 22, risk: 45, color: "#eab308" },
];

// ── Report definitions ────────────────────────────────────────────────────

const REPORTS = [
  {
    id: "health",
    title: "Asset Health Summary",
    subtitle: "Status by floor & type",
    icon: <CheckCircle size={11} weight="fill" className="text-emerald-400" />,
    tag: "Health",
    tagColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.07]",
    accentColor: "#10b981",
    meta: "All floors · Live",
  },
  {
    id: "thermal",
    title: "Thermal Trend Analysis",
    subtitle: "CHW supply temp vs baseline",
    icon: <Thermometer size={11} weight="fill" className="text-red-400" />,
    tag: "Thermal",
    tagColor: "text-red-400 border-red-500/20 bg-red-500/[0.07]",
    accentColor: "#ef4444",
    meta: "CHILLER-A-03 · 24h",
  },
  {
    id: "pue",
    title: "PUE & Power Efficiency",
    subtitle: "Power usage effectiveness",
    icon: <Lightning size={11} weight="fill" className="text-sky-400" />,
    tag: "Power",
    tagColor: "text-sky-400 border-sky-500/20 bg-sky-500/[0.07]",
    accentColor: "#38bdf8",
    meta: "DC-01 · 9h rolling",
  },
  {
    id: "cascade",
    title: "Cascade Risk Profile",
    subtitle: "Failure propagation timeline",
    icon: <Warning size={11} weight="fill" className="text-amber-400" />,
    tag: "Risk",
    tagColor: "text-amber-400 border-amber-500/20 bg-amber-500/[0.07]",
    accentColor: "#f59e0b",
    meta: "inc-001 · Active",
  },
  {
    id: "dispatch",
    title: "Dispatch & Field Ops",
    subtitle: "Job status, technician coverage",
    icon: <ChartLine size={11} weight="fill" className="text-violet-400" />,
    tag: "Ops",
    tagColor: "text-violet-400 border-violet-500/20 bg-violet-500/[0.07]",
    accentColor: "#8b5cf6",
    meta: "Live",
  },
];

// ── Custom tooltip ────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg px-2.5 py-2 text-[9px] font-mono">
      <p className="text-zinc-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color ?? "#a1a1aa" }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ── Report content panels ─────────────────────────────────────────────────

function ReportHealth() {
  const total = assets.length;
  const critical = assets.filter((a) => a.status === "critical").length;
  const warning = assets.filter((a) => a.status === "warning").length;
  const normal = assets.filter((a) => a.status === "normal").length;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Total Assets", value: total, color: "text-zinc-200", accent: "#71717a" },
          { label: "Normal", value: normal, color: "text-emerald-400", accent: "#10b981" },
          { label: "Warning", value: warning, color: "text-amber-400", accent: "#f59e0b" },
          { label: "Critical", value: critical, color: "text-red-400", accent: "#ef4444" },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#070707] px-3.5 py-3"
            style={{ boxShadow: `0 0 20px ${k.accent}14` }}
          >
            <div
              className="absolute left-0 inset-y-3 w-[2.5px] rounded-r-full"
              style={{ backgroundColor: k.accent }}
            />
            <p
              className={`text-[26px] font-semibold tracking-[-0.04em] tabular-nums leading-none ${k.color}`}
            >
              {k.value}
            </p>
            <p className="text-[8px] text-zinc-600 mt-1.5 font-mono uppercase tracking-[0.12em]">
              {k.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#060607] overflow-hidden">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-[2px] h-3 rounded-full bg-emerald-500/60" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
              Asset Status by Floor
            </span>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: "Normal", color: "#10b981" },
              { label: "Warning", color: "#f59e0b" },
              { label: "Critical", color: "#ef4444" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-[7px] font-mono text-zinc-700">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={healthByFloor}
            margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
            barGap={2}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="floor"
              tick={{ fontSize: 8, fill: "#52525b", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <ReTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="normal" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={24} />
            <Bar dataKey="warning" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={24} />
            <Bar dataKey="critical" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* incident summary */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#060607] px-4 py-3">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-[2px] h-3 rounded-full bg-red-500/60" />
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
            Open Incidents
          </span>
        </div>
        {incidents.map((inc) => {
          const asset = assets.find((a) => a.id === inc.assetId);
          return (
            <div
              key={inc.id}
              className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0"
            >
              <Warning
                size={9}
                weight="fill"
                className={inc.severity === "critical" ? "text-red-400" : "text-amber-400"}
              />
              <span className="text-[10px] font-mono text-zinc-300 font-semibold flex-1">
                {asset?.name}
              </span>
              <span className="text-[9px] font-mono text-zinc-600">{inc.detectedAt}</span>
              <span
                className={`text-[9px] font-mono font-bold tabular-nums ${inc.severity === "critical" ? "text-red-400" : "text-amber-400"}`}
              >
                {inc.ttf}m TTF
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportThermal() {
  const current = thermalTrend[thermalTrend.length - 1]?.temp ?? 11.2;
  const baseline = 7.2;
  const delta = (current - baseline).toFixed(1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            label: "Current Temp",
            value: `${current.toFixed(1)}°C`,
            color: "text-red-400",
            accent: "#ef4444",
          },
          { label: "Baseline", value: `${baseline}°C`, color: "text-zinc-400", accent: "#52525b" },
          { label: "Deviation", value: `+${delta}°C`, color: "text-amber-400", accent: "#f59e0b" },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#070707] px-3.5 py-3"
            style={{ boxShadow: `0 0 18px ${k.accent}12` }}
          >
            <div
              className="absolute left-0 inset-y-3 w-[2.5px] rounded-r-full"
              style={{ backgroundColor: k.accent }}
            />
            <p
              className={`text-[22px] font-semibold tracking-[-0.04em] tabular-nums leading-none font-mono ${k.color}`}
            >
              {k.value}
            </p>
            <p className="text-[8px] text-zinc-600 mt-1.5 font-mono uppercase tracking-[0.12em]">
              {k.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#060607] overflow-hidden">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-[2px] h-3 rounded-full bg-red-500/60" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
              CHILLER-A-03 · CHW Supply Temperature (°C)
            </span>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: "Actual", color: "#ef4444" },
              { label: "Baseline", color: "#3f3f46" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-3 h-px" style={{ backgroundColor: l.color }} />
                <span className="text-[7px] font-mono text-zinc-700">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={thermalTrend} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="thermalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
              interval={3}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[6, 13]}
              tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <ReTooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
            <ReferenceLine
              y={12.0}
              stroke="rgba(239,68,68,0.22)"
              strokeDasharray="3 3"
              label={{
                value: "12°C threshold",
                fill: "#ef444440",
                fontSize: 7,
                fontFamily: "monospace",
              }}
            />
            <Area
              type="monotone"
              dataKey="baseline"
              stroke="#3f3f46"
              strokeWidth={1}
              strokeDasharray="4 3"
              fill="none"
              dot={false}
              name="Baseline"
            />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#ef4444"
              strokeWidth={1.5}
              fill="url(#thermalGrad)"
              dot={false}
              name="Actual"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* forecast */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#060607] overflow-hidden">
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-[2px] h-3 rounded-full bg-violet-500/60" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
              Quantile Forecast (q05 / q50 / q95)
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={forecastData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="q95Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[10, 18]}
              tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <ReTooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
            <ReferenceLine y={12.0} stroke="rgba(239,68,68,0.22)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="q95"
              stroke="#8b5cf620"
              strokeWidth={1}
              fill="url(#q95Grad)"
              dot={false}
              name="q95"
            />
            <Area
              type="monotone"
              dataKey="q50"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              fill="none"
              dot={false}
              name="q50"
            />
            <Area
              type="monotone"
              dataKey="q05"
              stroke="#8b5cf640"
              strokeWidth={1}
              fill="none"
              dot={false}
              name="q05"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ReportPUE() {
  const latest = pueTrend[pueTrend.length - 1]?.pue ?? 1.38;
  const min = Math.min(...pueTrend.map((d) => d.pue)).toFixed(3);
  const max = Math.max(...pueTrend.map((d) => d.pue)).toFixed(3);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            label: "Current PUE",
            value: latest.toFixed(3),
            color: "text-sky-400",
            accent: "#38bdf8",
          },
          { label: "Min (9h)", value: min, color: "text-emerald-400", accent: "#10b981" },
          { label: "Max (9h)", value: max, color: "text-amber-400", accent: "#f59e0b" },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#070707] px-3.5 py-3"
            style={{ boxShadow: `0 0 18px ${k.accent}12` }}
          >
            <div
              className="absolute left-0 inset-y-3 w-[2.5px] rounded-r-full"
              style={{ backgroundColor: k.accent }}
            />
            <p
              className={`text-[22px] font-semibold tracking-[-0.04em] tabular-nums leading-none font-mono ${k.color}`}
            >
              {k.value}
            </p>
            <p className="text-[8px] text-zinc-600 mt-1.5 font-mono uppercase tracking-[0.12em]">
              {k.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#060607] overflow-hidden">
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-[2px] h-3 rounded-full bg-sky-500/60" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
              PUE Trend · 9h Rolling
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={pueTrend} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="pueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
              interval={3}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[1.3, 1.46]}
              tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <ReTooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
            <ReferenceLine
              y={1.38}
              stroke="rgba(56,189,248,0.22)"
              strokeDasharray="3 3"
              label={{
                value: "Target 1.38",
                fill: "#38bdf840",
                fontSize: 7,
                fontFamily: "monospace",
              }}
            />
            <Area
              type="monotone"
              dataKey="pue"
              stroke="#38bdf8"
              strokeWidth={1.5}
              fill="url(#pueGrad)"
              dot={false}
              name="PUE"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* power split */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#060607] px-4 py-3">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-[2px] h-3 rounded-full bg-sky-500/60" />
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
            Power Distribution
          </span>
        </div>
        <div className="space-y-2">
          {[
            { label: "IT Load", pct: 72, color: "#38bdf8" },
            { label: "Cooling", pct: 19, color: "#8b5cf6" },
            { label: "Lighting & Other", pct: 9, color: "#52525b" },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2.5">
              <span className="text-[8px] font-mono text-zinc-500 w-[120px] flex-shrink-0">
                {row.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${row.pct}%` }}
                  transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              </div>
              <span className="text-[9px] font-mono tabular-nums text-zinc-500 w-8 text-right">
                {row.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportCascade() {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-xl border border-red-500/25 bg-red-500/[0.04] px-4 py-3">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-500/35 to-transparent" />
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-red-500/80 via-red-500/40 to-transparent" />
        <div className="flex items-center gap-2 mb-1">
          <Warning size={10} weight="fill" className="text-red-400" />
          <span className="text-[10px] font-semibold text-red-300">
            CHILLER-A-03 · Active Failure Propagation
          </span>
          <span className="ml-auto text-[11px] font-mono font-bold text-red-400 tabular-nums">
            {incidents[0].ttf}m TTF
          </span>
        </div>
        <p className="text-[8px] text-zinc-500 leading-relaxed">
          {incidents[0].confidence * 100}% confidence · {incidents[0].blastRadius.length} assets at
          risk
        </p>
      </div>

      {/* cascade chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#060607] overflow-hidden">
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-[2px] h-3 rounded-full bg-amber-500/60" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
              Blast Radius · Risk by Cascade Delay (min)
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={cascadeRisk}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
          >
            <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 7, fill: "#3f3f46", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="asset"
              tick={{ fontSize: 8, fill: "#71717a", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <ReTooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="risk" radius={[0, 3, 3, 0]} maxBarSize={14} name="Risk %">
              {cascadeRisk.map((entry) => (
                <Cell key={entry.asset} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* timeline */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#060607] px-4 py-3">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-[2px] h-3 rounded-full bg-amber-500/60" />
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
            Propagation Timeline
          </span>
        </div>
        <div className="space-y-2">
          {cascadeRisk.map((entry, i) => (
            <motion.div
              key={entry.asset}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="flex items-center gap-3"
            >
              <span className="text-[8px] font-mono text-zinc-700 w-8 tabular-nums text-right flex-shrink-0">
                +{entry.delay}m
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[9px] font-mono text-zinc-400 flex-1">{entry.asset}</span>
              <div className="w-[60px] h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${entry.risk}%`, backgroundColor: entry.color }}
                />
              </div>
              <span
                className="text-[8px] font-mono tabular-nums w-8 text-right"
                style={{ color: entry.color }}
              >
                {entry.risk}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportDispatch() {
  const job = jobs[0];
  const tech = technicians.find((t) => t.id === job.technicianId);
  const completedSteps = job.steps.filter((s) => s.completed).length;
  const pct = Math.round((completedSteps / job.steps.length) * 100);

  return (
    <div className="space-y-5">
      {/* technician coverage */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#060607] px-4 py-3">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-[2px] h-3 rounded-full bg-violet-500/60" />
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
            Technician Status
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {technicians.map((t, i) => {
            const statusColor = { available: "#10b981", transit: "#38bdf8", "on-site": "#f59e0b" }[
              t.status
            ];
            const statusDot = {
              available: "bg-emerald-400",
              transit: "bg-sky-400",
              "on-site": "bg-amber-400",
            }[t.status];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                style={{ boxShadow: `0 0 16px ${statusColor}10` }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                    <span className="text-[7px] font-semibold text-zinc-300">{t.avatar}</span>
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                </div>
                <p className="text-[9px] font-semibold text-white leading-tight">{t.name}</p>
                <p className="text-[7px] font-mono mt-0.5" style={{ color: statusColor }}>
                  {t.status}
                </p>
                {t.eta && <p className="text-[7px] font-mono text-zinc-700 mt-0.5">{t.eta}</p>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* active job */}
      {job && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#060607] px-4 py-3">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-[2px] h-3 rounded-full bg-orange-500/60" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
              Active Job
            </span>
            <span className="ml-auto text-[8px] font-mono text-orange-400">{job.status}</span>
          </div>
          <p className="text-[11px] font-semibold text-white mb-1">{job.title}</p>
          {tech && (
            <p className="text-[8px] font-mono text-zinc-600 mb-2">
              Assigned to {tech.name} · ETA {job.eta}
            </p>
          )}

          {/* progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-wider">
                Progress
              </span>
              <span className="text-[8px] font-mono text-zinc-500 tabular-nums">
                {completedSteps}/{job.steps.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
              />
            </div>
          </div>

          {/* steps */}
          <div className="space-y-1.5">
            {job.steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${step.completed ? "bg-emerald-400" : "bg-zinc-700"}`}
                />
                <span
                  className={`text-[8px] font-mono leading-relaxed ${step.completed ? "text-zinc-600 line-through" : "text-zinc-400"}`}
                >
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* parts */}
          {job.partsRequired.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.05]">
              <p className="text-[7px] font-mono text-zinc-700 uppercase tracking-wider mb-1.5">
                Parts Required
              </p>
              <div className="flex flex-wrap gap-1.5">
                {job.partsRequired.map((p) => (
                  <span
                    key={p}
                    className="text-[7px] font-mono px-2 py-1 rounded-lg border border-white/[0.06] text-zinc-600"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

const REPORT_COMPONENTS: Record<string, React.ReactNode> = {
  health: <ReportHealth />,
  thermal: <ReportThermal />,
  pue: <ReportPUE />,
  cascade: <ReportCascade />,
  dispatch: <ReportDispatch />,
};

export default function Reports() {
  const [activeId, setActiveId] = useState("health");
  const activeReport = REPORTS.find((r) => r.id === activeId) ?? REPORTS[0];

  return (
    <div className="flex h-full bg-[#050505] overflow-hidden">
      {/* ── Left sidebar ─────────────────────────────────────────── */}
      <div className="w-[220px] flex-shrink-0 flex flex-col border-r border-white/[0.05] py-4 overflow-hidden">
        <div className="px-3 mb-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-[2px] h-3.5 rounded-full bg-violet-500/70" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.18em]">
              Reports
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: "none" }}>
          {REPORTS.map((report) => {
            const isActive = activeId === report.id;
            return (
              <button
                key={report.id}
                type="button"
                onClick={() => setActiveId(report.id)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 mb-1.5 transition-all duration-200 ${
                  isActive
                    ? "border-white/[0.10] bg-white/[0.04]"
                    : "border-transparent hover:border-white/[0.05] hover:bg-white/[0.02]"
                }`}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[2px] rounded-r-full"
                    style={{ backgroundColor: activeReport.accentColor }}
                  />
                )}
                <div className="flex items-center gap-2 mb-1">
                  {report.icon}
                  <span className="text-[9px] font-semibold text-zinc-300 flex-1 truncate">
                    {report.title}
                  </span>
                </div>
                <p className="text-[7px] font-mono text-zinc-700 ml-5">{report.subtitle}</p>
                <div className="mt-1.5 ml-5">
                  <span
                    className={`text-[7px] font-mono px-1.5 py-0.5 rounded-full border ${report.tagColor}`}
                  >
                    {report.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Report content ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* report header */}
        <div className="px-5 pt-4 pb-3.5 border-b border-white/[0.05] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {activeReport.icon}
              <div>
                <h2 className="text-[13px] font-semibold text-white">{activeReport.title}</h2>
                <p className="text-[9px] font-mono text-zinc-600 mt-0.5">{activeReport.meta}</p>
              </div>
            </div>
            <span
              className={`text-[8px] font-mono px-2 py-1 rounded-full border ${activeReport.tagColor}`}
            >
              {activeReport.tag}
            </span>
          </div>
        </div>

        {/* scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              {REPORT_COMPONENTS[activeId]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

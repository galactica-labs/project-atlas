import { ClockCountdown, Cpu, Pulse, WifiHigh } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface DataPacket {
  id: string;
  source: string;
  type: "telemetry" | "alert" | "heartbeat" | "command";
  payload: string;
  size: number;
  latency: number;
  timestamp: number;
}

const SOURCES = ["CRAH-A-01", "CHILLER-A-03", "UPS-01", "PDU-MAIN", "PUMP-CHW-03", "POD-02"];
const TYPES: DataPacket["type"][] = [
  "telemetry",
  "telemetry",
  "telemetry",
  "alert",
  "heartbeat",
  "command",
];
const TYPE_CONFIG = {
  telemetry: {
    color: "text-blue-400",
    bg: "bg-blue-500/[0.08]",
    ring: "ring-blue-500/20",
    dot: "bg-blue-400",
    label: "TELEMETRY",
  },
  alert: {
    color: "text-red-400",
    bg: "bg-red-500/[0.08]",
    ring: "ring-red-500/22",
    dot: "bg-red-400",
    label: "ALERT",
  },
  heartbeat: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/[0.06]",
    ring: "ring-emerald-500/18",
    dot: "bg-emerald-400",
    label: "HB",
  },
  command: {
    color: "text-amber-400",
    bg: "bg-amber-500/[0.08]",
    ring: "ring-amber-500/20",
    dot: "bg-amber-400",
    label: "CMD",
  },
};

function generatePacket(): DataPacket {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const payloads: Record<DataPacket["type"], string> = {
    telemetry: `{"temp":${(18 + Math.random() * 6).toFixed(1)},"fan":${Math.round(60 + Math.random() * 30)},"ts":${Date.now()}}`,
    alert: `{"severity":"${Math.random() > 0.5 ? "warning" : "critical"}","code":"THR_${Math.floor(Math.random() * 999)}"}`,
    heartbeat: `{"status":"ok","seq":${Math.floor(Math.random() * 99999)}}`,
    command: `{"cmd":"SET_SETPOINT","value":${(18 + Math.random() * 2).toFixed(1)}}`,
  };
  return {
    id: Math.random().toString(36).slice(2, 8),
    source,
    type,
    payload: payloads[type],
    size: Math.round(Math.random() * 400 + 64),
    latency: Math.round(Math.random() * 40 + 2),
    timestamp: Date.now(),
  };
}

export default function IngressViz() {
  const [packets, setPackets] = useState<DataPacket[]>([]);
  const [stats, setStats] = useState({ total: 0, rate: 0, errors: 0, avgLatency: 12 });
  const [chartData, setChartData] = useState<{ t: string; rate: number; errors: number }[]>([]);
  const [paused, setPaused] = useState(false);
  const rateRef = useRef(0);

  useEffect(() => {
    if (paused) return;
    let count = 0;
    const interval = setInterval(() => {
      const batch = Array.from({ length: Math.round(Math.random() * 4 + 1) }, generatePacket);
      count += batch.length;
      rateRef.current = count;
      setPackets((prev) => [...batch, ...prev].slice(0, 80));
      setStats((prev) => ({
        total: prev.total + batch.length,
        rate: Math.round(prev.rate * 0.8 + batch.length * 5 * 0.2),
        errors: prev.errors + (Math.random() < 0.03 ? 1 : 0),
        avgLatency: Math.round(prev.avgLatency * 0.9 + batch[0].latency * 0.1),
      }));
    }, 200);

    const chartInterval = setInterval(() => {
      setChartData((prev) =>
        [
          ...prev,
          {
            t: new Date().toLocaleTimeString("en", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            rate: rateRef.current * 5 + Math.round(Math.random() * 200),
            errors: Math.random() < 0.1 ? Math.round(Math.random() * 3) : 0,
          },
        ].slice(-40)
      );
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(chartInterval);
    };
  }, [paused]);

  const typeStats = (["telemetry", "alert", "heartbeat", "command"] as DataPacket["type"][]).map(
    (t) => ({
      type: t,
      count: packets.filter((p) => p.type === t).length,
    })
  );

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#050505] overflow-hidden">
      {/* Left: Stream feed — 45dvh on mobile, fixed 380px on desktop */}
      <div className="flex flex-col border-b md:border-b-0 md:border-r border-white/[0.05] flex-shrink-0 h-[45dvh] md:h-auto md:w-[380px]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.05] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${paused ? "bg-zinc-600" : "bg-emerald-400 animate-pulse"}`}
                />
                <span
                  className={`text-[9px] font-bold uppercase tracking-[0.18em] ${paused ? "text-zinc-600" : "text-emerald-500"}`}
                >
                  {paused ? "Paused" : "Live"}
                </span>
              </div>
              <h2 className="text-[16px] font-semibold tracking-tight">Ingress Stream</h2>
            </div>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ring-1 transition-all duration-200 ${paused ? "bg-emerald-500/[0.08] ring-emerald-500/25 text-emerald-400 hover:bg-emerald-500/[0.12]" : "bg-white/[0.04] ring-white/[0.08] text-zinc-400 hover:text-white"}`}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
          {/* Type breakdown */}
          <div className="flex gap-2 flex-wrap">
            {typeStats.map((ts) => {
              const cfg = TYPE_CONFIG[ts.type];
              return (
                <div
                  key={ts.type}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${cfg.bg} ring-1 ${cfg.ring}`}
                >
                  <div className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                  <span className={`text-[9px] font-mono font-bold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-[9px] font-mono text-zinc-600 tabular-nums">
                    {ts.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Packet stream */}
        <div
          className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono"
          style={{ scrollbarWidth: "none" }}
        >
          <AnimatePresence mode="popLayout">
            {packets.map((p) => {
              const cfg = TYPE_CONFIG[p.type];
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: -12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className={`flex items-start gap-2.5 px-3 py-2 rounded-xl ring-1 ${cfg.ring} bg-[#0a0a0a]`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] font-bold ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-[8px] text-zinc-700 tabular-nums">{p.latency}ms</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold not-italic block mt-0.5">
                      {p.source}
                    </span>
                    <span className="text-[8px] text-zinc-700 truncate block">{p.payload}</span>
                  </div>
                  <span className="text-[8px] text-zinc-800 tabular-nums flex-shrink-0 mt-0.5">
                    {p.size}B
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Metrics */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats bar */}
        <div className="px-4 md:px-6 pt-4 md:pt-5 pb-4 border-b border-white/[0.05] flex-shrink-0">
          <h1 className="text-[18px] md:text-[20px] font-semibold tracking-tight mb-3 md:mb-4">
            Ingress Telemetry
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {[
              {
                label: "Total Packets",
                value: stats.total.toLocaleString(),
                color: "text-white",
                icon: Pulse,
              },
              { label: "Rate", value: `${stats.rate}/s`, color: "text-blue-300", icon: WifiHigh },
              {
                label: "Avg Latency",
                value: `${stats.avgLatency}ms`,
                color: "text-zinc-300",
                icon: ClockCountdown,
              },
              {
                label: "Errors",
                value: String(stats.errors),
                color: stats.errors > 0 ? "text-red-300" : "text-zinc-600",
                icon: Cpu,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="bg-white/[0.02] rounded-xl p-3.5 ring-1 ring-white/[0.06]"
                >
                  <Icon size={13} weight="light" className="text-zinc-600 mb-2" />
                  <p
                    className={`text-[22px] font-semibold tracking-tighter tabular-nums font-mono leading-none ${s.color}`}
                  >
                    {s.value}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts */}
        <div
          className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Rate chart */}
          <div className="rounded-2xl ring-1 ring-white/[0.06] bg-[#0a0a0a] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-zinc-300">Message Rate</p>
              <span className="text-[10px] text-zinc-600 font-mono">/s</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 7, fill: "#52525b", fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                  interval={9}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    fontSize: 10,
                  }}
                />
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  fill="url(#rateGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Error rate chart */}
          <div className="rounded-2xl ring-1 ring-white/[0.06] bg-[#0a0a0a] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-zinc-300">Error Rate</p>
              <span className="text-[10px] text-emerald-500 font-mono">0.03% avg</span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 7, fill: "#52525b", fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                  interval={9}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="errors"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  fill="url(#errGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Source breakdown */}
          <div className="rounded-2xl ring-1 ring-white/[0.06] bg-[#0a0a0a] p-4">
            <p className="text-[11px] font-semibold text-zinc-300 mb-3">Source Breakdown</p>
            <div className="space-y-2">
              {SOURCES.map((src) => {
                const count = packets.filter((p) => p.source === src).length;
                const pct = Math.max(5, (count / Math.max(packets.length, 1)) * 100);
                return (
                  <div key={src} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-zinc-500 w-24 flex-shrink-0">
                      {src}
                    </span>
                    <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500/60 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 tabular-nums w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

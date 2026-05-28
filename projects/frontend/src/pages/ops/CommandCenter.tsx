import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "@xyflow/react/dist/style.css";
import { ArrowRight, ArrowUpRight, Brain, Square, Stack, Warning } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
} from "recharts";
import { AssetNode } from "../../components/nodes/AssetNode";
import { FloorNode } from "../../components/nodes/FloorNode";
import { type Asset, cascadeDelays, type Incident, telemetryHistory } from "../../data/mock";
import { useApp } from "../../store/appStore";
import AnomalyPanel from "./AnomalyPanel";

type ZoneVariant =
  | "a"
  | "b"
  | "mechanical"
  | "electrical"
  | "power"
  | "cooling"
  | "compute"
  | "network";

interface ZoneConfig {
  y: number;
  height: number;
  zone: ZoneVariant;
  label: string;
}

interface FloorConfig {
  label: string;
  subtitle: string;
  shortLabel: string;
  indicatorColor: string;
  zones: Record<string, ZoneConfig>;
}

type FloorKey = "Mechanical" | "Hall A" | "Hall B";

// ── Datacenter layout: 3 floors, each with named zones ──────────────
const DATACENTER_FLOORS: Record<FloorKey, FloorConfig> = {
  Mechanical: {
    label: "B1 – Mechanical Plant",
    subtitle: "Power / Cooling Infrastructure",
    shortLabel: "B1",
    indicatorColor: "bg-amber-500",
    zones: {
      Electrical: {
        y: 20,
        height: 200,
        zone: "electrical",
        label: "Electrical · Switchgear & Transformers",
      },
      "Backup Power": {
        y: 300,
        height: 200,
        zone: "power",
        label: "Backup Power · UPS & Generators",
      },
      "Chiller Plant": {
        y: 580,
        height: 400,
        zone: "cooling",
        label: "Chiller Plant · Chillers, Towers & Pumps",
      },
    },
  },
  "Hall A": {
    label: "F1 – Data Hall A",
    subtitle: "Primary Compute / CPU",
    shortLabel: "F1",
    indicatorColor: "bg-blue-500",
    zones: {
      "Cooling Bay A": {
        y: 20,
        height: 180,
        zone: "cooling",
        label: "Cooling Bay A · CRAH Units",
      },
      "Compute Row A": {
        y: 280,
        height: 280,
        zone: "compute",
        label: "Compute Row A · CPU Server Racks",
      },
      "Compute Row B": {
        y: 640,
        height: 280,
        zone: "compute",
        label: "Compute Row B · GPU Pods & Racks",
      },
      "Power & Network A": {
        y: 1000,
        height: 160,
        zone: "network",
        label: "Power & Network A · PDUs & Core Switches",
      },
    },
  },
  "Hall B": {
    label: "F2 – Data Hall B",
    subtitle: "HPC / GPU Cluster",
    shortLabel: "F2",
    indicatorColor: "bg-emerald-500",
    zones: {
      "Cooling Bay B": {
        y: 20,
        height: 180,
        zone: "cooling",
        label: "Cooling Bay B · CRAH Units",
      },
      "Compute Row C": {
        y: 280,
        height: 280,
        zone: "compute",
        label: "Compute Row C · GPU Pods",
      },
      "Compute Row D": {
        y: 640,
        height: 280,
        zone: "compute",
        label: "Compute Row D · Rack Compute",
      },
      "Power & Network B": {
        y: 1000,
        height: 160,
        zone: "network",
        label: "Power & Network B · PDUs & Dist. Switches",
      },
    },
  },
};

const nodeTypes = { assetNode: AssetNode, floorNode: FloorNode };

function buildNodes(
  assets: Asset[],
  incident: Incident | undefined,
  litNodes: Set<string>,
  ttf: number,
  activeFloor: FloorKey
): Node[] {
  const nodes: Node[] = [];
  const floorCfg = DATACENTER_FLOORS[activeFloor];
  const zones = floorCfg.zones;

  const floorAssets = assets.filter((a) => a.floor === activeFloor);

  const byZone: Record<string, Asset[]> = {};
  for (const a of floorAssets) {
    if (!byZone[a.zone]) byZone[a.zone] = [];
    byZone[a.zone].push(a);
  }

  for (const [zoneName, zoneCfg] of Object.entries(zones)) {
    const zoneAssets = byZone[zoneName] ?? [];
    nodes.push({
      id: `floor-${zoneName}`,
      type: "floorNode",
      position: { x: 20, y: zoneCfg.y + 20 },
      style: { width: 760, height: zoneCfg.height },
      data: { label: zoneCfg.label, zone: zoneCfg.zone, nodeCount: zoneAssets.length },
      selectable: false,
      draggable: false,
      zIndex: -1,
    });
  }

  for (const a of floorAssets) {
    const zoneCfg = zones[a.zone as keyof typeof zones];
    if (!zoneCfg) continue;

    const nodeX = 60 + (a.x / 100) * 640;
    const nodeY = zoneCfg.y + 50 + (a.y / 100) * (zoneCfg.height - 100);

    const isSource = incident?.assetId === a.id;
    const isBlast = litNodes.has(a.id);

    nodes.push({
      id: a.id,
      type: "assetNode",
      position: { x: nodeX, y: nodeY },
      data: {
        name: a.name,
        type: a.type,
        status: isSource ? "critical" : isBlast ? "warning" : a.status,
        telemetry: a.telemetry,
        isSource,
        isBlast,
        ttf: isSource ? ttf : undefined,
      },
      zIndex: isSource ? 10 : isBlast ? 8 : 1,
    });
  }

  return nodes;
}

function buildEdges(
  assets: Asset[],
  incident: Incident | undefined,
  litNodes: Set<string>,
  activeFloor: FloorKey
): Edge[] {
  const edges: Edge[] = [];

  const floorAssets = assets.filter((a) => a.floor === activeFloor);
  const floorIds = new Set(floorAssets.map((a) => a.id));

  for (const a of floorAssets) {
    for (const dep of a.dependsOn) {
      if (!floorIds.has(dep)) continue;
      const isBlastEdge =
        incident &&
        (litNodes.has(a.id) || a.id === incident.assetId) &&
        (litNodes.has(dep) || dep === incident.assetId);
      edges.push({
        id: `dep-${a.id}-${dep}`,
        source: dep,
        target: a.id,
        type: "default",
        animated: !!isBlastEdge,
        style: isBlastEdge
          ? { stroke: "rgba(251,146,60,0.55)", strokeWidth: 1.5, strokeDasharray: "5 4" }
          : { stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 },
        zIndex: isBlastEdge ? 5 : 0,
      });
    }
  }

  if (incident) {
    for (const tid of incident.blastRadius) {
      if (!floorIds.has(tid) || !floorIds.has(incident.assetId)) continue;
      if (
        edges.find(
          (e) =>
            (e.source === incident.assetId && e.target === tid) ||
            (e.source === tid && e.target === incident.assetId)
        )
      )
        continue;
      edges.push({
        id: `blast-${incident.assetId}-${tid}`,
        source: incident.assetId,
        target: tid,
        type: "default",
        animated: litNodes.has(tid),
        style: {
          stroke: litNodes.has(tid) ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.15)",
          strokeWidth: litNodes.has(tid) ? 1.5 : 1,
          strokeDasharray: "4 3",
        },
        zIndex: 6,
      });
    }
  }

  return edges;
}

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
  const [is3D, setIs3D] = useState(window.innerWidth >= 640);
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

  const nodes = useMemo(
    () => buildNodes(assets, incident, litNodes, ttf, activeFloor),
    [assets, incident, litNodes, ttf, activeFloor]
  );
  const edges = useMemo(
    () => buildEdges(assets, incident, litNodes, activeFloor),
    [assets, incident, litNodes, activeFloor]
  );

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    setFlowNodes(nodes);
  }, [nodes, setFlowNodes]);
  useEffect(() => {
    setFlowEdges(edges);
  }, [edges, setFlowEdges]);

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

  const zoneIndicatorColors: Record<string, string> = {
    electrical: "bg-yellow-400",
    power: "bg-orange-400",
    cooling: "bg-sky-400",
    compute: "bg-emerald-400",
    network: "bg-violet-400",
    mechanical: "bg-amber-400",
    a: "bg-blue-400",
    b: "bg-emerald-400",
  };

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
              <div className="hidden sm:flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg ring-1 ring-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIs3D(true)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-200 ${is3D ? "bg-white/[0.08] text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                >
                  <Stack size={10} weight="light" /> 3D
                </button>
                <button
                  type="button"
                  onClick={() => setIs3D(false)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-200 ${!is3D ? "bg-white/[0.08] text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                >
                  <Square size={10} weight="light" /> 2D
                </button>
              </div>
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
              const hasAlert = key === "Mechanical" && criticalIncident ? true : false;
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
          {/* Canvas */}
          <div
            className="relative rounded-2xl overflow-hidden ring-1 ring-white/[0.05] bg-[#060606]"
            style={{ minHeight: "300px" }}
          >
            {/* 3D perspective wrapper */}
            <div
              className="w-full h-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={is3D ? { perspective: "1400px", perspectiveOrigin: "50% 20%" } : {}}
            >
              <div
                className="w-full h-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={
                  is3D
                    ? {
                        transform: "rotateX(32deg) rotateZ(-6deg) scale(0.82)",
                        transformStyle: "preserve-3d",
                        transformOrigin: "50% 30%",
                      }
                    : { transform: "none" }
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFloor}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full"
                  >
                    <ReactFlow
                      nodes={flowNodes}
                      edges={flowEdges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      nodeTypes={nodeTypes}
                      onNodeClick={(_, node) => {
                        const inc = incidents.find(
                          (i) => i.assetId === node.id || i.blastRadius.includes(node.id)
                        );
                        if (inc) setActiveIncident(inc.id);
                      }}
                      fitView
                      fitViewOptions={{ padding: 0.12 }}
                      panOnDrag={!is3D}
                      zoomOnScroll={!is3D}
                      zoomOnPinch={!is3D}
                      nodesDraggable={false}
                      nodesConnectable={false}
                      defaultEdgeOptions={{ type: "default" }}
                      proOptions={{ hideAttribution: true }}
                    >
                      <Background
                        variant={BackgroundVariant.Dots}
                        gap={20}
                        size={0.5}
                        color="rgba(255,255,255,0.04)"
                      />
                      {!is3D && (
                        <Controls className="!bg-[#0a0a0a] !border-white/[0.08] !shadow-none" />
                      )}
                    </ReactFlow>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Floor label overlay */}
            <div className="absolute top-3 left-3 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
                  {DATACENTER_FLOORS[activeFloor].label}
                </span>
              </div>
            </div>

            {/* Zone legend — bottom left */}
            {is3D && (
              <div className="absolute bottom-3 left-3 flex flex-col gap-1 pointer-events-none">
                {floorZones.map(([zoneName, zoneCfg]) => (
                  <div key={zoneName} className="flex items-center gap-1.5">
                    <div
                      className={`w-1 h-1 rounded-full ${zoneIndicatorColors[zoneCfg.zone] ?? "bg-zinc-500"} opacity-60`}
                    />
                    <span className="text-[7px] font-mono text-zinc-700">{zoneName}</span>
                  </div>
                ))}
              </div>
            )}
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

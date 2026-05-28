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
import { useState } from "react";
import "@xyflow/react/dist/style.css";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { PipelineNode } from "../../components/nodes/PipelineNode";

const nodeTypes = { pipelineNode: PipelineNode };

const PIPELINE_NODES: Node[] = [
  {
    id: "src-sensors",
    type: "pipelineNode",
    position: { x: 40, y: 80 },
    data: {
      label: "Sensor Array",
      sublabel: "MQTT / Modbus",
      type: "source",
      throughput: "12.4K/s",
      latency: "2ms",
      status: "active",
    },
  },
  {
    id: "src-api",
    type: "pipelineNode",
    position: { x: 40, y: 280 },
    data: {
      label: "External APIs",
      sublabel: "REST / GraphQL",
      type: "source",
      throughput: "340/s",
      latency: "45ms",
      status: "active",
    },
  },
  {
    id: "src-webhook",
    type: "pipelineNode",
    position: { x: 40, y: 480 },
    data: {
      label: "Webhooks",
      sublabel: "HTTPS Push",
      type: "source",
      throughput: "89/s",
      latency: "12ms",
      status: "active",
    },
  },
  {
    id: "ingest",
    type: "pipelineNode",
    position: { x: 260, y: 240 },
    data: {
      label: "Ingestion Gateway",
      sublabel: "Load balancer · 3 replicas",
      type: "ingest",
      throughput: "12.8K/s",
      latency: "4ms",
      status: "active",
    },
  },
  {
    id: "parse",
    type: "pipelineNode",
    position: { x: 480, y: 180 },
    data: {
      label: "Stream Parser",
      sublabel: "Schema validation",
      type: "parse",
      throughput: "12.8K/s",
      latency: "1ms",
      status: "active",
      errorRate: "0.02%",
    },
  },
  {
    id: "enrich",
    type: "pipelineNode",
    position: { x: 480, y: 380 },
    data: {
      label: "Data Enricher",
      sublabel: "Geo + asset metadata",
      type: "enrich",
      throughput: "11.1K/s",
      latency: "8ms",
      status: "active",
    },
  },
  {
    id: "store",
    type: "pipelineNode",
    position: { x: 700, y: 180 },
    data: {
      label: "TimeSeries DB",
      sublabel: "InfluxDB cluster",
      type: "store",
      throughput: "11.0K/s",
      latency: "6ms",
      status: "active",
    },
  },
  {
    id: "alert",
    type: "pipelineNode",
    position: { x: 700, y: 380 },
    data: {
      label: "Alert Engine",
      sublabel: "Threshold · ML rules",
      type: "alert",
      throughput: "2.1K/s",
      latency: "22ms",
      status: "active",
    },
  },
  {
    id: "output-atlas",
    type: "pipelineNode",
    position: { x: 920, y: 240 },
    data: {
      label: "Atlas Platform",
      sublabel: "Real-time dashboard",
      type: "output",
      throughput: "9.3K/s",
      latency: "3ms",
      status: "active",
    },
  },
];

const PIPELINE_EDGES: Edge[] = [
  {
    id: "e1",
    source: "src-sensors",
    target: "ingest",
    animated: true,
    style: { stroke: "rgba(59,130,246,0.5)", strokeWidth: 1.5 },
  },
  {
    id: "e2",
    source: "src-api",
    target: "ingest",
    animated: true,
    style: { stroke: "rgba(59,130,246,0.4)", strokeWidth: 1.5 },
  },
  {
    id: "e3",
    source: "src-webhook",
    target: "ingest",
    animated: true,
    style: { stroke: "rgba(59,130,246,0.35)", strokeWidth: 1.5 },
  },
  {
    id: "e4",
    source: "ingest",
    target: "parse",
    animated: true,
    style: { stroke: "rgba(139,92,246,0.5)", strokeWidth: 1.5 },
  },
  {
    id: "e5",
    source: "ingest",
    target: "enrich",
    animated: true,
    style: { stroke: "rgba(139,92,246,0.4)", strokeWidth: 1.5 },
  },
  {
    id: "e6",
    source: "parse",
    target: "store",
    animated: true,
    style: { stroke: "rgba(34,197,94,0.4)", strokeWidth: 1.5 },
  },
  {
    id: "e7",
    source: "enrich",
    target: "alert",
    animated: true,
    style: { stroke: "rgba(34,197,94,0.4)", strokeWidth: 1.5 },
  },
  {
    id: "e8",
    source: "store",
    target: "output-atlas",
    animated: true,
    style: { stroke: "rgba(16,185,129,0.5)", strokeWidth: 1.5 },
  },
  {
    id: "e9",
    source: "alert",
    target: "output-atlas",
    animated: true,
    style: { stroke: "rgba(239,68,68,0.4)", strokeWidth: 1.5 },
  },
];

const throughputHistory = Array.from({ length: 30 }, (_, i) => ({
  t: `${i}s`,
  rate: 11200 + Math.sin(i * 0.5) * 800 + Math.random() * 300,
  errors: Math.random() * 5,
}));

export default function ImportFlow() {
  const [nodes, , onNodesChange] = useNodesState(PIPELINE_NODES);
  const [edges, , onEdgesChange] = useEdgesState(PIPELINE_EDGES);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const totalThroughput = "12.8K/s";
  const totalLatency = "42ms";
  const uptime = "99.97%";

  return (
    <div className="flex h-full bg-[#050505] overflow-hidden flex-col">
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 md:pt-5 pb-4 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-zinc-600">
                Operations
              </span>
              <span className="w-px h-3 bg-white/[0.08]" />
              <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Nominal
              </span>
            </div>
            <h1 className="text-[18px] md:text-[20px] font-semibold tracking-tight">
              Importation Pipeline
            </h1>
          </div>
          <div className="flex items-center gap-5 sm:gap-3">
            {[
              { label: "Throughput", value: totalThroughput, color: "text-blue-300" },
              { label: "End-to-end", value: totalLatency, color: "text-zinc-300" },
              { label: "Uptime", value: uptime, color: "text-emerald-300" },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className={`text-[16px] md:text-[18px] font-semibold font-mono tabular-nums leading-none ${s.color}`}
                >
                  {s.value}
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flow canvas */}
      <div className="flex-1 relative min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => setSelectedNode(selectedNode === n.id ? null : n.id)}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          nodesDraggable={false}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={0.5}
            color="rgba(255,255,255,0.035)"
          />
          <Controls className="!bg-[#0a0a0a] !border-white/[0.08] !shadow-none" />
        </ReactFlow>

        {/* Throughput mini chart */}
        <div className="absolute bottom-4 right-4 w-64 rounded-xl ring-1 ring-white/[0.07] bg-[#0a0a0a]/90 backdrop-blur-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">
              Live Throughput
            </p>
            <span className="text-[10px] text-blue-400 font-mono font-bold tabular-nums">
              {totalThroughput}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={throughputHistory}>
              <defs>
                <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="url(#tpGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

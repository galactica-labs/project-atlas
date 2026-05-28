import {
  ArrowsClockwise,
  BellRinging,
  CheckCircle,
  CloudArrowUp,
  Cpu,
  Database,
  Funnel,
} from "@phosphor-icons/react";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

type PipelineNodeData = {
  label: string;
  sublabel: string;
  type: "source" | "ingest" | "parse" | "enrich" | "store" | "alert" | "output";
  throughput: string;
  latency: string;
  status: "active" | "idle" | "error";
  errorRate?: string;
};

const typeConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; ring: string }
> = {
  source: {
    icon: CloudArrowUp,
    color: "text-blue-400",
    bg: "bg-blue-500/[0.08]",
    ring: "ring-blue-500/25",
  },
  ingest: {
    icon: ArrowsClockwise,
    color: "text-violet-400",
    bg: "bg-violet-500/[0.08]",
    ring: "ring-violet-500/25",
  },
  parse: { icon: Cpu, color: "text-cyan-400", bg: "bg-cyan-500/[0.08]", ring: "ring-cyan-500/25" },
  enrich: {
    icon: Funnel,
    color: "text-emerald-400",
    bg: "bg-emerald-500/[0.08]",
    ring: "ring-emerald-500/25",
  },
  store: {
    icon: Database,
    color: "text-amber-400",
    bg: "bg-amber-500/[0.08]",
    ring: "ring-amber-500/25",
  },
  alert: {
    icon: BellRinging,
    color: "text-red-400",
    bg: "bg-red-500/[0.08]",
    ring: "ring-red-500/25",
  },
  output: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/[0.06]",
    ring: "ring-emerald-500/20",
  },
};

export const PipelineNode = memo(({ data }: NodeProps) => {
  const d = data as PipelineNodeData;
  const cfg = typeConfig[d.type] ?? typeConfig.ingest;
  const Icon = cfg.icon;

  const statusDot =
    d.status === "active"
      ? "bg-emerald-400 animate-pulse"
      : d.status === "error"
        ? "bg-red-400 animate-pulse"
        : "bg-zinc-600";

  return (
    <div style={{ width: 160 }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 8, height: 8 }} />

      <div className={`p-[1.5px] rounded-2xl ring-1 ${cfg.ring} transition-all duration-300`}>
        <div
          className={`${cfg.bg} rounded-[14px] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div
              className={`w-7 h-7 rounded-lg ${cfg.bg} ring-1 ${cfg.ring} flex items-center justify-center flex-shrink-0`}
            >
              <Icon size={13} weight="light" className={cfg.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white leading-none truncate">
                {d.label}
              </p>
              <p className="text-[9px] text-zinc-600 mt-0.5 leading-none truncate">{d.sublabel}</p>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot}`} />
          </div>

          <div className="border-t border-white/[0.05] pt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            <div>
              <p className="text-[7.5px] text-zinc-700 uppercase tracking-wide font-mono">
                Throughput
              </p>
              <p className="text-[10px] font-mono font-bold text-zinc-300 tabular-nums">
                {d.throughput}
              </p>
            </div>
            <div>
              <p className="text-[7.5px] text-zinc-700 uppercase tracking-wide font-mono">
                Latency
              </p>
              <p className="text-[10px] font-mono font-bold text-zinc-300 tabular-nums">
                {d.latency}
              </p>
            </div>
            {d.errorRate && (
              <div className="col-span-2">
                <p className="text-[7.5px] text-zinc-700 uppercase tracking-wide font-mono">
                  Error Rate
                </p>
                <p className="text-[10px] font-mono font-bold text-red-400 tabular-nums">
                  {d.errorRate}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 8, height: 8 }} />
    </div>
  );
});
PipelineNode.displayName = "PipelineNode";

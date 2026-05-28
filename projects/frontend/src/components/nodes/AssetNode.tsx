import { Desktop, Gauge, Lightning, Shield, Thermometer } from "@phosphor-icons/react";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

const typeIcon: Record<string, React.ElementType> = {
  Cooling: Thermometer,
  Power: Lightning,
  Compute: Desktop,
  Safety: Shield,
  Controls: Gauge,
};

type AssetNodeData = {
  name: string;
  type: string;
  status: "normal" | "warning" | "critical" | "offline";
  telemetry?: { metric: string; value: number; unit: string }[];
  isSource?: boolean;
  isBlast?: boolean;
  ttf?: number;
};

export const AssetNode = memo(({ data, selected }: NodeProps) => {
  const d = data as AssetNodeData;
  const Icon = typeIcon[d.type] ?? Desktop;

  const statusColors = {
    normal: {
      ring: "ring-white/[0.12]",
      bg: "bg-white/[0.04]",
      icon: "text-zinc-400",
      dot: "bg-emerald-400",
    },
    warning: {
      ring: "ring-amber-500/40",
      bg: "bg-amber-500/[0.08]",
      icon: "text-amber-400",
      dot: "bg-amber-400",
    },
    critical: {
      ring: "ring-red-500/55",
      bg: "bg-red-500/[0.12]",
      icon: "text-red-400",
      dot: "bg-red-400",
    },
    offline: {
      ring: "ring-white/[0.04]",
      bg: "bg-zinc-900/50",
      icon: "text-zinc-700",
      dot: "bg-zinc-700",
    },
  };

  const c = d.isSource
    ? { ring: "ring-red-500/70", bg: "bg-red-500/[0.18]", icon: "text-red-400", dot: "bg-red-400" }
    : d.isBlast
      ? {
          ring: "ring-amber-500/55",
          bg: "bg-amber-500/[0.12]",
          icon: "text-amber-400",
          dot: "bg-amber-400",
        }
      : (statusColors[d.status] ?? statusColors.normal);

  const primaryTelemetry = d.telemetry?.[0];

  return (
    <div className="relative group" style={{ width: 88 }}>
      {/* Glow for critical */}
      {(d.isSource || d.status === "critical") && (
        <div
          className="absolute inset-0 -m-3 rounded-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 70%)",
          }}
        />
      )}

      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 6, height: 6 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 6, height: 6 }} />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, width: 6, height: 6 }}
      />

      <div
        className={`
        flex flex-col items-center gap-1.5 p-[1.5px] rounded-2xl ring-1 ${c.ring}
        transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${selected ? "scale-110" : "group-hover:scale-105"}
      `}
      >
        <div
          className={`
          ${c.bg} w-full rounded-[14px] flex flex-col items-center gap-1.5 px-2.5 py-3
          shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
        `}
        >
          {/* Status dot */}
          <div className="flex items-center justify-between w-full">
            <div
              className={`w-1.5 h-1.5 rounded-full ${c.dot} ${d.status !== "offline" ? "animate-pulse" : ""}`}
            />
            {d.isSource && (
              <span className="text-[7px] font-mono font-bold text-red-400 tabular-nums">
                {d.ttf}m
              </span>
            )}
          </div>

          {/* Icon */}
          <Icon size={16} weight={d.isSource ? "fill" : "light"} className={c.icon} />

          {/* Primary telemetry */}
          {primaryTelemetry && (
            <div className="text-center">
              <span
                className={`text-[9px] font-mono font-bold tabular-nums ${d.status === "critical" || d.isSource ? "text-red-300" : "text-zinc-300"}`}
              >
                {primaryTelemetry.value.toFixed(1)}
                {primaryTelemetry.unit}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Name label below */}
      <div className="text-center mt-1.5">
        <span className="text-[8px] text-zinc-600 font-mono leading-none whitespace-nowrap select-none block">
          {d.name}
        </span>
      </div>
    </div>
  );
});
AssetNode.displayName = "AssetNode";

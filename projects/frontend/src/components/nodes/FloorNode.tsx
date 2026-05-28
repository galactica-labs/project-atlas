import type { NodeProps } from "@xyflow/react";
import { memo } from "react";

type FloorNodeData = {
  label: string;
  zone: "a" | "b" | "mechanical";
  nodeCount: number;
};

const zoneColors = {
  a: {
    bg: "rgba(59,130,246,0.025)",
    border: "rgba(59,130,246,0.12)",
    label: "rgba(59,130,246,0.5)",
  },
  b: {
    bg: "rgba(16,185,129,0.02)",
    border: "rgba(16,185,129,0.10)",
    label: "rgba(16,185,129,0.5)",
  },
  mechanical: {
    bg: "rgba(245,158,11,0.018)",
    border: "rgba(245,158,11,0.10)",
    label: "rgba(245,158,11,0.45)",
  },
};

export const FloorNode = memo(({ data }: NodeProps) => {
  const d = data as FloorNodeData;
  const c = zoneColors[d.zone];

  return (
    <div
      className="rounded-2xl pointer-events-none select-none"
      style={{
        width: "100%",
        height: "100%",
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      {/* Zone label at top-left */}
      <div className="absolute top-3 left-4 flex items-center gap-2">
        <span
          className="text-[9px] font-mono font-bold uppercase tracking-[0.22em]"
          style={{ color: c.label }}
        >
          {d.label}
        </span>
        <span className="text-[8px] font-mono text-zinc-700">{d.nodeCount} assets</span>
      </div>

      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-4 h-4 border-t border-l rounded-tl-2xl pointer-events-none"
        style={{ borderColor: c.border }}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 border-t border-r rounded-tr-2xl pointer-events-none"
        style={{ borderColor: c.border }}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 border-b border-l rounded-bl-2xl pointer-events-none"
        style={{ borderColor: c.border }}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 border-b border-r rounded-br-2xl pointer-events-none"
        style={{ borderColor: c.border }}
      />
    </div>
  );
});
FloorNode.displayName = "FloorNode";

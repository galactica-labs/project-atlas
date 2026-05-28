import type { AssetStatus } from "../data/mock";

const config: Record<AssetStatus, { label: string; dot: string; text: string }> = {
  normal: { label: "Normal", dot: "bg-emerald-400", text: "text-emerald-400" },
  warning: { label: "Warning", dot: "bg-amber-400", text: "text-amber-400" },
  critical: { label: "Critical", dot: "bg-red-400", text: "text-red-400" },
  offline: { label: "Offline", dot: "bg-zinc-500", text: "text-zinc-500" },
};

export default function StatusBadge({ status }: { status: AssetStatus }) {
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide ${c.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot} ${status === "critical" ? "status-pulse" : ""}`}
      />
      {c.label}
    </span>
  );
}

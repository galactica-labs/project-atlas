import { useFloorPlanStore } from "./floorPlanStore";
import { COLORS } from "./mapStyles";
import type { LayerVisibility } from "./mapTypes";

interface ToggleProps {
  label: string;
  active: boolean;
  color: string;
  onToggle: () => void;
}

function LayerToggle({ label, active, color, onToggle }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-left ${
        active ? "bg-white/[0.05] ring-1 ring-white/[0.08]" : "opacity-40 hover:opacity-60"
      }`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-opacity"
        style={{ backgroundColor: color, opacity: active ? 1 : 0.4 }}
      />
      <span className="text-[11px] text-zinc-300 flex-1">{label}</span>
      <span
        className={`w-7 h-3.5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${
          active ? "" : "bg-zinc-800"
        }`}
        style={{
          backgroundColor: active ? `${color}40` : undefined,
          border: `1px solid ${active ? `${color}60` : "#334155"}`,
        }}
      >
        <span
          className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-200"
          style={{
            backgroundColor: active ? color : "#52525b",
            left: active ? "calc(100% - 12px)" : "1px",
          }}
        />
      </span>
    </button>
  );
}

const LAYER_DEFS: { key: keyof LayerVisibility; label: string; color: string }[] = [
  { key: "power", label: "Power", color: COLORS.power },
  { key: "cooling", label: "Cooling", color: COLORS.cooling },
  { key: "network", label: "Network", color: COLORS.network },
  { key: "dependency", label: "Dependency", color: COLORS.dependency },
  { key: "labels", label: "Labels", color: "#94A3B8" },
  { key: "criticalPathOnly", label: "Critical Path Only", color: COLORS.critical },
];

export default function LayerControls() {
  const layerVisibility = useFloorPlanStore((s) => s.layerVisibility);
  const toggleLayer = useFloorPlanStore((s) => s.toggleLayer);

  return (
    <div className="p-3">
      <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-2 px-1">
        Layer Controls
      </p>
      <div className="space-y-0.5">
        {LAYER_DEFS.map((def) => (
          <LayerToggle
            key={def.key}
            label={def.label}
            active={layerVisibility[def.key]}
            color={def.color}
            onToggle={() => toggleLayer(def.key)}
          />
        ))}
      </div>
    </div>
  );
}

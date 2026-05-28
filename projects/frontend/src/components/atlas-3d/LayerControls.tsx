import {
  ArrowsOut,
  GitFork,
  GridFour,
  Lightning,
  SquaresFour,
  Tag,
  Thermometer,
  WifiHigh,
} from "@phosphor-icons/react";
import { useCommandCenterStore } from "./commandCenterStore";
import type { VisibleLayers } from "./sceneTypes";

type LayerDef = {
  key: keyof VisibleLayers;
  label: string;
  icon: React.ElementType;
  color: string;
};

const LAYERS: LayerDef[] = [
  { key: "power", label: "Power", icon: Lightning, color: "#eab308" },
  { key: "cooling", label: "Cooling", icon: Thermometer, color: "#22d3ee" },
  { key: "network", label: "Network", icon: WifiHigh, color: "#a855f7" },
  { key: "dependency", label: "Deps", icon: GitFork, color: "#f97316" },
  { key: "labels", label: "Labels", icon: Tag, color: "#71717a" },
  { key: "grid", label: "Grid", icon: GridFour, color: "#3f3f46" },
  { key: "zoneBoundaries", label: "Zones", icon: SquaresFour, color: "#3f3f46" },
  { key: "criticalPathOnly", label: "Crit Only", icon: ArrowsOut, color: "#ef4444" },
];

export function LayerControls() {
  const { visibleLayers, toggleLayer } = useCommandCenterStore();

  return (
    <div className="flex flex-col gap-0.5 p-1.5 bg-black/70 backdrop-blur-md rounded-xl ring-1 ring-white/[0.07]">
      <p className="text-[7px] font-mono uppercase tracking-widest text-zinc-700 px-1 pb-0.5">
        Layers
      </p>
      {LAYERS.map(({ key, label, icon: Icon, color }) => {
        const active = visibleLayers[key];
        return (
          <button
            type="button"
            key={key}
            onClick={() => toggleLayer(key)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-medium transition-all duration-150 ${
              active ? "bg-white/[0.07] text-zinc-300" : "text-zinc-700 hover:text-zinc-500"
            }`}
            title={label}
          >
            <Icon size={9} weight="light" style={{ color: active ? color : undefined }} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

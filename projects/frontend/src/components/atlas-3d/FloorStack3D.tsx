import { Buildings, MouseSimple, Warning } from "@phosphor-icons/react";
import { Canvas } from "@react-three/fiber";
import { type ReactNode, Suspense, useEffect, useState } from "react";
import { useFloorPlanStore } from "../atlas-map/floorPlanStore";
import { FLOORS } from "../atlas-map/mapData";
import type { FloorId } from "../atlas-map/mapTypes";
import { FLOOR_META } from "../atlas-map/mapTypes";
import { FloorStackScene } from "./FloorStackScene";

const FLOOR_ORDER: FloorId[] = ["floor-a", "floor-b", "floor-c"];

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <span className="font-mono text-[10px] text-zinc-600 tabular-nums tracking-widest">
      {pad(t.getHours())}:{pad(t.getMinutes())}:{pad(t.getSeconds())} UTC
    </span>
  );
}

function TopBar({ modeSwitcher }: { modeSwitcher?: ReactNode }) {
  const activeFloorId = useFloorPlanStore((s) => s.activeFloorId);
  const incidentActive = useFloorPlanStore((s) => s.incidentActive);
  const floor = FLOOR_META[activeFloorId];

  const allAssets = [
    ...FLOORS["floor-a"].assets,
    ...FLOORS["floor-b"].assets,
    ...FLOORS["floor-c"].assets,
  ];
  const critical = allAssets.filter((a) => a.status === "critical").length;
  const warning = allAssets.filter((a) => a.status === "warning").length;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.05] flex-shrink-0 bg-[#05070A]">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center">
          <div className="w-2 h-2 bg-black rounded-[2px]" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-white">ATLAS</span>
        <span className="hidden sm:block w-px h-3 bg-white/[0.06]" />
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500">
          <Buildings size={9} weight="light" className="text-zinc-600" />
          <span>Data Center Alpha</span>
          <span className="text-zinc-700">·</span>
          <span className="font-mono text-zinc-600">3D Overview</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-600 text-[9px]">{floor.name} active</span>
        </div>
      </div>

      <div className="w-px h-3 bg-white/[0.06] hidden sm:block" />

      {incidentActive ? (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[9px] font-bold tracking-wider uppercase text-red-400">
            Incident Active
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-600">
            Nominal
          </span>
        </div>
      )}

      <div className="hidden md:flex items-center gap-2 ml-1">
        {critical > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-950/40 ring-1 ring-red-500/30">
            <Warning size={8} weight="fill" className="text-red-400" />
            <span className="text-[9px] font-mono font-bold text-red-400">{critical} critical</span>
          </div>
        )}
        {warning > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-950/30 ring-1 ring-amber-500/20">
            <Warning size={8} weight="fill" className="text-amber-400" />
            <span className="text-[9px] font-mono text-amber-400">{warning} warning</span>
          </div>
        )}
        {critical === 0 && warning === 0 && (
          <span className="text-[9px] font-mono text-zinc-700">
            {allAssets.length} assets · all nominal
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {modeSwitcher}
        <LiveClock />
      </div>
    </div>
  );
}

function FloorLegend() {
  const { activeFloorId, setFloor } = useFloorPlanStore();

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
      {FLOOR_ORDER.map((id) => {
        const meta = FLOOR_META[id];
        const active = activeFloorId === id;
        const assets = FLOORS[id].assets;
        const critical = assets.filter((a) => a.status === "critical").length;
        const warning = assets.filter((a) => a.status === "warning").length;

        return (
          <button
            key={id}
            type="button"
            onClick={() => setFloor(id)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150"
            style={{
              backgroundColor: active ? "rgba(59,130,246,0.12)" : "rgba(0,0,0,0.65)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${active ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            <span
              className="text-[12px] font-bold tabular-nums w-4 text-center"
              style={{ color: active ? "#93c5fd" : "#64748b" }}
            >
              {meta.shortLabel}
            </span>
            <div className="flex flex-col items-start">
              <span
                className="text-[9px] font-medium leading-none"
                style={{ color: active ? "#e2e8f0" : "#475569" }}
              >
                {meta.description.split("—")[0].trim()}
              </span>
              {(critical > 0 || warning > 0) && (
                <span
                  className="text-[8px] font-mono mt-0.5"
                  style={{ color: critical > 0 ? "#ef4444" : "#f59e0b" }}
                >
                  {critical > 0 ? `${critical} critical` : `${warning} warning`}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ControlHint() {
  return (
    <div
      className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <MouseSimple size={10} weight="light" className="text-zinc-600" />
      <span className="text-[8px] font-mono text-zinc-600">Drag · Scroll · Click floor</span>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-[#05070A]">
      <span className="text-[11px] font-mono text-zinc-600">Loading 3D view…</span>
    </div>
  );
}

export function FloorStack3D({ modeSwitcher }: { modeSwitcher?: ReactNode }) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#05070A]">
      <TopBar modeSwitcher={modeSwitcher} />
      <div className="flex-1 relative overflow-hidden">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [-6, 28, 20], fov: 45, near: 0.1, far: 200 }}
            style={{ background: "#05070A" }}
            gl={{ antialias: true, alpha: false }}
          >
            <FloorStackScene />
          </Canvas>
        </Suspense>

        <FloorLegend />
        <ControlHint />

        {/* Vignette frame */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, transparent 55%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>
    </div>
  );
}

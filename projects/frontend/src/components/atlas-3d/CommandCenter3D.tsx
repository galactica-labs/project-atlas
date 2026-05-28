import {
  ArrowCounterClockwise,
  ArrowsOut,
  Eye,
  House,
  ScanSmiley,
  Warning,
} from "@phosphor-icons/react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { AssetDetailsPanel } from "./AssetDetailsPanel";
import { BottomTimeline } from "./BottomTimeline";
import { useCommandCenterStore } from "./commandCenterStore";
import { FacilityScene } from "./FacilityScene";
import { LayerControls } from "./LayerControls";

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

function StatusBar() {
  const { viewMode, activeIncidentId, assetStatuses } = useCommandCenterStore();
  const critical = Object.values(assetStatuses).filter((s) => s === "critical").length;
  const warning = Object.values(assetStatuses).filter((s) => s === "warning").length;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.05] flex-shrink-0 bg-[#070707]">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center flex-shrink-0">
          <div className="w-2 h-2 bg-black rounded-[2px]" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight">ATLAS</span>
        <span className="hidden sm:block text-[10px] text-zinc-700">·</span>
        <span className="hidden sm:block text-[10px] text-zinc-500">
          Data Center Alpha / Hall B
        </span>
      </div>

      <div className="w-px h-3 bg-white/[0.08] hidden sm:block" />

      {viewMode === "incident" ? (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[9px] font-bold tracking-wider uppercase text-red-400">
            Incident Active
          </span>
          {critical > 0 && (
            <span className="text-[9px] text-red-400 font-mono">{critical} critical</span>
          )}
          {warning > 0 && (
            <span className="text-[9px] text-amber-400 font-mono">{warning} warning</span>
          )}
        </motion.div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-600">
            Nominal
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 ml-auto">
        <AnimatePresence>
          {activeIncidentId && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] font-mono text-red-400"
            >
              INC-{activeIncidentId.toUpperCase().slice(0, 8)}
            </motion.span>
          )}
        </AnimatePresence>
        <LiveClock />
      </div>
    </div>
  );
}

function CameraButtons() {
  const { requestCameraFocus, selectedAssetId, viewMode, activeIncidentId } =
    useCommandCenterStore();

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => requestCameraFocus({ type: "overview" })}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-md ring-1 ring-white/[0.08] text-[9px] text-zinc-400 hover:text-white transition-colors"
        title="Overview"
      >
        <House size={10} weight="light" />
        Overview
      </button>
      {selectedAssetId && (
        <button
          type="button"
          onClick={() => requestCameraFocus({ type: "asset", assetId: selectedAssetId })}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-md ring-1 ring-white/[0.08] text-[9px] text-zinc-400 hover:text-white transition-colors"
          title="Focus selected"
        >
          <Eye size={10} weight="light" />
          Focus Asset
        </button>
      )}
      {viewMode === "incident" && activeIncidentId && (
        <button
          type="button"
          onClick={() =>
            requestCameraFocus({
              type: "incident",
              rootAssetId: "crac-07",
              affectedAssetIds: [
                "rack-c12",
                "rack-c13",
                "rack-c14",
                "rack-c15",
                "rack-c16",
                "rack-c17",
              ],
            })
          }
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/70 backdrop-blur-md ring-1 ring-red-500/20 text-[9px] text-red-400 hover:text-red-300 transition-colors"
          title="Frame incident"
        >
          <ArrowsOut size={10} weight="light" />
          Incident Path
        </button>
      )}
    </div>
  );
}

function SimulationControls() {
  const { simulateCRAC07Failure, resetSimulation, viewMode } = useCommandCenterStore();

  return (
    <div className="flex flex-col gap-1">
      {viewMode !== "incident" ? (
        <button
          type="button"
          onClick={simulateCRAC07Failure}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/80 backdrop-blur-md ring-1 ring-red-500/30 text-[9px] font-semibold text-red-400 hover:bg-red-900/80 hover:text-red-300 transition-all active:scale-95"
        >
          <Warning size={10} weight="fill" />
          Simulate CRAC-07 Failure
        </button>
      ) : (
        <button
          type="button"
          onClick={resetSimulation}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900/80 backdrop-blur-md ring-1 ring-white/[0.08] text-[9px] font-medium text-zinc-400 hover:text-zinc-200 transition-all active:scale-95"
        >
          <ArrowCounterClockwise size={10} weight="light" />
          Reset Simulation
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (viewMode === "incident") return;
          // Just a visual hint
        }}
        className="hidden"
      />
    </div>
  );
}

function SceneLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#060606]">
      <div className="flex items-center gap-2">
        <ScanSmiley
          size={16}
          weight="thin"
          className="text-zinc-600 animate-spin"
          style={{ animationDuration: "3s" }}
        />
        <span className="text-[11px] text-zinc-600 font-mono">Loading facility model…</span>
      </div>
    </div>
  );
}

export function CommandCenter3D() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060606]">
      {/* Top status bar */}
      <StatusBar />

      {/* Main: 3D canvas + right panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          <Suspense fallback={<SceneLoadingFallback />}>
            <Canvas
              camera={{ position: [-4, 22, 19], fov: 45, near: 0.1, far: 200 }}
              style={{ background: "#060606" }}
              gl={{ antialias: true, alpha: false }}
              onPointerMissed={() => useCommandCenterStore.getState().selectAsset(null)}
            >
              <FacilityScene />
            </Canvas>
          </Suspense>

          {/* Layer controls — top left */}
          <div className="absolute top-3 left-3 z-10">
            <LayerControls />
          </div>

          {/* Camera controls — bottom left */}
          <div className="absolute bottom-3 left-3 z-10">
            <CameraButtons />
          </div>

          {/* Simulation controls — top right */}
          <div className="absolute top-3 right-3 z-10">
            <SimulationControls />
          </div>

          {/* Crosshair overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, transparent 60%, rgba(0,0,0,0.5) 100%)",
            }}
          />
        </div>

        {/* Right panel */}
        <div className="w-72 xl:w-80 flex-shrink-0 overflow-hidden">
          <AssetDetailsPanel />
        </div>
      </div>

      {/* Bottom timeline */}
      <div className="flex-shrink-0 h-[52px] border-t border-white/[0.05]">
        <BottomTimeline />
      </div>
    </div>
  );
}

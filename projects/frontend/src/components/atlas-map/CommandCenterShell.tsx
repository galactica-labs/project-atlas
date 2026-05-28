import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import AssetDetailsPanel from "./AssetDetailsPanel";
import { useFloorPlanStore } from "./floorPlanStore";
import IncidentQueue from "./IncidentQueue";
import LayerControls from "./LayerControls";
import { FLOORS } from "./mapData";
import { COLORS } from "./mapStyles";
import type { FloorId } from "./mapTypes";
import { FLOOR_META } from "./mapTypes";

const AtlasFloorPlanMap = lazy(() => import("./AtlasFloorPlanMap"));

// ── Live clock ────────────────────────────────────────────────────────────────

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

// ── Top status bar ────────────────────────────────────────────────────────────

function TopStatusBar() {
  const { activeFloorId, incidentActive, incidentAssetOverrides } = useFloorPlanStore();
  const floor = FLOOR_META[activeFloorId];
  const allAssets = FLOORS[activeFloorId].assets;

  const critical = allAssets.filter(
    (a) => (incidentAssetOverrides[a.id] ?? a.status) === "critical"
  ).length;
  const warning = allAssets.filter(
    (a) => (incidentAssetOverrides[a.id] ?? a.status) === "warning"
  ).length;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 border-b flex-shrink-0 bg-[#05070A]"
      style={{ borderColor: COLORS.panelBorder }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center">
          <div className="w-2 h-2 bg-black rounded-[2px]" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-white">ATLAS</span>
        <span className="hidden sm:block w-px h-3" style={{ backgroundColor: COLORS.border }} />
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500">
          <span>Data Center Alpha</span>
          <span className="text-zinc-700">·</span>
          <span className="font-mono text-zinc-600">{floor.name}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-600 text-[9px]">{floor.description}</span>
        </div>
      </div>

      <div className="w-px h-3 hidden sm:block" style={{ backgroundColor: COLORS.border }} />

      {/* Mode badge */}
      {incidentActive ? (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[9px] font-bold tracking-wider uppercase text-red-400">
            Incident Active
          </span>
        </motion.div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-600">
            Nominal
          </span>
        </div>
      )}

      {/* Status counts */}
      <div className="hidden md:flex items-center gap-2 ml-1">
        {critical > 0 && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: COLORS.critical }}
            />
            <span className="text-[9px] font-mono font-bold" style={{ color: COLORS.critical }}>
              {critical} critical
            </span>
          </div>
        )}
        {warning > 0 && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.20)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: COLORS.warning }}
            />
            <span className="text-[9px] font-mono" style={{ color: COLORS.warning }}>
              {warning} warning
            </span>
          </div>
        )}
        {critical === 0 && warning === 0 && (
          <span className="text-[9px] font-mono text-zinc-700">
            {allAssets.length} assets · all nominal
          </span>
        )}
      </div>

      <div className="ml-auto">
        <LiveClock />
      </div>
    </div>
  );
}

// ── Floor switcher tabs ───────────────────────────────────────────────────────

const FLOOR_ORDER: FloorId[] = ["floor-a", "floor-b", "floor-c"];

function FloorSwitcher() {
  const { activeFloorId, setFloor } = useFloorPlanStore();

  return (
    <div className="px-3 pt-3 pb-2">
      <p
        className="text-[8px] font-bold tracking-[0.14em] uppercase mb-2 px-1"
        style={{ color: COLORS.textMuted }}
      >
        Floor
      </p>
      <div className="flex gap-1">
        {FLOOR_ORDER.map((id) => {
          const meta = FLOOR_META[id];
          const active = activeFloorId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFloor(id)}
              title={meta.description}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all duration-150"
              style={{
                backgroundColor: active ? "rgba(248,250,252,0.06)" : "transparent",
                border: `1px solid ${active ? "rgba(248,250,252,0.12)" : "rgba(248,250,252,0.04)"}`,
              }}
            >
              <span
                className="text-[14px] font-bold tabular-nums"
                style={{ color: active ? COLORS.textPrimary : COLORS.textMuted }}
              >
                {meta.shortLabel}
              </span>
              <span
                className="text-[8px] font-mono leading-none"
                style={{ color: active ? COLORS.textSecondary : "#374151" }}
              >
                {meta.description.split("—")[0].trim()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Bottom timeline ───────────────────────────────────────────────────────────

function BottomTimeline() {
  const events = useFloorPlanStore((s) => s.timelineEvents);

  const formatMs = (ms: number) => `T+${(ms / 1000).toFixed(1)}s`;

  return (
    <div
      className="h-[52px] flex items-center flex-shrink-0 border-t"
      style={{ backgroundColor: "#05070A", borderColor: COLORS.panelBorder }}
    >
      <div
        className="px-4 flex-shrink-0 h-full flex items-center border-r"
        style={{ borderColor: COLORS.panelBorder }}
      >
        <p
          className="text-[8px] font-mono uppercase tracking-widest"
          style={{ color: COLORS.textMuted }}
        >
          Timeline
        </p>
      </div>

      {events.length === 0 ? (
        <div className="px-4">
          <p className="text-[10px] font-mono" style={{ color: "#1f2937" }}>
            No events — run a simulation
          </p>
        </div>
      ) : (
        <div
          className="flex-1 overflow-x-auto flex items-center gap-3 px-4"
          style={{ scrollbarWidth: "none" }}
        >
          <AnimatePresence initial={false}>
            {events.map((evt, i) => {
              const isLast = i === events.length - 1;
              const color =
                evt.severity === "critical"
                  ? COLORS.critical
                  : evt.severity === "warning"
                    ? COLORS.warning
                    : COLORS.textMuted;
              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  className="flex items-center gap-2 flex-shrink-0 px-2.5 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: isLast ? "rgba(255,255,255,0.03)" : "transparent",
                    border: isLast ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className="text-[9px] font-mono tabular-nums"
                    style={{ color: COLORS.textMuted }}
                  >
                    {formatMs(evt.timestamp)}
                  </span>
                  <span
                    className="text-[9px] max-w-[200px] truncate"
                    style={{ color: isLast ? COLORS.textSecondary : COLORS.textMuted }}
                  >
                    {evt.message}
                  </span>
                  {i < events.length - 1 && (
                    <div className="w-4 h-px ml-1" style={{ backgroundColor: COLORS.border }} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Incident vignette overlay ─────────────────────────────────────────────────

function IncidentVignette() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(60,0,0,0.22) 100%)",
      }}
    />
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

export default function CommandCenterShell() {
  const incidentActive = useFloorPlanStore((s) => s.incidentActive);

  return (
    <div className="h-full overflow-hidden flex flex-col" style={{ backgroundColor: COLORS.bg }}>
      {/* Top bar */}
      <TopStatusBar />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left sidebar */}
        <div
          className="w-56 flex-shrink-0 flex flex-col overflow-y-auto overflow-x-hidden border-r"
          style={{
            backgroundColor: COLORS.panel,
            borderColor: COLORS.panelBorder,
            scrollbarWidth: "none",
          }}
        >
          <FloorSwitcher />
          <div className="border-t" style={{ borderColor: COLORS.panelBorder }} />
          <LayerControls />
          <div className="border-t" style={{ borderColor: COLORS.panelBorder }} />
          <IncidentQueue />
        </div>

        {/* Map canvas — min-h-0 prevents flex overflow collapse */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center h-full"
                style={{ backgroundColor: COLORS.bg }}
              >
                <span className="text-[11px] font-mono" style={{ color: COLORS.textMuted }}>
                  Loading floor plan…
                </span>
              </div>
            }
          >
            <AtlasFloorPlanMap />
          </Suspense>

          {/* Incident vignette */}
          <AnimatePresence>
            {incidentActive && (
              <motion.div
                key="vignette"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 pointer-events-none"
              >
                <IncidentVignette />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scene edge gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, transparent 60%, rgba(0,0,0,0.35) 100%)",
            }}
          />
        </div>

        {/* Right panel */}
        <div className="w-72 xl:w-80 flex-shrink-0 overflow-hidden">
          <AssetDetailsPanel />
        </div>
      </div>

      {/* Bottom timeline */}
      <BottomTimeline />
    </div>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { useFloorPlanStore } from "./floorPlanStore";
import { FLOORS } from "./mapData";
import { COLORS } from "./mapStyles";

function SimulationControls() {
  const incidentActive = useFloorPlanStore((s) => s.incidentActive);
  const simulate = useFloorPlanStore((s) => s.simulateCrac07Failure);
  const reset = useFloorPlanStore((s) => s.resetIncident);

  return (
    <div className="p-3 space-y-2">
      <p
        className="text-[8px] font-bold tracking-[0.14em] uppercase px-1"
        style={{ color: COLORS.textMuted }}
      >
        Simulation
      </p>

      {!incidentActive ? (
        <button
          type="button"
          onClick={simulate}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-[0.98]"
          style={{
            border: "1px solid rgba(239,68,68,0.30)",
            backgroundColor: "rgba(239,68,68,0.07)",
            color: "rgba(252,165,165,0.9)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: COLORS.critical, boxShadow: "0 0 6px rgba(239,68,68,0.8)" }}
          />
          Simulate CRAC-07 Failure
        </button>
      ) : (
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              border: "1px solid rgba(239,68,68,0.30)",
              backgroundColor: "rgba(239,68,68,0.06)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: COLORS.critical }}
            />
            <span className="text-[11px] font-semibold" style={{ color: "rgba(252,165,165,0.9)" }}>
              Simulation Active
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 active:scale-[0.98]"
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "rgba(255,255,255,0.03)",
              color: COLORS.textMuted,
            }}
          >
            Reset Simulation
          </button>
        </div>
      )}
    </div>
  );
}

function TimelineSection() {
  const events = useFloorPlanStore((s) => s.timelineEvents);

  if (events.length === 0) return null;

  const formatMs = (ms: number) => {
    const s = (ms / 1000).toFixed(1);
    return `T+${s}s`;
  };

  return (
    <div className="p-3 border-t" style={{ borderColor: COLORS.panelBorder }}>
      <p
        className="text-[8px] font-bold tracking-[0.14em] uppercase mb-2 px-1"
        style={{ color: COLORS.textMuted }}
      >
        Event Log
      </p>
      <div className="space-y-1.5 max-h-44 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence>
          {[...events].reverse().map((evt) => {
            const color = evt.severity === "critical" ? COLORS.critical : COLORS.warning;
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-2"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] leading-snug" style={{ color: COLORS.textMuted }}>
                    {evt.message}
                  </p>
                  <p className="text-[9px] font-mono mt-0.5" style={{ color: "#374151" }}>
                    {formatMs(evt.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function IncidentQueue() {
  const incidentActive = useFloorPlanStore((s) => s.incidentActive);
  const overrides = useFloorPlanStore((s) => s.incidentAssetOverrides);
  const selectAsset = useFloorPlanStore((s) => s.selectAsset);

  const floorBAssets = FLOORS["floor-b"].assets;
  const affectedAssets = floorBAssets.filter((a) => overrides[a.id] && a.id !== "crac-07");

  return (
    <div className="flex flex-col">
      <SimulationControls />

      <AnimatePresence>
        {incidentActive && (
          <motion.div
            key="incident-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t overflow-hidden"
            style={{ borderColor: COLORS.panelBorder }}
          >
            <div className="p-3">
              <p
                className="text-[8px] font-bold tracking-[0.14em] uppercase mb-2 px-1"
                style={{ color: COLORS.textMuted }}
              >
                Incident Queue
              </p>

              {/* Root cause card */}
              <button
                type="button"
                onClick={() => selectAsset("crac-07")}
                className="w-full text-left p-[1px] rounded-xl mb-2 transition-all duration-200"
                style={{
                  backgroundColor: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.30)",
                }}
              >
                <div className="rounded-[10px] px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: COLORS.critical }}
                    />
                    <span className="text-[11px] font-semibold text-white">CRAC-07 Failure</span>
                    <span
                      className="ml-auto text-[9px] font-mono font-bold"
                      style={{ color: COLORS.critical }}
                    >
                      P1
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                    Hall B / Cooling Zone
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#374151" }}>
                    First impact:{" "}
                    <span className="font-mono font-semibold" style={{ color: COLORS.warning }}>
                      14 min
                    </span>
                  </p>
                </div>
              </button>

              {/* Affected assets list */}
              {affectedAssets.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-[9px] px-1" style={{ color: "#374151" }}>
                    {affectedAssets.length} affected
                  </p>
                  {affectedAssets.slice(0, 5).map((a) => {
                    const color = overrides[a.id] === "critical" ? COLORS.critical : COLORS.warning;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => selectAsset(a.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-white/[0.03]"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[11px] flex-1" style={{ color: COLORS.textMuted }}>
                          {a.name}
                        </span>
                        <span className="text-[9px] font-mono uppercase" style={{ color }}>
                          {overrides[a.id]}
                        </span>
                      </button>
                    );
                  })}
                  {affectedAssets.length > 5 && (
                    <p className="text-[10px] px-2" style={{ color: "#374151" }}>
                      +{affectedAssets.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TimelineSection />
    </div>
  );
}

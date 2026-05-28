import { AnimatePresence, motion } from "framer-motion";
import { useFloorPlanStore } from "./floorPlanStore";
import { ASSETS } from "./mapData";
import { COLORS } from "./mapStyles";

function SimulationControls() {
  const incidentActive = useFloorPlanStore((s) => s.incidentActive);
  const simulate = useFloorPlanStore((s) => s.simulateCrac07Failure);
  const reset = useFloorPlanStore((s) => s.resetIncident);

  return (
    <div className="p-3 space-y-2">
      <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-2 px-1">
        Simulation
      </p>

      {!incidentActive ? (
        <button
          type="button"
          onClick={simulate}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 ring-1 ring-red-500/30 bg-red-500/[0.07] text-red-300 hover:bg-red-500/[0.12] hover:ring-red-500/50 active:scale-[0.98]"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-red-400"
            style={{ boxShadow: "0 0 6px rgba(239,68,68,0.8)" }}
          />
          Simulate CRAC-07 Failure
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ring-red-500/30 bg-red-500/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-red-300">Simulation Active</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 ring-1 ring-white/[0.07] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300 active:scale-[0.98]"
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
    <div className="p-3 border-t border-[#202A36]">
      <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-2 px-1">
        Event Log
      </p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence>
          {[...events].reverse().map((evt) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-start gap-2"
            >
              <span
                className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                style={{
                  backgroundColor: evt.severity === "critical" ? COLORS.critical : COLORS.warning,
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-zinc-400 leading-snug">{evt.message}</p>
                <p className="text-[9px] text-zinc-700 font-mono mt-0.5">
                  {formatMs(evt.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function IncidentQueue() {
  const incidentActive = useFloorPlanStore((s) => s.incidentActive);
  const overrides = useFloorPlanStore((s) => s.incidentAssetOverrides);
  const selectAsset = useFloorPlanStore((s) => s.selectAsset);

  const affectedAssets = ASSETS.filter((a) => overrides[a.id] && a.id !== "crac-07");

  return (
    <div className="flex flex-col">
      <SimulationControls />

      {incidentActive && (
        <div className="border-t border-[#202A36]">
          <div className="p-3">
            <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-2 px-1">
              Incident Queue
            </p>

            <button
              type="button"
              onClick={() => selectAsset("crac-07")}
              className="w-full p-[1px] rounded-xl bg-red-500/[0.06] ring-1 ring-red-500/30 hover:ring-red-500/50 transition-all duration-200 text-left mb-2"
            >
              <div className="rounded-[10px] px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-white">CRAC-07 Failure</span>
                  <span className="ml-auto text-[9px] font-mono font-bold text-red-400">P1</span>
                </div>
                <p className="text-[10px] text-zinc-500">Hall B / Cooling Zone</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  First impact:{" "}
                  <span className="text-amber-400 font-mono font-semibold">14 min</span>
                </p>
              </div>
            </button>

            {affectedAssets.length > 0 && (
              <div className="space-y-1">
                <p className="text-[9px] text-zinc-700 px-1">
                  {affectedAssets.length} affected assets
                </p>
                {affectedAssets.slice(0, 4).map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => selectAsset(a.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          overrides[a.id] === "critical" ? COLORS.critical : COLORS.warning,
                      }}
                    />
                    <span className="text-[11px] text-zinc-400">{a.name}</span>
                    <span
                      className="ml-auto text-[9px] font-mono uppercase"
                      style={{
                        color: overrides[a.id] === "critical" ? COLORS.critical : COLORS.warning,
                      }}
                    >
                      {overrides[a.id]}
                    </span>
                  </button>
                ))}
                {affectedAssets.length > 4 && (
                  <p className="text-[10px] text-zinc-700 px-2">
                    +{affectedAssets.length - 4} more...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <TimelineSection />
    </div>
  );
}

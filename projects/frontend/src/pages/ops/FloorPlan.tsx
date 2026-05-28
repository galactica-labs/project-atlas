import { useEffect, useState } from "react";
import CommandCenterZoneView from "../../components/ops/CommandCenterZoneView";
import {
  DATACENTER_FLOORS,
  type FloorKey,
  ZONE_INDICATOR_COLORS,
} from "../../components/ops/commandCenterLayout";
import { cascadeDelays } from "../../data/mock";
import { useApp } from "../../store/appStore";

function LiveClock() {
  const [t, setT] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = t.getHours().toString().padStart(2, "0");
  const m = t.getMinutes().toString().padStart(2, "0");
  const s = t.getSeconds().toString().padStart(2, "0");

  return (
    <span className="font-mono text-[11px] text-zinc-600 tabular-nums tracking-widest">
      {h}:{m}:{s}
    </span>
  );
}

export default function FloorPlan() {
  const { assets, incidents, activeIncidentId, setActiveIncident } = useApp();
  const [activeFloor, setActiveFloor] = useState<FloorKey>("Mechanical");
  const [litNodes, setLitNodes] = useState<Set<string>>(new Set());

  const incident = incidents.find((item) => item.id === activeIncidentId);
  const criticalIncident = incidents.find((item) => item.severity === "critical");
  const floorZones = Object.entries(DATACENTER_FLOORS[activeFloor].zones);

  useEffect(() => {
    if (!incident) {
      setLitNodes(new Set());
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    incident.blastRadius.forEach((id) => {
      timers.push(
        setTimeout(
          () => setLitNodes((prev) => new Set([...prev, id])),
          (cascadeDelays[id] ?? 5) * 400
        )
      );
    });

    return () => {
      timers.forEach(clearTimeout);
      setLitNodes(new Set());
    };
  }, [incident]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#050505]">
      <div className="px-4 md:px-5 pt-3 md:pt-4 pb-3 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-emerald-500">
              Floor Layout
            </span>
            <span className="hidden sm:block w-px h-3 bg-white/[0.08]" />
            <span className="hidden sm:block text-[11px] text-zinc-400 font-medium">
              Facility Alpha
            </span>
            <span className="hidden sm:block text-[11px] text-zinc-700">·</span>
            <span className="hidden sm:block text-[11px] text-zinc-600 font-mono">DC-01</span>
            {criticalIncident && (
              <button
                type="button"
                onClick={() => setActiveIncident(criticalIncident.id)}
                className="flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase tracking-wide"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />1 Critical
                Path
              </button>
            )}
          </div>

          <LiveClock />
        </div>

        <div className="flex items-center gap-1 p-1 bg-white/[0.02] rounded-xl ring-1 ring-white/[0.05]">
          {(
            Object.entries(DATACENTER_FLOORS) as [FloorKey, (typeof DATACENTER_FLOORS)[FloorKey]][]
          ).map(([key, cfg]) => {
            const isActive = activeFloor === key;
            const hasAlert = !!(key === "Mechanical" && criticalIncident);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFloor(key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.08] text-white ring-1 ring-white/[0.10]"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasAlert ? "bg-red-400 animate-pulse" : cfg.indicatorColor} opacity-70`}
                />
                <span className="hidden sm:block font-mono">{cfg.shortLabel}</span>
                <span className="hidden md:block text-[9px] opacity-70">{cfg.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 mt-2.5 mx-4 md:mx-5 mb-4 md:mb-5 overflow-hidden">
        <div className="relative h-full rounded-2xl overflow-hidden ring-1 ring-white/[0.05] bg-[#060606] min-h-[420px]">
          <CommandCenterZoneView
            assets={assets}
            incident={incident}
            litNodes={litNodes}
            activeFloor={activeFloor}
            onAssetClick={(id) => {
              const nextIncident = incidents.find(
                (item) => item.assetId === id || item.blastRadius.includes(id)
              );
              setActiveIncident(nextIncident?.id ?? null);
            }}
          />

          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
              {DATACENTER_FLOORS[activeFloor].label}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 flex flex-col gap-1 pointer-events-none">
            {floorZones.map(([zoneName, zoneCfg]) => (
              <div key={zoneName} className="flex items-center gap-1.5">
                <div
                  className={`w-1 h-1 rounded-full ${ZONE_INDICATOR_COLORS[zoneCfg.zone] ?? "bg-zinc-500"} opacity-60`}
                />
                <span className="text-[7px] font-mono text-zinc-700">{zoneName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

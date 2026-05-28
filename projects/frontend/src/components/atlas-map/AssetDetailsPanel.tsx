import { AnimatePresence, motion } from "framer-motion";
import { useFloorPlanStore } from "./floorPlanStore";
import { ASSETS, CRAC07_INCIDENT, EDGES } from "./mapData";
import { COLORS } from "./mapStyles";
import type { AssetStatus, AssetType, EdgeResource } from "./mapTypes";
import { getAssetById, getDownstreamDeps, getUpstreamDeps } from "./mapUtils";

const TYPE_LABELS: Record<AssetType, string> = {
  rack: "Server Rack",
  pdu: "Power Distribution Unit",
  ups: "UPS",
  crac: "CRAC Unit",
  sensor: "Sensor",
  generator: "Generator",
  switch: "Network Switch",
  cooling_unit: "Cooling Unit",
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  normal: COLORS.normal,
  warning: COLORS.warning,
  critical: COLORS.critical,
  offline: COLORS.offline,
};

const RESOURCE_COLORS: Record<EdgeResource, string> = {
  power: COLORS.power,
  cooling: COLORS.cooling,
  network: COLORS.network,
  dependency: COLORS.dependency,
};

function StatusDot({ status }: { status: AssetStatus }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    />
  );
}

function ResourceChip({ resource }: { resource: EdgeResource }) {
  return (
    <span
      className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
      style={{
        color: RESOURCE_COLORS[resource],
        backgroundColor: `${RESOURCE_COLORS[resource]}1A`,
        border: `1px solid ${RESOURCE_COLORS[resource]}33`,
      }}
    >
      {resource}
    </span>
  );
}

function SiteOverview() {
  const incidentActive = useFloorPlanStore((s) => s.incidentActive);
  const overrides = useFloorPlanStore((s) => s.incidentAssetOverrides);
  const selectAsset = useFloorPlanStore((s) => s.selectAsset);

  const criticalCount = ASSETS.filter((a) => (overrides[a.id] ?? a.status) === "critical").length;
  const warningCount = ASSETS.filter((a) => (overrides[a.id] ?? a.status) === "warning").length;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="mb-1">
        <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-3">
          Site Overview
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Total Assets", value: ASSETS.length, color: "text-zinc-300" },
            { label: "Zones", value: 6, color: "text-zinc-300" },
            {
              label: "Critical",
              value: criticalCount,
              color: criticalCount > 0 ? "text-red-400" : "text-zinc-500",
            },
            {
              label: "Warning",
              value: warningCount,
              color: warningCount > 0 ? "text-amber-400" : "text-zinc-500",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white/[0.02] rounded-lg px-3 py-2 ring-1 ring-white/[0.05]"
            >
              <p className={`text-[18px] font-semibold leading-none tabular-nums ${kpi.color}`}>
                {kpi.value}
              </p>
              <p className="text-[10px] text-zinc-600 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      {incidentActive && (
        <div className="rounded-xl ring-1 ring-red-500/25 bg-red-500/[0.04] p-3">
          <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-red-500/80 mb-2">
            Active Incident
          </p>
          <p className="text-[12px] font-semibold text-white mb-1">CRAC-07 Thermal Failure</p>
          <p className="text-[11px] text-zinc-400">
            {Object.keys(useFloorPlanStore.getState().incidentAssetOverrides).length} assets
            affected
          </p>
          <button
            type="button"
            onClick={() => selectAsset("crac-07")}
            className="mt-2 text-[10px] text-red-400 hover:text-red-300 transition-colors"
          >
            View root cause →
          </button>
        </div>
      )}

      <div className="mt-1">
        <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-2">
          Asset List
        </p>
        <div className="space-y-1 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {ASSETS.filter((a) => ["crac", "ups", "pdu", "generator"].includes(a.type)).map((a) => {
            const status = (overrides[a.id] ?? a.status) as AssetStatus;
            return (
              <button
                type="button"
                key={a.id}
                onClick={() => selectAsset(a.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
              >
                <StatusDot status={status} />
                <span className="text-[11px] text-zinc-300 flex-1">{a.name}</span>
                <span className="text-[9px] text-zinc-600">{TYPE_LABELS[a.type]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BlastRadiusSection() {
  const overrides = useFloorPlanStore((s) => s.incidentAssetOverrides);
  const edgeOverrides = useFloorPlanStore((s) => s.incidentEdgeOverrides);

  const affectedSteps = CRAC07_INCIDENT.filter(
    (s) => s.assetId !== "crac-07" && overrides[s.assetId]
  );

  if (affectedSteps.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-red-500/70 mb-2">
        Blast Radius
      </p>
      <div className="space-y-1.5">
        {affectedSteps.map((step) => {
          const asset = getAssetById(ASSETS, step.assetId);
          const isEdgeActive = step.edgeIds.some((id) => edgeOverrides[id]);
          return (
            <div
              key={step.assetId}
              className="flex items-start gap-2 px-2.5 py-2 rounded-lg ring-1 bg-amber-500/[0.03] ring-amber-500/15"
            >
              <span
                className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                style={{
                  backgroundColor:
                    overrides[step.assetId] === "critical" ? COLORS.critical : COLORS.warning,
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-zinc-200">{asset?.name}</p>
                {step.minutesToImpact && (
                  <p className="text-[10px] text-zinc-500">
                    T+
                    <span className="text-amber-400 font-mono font-semibold">
                      {step.minutesToImpact}
                    </span>{" "}
                    min
                    {isEdgeActive && (
                      <span className="text-cyan-400 ml-1">· cooling path active</span>
                    )}
                  </p>
                )}
              </div>
              <span
                className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded"
                style={{
                  color: overrides[step.assetId] === "critical" ? COLORS.critical : COLORS.warning,
                  backgroundColor:
                    overrides[step.assetId] === "critical"
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(245,158,11,0.1)",
                }}
              >
                {overrides[step.assetId]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AssetDetailsPanel() {
  const selectedAssetId = useFloorPlanStore((s) => s.selectedAssetId);
  const incidentActive = useFloorPlanStore((s) => s.incidentActive);
  const overrides = useFloorPlanStore((s) => s.incidentAssetOverrides);

  const asset = selectedAssetId ? getAssetById(ASSETS, selectedAssetId) : null;
  const upstream = asset ? getUpstreamDeps(EDGES, asset.id) : [];
  const downstream = asset ? getDownstreamDeps(EDGES, asset.id) : [];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0E1218] border-l border-[#202A36]">
      <div className="px-4 py-3 border-b border-[#202A36] flex-shrink-0">
        <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600">
          {asset ? "Asset Details" : "Overview"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait">
          {!asset ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <SiteOverview />
            </motion.div>
          ) : (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Asset header */}
              <div className="p-4 border-b border-[#202A36]">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${STATUS_COLORS[(overrides[asset.id] ?? asset.status) as AssetStatus]}15`,
                      border: `1px solid ${STATUS_COLORS[(overrides[asset.id] ?? asset.status) as AssetStatus]}40`,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[(overrides[asset.id] ?? asset.status) as AssetStatus],
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-white leading-tight">
                      {asset.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{TYPE_LABELS[asset.type]}</p>
                  </div>
                  <span
                    className="text-[9px] font-mono uppercase px-2 py-1 rounded-md mt-0.5 font-semibold"
                    style={{
                      color: STATUS_COLORS[(overrides[asset.id] ?? asset.status) as AssetStatus],
                      backgroundColor: `${STATUS_COLORS[(overrides[asset.id] ?? asset.status) as AssetStatus]}15`,
                    }}
                  >
                    {overrides[asset.id] ?? asset.status}
                  </span>
                </div>
              </div>

              {/* Metadata */}
              <div className="p-4 border-b border-[#202A36]">
                <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-2">
                  Properties
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-zinc-500">Zone</span>
                    <span className="text-[11px] text-zinc-300">
                      {asset.zoneId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-zinc-500">Criticality</span>
                    <span
                      className={`text-[11px] font-semibold ${asset.criticality === "critical" ? "text-red-400" : asset.criticality === "high" ? "text-amber-400" : "text-zinc-400"}`}
                    >
                      {asset.criticality}
                    </span>
                  </div>
                  {Object.entries(asset.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[11px] text-zinc-500">{k.replace(/_/g, " ")}</span>
                      <span className="text-[11px] text-zinc-300 font-mono">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upstream dependencies */}
              {upstream.length > 0 && (
                <div className="p-4 border-b border-[#202A36]">
                  <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-2">
                    Upstream ({upstream.length})
                  </p>
                  <div className="space-y-1.5">
                    {upstream.map((edge) => {
                      const src = getAssetById(ASSETS, edge.sourceAssetId);
                      return (
                        <div key={edge.id} className="flex items-center gap-2">
                          <ResourceChip resource={edge.resource} />
                          <span className="text-[11px] text-zinc-300 flex-1">{src?.name}</span>
                          <StatusDot
                            status={
                              (overrides[edge.sourceAssetId] ??
                                src?.status ??
                                "normal") as AssetStatus
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Downstream dependencies */}
              {downstream.length > 0 && (
                <div className="p-4 border-b border-[#202A36]">
                  <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-600 mb-2">
                    Downstream ({downstream.length})
                  </p>
                  <div className="space-y-1.5">
                    {downstream.map((edge) => {
                      const tgt = getAssetById(ASSETS, edge.targetAssetId);
                      const tgtStatus = (overrides[edge.targetAssetId] ??
                        tgt?.status ??
                        "normal") as AssetStatus;
                      return (
                        <div key={edge.id} className="flex items-center gap-2">
                          <ResourceChip resource={edge.resource} />
                          <span className="text-[11px] text-zinc-300 flex-1">{tgt?.name}</span>
                          {edge.minutesToImpact && incidentActive && (
                            <span className="text-[9px] font-mono text-amber-400">
                              T+{edge.minutesToImpact}m
                            </span>
                          )}
                          <StatusDot status={tgtStatus} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Blast radius section (when incident active and this is the root) */}
              {incidentActive && asset.id === "crac-07" && <BlastRadiusSection />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

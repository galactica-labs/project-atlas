import { AnimatePresence, motion } from "framer-motion";
import { useFloorPlanStore } from "./floorPlanStore";
import { CRAC07_INCIDENT, FLOORS } from "./mapData";
import { COLORS } from "./mapStyles";
import type { AssetStatus, AssetType, EdgeResource } from "./mapTypes";
import { getAssetById, getDownstreamDeps, getUpstreamDeps } from "./mapUtils";

const TYPE_LABELS: Record<AssetType, string> = {
  rack: "Server Rack",
  pdu: "Power Dist. Unit",
  ups: "UPS",
  crac: "CRAC Unit",
  sensor: "Sensor",
  generator: "Generator",
  switch: "Network Switch",
  cooling_unit: "Cooling Unit",
  firewall: "Firewall",
  patch_panel: "Patch Panel",
  chiller: "Chiller",
  battery: "Battery Bank",
  switchgear: "Switchgear",
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

function Divider() {
  return <div className="border-b" style={{ borderColor: COLORS.panelBorder }} />;
}

function ResourceChip({ resource }: { resource: EdgeResource }) {
  const color = RESOURCE_COLORS[resource];
  return (
    <span
      className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
      style={{ color, backgroundColor: `${color}1A`, border: `1px solid ${color}33` }}
    >
      {resource}
    </span>
  );
}

function StatusDot({ status }: { status: AssetStatus }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    />
  );
}

function BlastRadiusSection() {
  const overrides = useFloorPlanStore((s) => s.incidentAssetOverrides);
  const edgeOverrides = useFloorPlanStore((s) => s.incidentEdgeOverrides);
  const floorAssets = FLOORS["floor-b"].assets;

  const affectedSteps = CRAC07_INCIDENT.filter(
    (s) => s.assetId !== "crac-07" && overrides[s.assetId]
  );

  if (affectedSteps.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <p
        className="text-[9px] font-bold tracking-[0.14em] uppercase mb-2"
        style={{ color: "rgba(239,68,68,0.7)" }}
      >
        Blast Radius
      </p>
      <div className="space-y-1.5">
        {affectedSteps.map((step) => {
          const asset = getAssetById(floorAssets, step.assetId);
          const isEdgeActive = step.edgeIds.some((id) => edgeOverrides[id]);
          const statusColor =
            overrides[step.assetId] === "critical" ? COLORS.critical : COLORS.warning;
          return (
            <div
              key={step.assetId}
              className="flex items-start gap-2 px-2.5 py-2 rounded-lg ring-1"
              style={{
                backgroundColor: "rgba(245,158,11,0.03)",
                borderColor: "rgba(245,158,11,0.15)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold" style={{ color: COLORS.textSecondary }}>
                  {asset?.name}
                </p>
                {step.minutesToImpact && (
                  <p className="text-[10px]" style={{ color: COLORS.textMuted }}>
                    T+
                    <span className="font-mono font-semibold" style={{ color: COLORS.warning }}>
                      {step.minutesToImpact}
                    </span>{" "}
                    min
                    {isEdgeActive && (
                      <span style={{ color: COLORS.cooling }}> · cooling active</span>
                    )}
                  </p>
                )}
              </div>
              <span
                className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded"
                style={{ color: statusColor, backgroundColor: `${statusColor}1A` }}
              >
                {overrides[step.assetId]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recommended action */}
      <div
        className="mt-3 p-3 rounded-lg"
        style={{
          backgroundColor: "rgba(245,158,11,0.04)",
          border: "1px solid rgba(245,158,11,0.18)",
        }}
      >
        <p className="text-[9px] font-bold mb-1" style={{ color: COLORS.warning }}>
          Recommended Action
        </p>
        <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textMuted }}>
          Dispatch technician to Cooling Zone — Floor B. CRAC-07 compressor replacement required.
          Estimated repair: 45 min. CRAC-08 can carry partial load.
        </p>
      </div>
    </div>
  );
}

function SiteOverview() {
  const { incidentActive, incidentAssetOverrides, selectAsset, activeFloorId } =
    useFloorPlanStore();
  const floorAssets = FLOORS[activeFloorId].assets;

  const critical = floorAssets.filter(
    (a) => (incidentAssetOverrides[a.id] ?? a.status) === "critical"
  ).length;
  const warning = floorAssets.filter(
    (a) => (incidentAssetOverrides[a.id] ?? a.status) === "warning"
  ).length;

  const kpis = [
    { label: "Total Assets", value: floorAssets.length, color: COLORS.textSecondary },
    {
      label: "Zones",
      value: FLOORS[activeFloorId].zones.filter((z) => z.type !== "hall").length,
      color: COLORS.textSecondary,
    },
    {
      label: "Critical",
      value: critical,
      color: critical > 0 ? COLORS.critical : COLORS.textMuted,
    },
    { label: "Warning", value: warning, color: warning > 0 ? COLORS.warning : COLORS.textMuted },
  ];

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <p
          className="text-[9px] font-bold tracking-[0.14em] uppercase mb-3"
          style={{ color: COLORS.textMuted }}
        >
          Site Overview
        </p>
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg px-3 py-2"
              style={{
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p
                className="text-[18px] font-semibold leading-none tabular-nums"
                style={{ color: kpi.color }}
              >
                {kpi.value}
              </p>
              <p className="text-[10px] mt-1" style={{ color: COLORS.textMuted }}>
                {kpi.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {incidentActive && (
        <div
          className="rounded-xl p-3"
          style={{
            border: "1px solid rgba(239,68,68,0.25)",
            backgroundColor: "rgba(239,68,68,0.04)",
          }}
        >
          <p
            className="text-[9px] font-bold tracking-[0.14em] uppercase mb-2"
            style={{ color: "rgba(239,68,68,0.8)" }}
          >
            Active Incident
          </p>
          <p className="text-[12px] font-semibold text-white mb-1">CRAC-07 Thermal Failure</p>
          <p className="text-[11px]" style={{ color: COLORS.textMuted }}>
            {Object.keys(useFloorPlanStore.getState().incidentAssetOverrides).length} assets
            affected
          </p>
          <button
            type="button"
            onClick={() => selectAsset("crac-07")}
            className="mt-2 text-[10px] transition-colors hover:opacity-80"
            style={{ color: COLORS.critical }}
          >
            View root cause →
          </button>
        </div>
      )}

      {/* Critical asset quick list */}
      <div>
        <p
          className="text-[9px] font-bold tracking-[0.14em] uppercase mb-2"
          style={{ color: COLORS.textMuted }}
        >
          Key Assets
        </p>
        <div className="space-y-0.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {floorAssets
            .filter((a) =>
              ["crac", "ups", "generator", "chiller", "switchgear", "firewall"].includes(a.type)
            )
            .map((a) => {
              const status = (incidentAssetOverrides[a.id] ?? a.status) as AssetStatus;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => selectAsset(a.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-white/[0.03]"
                >
                  <StatusDot status={status} />
                  <span className="text-[11px] flex-1" style={{ color: COLORS.textSecondary }}>
                    {a.name}
                  </span>
                  <span className="text-[9px]" style={{ color: COLORS.textMuted }}>
                    {TYPE_LABELS[a.type]}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default function AssetDetailsPanel() {
  const { selectedAssetId, incidentActive, incidentAssetOverrides, activeFloorId } =
    useFloorPlanStore();

  const floorAssets = FLOORS[activeFloorId].assets;
  const floorEdges = FLOORS[activeFloorId].edges;

  const asset = selectedAssetId ? getAssetById(floorAssets, selectedAssetId) : null;
  const upstream = asset ? getUpstreamDeps(floorEdges, asset.id) : [];
  const downstream = asset ? getDownstreamDeps(floorEdges, asset.id) : [];

  return (
    <div
      className="h-full flex flex-col overflow-hidden border-l"
      style={{ backgroundColor: COLORS.panel, borderColor: COLORS.panelBorder }}
    >
      <div className="px-4 py-3 flex-shrink-0 border-b" style={{ borderColor: COLORS.panelBorder }}>
        <p
          className="text-[9px] font-bold tracking-[0.14em] uppercase"
          style={{ color: COLORS.textMuted }}
        >
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
              {/* Header */}
              <div className="p-4 border-b" style={{ borderColor: COLORS.panelBorder }}>
                <div className="flex items-start gap-3">
                  {(() => {
                    const status = (incidentAssetOverrides[asset.id] ??
                      asset.status) as AssetStatus;
                    const sc = STATUS_COLORS[status];
                    return (
                      <>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${sc}15`, border: `1px solid ${sc}40` }}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: sc }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold leading-tight text-white">
                            {asset.name}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: COLORS.textMuted }}>
                            {TYPE_LABELS[asset.type]}
                          </p>
                        </div>
                        <span
                          className="text-[9px] font-mono uppercase px-2 py-1 rounded-md mt-0.5 font-semibold"
                          style={{ color: sc, backgroundColor: `${sc}15` }}
                        >
                          {status}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Properties */}
              <div className="p-4 border-b" style={{ borderColor: COLORS.panelBorder }}>
                <p
                  className="text-[9px] font-bold tracking-[0.14em] uppercase mb-2"
                  style={{ color: COLORS.textMuted }}
                >
                  Properties
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: COLORS.textMuted }}>
                      Zone
                    </span>
                    <span className="text-[11px]" style={{ color: COLORS.textSecondary }}>
                      {asset.zoneId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: COLORS.textMuted }}>
                      Criticality
                    </span>
                    <span
                      className="text-[11px] font-semibold"
                      style={{
                        color:
                          asset.criticality === "critical"
                            ? COLORS.critical
                            : asset.criticality === "high"
                              ? COLORS.warning
                              : COLORS.textMuted,
                      }}
                    >
                      {asset.criticality}
                    </span>
                  </div>
                  {Object.entries(asset.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[11px]" style={{ color: COLORS.textMuted }}>
                        {k.replace(/_/g, " ")}
                      </span>
                      <span
                        className="text-[11px] font-mono"
                        style={{ color: COLORS.textSecondary }}
                      >
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upstream */}
              {upstream.length > 0 && (
                <>
                  <div className="p-4 border-b" style={{ borderColor: COLORS.panelBorder }}>
                    <p
                      className="text-[9px] font-bold tracking-[0.14em] uppercase mb-2"
                      style={{ color: COLORS.textMuted }}
                    >
                      Upstream ({upstream.length})
                    </p>
                    <div className="space-y-1.5">
                      {upstream.slice(0, 6).map((edge) => {
                        const src = getAssetById(floorAssets, edge.sourceAssetId);
                        const srcStatus = (incidentAssetOverrides[edge.sourceAssetId] ??
                          src?.status ??
                          "normal") as AssetStatus;
                        return (
                          <div key={edge.id} className="flex items-center gap-2">
                            <ResourceChip resource={edge.resource} />
                            <span
                              className="text-[11px] flex-1"
                              style={{ color: COLORS.textSecondary }}
                            >
                              {src?.name ?? edge.sourceAssetId}
                            </span>
                            <StatusDot status={srcStatus} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Divider />
                </>
              )}

              {/* Downstream */}
              {downstream.length > 0 && (
                <div className="p-4 border-b" style={{ borderColor: COLORS.panelBorder }}>
                  <p
                    className="text-[9px] font-bold tracking-[0.14em] uppercase mb-2"
                    style={{ color: COLORS.textMuted }}
                  >
                    Downstream ({downstream.length})
                  </p>
                  <div className="space-y-1.5">
                    {downstream.slice(0, 8).map((edge) => {
                      const tgt = getAssetById(floorAssets, edge.targetAssetId);
                      const tgtStatus = (incidentAssetOverrides[edge.targetAssetId] ??
                        tgt?.status ??
                        "normal") as AssetStatus;
                      return (
                        <div key={edge.id} className="flex items-center gap-2">
                          <ResourceChip resource={edge.resource} />
                          <span
                            className="text-[11px] flex-1"
                            style={{ color: COLORS.textSecondary }}
                          >
                            {tgt?.name ?? edge.targetAssetId}
                          </span>
                          {edge.minutesToImpact && incidentActive && (
                            <span
                              className="text-[9px] font-mono"
                              style={{ color: COLORS.warning }}
                            >
                              T+{edge.minutesToImpact}m
                            </span>
                          )}
                          <StatusDot status={tgtStatus} />
                        </div>
                      );
                    })}
                    {downstream.length > 8 && (
                      <p className="text-[10px] px-1" style={{ color: COLORS.textMuted }}>
                        +{downstream.length - 8} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Blast radius — shown when incident active and this is the root */}
              {incidentActive && asset.id === "crac-07" && <BlastRadiusSection />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

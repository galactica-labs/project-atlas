import {
  ArrowRight,
  CheckCircle,
  Clock,
  Lightning,
  Package,
  Thermometer,
  Warning,
  WifiHigh,
  XCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCommandCenterStore } from "./commandCenterStore";
import { SCENE_ASSETS, SCENE_EDGES } from "./sceneData";
import { STATUS_COLORS } from "./sceneStyles";
import type { AssetStatus, AssetType } from "./sceneTypes";

const TYPE_ICON: Record<AssetType, React.ElementType> = {
  rack: Package,
  crac: Thermometer,
  cooling_unit: Thermometer,
  pdu: Lightning,
  ups: Lightning,
  switch: WifiHigh,
  sensor: Thermometer,
  generator: Lightning,
};

const STATUS_LABEL: Record<AssetStatus, string> = {
  normal: "Normal",
  warning: "Warning",
  critical: "Critical",
  offline: "Offline",
};

const STATUS_ICON: Record<AssetStatus, React.ElementType> = {
  normal: CheckCircle,
  warning: Warning,
  critical: XCircle,
  offline: XCircle,
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
      <span className="text-[10px] text-zinc-600 font-mono">{label}</span>
      <span className="text-[10px] text-zinc-300 font-mono tabular-nums">{value}</span>
    </div>
  );
}

function BlastRadiusPanel() {
  const { blastRadiusItems } = useCommandCenterStore();

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Warning size={10} weight="fill" className="text-red-400" />
        <span className="text-[9px] font-bold tracking-wider uppercase text-red-400">
          Blast Radius
        </span>
      </div>
      <div className="space-y-1.5">
        {blastRadiusItems.map((item) => (
          <div key={item.assetId} className="p-2 rounded-lg bg-red-950/30 ring-1 ring-red-500/20">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-semibold text-red-300">{item.assetName}</span>
              <div className="flex items-center gap-1 text-red-400">
                <Clock size={8} />
                <span className="text-[9px] font-mono font-bold tabular-nums">
                  {item.minutesToImpact}m
                </span>
              </div>
            </div>
            <p className="text-[9px] text-zinc-500 leading-snug">{item.impact}</p>
          </div>
        ))}
      </div>

      {/* Recommended action */}
      <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 ring-1 ring-amber-500/20">
        <p className="text-[9px] font-bold text-amber-400 mb-1">Recommended Action</p>
        <p className="text-[9px] text-zinc-400 leading-relaxed">
          Dispatch technician to Cooling Zone. CRAC-07 compressor unit requires replacement.
          Estimated repair time: 45 min. CRAC-08 can carry partial load.
        </p>
        <button
          type="button"
          className="mt-2 flex items-center gap-1 text-[9px] text-amber-400 font-semibold hover:text-amber-300 transition-colors"
        >
          Create Dispatch Plan <ArrowRight size={8} weight="bold" />
        </button>
      </div>
    </div>
  );
}

export function AssetDetailsPanel() {
  const { selectedAssetId, assetStatuses, viewMode, blastRadiusItems } = useCommandCenterStore();

  const asset = SCENE_ASSETS.find((a) => a.id === selectedAssetId);
  const status = asset ? (assetStatuses[asset.id] ?? asset.status) : null;

  const upstreamEdges = asset ? SCENE_EDGES.filter((e) => e.targetAssetId === asset.id) : [];
  const downstreamEdges = asset ? SCENE_EDGES.filter((e) => e.sourceAssetId === asset.id) : [];
  const upstreamAssets = upstreamEdges
    .map((e) => SCENE_ASSETS.find((a) => a.id === e.sourceAssetId))
    .filter(Boolean);
  const downstreamAssets = downstreamEdges
    .map((e) => SCENE_ASSETS.find((a) => a.id === e.targetAssetId))
    .filter(Boolean);

  const hasBlastRadius = viewMode === "incident" && blastRadiusItems.length > 0;
  const showPanel = !!asset || hasBlastRadius;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#070707] border-l border-white/[0.05]">
      <div className="px-4 py-3 border-b border-white/[0.05] flex-shrink-0">
        <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-600">
          {viewMode === "incident" ? "Incident Details" : "Asset Details"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait">
          {!showPanel ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-40 text-center"
            >
              <Package size={24} weight="thin" className="text-zinc-700 mb-2" />
              <p className="text-[11px] text-zinc-700">Select an asset to inspect</p>
              <p className="text-[10px] text-zinc-800 mt-1">or run a simulation</p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedAssetId ?? "incident"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {asset && status && (
                <>
                  {/* Header */}
                  <div className="flex items-start gap-2 mb-3">
                    {(() => {
                      const Icon = TYPE_ICON[asset.type];
                      const SIcon = STATUS_ICON[status];
                      return (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] ring-1 ring-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon size={14} weight="light" className="text-zinc-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-white leading-none">
                              {asset.name}
                            </p>
                            <p className="text-[10px] text-zinc-600 mt-0.5 capitalize">
                              {asset.type.replace("_", " ")} · Zone {asset.zoneId.replace("-", " ")}
                            </p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <SIcon
                                size={9}
                                weight="fill"
                                style={{ color: STATUS_COLORS[status] }}
                              />
                              <span
                                className="text-[9px] font-semibold"
                                style={{ color: STATUS_COLORS[status] }}
                              >
                                {STATUS_LABEL[status]}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Criticality */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-zinc-600 font-mono">Criticality</span>
                      <span className="text-[9px] text-zinc-400 font-mono">
                        {asset.criticality}/10
                      </span>
                    </div>
                    <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${asset.criticality * 10}%`,
                          background:
                            asset.criticality >= 9
                              ? "#ef4444"
                              : asset.criticality >= 7
                                ? "#f59e0b"
                                : "#22c55e",
                        }}
                      />
                    </div>
                  </div>

                  {/* Metadata */}
                  {asset.metadata && Object.keys(asset.metadata).length > 0 && (
                    <div className="mb-3">
                      <p className="text-[8px] font-mono uppercase tracking-wider text-zinc-700 mb-1.5">
                        Telemetry
                      </p>
                      {Object.entries(asset.metadata).map(([k, v]) => (
                        <MetaRow key={k} label={k} value={String(v)} />
                      ))}
                    </div>
                  )}

                  {/* Upstream */}
                  {upstreamAssets.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[8px] font-mono uppercase tracking-wider text-zinc-700 mb-1.5">
                        Upstream
                      </p>
                      <div className="space-y-1">
                        {upstreamAssets.slice(0, 4).map(
                          (a) =>
                            a && (
                              <div
                                key={a.id}
                                className="flex items-center gap-1.5 text-[9px] text-zinc-500"
                              >
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                {a.name}
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Downstream */}
                  {downstreamAssets.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[8px] font-mono uppercase tracking-wider text-zinc-700 mb-1.5">
                        Downstream ({downstreamAssets.length})
                      </p>
                      <div className="space-y-1">
                        {downstreamAssets.slice(0, 5).map(
                          (a) =>
                            a && (
                              <div
                                key={a.id}
                                className="flex items-center gap-1.5 text-[9px] text-zinc-500"
                              >
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                {a.name}
                              </div>
                            )
                        )}
                        {downstreamAssets.length > 5 && (
                          <p className="text-[9px] text-zinc-700">
                            +{downstreamAssets.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Blast radius for incident mode */}
              {hasBlastRadius && <BlastRadiusPanel />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

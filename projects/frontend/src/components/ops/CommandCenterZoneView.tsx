import {
  Cpu,
  Desktop,
  Gear,
  Lightning,
  Network,
  Plugs,
  Snowflake,
  Warning,
  WifiHigh,
} from "@phosphor-icons/react";
import type { Asset, AssetStatus, Incident } from "../../data/mock";
import {
  DATACENTER_FLOORS,
  type FloorKey,
  ZONE_SURFACE_COLORS,
  type ZoneConfig,
  type ZoneVariant,
} from "./commandCenterLayout";

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  assets: Asset[];
  incident: Incident | undefined;
  litNodes: Set<string>;
  activeFloor: FloorKey;
  onAssetClick: (assetId: string) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getDerivedStatus(
  asset: Asset,
  incident: Incident | undefined,
  litNodes: Set<string>
): AssetStatus {
  if (incident?.assetId === asset.id) return "critical";
  if (litNodes.has(asset.id)) return "warning";
  return asset.status;
}

function getStatusTone(status: AssetStatus) {
  switch (status) {
    case "critical":
      return { color: "#ef4444", glow: "rgba(239,68,68,0.28)", ring: "rgba(239,68,68,0.55)" };
    case "warning":
      return { color: "#f59e0b", glow: "rgba(245,158,11,0.24)", ring: "rgba(245,158,11,0.50)" };
    case "offline":
      return { color: "#71717a", glow: "rgba(113,113,122,0.18)", ring: "rgba(113,113,122,0.35)" };
    default:
      return { color: "#22c55e", glow: "rgba(34,197,94,0.14)", ring: "rgba(255,255,255,0.12)" };
  }
}

function getAssetIcon(type: string) {
  if (type === "Cooling") return Snowflake;
  if (type === "Power") return Lightning;
  if (type === "Network") return WifiHigh;
  return Desktop;
}

function getAssetAccent(type: string) {
  if (type === "Cooling") return "#38bdf8";
  if (type === "Power") return "#f59e0b";
  if (type === "Network") return "#a78bfa";
  return "#34d399";
}

function getLinkColor(assetType: string, highlighted: boolean) {
  if (highlighted) return "rgba(248,113,113,0.9)";
  if (assetType === "Cooling") return "rgba(56,189,248,0.42)";
  if (assetType === "Power") return "rgba(245,158,11,0.36)";
  if (assetType === "Network") return "rgba(167,139,250,0.36)";
  return "rgba(255,255,255,0.14)";
}

function getZoneIcon(variant: ZoneVariant) {
  switch (variant) {
    case "electrical":
      return Plugs;
    case "power":
      return Lightning;
    case "cooling":
      return Snowflake;
    case "compute":
      return Desktop;
    case "network":
      return Network;
    case "mechanical":
      return Gear;
    case "a":
      return Cpu;
    case "b":
      return Cpu;
  }
}

// ── AssetNode ────────────────────────────────────────────────────────────────

function AssetNode({
  asset,
  status,
  isFocused,
  isAffected,
  onAssetClick,
}: {
  asset: Asset;
  status: AssetStatus;
  isFocused: boolean;
  isAffected: boolean;
  onAssetClick: (id: string) => void;
}) {
  const statusTone = getStatusTone(status);
  const isAlert = isFocused || isAffected || status !== "normal";
  const nodeSize = isAlert && asset.criticality === "high" ? 32 : 28;
  const accent = getAssetAccent(asset.type);
  const Icon = getAssetIcon(asset.type);
  const iconSize = nodeSize === 32 ? 16 : 14;

  return (
    <button
      type="button"
      className="group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-[3px] z-10"
      style={{ left: `${asset.x}%`, top: `${asset.y}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onAssetClick(asset.id);
      }}
      title={`${asset.name} — ${status}`}
      aria-label={`Inspect ${asset.name}`}
    >
      {/* Ambient glow halo */}
      {isAlert && (
        <span
          className="absolute inset-[-16px] rounded-full animate-pulse pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${statusTone.glow} 0%, transparent 65%)`,
          }}
        />
      )}

      {/* Node circle */}
      <span
        className="relative flex items-center justify-center rounded-full transition-all duration-200 group-hover:scale-110"
        style={{
          width: nodeSize,
          height: nodeSize,
          background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.10), rgba(0,0,0,0.60))`,
          backgroundColor: `color-mix(in srgb, ${accent} 9%, #090c11)`,
          border: `1.5px solid ${isAlert ? statusTone.ring : "rgba(255,255,255,0.11)"}`,
          boxShadow: isAlert
            ? `0 0 18px ${statusTone.glow}, inset 0 1px 0 rgba(255,255,255,0.14)`
            : `0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)`,
        }}
      >
        <Icon
          size={iconSize}
          weight={isAlert ? "fill" : "regular"}
          style={{
            color: isAlert ? statusTone.color : accent,
            opacity: isAlert ? 1 : 0.65,
          }}
        />

        {/* Status dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-[7px] h-[7px] rounded-full ring-[1.5px] ring-[#050505]"
          style={{ backgroundColor: statusTone.color }}
        />
      </span>

      {/* Always-visible name label */}
      <span
        className="whitespace-nowrap font-mono leading-none pointer-events-none select-none"
        style={{
          fontSize: "7px",
          color: isAlert ? statusTone.color : "rgba(161,161,170,0.50)",
          letterSpacing: "0.05em",
          textShadow: isAlert ? `0 0 8px ${statusTone.glow}` : "none",
        }}
      >
        {asset.name}
      </span>
    </button>
  );
}

// ── GraphLegend ──────────────────────────────────────────────────────────────

function GraphLegend() {
  const types = [
    { label: "Cooling", Icon: Snowflake, color: "#38bdf8" },
    { label: "Power", Icon: Lightning, color: "#f59e0b" },
    { label: "Compute", Icon: Desktop, color: "#34d399" },
    { label: "Network", Icon: WifiHigh, color: "#a78bfa" },
  ];
  const statuses = [
    { label: "Nominal", color: "#22c55e" },
    { label: "Warning", color: "#f59e0b" },
    { label: "Critical", color: "#ef4444" },
    { label: "Offline", color: "#71717a" },
  ];

  return (
    <div
      className="absolute bottom-0 inset-x-0 z-20 pointer-events-none flex items-center justify-between gap-4 px-4 py-2.5"
      style={{
        background: "linear-gradient(0deg, rgba(4,6,10,0.96) 65%, transparent)",
      }}
    >
      {/* Asset type legend */}
      <div className="flex items-center gap-3.5">
        {types.map(({ label, Icon, color }) => (
          <div key={label} className="flex items-center gap-1">
            <Icon size={9} style={{ color }} />
            <span className="text-[7px] font-mono text-zinc-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Status dot legend */}
      <div className="flex items-center gap-3.5">
        {statuses.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[7px] font-mono text-zinc-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BlueprintView ────────────────────────────────────────────────────────────

function BlueprintView({
  assetsByZone,
  incident,
  litNodes,
  floorAssetIds,
  onAssetClick,
}: {
  assetsByZone: { zoneName: string; zoneCfg: ZoneConfig; assets: Asset[] }[];
  incident: Incident | undefined;
  litNodes: Set<string>;
  floorAssetIds: Set<string>;
  onAssetClick: (assetId: string) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-2 p-3 pb-10">
      {assetsByZone.map(({ zoneName, zoneCfg, assets: zoneAssets }) => {
        const zoneTone = ZONE_SURFACE_COLORS[zoneCfg.zone];
        const ZoneIcon = getZoneIcon(zoneCfg.zone);

        // Zone-level status counts
        const critCount = zoneAssets.filter(
          (a) => getDerivedStatus(a, incident, litNodes) === "critical"
        ).length;
        const warnCount = zoneAssets.filter(
          (a) => getDerivedStatus(a, incident, litNodes) === "warning"
        ).length;

        // Cross-floor upstream-failure badge
        const hasCrossFloorImpact = zoneAssets.some((a) =>
          a.dependsOn.some(
            (depId) =>
              !floorAssetIds.has(depId) && (incident?.assetId === depId || litNodes.has(depId))
          )
        );

        // Intra-zone dependency edges
        const zoneAssetMap = new Map(zoneAssets.map((a) => [a.id, a]));
        const links = zoneAssets.flatMap((asset) =>
          asset.dependsOn.flatMap((depId) => {
            const dep = zoneAssetMap.get(depId);
            if (!dep) return [];
            const highlighted =
              incident?.assetId === asset.id ||
              incident?.assetId === dep.id ||
              litNodes.has(asset.id) ||
              litNodes.has(dep.id);
            return [{ id: `${depId}-${asset.id}`, from: dep, to: asset, highlighted }];
          })
        );

        const borderColor =
          critCount > 0
            ? "rgba(239,68,68,0.20)"
            : warnCount > 0
              ? "rgba(245,158,11,0.16)"
              : "rgba(255,255,255,0.055)";

        return (
          <section
            key={zoneName}
            className="relative min-h-[92px] overflow-hidden rounded-[18px]"
            style={{
              flex: zoneCfg.height,
              border: `1px solid ${borderColor}`,
              background: `linear-gradient(160deg, ${zoneTone.fill}, rgba(4,8,12,0.94))`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), inset 0 0 0 1px ${zoneTone.glow}`,
            }}
          >
            {/* Left accent bar */}
            <div
              className="absolute inset-y-0 left-0 w-[2.5px] rounded-l-[18px]"
              style={{
                background: `linear-gradient(180deg, ${zoneTone.edge}, transparent 70%)`,
              }}
            />

            <div className="relative flex h-full flex-col px-4 py-3">
              {/* Zone header */}
              <div className="mb-2 flex items-center justify-between gap-2 flex-shrink-0">
                {/* Left: variant icon + zone name */}
                <div className="flex items-center gap-2 min-w-0">
                  <ZoneIcon
                    size={12}
                    weight="duotone"
                    style={{ color: zoneTone.edge, flexShrink: 0 }}
                  />
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-semibold leading-none truncate"
                      style={{ color: zoneTone.text }}
                    >
                      {zoneName}
                    </p>
                    <p className="text-[8px] text-zinc-700 mt-0.5 font-mono truncate">
                      {zoneCfg.label}
                    </p>
                  </div>
                </div>

                {/* Right: status badges + asset count */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {critCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold font-mono text-red-400 bg-red-500/[0.12] border border-red-500/25">
                      {critCount} crit
                    </span>
                  )}
                  {warnCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold font-mono text-amber-400 bg-amber-500/[0.10] border border-amber-500/22">
                      {warnCount} warn
                    </span>
                  )}
                  {hasCrossFloorImpact && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[7.5px] font-mono text-amber-400/80 bg-amber-500/[0.07] border border-amber-500/18">
                      <Warning size={7} weight="fill" />
                      X-floor
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-full text-[8px] font-mono"
                    style={{
                      color: "rgba(161,161,170,0.40)",
                      background: "rgba(0,0,0,0.30)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    {zoneAssets.length}
                  </span>
                </div>
              </div>

              {/* Asset canvas */}
              <div
                className="relative flex-1 rounded-[12px] overflow-hidden"
                style={{
                  border: "1px solid rgba(255,255,255,0.04)",
                  background: "rgba(0,0,0,0.18)",
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                {/* SVG dependency edges */}
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  {links.map((link) => (
                    <g key={link.id}>
                      {/* Shadow stroke for depth */}
                      <line
                        x1={`${link.from.x}%`}
                        y1={`${link.from.y}%`}
                        x2={`${link.to.x}%`}
                        y2={`${link.to.y}%`}
                        stroke={link.highlighted ? "rgba(239,68,68,0.14)" : "rgba(0,0,0,0.50)"}
                        strokeWidth={link.highlighted ? 6 : 3.5}
                        strokeLinecap="round"
                      />
                      {/* Colored main stroke */}
                      <line
                        x1={`${link.from.x}%`}
                        y1={`${link.from.y}%`}
                        x2={`${link.to.x}%`}
                        y2={`${link.to.y}%`}
                        stroke={getLinkColor(link.from.type, link.highlighted)}
                        strokeWidth={link.highlighted ? 2.0 : 1.2}
                        strokeDasharray={link.highlighted ? "5 4" : "2 6"}
                        strokeLinecap="round"
                        className={link.highlighted ? "dash-flow" : ""}
                      />
                    </g>
                  ))}
                </svg>

                {/* Asset nodes */}
                {zoneAssets.map((asset) => {
                  const status = getDerivedStatus(asset, incident, litNodes);
                  return (
                    <AssetNode
                      key={asset.id}
                      asset={asset}
                      status={status}
                      isFocused={incident?.assetId === asset.id}
                      isAffected={litNodes.has(asset.id)}
                      onAssetClick={onAssetClick}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── CommandCenterZoneView ────────────────────────────────────────────────────

export default function CommandCenterZoneView({
  assets,
  incident,
  litNodes,
  activeFloor,
  onAssetClick,
}: Props) {
  const floorAssets = assets.filter((asset) => asset.floor === activeFloor);
  const floorAssetIds = new Set(floorAssets.map((a) => a.id));
  const impactedOnFloor = floorAssets.filter(
    (asset) => incident?.assetId === asset.id || litNodes.has(asset.id)
  ).length;
  const assetsByZone = Object.entries(DATACENTER_FLOORS[activeFloor].zones).map(
    ([zoneName, zoneCfg]) => ({
      zoneName,
      zoneCfg,
      assets: floorAssets.filter((asset) => asset.zone === zoneName),
    })
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-[#04060a]">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(56,189,248,0.06),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(167,139,250,0.04),_transparent_40%)]" />

      {/* Asset count badge */}
      <div className="absolute right-3 top-3 z-10">
        <div
          className="rounded-full px-3 py-1.5 text-[10px] font-medium font-mono text-zinc-400"
          style={{
            background: "rgba(0,0,0,0.50)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          {floorAssets.length} assets
          {impactedOnFloor > 0 && (
            <span className="text-amber-400 ml-1.5">· {impactedOnFloor} impacted</span>
          )}
        </div>
      </div>

      <BlueprintView
        assetsByZone={assetsByZone}
        incident={incident}
        litNodes={litNodes}
        floorAssetIds={floorAssetIds}
        onAssetClick={onAssetClick}
      />

      <GraphLegend />
    </div>
  );
}

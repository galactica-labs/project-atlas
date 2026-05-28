import type { Asset, AssetStatus, Incident } from "../../data/mock";
import {
  DATACENTER_FLOORS,
  type FloorKey,
  ZONE_SURFACE_COLORS,
  type ZoneConfig,
} from "./commandCenterLayout";

interface Props {
  assets: Asset[];
  incident: Incident | undefined;
  litNodes: Set<string>;
  activeFloor: FloorKey;
  onAssetClick: (assetId: string) => void;
}

function getDerivedStatus(
  asset: Asset,
  incident: Incident | undefined,
  litNodes: Set<string>
): AssetStatus {
  if (incident?.assetId === asset.id) return "critical";
  if (litNodes.has(asset.id)) return "warning";
  return asset.status;
}

function getAssetTone(assetType: string) {
  switch (assetType) {
    case "Cooling":
      return { accent: "#38bdf8", surface: "rgba(56, 189, 248, 0.28)", label: "CLG" };
    case "Power":
      return { accent: "#f59e0b", surface: "rgba(245, 158, 11, 0.28)", label: "PWR" };
    case "Network":
      return { accent: "#a78bfa", surface: "rgba(167, 139, 250, 0.28)", label: "NET" };
    default:
      return { accent: "#34d399", surface: "rgba(52, 211, 153, 0.28)", label: "CMP" };
  }
}

function getStatusTone(status: AssetStatus) {
  switch (status) {
    case "critical":
      return {
        color: "#ef4444",
        glow: "rgba(239, 68, 68, 0.28)",
        ring: "rgba(239, 68, 68, 0.55)",
      };
    case "warning":
      return {
        color: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.24)",
        ring: "rgba(245, 158, 11, 0.5)",
      };
    case "offline":
      return {
        color: "#71717a",
        glow: "rgba(113, 113, 122, 0.18)",
        ring: "rgba(113, 113, 122, 0.35)",
      };
    default:
      return {
        color: "#22c55e",
        glow: "rgba(34, 197, 94, 0.16)",
        ring: "rgba(255, 255, 255, 0.18)",
      };
  }
}

function getLinkColor(assetType: string, highlighted: boolean) {
  if (highlighted) return "rgba(248, 113, 113, 0.9)";
  switch (assetType) {
    case "Cooling":
      return "rgba(56, 189, 248, 0.42)";
    case "Power":
      return "rgba(245, 158, 11, 0.36)";
    case "Network":
      return "rgba(167, 139, 250, 0.36)";
    default:
      return "rgba(255, 255, 255, 0.14)";
  }
}

function getStatusLabel(status: AssetStatus) {
  switch (status) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    case "offline":
      return "Offline";
    default:
      return "Nominal";
  }
}

function AssetGlyph({ asset, status }: { asset: Asset; status: AssetStatus }) {
  const assetTone = getAssetTone(asset.type);
  const statusTone = getStatusTone(status);
  const isCompute = asset.type === "Compute";
  const isCooling = asset.type === "Cooling";
  const isNetwork = asset.type === "Network";
  const isPower = asset.type === "Power";
  const frameClass = isCooling
    ? "h-8 w-[58px] rounded-[999px]"
    : isNetwork
      ? "h-10 w-10 rotate-45 rounded-[10px]"
      : isCompute
        ? "h-[56px] w-8 rounded-[10px]"
        : "h-10 w-10 rounded-[12px]";
  const coreClass = isCooling
    ? "h-2.5 w-7 rounded-[999px]"
    : isNetwork
      ? "h-3 w-3 rounded-[4px]"
      : isCompute
        ? "h-8 w-2 rounded-[3px]"
        : "h-3.5 w-3.5 rounded-[5px]";
  const railClass = isCooling
    ? "h-1.5 w-1.5 rounded-full"
    : isCompute
      ? "h-1 w-[70%] rounded-full"
      : "h-1.5 w-1.5 rounded-full";

  return (
    <span
      className={`relative flex items-center justify-center border transition-all duration-200 group-hover:scale-[1.08] ${frameClass}`}
      style={{
        background: `linear-gradient(180deg, ${assetTone.surface}, rgba(8,12,18,0.96))`,
        borderColor: statusTone.ring,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.04), 0 8px 18px rgba(0,0,0,0.28), 0 0 18px ${statusTone.glow}`,
      }}
    >
      <span
        className="absolute inset-x-[12%] top-[18%] h-[20%] rounded-full opacity-70"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.28), transparent)" }}
      />

      <span
        className="absolute inset-[1.5px] rounded-[inherit] border opacity-50"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      />

      <span
        className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[7px] font-bold tracking-[0.12em]"
        style={{
          color: assetTone.accent,
          background: "rgba(2, 6, 10, 0.92)",
          borderColor: "rgba(255,255,255,0.1)",
          boxShadow: `0 0 14px ${statusTone.glow}`,
        }}
      >
        {assetTone.label}
      </span>

      <span
        className={`absolute border ${isNetwork ? "-rotate-45" : ""} ${coreClass}`}
        style={{
          backgroundColor: statusTone.color,
          borderColor: "rgba(255,255,255,0.2)",
          boxShadow: `0 0 16px ${statusTone.glow}`,
        }}
      />

      {isCompute && (
        <>
          <span className="absolute inset-y-[14%] left-[30%] w-px bg-white/10" />
          <span className="absolute inset-y-[14%] right-[30%] w-px bg-white/10" />
        </>
      )}

      {isCooling && (
        <>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/18 h-3 w-1.5" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/18 h-3 w-1.5" />
        </>
      )}

      {isPower && (
        <span className="absolute grid grid-cols-2 gap-[2px]">
          <span className="h-1.5 w-1.5 rounded-[2px] bg-white/16" />
          <span className="h-1.5 w-1.5 rounded-[2px] bg-white/12" />
          <span className="h-1.5 w-1.5 rounded-[2px] bg-white/12" />
          <span className="h-1.5 w-1.5 rounded-[2px] bg-white/16" />
        </span>
      )}

      {isNetwork && (
        <>
          <span className="absolute left-1/2 top-[20%] h-1.5 w-px -translate-x-1/2 bg-white/16" />
          <span className="absolute left-1/2 bottom-[20%] h-1.5 w-px -translate-x-1/2 bg-white/16" />
          <span className="absolute top-1/2 left-[20%] h-px w-1.5 -translate-y-1/2 bg-white/16" />
          <span className="absolute top-1/2 right-[20%] h-px w-1.5 -translate-y-1/2 bg-white/16" />
        </>
      )}

      <span
        className={`absolute left-1/2 -translate-x-1/2 bg-white/20 ${
          isCompute ? "bottom-2" : "bottom-1.5"
        } ${railClass}`}
      />

      <span
        className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ring-2 ring-[#05070a]"
        style={{ backgroundColor: statusTone.color }}
      />
    </span>
  );
}

function BlueprintView({
  assetsByZone,
  incident,
  litNodes,
  onAssetClick,
}: {
  assetsByZone: { zoneName: string; zoneCfg: ZoneConfig; assets: Asset[] }[];
  incident: Incident | undefined;
  litNodes: Set<string>;
  onAssetClick: (assetId: string) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      {assetsByZone.map(({ zoneName, zoneCfg, assets }) => {
        const zoneTone = ZONE_SURFACE_COLORS[zoneCfg.zone];
        const zoneAssetMap = new Map(assets.map((asset) => [asset.id, asset]));
        const links = assets.flatMap((asset) =>
          asset.dependsOn.flatMap((depId) => {
            const dep = zoneAssetMap.get(depId);
            if (!dep) return [];
            const highlighted =
              incident?.assetId === asset.id ||
              incident?.assetId === dep.id ||
              litNodes.has(asset.id) ||
              litNodes.has(dep.id);
            return [
              {
                id: `${depId}-${asset.id}`,
                from: dep,
                to: asset,
                highlighted,
              },
            ];
          })
        );
        const impactedCount = assets.filter(
          (asset) => incident?.assetId === asset.id || litNodes.has(asset.id)
        ).length;

        return (
          <section
            key={zoneName}
            className="relative min-h-[92px] overflow-hidden rounded-[20px]"
            style={{
              flex: zoneCfg.height,
              border: "1px solid rgba(255,255,255,0.055)",
              background: `linear-gradient(160deg, ${zoneTone.fill}, rgba(4,8,12,0.94))`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), inset 0 0 0 1px ${zoneTone.glow}`,
            }}
          >
            {/* Left edge accent */}
            <div
              className="absolute inset-y-0 left-0 w-[2.5px] rounded-l-[20px]"
              style={{ background: `linear-gradient(180deg, ${zoneTone.edge}, transparent 70%)` }}
            />

            <div className="relative flex h-full flex-col px-4 py-3">
              {/* Zone header */}
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: zoneTone.edge, opacity: 0.7 }}
                  />
                  <div>
                    <p
                      className="text-[11px] font-semibold leading-none"
                      style={{ color: zoneTone.text }}
                    >
                      {zoneName}
                    </p>
                    <p className="text-[9px] text-zinc-600 mt-0.5 font-mono">{zoneCfg.label}</p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 rounded-full px-2.5 py-1 text-[9px]"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="text-zinc-500 font-mono">{assets.length}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-white/20" />
                  <span
                    className="font-mono"
                    style={{ color: impactedCount > 0 ? "#fcd34d" : "#3f3f46" }}
                  >
                    {impactedCount} hit
                  </span>
                </div>
              </div>

              {/* Asset canvas */}
              <div
                className="relative flex-1 rounded-[14px] overflow-hidden"
                style={{
                  border: "1px solid rgba(255,255,255,0.04)",
                  background: "rgba(0,0,0,0.22)",
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              >
                {/* Center guide line */}
                <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/[0.03]" />

                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  {links.map((link) => (
                    <g key={link.id}>
                      <line
                        x1={`${link.from.x}%`}
                        y1={`${link.from.y}%`}
                        x2={`${link.to.x}%`}
                        y2={`${link.to.y}%`}
                        stroke={
                          link.highlighted ? "rgba(248, 113, 113, 0.22)" : "rgba(255,255,255,0.04)"
                        }
                        strokeWidth={link.highlighted ? 4.2 : 2.2}
                        strokeLinecap="round"
                      />
                      <line
                        x1={`${link.from.x}%`}
                        y1={`${link.from.y}%`}
                        x2={`${link.to.x}%`}
                        y2={`${link.to.y}%`}
                        stroke={getLinkColor(link.from.type, link.highlighted)}
                        strokeWidth={link.highlighted ? 2.1 : 1.1}
                        strokeDasharray={link.highlighted ? "5 4" : "2 5"}
                        strokeLinecap="round"
                        className={link.highlighted ? "dash-flow" : ""}
                      />
                    </g>
                  ))}
                </svg>

                {assets.map((asset) => {
                  const status = getDerivedStatus(asset, incident, litNodes);
                  const statusTone = getStatusTone(status);
                  const isFocused = incident?.assetId === asset.id;
                  const isAffected = litNodes.has(asset.id);
                  const showLabel = status !== "normal" || isFocused || isAffected;
                  const assetTone = getAssetTone(asset.type);

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      className="group absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${asset.x}%`, top: `${asset.y}%` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAssetClick(asset.id);
                      }}
                      title={`${asset.name} - ${status}`}
                      aria-label={`Inspect ${asset.name}`}
                    >
                      <span
                        className={`absolute inset-[-10px] rounded-full ${
                          isFocused || isAffected ? "animate-pulse" : ""
                        }`}
                        style={{
                          background: `radial-gradient(circle, ${statusTone.glow} 0%, transparent 72%)`,
                        }}
                      />
                      <AssetGlyph asset={asset} status={status} />

                      <span
                        className="absolute left-1/2 top-1/2 h-[calc(100%+12px)] w-[calc(100%+12px)] -translate-x-1/2 -translate-y-1/2 rounded-full border"
                        style={{
                          borderColor: isFocused
                            ? statusTone.color
                            : isAffected
                              ? statusTone.ring
                              : "rgba(255,255,255,0.06)",
                          opacity: isFocused || isAffected ? 1 : 0.42,
                        }}
                      />

                      {showLabel && (
                        <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/[0.08] bg-black/90 px-2.5 py-1.5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] z-20">
                          <span className="block text-[9px] font-semibold text-zinc-100">
                            {asset.name}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-[8px] uppercase tracking-[0.14em] text-zinc-500">
                            <span style={{ color: assetTone.accent }}>{asset.type}</span>
                            <span className="h-1 w-1 rounded-full bg-white/15" />
                            <span style={{ color: statusTone.color }}>
                              {getStatusLabel(status)}
                            </span>
                          </span>
                        </span>
                      )}
                    </button>
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

export default function CommandCenterZoneView({
  assets,
  incident,
  litNodes,
  activeFloor,
  onAssetClick,
}: Props) {
  const floorAssets = assets.filter((asset) => asset.floor === activeFloor);
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(56,189,248,0.07),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(167,139,250,0.04),_transparent_40%)]" />

      {/* Asset count badge */}
      <div className="absolute right-3 top-3 z-10">
        <div
          className="rounded-full px-3 py-1.5 text-[10px] font-medium font-mono text-zinc-400"
          style={{
            background: "rgba(0,0,0,0.5)",
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
        onAssetClick={onAssetClick}
      />
    </div>
  );
}

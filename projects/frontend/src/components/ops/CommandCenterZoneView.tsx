import { Line, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import type { Asset, AssetStatus, Incident } from "../../data/mock";
import {
  DATACENTER_FLOORS,
  type FloorKey,
  ZONE_SURFACE_COLORS,
  type ZoneConfig,
} from "./commandCenterLayout";

type ViewMode = "2d" | "2.5d";

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
      return { accent: "#38bdf8", surface: "rgba(56, 189, 248, 0.28)" };
    case "Power":
      return { accent: "#f59e0b", surface: "rgba(245, 158, 11, 0.28)" };
    case "Network":
      return { accent: "#a78bfa", surface: "rgba(167, 139, 250, 0.28)" };
    default:
      return { accent: "#34d399", surface: "rgba(52, 211, 153, 0.28)" };
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

function getAssetDimensions(asset: Asset, status: AssetStatus): [number, number, number] {
  const boost = status === "critical" ? 0.5 : status === "warning" ? 0.25 : 0;
  switch (asset.type) {
    case "Cooling":
      return [1.2, 0.9 + boost, 1.6];
    case "Power":
      return [1.1, 0.7 + boost, 1.1];
    case "Network":
      return [1.5, 0.4 + boost, 0.8];
    default:
      return [0.85, 1.25 + boost, 0.85];
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

function AssetGlyph({ asset, status }: { asset: Asset; status: AssetStatus }) {
  const assetTone = getAssetTone(asset.type);
  const statusTone = getStatusTone(status);
  const isCompute = asset.type === "Compute";
  const isCooling = asset.type === "Cooling";
  const isNetwork = asset.type === "Network";

  return (
    <span
      className={`relative flex items-center justify-center border transition-transform duration-200 ${
        isCooling
          ? "h-4 w-8 rounded-full"
          : isNetwork
            ? "h-4 w-4 rotate-45 rounded-[4px]"
            : isCompute
              ? "h-7 w-4 rounded-[5px]"
              : "h-5 w-5 rounded-[6px]"
      }`}
      style={{
        background: `linear-gradient(180deg, ${assetTone.surface}, rgba(8,12,18,0.95))`,
        borderColor: statusTone.ring,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 18px ${statusTone.glow}`,
      }}
    >
      <span
        className={`absolute ${isNetwork ? "-rotate-45" : ""}`}
        style={{
          width: isCooling ? 8 : isCompute ? 6 : 7,
          height: isCooling ? 8 : isCompute ? 16 : 7,
          borderRadius: isCooling ? 999 : 3,
          backgroundColor: statusTone.color,
          boxShadow: `0 0 12px ${statusTone.glow}`,
        }}
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
            className="relative min-h-[92px] overflow-hidden rounded-[22px] border"
            style={{
              flex: zoneCfg.height,
              borderColor: "rgba(255,255,255,0.06)",
              background: `linear-gradient(180deg, ${zoneTone.fill}, rgba(4,8,12,0.94))`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), inset 0 0 0 1px ${zoneTone.glow}`,
            }}
          >
            <div
              className="absolute inset-y-0 left-0 w-[3px]"
              style={{ background: `linear-gradient(180deg, ${zoneTone.edge}, transparent)` }}
            />

            <div className="relative flex h-full flex-col px-4 py-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Zone
                  </p>
                  <p className="text-[12px] font-semibold" style={{ color: zoneTone.text }}>
                    {zoneName}
                  </p>
                  <p className="text-[10px] text-zinc-600">{zoneCfg.label}</p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-black/20 px-2.5 py-1 text-[10px] text-zinc-500">
                  <span>{assets.length} assets</span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className={impactedCount > 0 ? "text-amber-300" : "text-zinc-600"}>
                    {impactedCount} impacted
                  </span>
                </div>
              </div>

              <div className="relative flex-1 rounded-2xl border border-white/[0.04] bg-black/20 px-3 py-2">
                <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/[0.04]" />
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  {links.map((link) => (
                    <line
                      key={link.id}
                      x1={`${link.from.x}%`}
                      y1={`${link.from.y}%`}
                      x2={`${link.to.x}%`}
                      y2={`${link.to.y}%`}
                      stroke={getLinkColor(link.from.type, link.highlighted)}
                      strokeWidth={link.highlighted ? 1.8 : 1}
                      strokeDasharray={link.highlighted ? "5 4" : undefined}
                    />
                  ))}
                </svg>

                {assets.map((asset) => {
                  const status = getDerivedStatus(asset, incident, litNodes);
                  const statusTone = getStatusTone(status);
                  const isFocused = incident?.assetId === asset.id;
                  const isAffected = litNodes.has(asset.id);
                  const showLabel = status !== "normal" || isFocused || isAffected;

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

                      {showLabel && (
                        <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/[0.08] bg-black/80 px-2 py-1 text-[9px] font-medium text-zinc-200 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                          {asset.name}
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

function TwoPointFiveDView({
  assetsByZone,
  floorAssets,
  incident,
  litNodes,
  onAssetClick,
}: {
  assetsByZone: { zoneName: string; zoneCfg: ZoneConfig; assets: Asset[] }[];
  floorAssets: Asset[];
  incident: Incident | undefined;
  litNodes: Set<string>;
  onAssetClick: (assetId: string) => void;
}) {
  const totalZoneHeight = assetsByZone.reduce((sum, zone) => sum + zone.zoneCfg.height, 0);
  const sceneDepth = 18;
  const sceneWidth = 18;
  let cursor = -(sceneDepth / 2);
  const assetPositions = new Map<string, [number, number, number]>();

  const zoneMeshes = assetsByZone.map(({ zoneName, zoneCfg, assets }) => {
    const depth = (zoneCfg.height / totalZoneHeight) * sceneDepth;
    const centerZ = cursor + depth / 2;
    cursor += depth;
    const zoneTone = ZONE_SURFACE_COLORS[zoneCfg.zone];

    const assetMeshes = assets.map((asset) => {
      const status = getDerivedStatus(asset, incident, litNodes);
      const dims = getAssetDimensions(asset, status);
      const x = -sceneWidth / 2 + 1.25 + (asset.x / 100) * (sceneWidth - 2.5);
      const z = centerZ - depth / 2 + 0.65 + (asset.y / 100) * Math.max(depth - 1.3, 0.4);
      const y = dims[1] / 2 + 0.34;
      assetPositions.set(asset.id, [x, y, z]);

      return {
        asset,
        status,
        dims,
        position: [x, y, z] as [number, number, number],
      };
    });

    return {
      zoneName,
      zoneTone,
      centerZ,
      depth,
      assetMeshes,
    };
  });

  const links = floorAssets.flatMap((asset) =>
    asset.dependsOn.flatMap((depId) => {
      const from = assetPositions.get(depId);
      const to = assetPositions.get(asset.id);
      if (!from || !to) return [];

      const highlighted =
        incident?.assetId === asset.id ||
        incident?.assetId === depId ||
        litNodes.has(asset.id) ||
        litNodes.has(depId);

      return [
        {
          id: `${depId}-${asset.id}`,
          from: [from[0], 0.24, from[2]] as [number, number, number],
          to: [to[0], 0.24, to[2]] as [number, number, number],
          color: getLinkColor(asset.type, highlighted),
          highlighted,
        },
      ];
    })
  );

  return (
    <div className="h-full w-full">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => onAssetClick("")}
      >
        <color attach="background" args={["#06090d"]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[8, 10, 8]} intensity={1.1} color="#f8fafc" />
        <directionalLight position={[-10, 6, -4]} intensity={0.45} color="#7dd3fc" />
        <OrthographicCamera makeDefault position={[0, 12, 14]} zoom={42} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial color="#05070b" />
        </mesh>

        {links.map((link) => (
          <Line
            key={link.id}
            points={[link.from, link.to]}
            color={link.color}
            lineWidth={link.highlighted ? 2.2 : 1.2}
            transparent
            opacity={link.highlighted ? 0.9 : 0.45}
          />
        ))}

        {zoneMeshes.map((zone) => (
          <group key={zone.zoneName}>
            <mesh position={[0, 0.14, zone.centerZ]}>
              <boxGeometry args={[sceneWidth, 0.28, zone.depth]} />
              <meshStandardMaterial color={zone.zoneTone.edge} transparent opacity={0.18} />
            </mesh>
            <mesh position={[-sceneWidth / 2 - 0.12, 0.2, zone.centerZ]}>
              <boxGeometry args={[0.18, 0.44, zone.depth]} />
              <meshStandardMaterial
                color={zone.zoneTone.edge}
                emissive={zone.zoneTone.edge}
                emissiveIntensity={0.25}
              />
            </mesh>

            {zone.assetMeshes.map(({ asset, status, dims, position }) => {
              const statusTone = getStatusTone(status);
              const isFocused = incident?.assetId === asset.id;
              const isAffected = litNodes.has(asset.id);

              return (
                <group key={asset.id}>
                  {(isFocused || isAffected) && (
                    <mesh
                      position={[position[0], 0.05, position[2]]}
                      rotation={[-Math.PI / 2, 0, 0]}
                    >
                      <ringGeometry args={[0.34, 0.54, 28]} />
                      <meshBasicMaterial
                        color={statusTone.color}
                        transparent
                        opacity={isFocused ? 0.75 : 0.48}
                      />
                    </mesh>
                  )}

                  {/* biome-ignore lint/a11y/noStaticElementInteractions: r3f meshes handle scene picking, not DOM clicks */}
                  <mesh
                    position={position}
                    onClick={(event) => {
                      event.stopPropagation();
                      onAssetClick(asset.id);
                    }}
                  >
                    <boxGeometry args={dims} />
                    <meshStandardMaterial
                      color={statusTone.color}
                      emissive={statusTone.color}
                      emissiveIntensity={status === "normal" ? 0.18 : 0.34}
                      metalness={0.22}
                      roughness={0.42}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        ))}
      </Canvas>
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
  const [viewMode, setViewMode] = useState<ViewMode>("2.5d");
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
    <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-[#05070a]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_28%)]" />

      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        <div className="rounded-full border border-white/[0.08] bg-black/55 p-1 backdrop-blur-md">
          {(["2d", "2.5d"] as ViewMode[]).map((mode) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                  active
                    ? "bg-white/[0.12] text-white"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                }`}
                aria-pressed={active}
              >
                {mode === "2d" ? "2D" : "2.5D"}
              </button>
            );
          })}
        </div>

        <div className="rounded-full border border-white/[0.06] bg-black/45 px-3 py-1.5 text-[10px] font-medium text-zinc-400 backdrop-blur-md">
          {floorAssets.length} assets · {impactedOnFloor} impacted
        </div>
      </div>

      {viewMode === "2d" ? (
        <BlueprintView
          assetsByZone={assetsByZone}
          incident={incident}
          litNodes={litNodes}
          onAssetClick={onAssetClick}
        />
      ) : (
        <TwoPointFiveDView
          assetsByZone={assetsByZone}
          floorAssets={floorAssets}
          incident={incident}
          litNodes={litNodes}
          onAssetClick={onAssetClick}
        />
      )}
    </div>
  );
}

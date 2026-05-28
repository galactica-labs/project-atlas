import type { IconProps } from "@phosphor-icons/react";
import {
  BatteryCharging,
  Cpu,
  Desktop,
  Fan,
  Gauge,
  Lightning,
  Network,
  Thermometer,
} from "@phosphor-icons/react";
import { Billboard, Html, Line, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { type ComponentType, useMemo } from "react";
import type { Asset, Incident } from "../../data/mock";
import {
  DATACENTER_FLOORS,
  FLOOR_ZONE_RECTS,
  type FloorKey,
  type ZoneVariant,
} from "./commandCenterFloorData";

type GraphNode = {
  asset: Asset;
  position: [number, number, number];
  icon: ComponentType<IconProps>;
  zoneColor: string;
  kindLabel: string;
  status: Asset["status"];
  isSource: boolean;
  isBlast: boolean;
};

type GraphEdge = {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  resource: "power" | "cooling" | "network" | "dependency";
  active: boolean;
};

type Props = {
  assets: Asset[];
  incident?: Incident;
  litNodes: Set<string>;
  activeFloor: FloorKey;
  onAssetClick: (assetId: string) => void;
};

const ZONE_SURFACE_COLORS: Record<ZoneVariant, string> = {
  a: "#1d4ed8",
  b: "#059669",
  mechanical: "#d97706",
  electrical: "#facc15",
  power: "#fb923c",
  cooling: "#38bdf8",
  compute: "#22c55e",
  network: "#8b5cf6",
};

const EDGE_COLORS: Record<GraphEdge["resource"], string> = {
  power: "#f59e0b",
  cooling: "#38bdf8",
  network: "#8b5cf6",
  dependency: "#64748b",
};

const MACHINE_ICONS: Array<{
  test: (asset: Asset) => boolean;
  icon: ComponentType<IconProps>;
  label: string;
}> = [
  { test: (asset) => asset.id.startsWith("crah"), icon: Fan, label: "CRAH" },
  { test: (asset) => asset.id.startsWith("chiller"), icon: Thermometer, label: "Chiller" },
  { test: (asset) => asset.id.startsWith("pump-"), icon: Gauge, label: "Pump" },
  { test: (asset) => asset.id.startsWith("ct-"), icon: Fan, label: "Cooling Tower" },
  { test: (asset) => asset.id.startsWith("ups"), icon: BatteryCharging, label: "UPS" },
  { test: (asset) => asset.id.startsWith("batt"), icon: BatteryCharging, label: "Battery" },
  { test: (asset) => asset.id.startsWith("pdu"), icon: Lightning, label: "PDU" },
  { test: (asset) => asset.id.includes("sw"), icon: Network, label: "Switch" },
  { test: (asset) => asset.id.startsWith("pod-"), icon: Cpu, label: "GPU Pod" },
  { test: (asset) => asset.id.startsWith("rack-"), icon: Desktop, label: "Rack" },
  { test: (asset) => asset.type === "Cooling", icon: Thermometer, label: "Cooling" },
  { test: (asset) => asset.type === "Power", icon: Lightning, label: "Power" },
  { test: (asset) => asset.type === "Network", icon: Network, label: "Network" },
  { test: (asset) => asset.type === "Compute", icon: Desktop, label: "Compute" },
];

function machineInfo(asset: Asset) {
  return MACHINE_ICONS.find((entry) => entry.test(asset)) ?? { icon: Gauge, label: asset.type };
}

function zoneRectFor(asset: Asset, floor: FloorKey) {
  return FLOOR_ZONE_RECTS[floor][asset.zone];
}

function toScenePosition(asset: Asset, floor: FloorKey): [number, number, number] {
  const rect = zoneRectFor(asset, floor);
  if (!rect) return [0, 0.6, 0];

  const [x1, y1, x2, y2] = rect;
  const width = x2 - x1;
  const depth = y2 - y1;
  const localX = x1 + (asset.x / 100) * width;
  const localY = y1 + (asset.y / 100) * depth;

  return [localX - 50, 0.65, localY - 50];
}

function edgeResource(from: Asset, to: Asset): GraphEdge["resource"] {
  if (from.type === "Cooling" || to.type === "Cooling") return "cooling";
  if (from.type === "Network" || to.type === "Network") return "network";
  if (from.type === "Power" || to.type === "Power") return "power";
  return "dependency";
}

function statusColor(status: Asset["status"], isSource: boolean, isBlast: boolean) {
  if (isSource || status === "critical") return "#ef4444";
  if (isBlast || status === "warning") return "#f59e0b";
  if (status === "offline") return "#52525b";
  return "#22c55e";
}

function ZonePlate({
  center,
  size,
  color,
  title,
  purpose,
}: {
  center: [number, number, number];
  size: [number, number];
  color: string;
  title: string;
  purpose: string;
}) {
  return (
    <group position={center}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.17}
          roughness={1}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] + 0.35, size[1] + 0.35]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} />
      </mesh>
      <Html
        position={[0, 0.12, 0]}
        center
        distanceFactor={20}
        transform
        style={{ pointerEvents: "none" }}
      >
        <div className="rounded-2xl border border-white/10 bg-black/85 px-3 py-2 text-center shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
            {title}
          </p>
          <p className="mt-1 max-w-[150px] text-[9px] leading-relaxed text-zinc-400">{purpose}</p>
        </div>
      </Html>
    </group>
  );
}

function MachineNode({ node, onClick }: { node: GraphNode; onClick: (id: string) => void }) {
  const Icon = node.icon;
  const glow = statusColor(node.status, node.isSource, node.isBlast);

  return (
    <group position={node.position}>
      <mesh position={[0, -0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.8, 48]} />
        <meshBasicMaterial
          color={glow}
          transparent
          opacity={node.isSource ? 0.85 : node.isBlast ? 0.5 : 0.18}
        />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[0.52, 0.66, 0.28, 8]} />
        <meshStandardMaterial color="#0f1117" metalness={0.45} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.38, 0.46, 0.1, 32]} />
        <meshStandardMaterial
          color={node.zoneColor}
          emissive={node.zoneColor}
          emissiveIntensity={0.28}
        />
      </mesh>
      <Billboard position={[0, 0.78, 0]} follow>
        <Html center transform distanceFactor={12}>
          <button
            type="button"
            onClick={() => onClick(node.asset.id)}
            className="group pointer-events-auto flex w-[92px] flex-col items-center rounded-[22px] border border-white/12 bg-black/82 px-2.5 py-2 text-center shadow-[0_20px_65px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.04]"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12"
              style={{ backgroundColor: `${glow}22`, color: glow }}
            >
              <Icon size={16} weight={node.isSource ? "fill" : "light"} />
            </span>
            <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/90">
              {node.asset.name}
            </span>
            <span className="mt-1 text-[8px] uppercase tracking-[0.18em] text-zinc-500">
              {node.kindLabel}
            </span>
          </button>
        </Html>
      </Billboard>
    </group>
  );
}

function SceneContent({ assets, incident, litNodes, activeFloor, onAssetClick }: Props) {
  const floorConfig = DATACENTER_FLOORS[activeFloor];

  const floorAssets = useMemo(
    () => assets.filter((asset) => asset.floor === activeFloor),
    [assets, activeFloor]
  );

  const nodes = useMemo<GraphNode[]>(() => {
    return floorAssets.map((asset) => {
      const zoneCfg = floorConfig.zones[asset.zone];
      const info = machineInfo(asset);
      const isSource = incident?.assetId === asset.id;
      const isBlast = litNodes.has(asset.id);

      return {
        asset,
        position: toScenePosition(asset, activeFloor),
        icon: info.icon,
        kindLabel: info.label,
        zoneColor: ZONE_SURFACE_COLORS[zoneCfg?.zone ?? "mechanical"],
        status: isSource ? "critical" : isBlast ? "warning" : asset.status,
        isSource: !!isSource,
        isBlast,
      };
    });
  }, [floorAssets, floorConfig.zones, incident, litNodes, activeFloor]);

  const assetMap = useMemo(
    () => new Map(floorAssets.map((asset) => [asset.id, asset])),
    [floorAssets]
  );
  const positionMap = useMemo(
    () => new Map(nodes.map((node) => [node.asset.id, node.position])),
    [nodes]
  );

  const edges = useMemo<GraphEdge[]>(() => {
    const nextEdges: GraphEdge[] = [];
    const added = new Set<string>();

    for (const asset of floorAssets) {
      for (const depId of asset.dependsOn) {
        const sourceAsset = assetMap.get(depId);
        const sourcePos = positionMap.get(depId);
        const targetPos = positionMap.get(asset.id);

        if (!sourceAsset || !sourcePos || !targetPos) continue;

        const id = [depId, asset.id].sort().join("--");
        if (added.has(id)) continue;
        added.add(id);

        const active =
          !!incident &&
          (depId === incident.assetId || litNodes.has(depId)) &&
          (asset.id === incident.assetId || litNodes.has(asset.id));

        nextEdges.push({
          id,
          from: sourcePos,
          to: targetPos,
          resource: edgeResource(sourceAsset, asset),
          active,
        });
      }
    }

    return nextEdges;
  }, [assetMap, floorAssets, incident, litNodes, positionMap]);

  const zonePlates = useMemo(() => {
    return Object.entries(FLOOR_ZONE_RECTS[activeFloor]).map(([zoneName, rect]) => {
      const [x1, y1, x2, y2] = rect;
      const zoneCfg = floorConfig.zones[zoneName];

      return {
        zoneName,
        purpose: zoneCfg?.purpose ?? "Facility operations",
        color: ZONE_SURFACE_COLORS[zoneCfg?.zone ?? "mechanical"],
        center: [(x1 + x2) / 2 - 50, 0.01, (y1 + y2) / 2 - 50] as [number, number, number],
        size: [x2 - x1, y2 - y1] as [number, number],
      };
    });
  }, [activeFloor, floorConfig.zones]);

  return (
    <>
      <color attach="background" args={["#06070b"]} />
      <fog attach="fog" args={["#06070b", 34, 92]} />
      <ambientLight intensity={0.95} color="#b7d3ff" />
      <directionalLight position={[14, 18, 10]} intensity={1.6} color="#dbeafe" />
      <pointLight position={[-18, 8, -16]} intensity={4.2} distance={64} color="#0ea5e9" />
      <pointLight position={[16, 10, 18]} intensity={3.2} distance={58} color="#22c55e" />

      <PerspectiveCamera makeDefault position={[0, 30, 28]} fov={34} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={0.72}
        maxPolarAngle={1.25}
        minDistance={26}
        maxDistance={48}
      />

      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[112, 112]} />
          <meshStandardMaterial color="#07090f" roughness={0.98} metalness={0.06} />
        </mesh>

        <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[120, 120]} />
          <meshBasicMaterial color="#010204" transparent opacity={0.8} />
        </mesh>

        <gridHelper args={[100, 20, "#182130", "#0d131e"]} position={[0, 0.01, 0]} />

        {zonePlates.map((zone) => (
          <ZonePlate
            key={zone.zoneName}
            center={zone.center}
            size={zone.size}
            color={zone.color}
            title={zone.zoneName}
            purpose={zone.purpose}
          />
        ))}

        {edges.map((edge) => (
          <Line
            key={edge.id}
            points={[
              [edge.from[0], edge.from[1] + 0.05, edge.from[2]],
              [(edge.from[0] + edge.to[0]) / 2, 1.2, (edge.from[2] + edge.to[2]) / 2],
              [edge.to[0], edge.to[1] + 0.05, edge.to[2]],
            ]}
            color={edge.active ? "#f43f5e" : EDGE_COLORS[edge.resource]}
            lineWidth={edge.active ? 2.6 : 1.25}
            transparent
            opacity={edge.active ? 0.95 : 0.34}
          />
        ))}

        {nodes.map((node) => (
          <MachineNode key={node.asset.id} node={node} onClick={onAssetClick} />
        ))}
      </group>
    </>
  );
}

export function CommandCenterFloorGraph(props: Props) {
  return (
    <div className="h-full w-full">
      <Canvas dpr={[1, 1.75]} shadows={false} gl={{ antialias: true }}>
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}

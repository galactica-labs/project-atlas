import { Html, OrbitControls } from "@react-three/drei";
import { useCallback, useMemo } from "react";
import * as THREE from "three";
import { useFloorPlanStore } from "../atlas-map/floorPlanStore";
import { FLOORS } from "../atlas-map/mapData";
import type { FloorId } from "../atlas-map/mapTypes";
import { FLOOR_META } from "../atlas-map/mapTypes";

const SCALE = 0.14;
const FLOOR_THICKNESS = 0.18;

const FLOOR_Y: Record<FloorId, number> = {
  "floor-c": -8,
  "floor-b": 0,
  "floor-a": 8,
};

const ZONE_COLORS: Record<string, string> = {
  hall: "#0d1117",
  row: "#0b1929",
  electrical: "#1c1000",
  cooling: "#001a2e",
  corridor: "#0a0a0a",
  network: "#14002e",
  noc: "#001a14",
  ups_room: "#1a0a00",
  patch_bay: "#0a0a1a",
  generator: "#1a0d00",
  chiller_plant: "#001a22",
  battery_room: "#1a1000",
  switchgear: "#0d0d1a",
  restricted: "#1a0000",
};

const ZONE_BORDER_COLORS: Record<string, string> = {
  hall: "#1a2030",
  row: "#1e3a5f",
  electrical: "#5c3a00",
  cooling: "#0c4a6e",
  corridor: "#1a1a1a",
  network: "#2e1065",
  noc: "#065f46",
  ups_room: "#451a03",
  patch_bay: "#1e3a5f",
  generator: "#78350f",
  chiller_plant: "#0c4a6e",
  battery_room: "#451a03",
  switchgear: "#1e3a5f",
  restricted: "#7f1d1d",
};

const STATUS_COLORS: Record<string, string> = {
  normal: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
  offline: "#374151",
};

function facilityToThree(x: number, y: number): [number, number] {
  return [(x - 100) * SCALE, (y - 50) * SCALE];
}

function buildZoneShape(polygon: [number, number][]): THREE.Shape {
  const pts = polygon.slice(0, -1);
  const shape = new THREE.Shape();
  const [startX, startZ] = facilityToThree(pts[0][0], pts[0][1]);
  shape.moveTo(startX, startZ);
  for (let i = 1; i < pts.length; i++) {
    const [px, pz] = facilityToThree(pts[i][0], pts[i][1]);
    shape.lineTo(px, pz);
  }
  shape.closePath();
  return shape;
}

function buildZoneBorderGeo(polygon: [number, number][]): THREE.BufferGeometry {
  const pts = polygon.slice(0, -1);
  const positions: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = facilityToThree(pts[i][0], pts[i][1]);
    const next = pts[(i + 1) % pts.length];
    const [bx, bz] = facilityToThree(next[0], next[1]);
    positions.push(ax, 0, az, bx, 0, bz);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

function buildPerimeterGeo(): THREE.BufferGeometry {
  const hw = 100 * SCALE + 0.3;
  const hd = 50 * SCALE + 0.3;
  const corners = [
    [-hw, 0, -hd],
    [hw, 0, -hd],
    [hw, 0, hd],
    [-hw, 0, hd],
    [-hw, 0, -hd],
  ].flat();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(corners, 3));
  return geo;
}

interface FloorSlabProps {
  floorId: FloorId;
  isActive: boolean;
  onClick: () => void;
}

function FloorSlab({ floorId, isActive, onClick }: FloorSlabProps) {
  const floorData = FLOORS[floorId];
  const meta = FLOOR_META[floorId];
  const yBase = FLOOR_Y[floorId];
  const opacity = isActive ? 1 : 0.3;

  const zoneShapes = useMemo(
    () => floorData.zones.map((z) => ({ zone: z, shape: buildZoneShape(z.polygon) })),
    [floorData.zones]
  );

  const zoneBorderGeos = useMemo(
    () => floorData.zones.map((z) => ({ zone: z, geo: buildZoneBorderGeo(z.polygon) })),
    [floorData.zones]
  );

  const perimeterGeo = useMemo(buildPerimeterGeo, []);

  const slabGeo = useMemo(() => {
    const hw = 100 * SCALE + 0.3;
    const hd = 50 * SCALE + 0.3;
    return new THREE.BoxGeometry(hw * 2, FLOOR_THICKNESS, hd * 2);
  }, []);

  const borderColor = isActive ? "#3b82f6" : "#1e293b";
  const borderOpacity = isActive ? 0.9 : 0.35;

  return (
    /* biome-ignore lint/a11y/noStaticElementInteractions: r3f groups are scene graph nodes, not static DOM elements */
    <group position={[0, yBase, 0]} onClick={onClick}>
      {/* Base slab */}
      <mesh geometry={slabGeo} position={[0, -FLOOR_THICKNESS / 2, 0]}>
        <meshBasicMaterial color="#040608" transparent opacity={opacity * 0.95} />
      </mesh>

      {/* Zone fills — rendered as ShapeGeometry in XZ plane */}
      {zoneShapes.map(({ zone, shape }) => {
        const geo = new THREE.ShapeGeometry(shape);
        return (
          <mesh
            key={zone.id}
            geometry={geo}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.003, 0]}
          >
            <meshBasicMaterial
              color={ZONE_COLORS[zone.type] ?? "#0d1117"}
              transparent
              opacity={opacity * 0.92}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Zone borders */}
      {zoneBorderGeos.map(({ zone, geo }) => (
        <lineSegments key={`b-${zone.id}`} geometry={geo} position={[0, 0.006, 0]}>
          <lineBasicMaterial
            color={ZONE_BORDER_COLORS[zone.type] ?? "#1e293b"}
            transparent
            opacity={opacity * 0.65}
          />
        </lineSegments>
      ))}

      {/* Assets */}
      {floorData.assets.map((asset) => {
        const [ax, az] = facilityToThree(asset.coordinates[0], asset.coordinates[1]);
        const color = STATUS_COLORS[asset.status] ?? STATUS_COLORS.normal;
        const isLargeAsset = ["crac", "chiller", "generator", "ups"].includes(asset.type);
        const r = isLargeAsset ? 0.14 : asset.type === "rack" ? 0.09 : 0.1;
        return (
          <mesh key={asset.id} position={[ax, 0.08, az]}>
            <sphereGeometry args={[r, 6, 5]} />
            <meshBasicMaterial color={color} transparent opacity={isActive ? 0.9 : 0.25} />
          </mesh>
        );
      })}

      {/* Perimeter border */}
      <primitive
        object={
          new THREE.Line(
            perimeterGeo,
            new THREE.LineBasicMaterial({
              color: borderColor,
              transparent: true,
              opacity: borderOpacity,
            })
          )
        }
      />

      {/* Floor label */}
      <Html
        position={[-(100 * SCALE + 0.7), 0.4, -(50 * SCALE + 0.1)]}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: isActive ? "11px" : "9px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: isActive ? "#f8fafc" : "#475569",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {meta.shortLabel} · {meta.description.split("—")[0].trim()}
        </div>
      </Html>
    </group>
  );
}

function FloorConnectors() {
  const geo = useMemo(() => {
    const hw = 100 * SCALE + 0.3;
    const hd = 50 * SCALE + 0.3;
    const corners: [number, number][] = [
      [-hw, -hd],
      [hw, -hd],
      [hw, hd],
      [-hw, hd],
    ];
    const yTop = FLOOR_Y["floor-a"] + 0.1;
    const yBot = FLOOR_Y["floor-c"] - FLOOR_THICKNESS;
    const positions: number[] = [];
    for (const [cx, cz] of corners) {
      positions.push(cx, yTop, cz, cx, yBot, cz);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, []);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#1e293b" transparent opacity={0.22} />
    </lineSegments>
  );
}

export function FloorStackScene() {
  const { activeFloorId, setFloor } = useFloorPlanStore();

  const handleClick = useCallback((id: FloorId) => setFloor(id), [setFloor]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.3} />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={6}
        maxDistance={65}
        makeDefault
      />

      {(["floor-c", "floor-b", "floor-a"] as FloorId[]).map((id) => (
        <FloorSlab
          key={id}
          floorId={id}
          isActive={activeFloorId === id}
          onClick={() => handleClick(id)}
        />
      ))}

      <FloorConnectors />
    </>
  );
}

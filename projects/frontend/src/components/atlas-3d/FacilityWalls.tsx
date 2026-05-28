import { useMemo } from "react";
import * as THREE from "three";

// Hall B extents
const HALL_W = 30; // x: -15 to 15
const HALL_D = 20; // z: -10 to 10
const WALL_H = 1.5;
const WALL_T = 0.12;
const WALL_Y = WALL_H / 2; // center at half height (floor is y=0)

// Zone divider definitions
// Thin translucent panels separating functional zones
const DIVIDERS = [
  // Cooling zone west boundary (x = 9)
  { x: 9, z: 0, w: WALL_T, h: WALL_H, d: 12, color: "#22d3ee", opacity: 0.08 },
  // Electrical zone east boundary (x = -10)
  { x: -10, z: 0, w: WALL_T, h: WALL_H, d: 12, color: "#f59e0b", opacity: 0.08 },
  // Network zone north boundary (z = -6.5)
  { x: 0, z: -6.5, w: 10, h: WALL_H, d: WALL_T, color: "#a855f7", opacity: 0.08 },
];

function WallEdgeLine({
  from,
  to,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([...from, ...to], 3));
    return g;
  }, [from, to]);

  return (
    <primitive
      object={
        new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 })
        )
      }
    />
  );
}

export function FacilityWalls() {
  const hw = HALL_W / 2; // 15
  const hd = HALL_D / 2; // 10

  return (
    <group>
      {/* ── Perimeter walls ──────────────────────────────────────── */}
      {/* North wall (z = -hd) */}
      <mesh position={[0, WALL_Y, -hd]}>
        <boxGeometry args={[HALL_W, WALL_H, WALL_T]} />
        <meshStandardMaterial
          color="#111111"
          transparent
          opacity={0.22}
          roughness={0.9}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Top edge glow line on north wall */}
      <WallEdgeLine from={[-hw, WALL_H, -hd]} to={[hw, WALL_H, -hd]} color="#333333" />

      {/* South wall (z = +hd) */}
      <mesh position={[0, WALL_Y, hd]}>
        <boxGeometry args={[HALL_W, WALL_H, WALL_T]} />
        <meshStandardMaterial
          color="#111111"
          transparent
          opacity={0.22}
          roughness={0.9}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <WallEdgeLine from={[-hw, WALL_H, hd]} to={[hw, WALL_H, hd]} color="#333333" />

      {/* West wall (x = -hw) */}
      <mesh position={[-hw, WALL_Y, 0]}>
        <boxGeometry args={[WALL_T, WALL_H, HALL_D]} />
        <meshStandardMaterial
          color="#111111"
          transparent
          opacity={0.22}
          roughness={0.9}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <WallEdgeLine from={[-hw, WALL_H, -hd]} to={[-hw, WALL_H, hd]} color="#333333" />

      {/* East wall (x = +hw) */}
      <mesh position={[hw, WALL_Y, 0]}>
        <boxGeometry args={[WALL_T, WALL_H, HALL_D]} />
        <meshStandardMaterial
          color="#111111"
          transparent
          opacity={0.22}
          roughness={0.9}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <WallEdgeLine from={[hw, WALL_H, -hd]} to={[hw, WALL_H, hd]} color="#333333" />

      {/* ── Corner pillars ────────────────────────────────────────── */}
      {(
        [
          [-hw, -hd],
          [hw, -hd],
          [hw, hd],
          [-hw, hd],
        ] as [number, number][]
      ).map(([px, pz]) => (
        <mesh key={`pillar-${px}-${pz}`} position={[px, WALL_H / 2, pz]}>
          <boxGeometry args={[0.25, WALL_H, 0.25]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.4} />
        </mesh>
      ))}

      {/* ── Zone dividers ─────────────────────────────────────────── */}
      {DIVIDERS.map((div) => (
        <group key={`div-${div.x}-${div.z}`} position={[div.x, WALL_Y, div.z]}>
          <mesh>
            <boxGeometry args={[div.w, div.h, div.d]} />
            <meshStandardMaterial
              color={div.color}
              transparent
              opacity={div.opacity}
              roughness={0.9}
              metalness={0.0}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Emissive top edge */}
          <mesh position={[0, div.h / 2 + 0.01, 0]}>
            <boxGeometry args={[div.w + 0.01, 0.02, div.d + 0.01]} />
            <meshStandardMaterial
              color={div.color}
              emissive={div.color}
              emissiveIntensity={0.4}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* ── Sub-floor depth edge ──────────────────────────────────── */}
      {/* Thin strip to give the floor slab a 'raised' look */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[HALL_W + 0.4, 0.12, HALL_D + 0.4]} />
        <meshStandardMaterial color="#050505" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

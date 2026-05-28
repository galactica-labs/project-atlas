import { useMemo } from "react";
import * as THREE from "three";
import { FLOOR_COLOR } from "./sceneStyles";

const FLOOR_W = 32;
const FLOOR_D = 22;

function GridLines() {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const half_w = FLOOR_W / 2;
    const half_d = FLOOR_D / 2;
    const step = 1;

    for (let x = -half_w; x <= half_w; x += step) {
      pts.push(x, 0.005, -half_d, x, 0.005, half_d);
    }
    for (let z = -half_d; z <= half_d; z += step) {
      pts.push(-half_w, 0.005, z, half_w, 0.005, z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.035} />
    </lineSegments>
  );
}

export function FacilityFloor({ showGrid }: { showGrid: boolean }) {
  return (
    <group>
      {/* Main floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_W, FLOOR_D]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Grid lines */}
      {showGrid && <GridLines />}

      {/* Subtle floor border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[FLOOR_W + 0.5, FLOOR_D + 0.5]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[FLOOR_W, FLOOR_D]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.95} metalness={0.05} />
      </mesh>
    </group>
  );
}

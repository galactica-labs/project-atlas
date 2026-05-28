import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { Zone3D } from "./sceneTypes";

type Props = {
  zone: Zone3D;
  visible: boolean;
};

export function ZoneBlock({ zone, visible }: Props) {
  const { minX, maxX, minZ, maxZ } = zone.bounds;
  const w = maxX - minX;
  const d = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  const borderPoints = useMemo<[number, number, number][]>(
    () => [
      [minX, 0.03, minZ],
      [maxX, 0.03, minZ],
      [maxX, 0.03, maxZ],
      [minX, 0.03, maxZ],
      [minX, 0.03, minZ],
    ],
    [minX, maxX, minZ, maxZ]
  );

  const borderGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const flat = borderPoints.flat();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(flat, 3));
    return geo;
  }, [borderPoints]);

  if (!visible) return null;

  return (
    <group>
      {/* Tinted floor fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.015, cz]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color={zone.color} transparent opacity={0.07} depthWrite={false} />
      </mesh>

      {/* Zone border */}
      <primitive
        object={
          new THREE.Line(
            borderGeo,
            new THREE.LineBasicMaterial({ color: zone.color, transparent: true, opacity: 0.4 })
          )
        }
      />

      {/* Zone label */}
      <Html
        position={[cx, 0.2, maxZ - 0.5]}
        center
        distanceFactor={18}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <span
          style={{
            fontFamily: "Geist Variable, monospace",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: zone.color,
            opacity: 0.7,
            whiteSpace: "nowrap",
          }}
        >
          {zone.name}
        </span>
      </Html>
    </group>
  );
}

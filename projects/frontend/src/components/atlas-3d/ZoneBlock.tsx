import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useCommandCenterStore } from "./commandCenterStore";
import type { Zone3D } from "./sceneTypes";

type Props = {
  zone: Zone3D;
  visible: boolean;
};

// Zones that pulse red during incident mode
const INCIDENT_ZONES = new Set(["row-c"]);

export function ZoneBlock({ zone, visible }: Props) {
  const { minX, maxX, minZ, maxZ } = zone.bounds;
  const w = maxX - minX;
  const d = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  const viewMode = useCommandCenterStore((s) => s.viewMode);
  const isIncidentZone = INCIDENT_ZONES.has(zone.id) && viewMode === "incident";

  const fillMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Build border line once
  const { borderLine, borderMat } = useMemo(() => {
    const pts: [number, number, number][] = [
      [minX, 0.03, minZ],
      [maxX, 0.03, minZ],
      [maxX, 0.03, maxZ],
      [minX, 0.03, maxZ],
      [minX, 0.03, minZ],
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
    const mat = new THREE.LineBasicMaterial({
      color: zone.color,
      transparent: true,
      opacity: 0.35,
    });
    return { borderLine: new THREE.Line(geo, mat), borderMat: mat };
  }, [minX, maxX, minZ, maxZ, zone.color]);

  useFrame(({ clock }) => {
    if (!isIncidentZone) return;
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 2.5) * 0.5;
    if (fillMatRef.current) {
      fillMatRef.current.opacity = 0.06 + pulse * 0.12;
    }
    borderMat.opacity = 0.3 + pulse * 0.55;
    borderMat.color.set(isIncidentZone ? "#ff4400" : zone.color);
  });

  if (!visible) return null;

  const fillColor = isIncidentZone ? "#ff2200" : zone.color;
  const labelColor = isIncidentZone ? "#ff6633" : zone.color;
  const labelZ = maxZ - 0.5;

  return (
    <group>
      {/* Tinted floor fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.015, cz]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial
          ref={fillMatRef}
          color={fillColor}
          transparent
          opacity={isIncidentZone ? 0.12 : 0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Zone border */}
      <primitive object={borderLine} />

      {/* Incident glow ring */}
      {isIncidentZone && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.018, cz]}>
          <planeGeometry args={[w + 0.2, d + 0.2]} />
          <meshBasicMaterial color="#ff4400" transparent opacity={0.04} depthWrite={false} />
        </mesh>
      )}

      {/* Zone label */}
      <Html
        position={[cx, 0.2, labelZ]}
        center
        distanceFactor={18}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "8px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: labelColor,
            opacity: 0.7,
            whiteSpace: "nowrap",
            textShadow: isIncidentZone ? "0 0 8px rgba(255,68,0,0.6)" : "none",
          }}
        >
          {zone.name}
        </span>
      </Html>
    </group>
  );
}

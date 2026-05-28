import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ASSET_BODY_COLOR, STATUS_COLORS } from "./sceneStyles";
import type { Asset3D, AssetStatus } from "./sceneTypes";

const VENT_GRILLE_KEYS = ["vent-01", "vent-02", "vent-03", "vent-04", "vent-05"] as const;

type Props = {
  asset: Asset3D;
  status: AssetStatus;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
};

export function CRACModel({
  asset,
  status,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}: Props) {
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const { width: w, height: h, depth: d } = asset.dimensions;

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    if (status === "critical") {
      matRef.current.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.35;
    } else if (status === "warning") {
      matRef.current.emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 2) * 0.1;
    } else {
      matRef.current.emissiveIntensity = isHovered ? 0.1 : 0.03;
    }
  });

  const emissive = status === "critical" ? "#ff0000" : status === "warning" ? "#f59e0b" : "#0a1a1a";
  const isCritical = status === "critical";

  return (
    <group position={asset.position}>
      {/* Main industrial block */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh handles canvas pointer events. */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut();
        }}
        castShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          ref={matRef}
          color={ASSET_BODY_COLOR}
          emissive={emissive}
          emissiveIntensity={0.03}
          roughness={0.8}
          metalness={0.4}
        />
      </mesh>
      {/* Vent grille on front */}
      {VENT_GRILLE_KEYS.map((grilleKey, i) => (
        <mesh key={grilleKey} position={[0, -h / 2 + 0.2 + i * (h * 0.15), d / 2 + 0.002]}>
          <planeGeometry args={[w * 0.85, h * 0.06]} />
          <meshStandardMaterial color="#1a2a2a" roughness={0.95} />
        </mesh>
      ))}
      {/* Status indicator + cooling glow */}
      <mesh position={[0, h / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          color={STATUS_COLORS[status]}
          emissive={STATUS_COLORS[status]}
          emissiveIntensity={isCritical ? 1.0 : status === "warning" ? 0.5 : 0.2}
          roughness={0.5}
        />
      </mesh>
      {/* Cooling exhaust indicator (cyan glow on front bottom) */}
      <mesh position={[0, -h / 2 + 0.05, d / 2 + 0.003]}>
        <planeGeometry args={[w * 0.9, 0.08]} />
        <meshStandardMaterial
          color={isCritical ? "#ef4444" : "#22d3ee"}
          emissive={isCritical ? "#ef4444" : "#22d3ee"}
          emissiveIntensity={isCritical ? 1.2 : 0.6}
        />
      </mesh>
      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, h / 2 + 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) / 2 + 0.2, Math.max(w, d) / 2 + 0.35, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

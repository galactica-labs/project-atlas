import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ASSET_BODY_COLOR, STATUS_COLORS } from "./sceneStyles";
import type { Asset3D, AssetStatus } from "./sceneTypes";

const BATTERY_CELL_KEYS = ["cell-01", "cell-02", "cell-03", "cell-04"] as const;

type Props = {
  asset: Asset3D;
  status: AssetStatus;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
};

export function UPSModel({
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
    matRef.current.emissiveIntensity =
      status === "critical"
        ? 0.45 + Math.sin(clock.elapsedTime * 3) * 0.25
        : status === "warning"
          ? 0.18
          : isHovered
            ? 0.1
            : 0.03;
  });

  const emissive = status === "critical" ? "#cc0000" : status === "warning" ? "#b45309" : "#0f0a00";

  return (
    <group position={asset.position}>
      {/* Main body */}
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
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          ref={matRef}
          color={ASSET_BODY_COLOR}
          emissive={emissive}
          emissiveIntensity={0.03}
          roughness={0.82}
          metalness={0.38}
        />
      </mesh>
      {/* Battery cell indicator bars */}
      {BATTERY_CELL_KEYS.map((cellKey, i) => (
        <mesh key={cellKey} position={[-w / 4 + i * (w / 3.5), 0, d / 2 + 0.002]}>
          <planeGeometry args={[w * 0.18, h * 0.55]} />
          <meshStandardMaterial color="#1a1800" roughness={0.9} />
        </mesh>
      ))}
      {/* Battery % display */}
      <mesh position={[0, h * 0.3, d / 2 + 0.003]}>
        <planeGeometry args={[w * 0.5, h * 0.12]} />
        <meshStandardMaterial color="#0a1500" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
      {/* Status top */}
      <mesh position={[0, h / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          color={STATUS_COLORS[status]}
          emissive={STATUS_COLORS[status]}
          emissiveIntensity={status !== "normal" ? 0.5 : 0.12}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, h / 2 + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) / 2 + 0.15, Math.max(w, d) / 2 + 0.28, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

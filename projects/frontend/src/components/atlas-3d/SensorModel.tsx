import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Asset3D, AssetStatus } from "./sceneTypes";

type Props = {
  asset: Asset3D;
  status: AssetStatus;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
};

export function SensorModel({
  asset,
  status,
  isSelected,
  onClick,
  onPointerOver,
  onPointerOut,
}: Props) {
  const glowRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const { width: w } = asset.dimensions;

  const color = status === "critical" ? "#ef4444" : status === "warning" ? "#f59e0b" : "#22d3ee";

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    glowRef.current.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 2.2) * 0.3;
  });

  return (
    <group position={asset.position}>
      {/* Sensor body — small cylinder */}
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
        <cylinderGeometry args={[w / 2, w / 2, w * 1.2, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.2} />
      </mesh>
      {/* Glowing tip */}
      <mesh position={[0, w * 0.7, 0]}>
        <sphereGeometry args={[w * 0.35, 8, 8]} />
        <meshStandardMaterial
          ref={glowRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[w * 1.2, w * 1.5, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

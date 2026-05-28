import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ASSET_BODY_COLOR, STATUS_COLORS } from "./sceneStyles";
import type { Asset3D, AssetStatus } from "./sceneTypes";

const PORT_LED_KEYS = [
  "port-01",
  "port-02",
  "port-03",
  "port-04",
  "port-05",
  "port-06",
  "port-07",
  "port-08",
  "port-09",
  "port-10",
  "port-11",
  "port-12",
] as const;

type Props = {
  asset: Asset3D;
  status: AssetStatus;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
};

export function SwitchModel({
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
      status === "critical" ? 0.4 + Math.sin(clock.elapsedTime * 3) * 0.2 : isHovered ? 0.1 : 0.03;
  });

  const portCount = 12;

  return (
    <group position={asset.position}>
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
          emissive={status === "critical" ? "#ff0000" : "#0a0a18"}
          emissiveIntensity={0.03}
          roughness={0.8}
          metalness={0.4}
        />
      </mesh>
      {/* Port LEDs on front */}
      {PORT_LED_KEYS.map((portKey, i) => {
        const active = i < 8;
        return (
          <mesh
            key={portKey}
            position={[-w / 2 + 0.06 + i * (w / (portCount + 1)), 0, d / 2 + 0.003]}
          >
            <boxGeometry args={[0.04, 0.04, 0.01]} />
            <meshStandardMaterial
              color={active ? "#a855f7" : "#1a1a1a"}
              emissive={active ? "#a855f7" : "#000000"}
              emissiveIntensity={active ? 0.8 : 0}
            />
          </mesh>
        );
      })}
      {/* Status top */}
      <mesh position={[0, h / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          color={STATUS_COLORS[status]}
          emissive={STATUS_COLORS[status]}
          emissiveIntensity={status !== "normal" ? 0.5 : 0.15}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, h / 2 + 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) / 2 + 0.1, Math.max(w, d) / 2 + 0.2, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

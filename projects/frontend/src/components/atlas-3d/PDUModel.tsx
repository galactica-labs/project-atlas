import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ASSET_BODY_COLOR, STATUS_COLORS } from "./sceneStyles";
import type { Asset3D, AssetStatus } from "./sceneTypes";

const OUTLET_ROW_KEYS = [
  "outlet-row-01",
  "outlet-row-02",
  "outlet-row-03",
  "outlet-row-04",
  "outlet-row-05",
  "outlet-row-06",
  "outlet-row-07",
  "outlet-row-08",
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

export function PDUModel({
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
        ? 0.4 + Math.sin(clock.elapsedTime * 3) * 0.2
        : status === "warning"
          ? 0.15
          : isHovered
            ? 0.1
            : 0.03;
  });

  const emissive = status === "critical" ? "#ff0000" : status === "warning" ? "#f59e0b" : "#0a0a0a";

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
          emissive={emissive}
          emissiveIntensity={0.03}
          roughness={0.85}
          metalness={0.35}
        />
      </mesh>
      {/* Circuit outlet rows */}
      {OUTLET_ROW_KEYS.map((outletKey, i) => (
        <mesh key={outletKey} position={[0, -h / 2 + 0.15 + i * (h / 10), d / 2 + 0.002]}>
          <planeGeometry args={[w * 0.7, 0.04]} />
          <meshStandardMaterial color="#1e2a1e" roughness={0.95} />
        </mesh>
      ))}
      {/* Status top */}
      <mesh position={[0, h / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          color={STATUS_COLORS[status]}
          emissive={STATUS_COLORS[status]}
          emissiveIntensity={status !== "normal" ? 0.5 : 0.15}
        />
      </mesh>
      {/* Power indicator LED strip on side */}
      <mesh position={[w / 2 + 0.002, 0, 0]}>
        <planeGeometry args={[0.04, h * 0.6]} />
        <meshStandardMaterial
          color="#eab308"
          emissive="#eab308"
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {isSelected && (
        <mesh position={[0, h / 2 + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) / 2 + 0.1, Math.max(w, d) / 2 + 0.22, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

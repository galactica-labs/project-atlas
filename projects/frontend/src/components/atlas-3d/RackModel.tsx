import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ASSET_BODY_COLOR, STATUS_COLORS, STATUS_EMISSIVE } from "./sceneStyles";
import type { Asset3D, AssetStatus } from "./sceneTypes";

const RACK_SLOT_KEYS = [
  "slot-01",
  "slot-02",
  "slot-03",
  "slot-04",
  "slot-05",
  "slot-06",
  "slot-07",
  "slot-08",
  "slot-09",
  "slot-10",
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

function SelectionRing({ w, d, h }: { w: number; d: number; h: number }) {
  const pts = useMemo<[number, number, number][]>(() => {
    const hw = w / 2 + 0.08;
    const hd = d / 2 + 0.08;
    const y = h / 2 + 0.1;
    return [
      [-hw, y, -hd],
      [hw, y, -hd],
      [hw, y, hd],
      [-hw, y, hd],
      [-hw, y, -hd],
    ];
  }, [w, d, h]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
    return g;
  }, [pts]);

  return (
    <primitive
      object={
        new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({ color: "#ffffff", opacity: 0.8, transparent: true })
        )
      }
    />
  );
}

export function RackModel({
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
      matRef.current.emissiveIntensity = 0.35 + Math.sin(clock.elapsedTime * 3.5) * 0.25;
    } else if (status === "warning") {
      matRef.current.emissiveIntensity = 0.18 + Math.sin(clock.elapsedTime * 1.5) * 0.08;
    } else if (isHovered) {
      matRef.current.emissiveIntensity = 0.12;
    } else {
      matRef.current.emissiveIntensity = 0.04;
    }
  });

  const emissiveColor =
    status === "critical"
      ? "#ff1111"
      : status === "warning"
        ? "#f59e0b"
        : isHovered
          ? "#2a2a2a"
          : STATUS_EMISSIVE[status];

  const slotCount = 10;
  const slotHeight = (h * 0.85) / slotCount;
  const slotGap = slotHeight * 0.3;

  return (
    <group position={asset.position} rotation={asset.rotation ?? [0, 0, 0]}>
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
        castShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          ref={matRef}
          color={ASSET_BODY_COLOR}
          emissive={emissiveColor}
          emissiveIntensity={0.04}
          roughness={0.85}
          metalness={0.3}
        />
      </mesh>
      {/* Front face frame inset (slightly lighter) */}
      <mesh position={[0, 0, d / 2 + 0.001]}>
        <planeGeometry args={[w * 0.9, h * 0.9]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Server slot lines */}
      {RACK_SLOT_KEYS.map((slotKey, i) => {
        const y = -h / 2 + slotGap + i * slotHeight + slotHeight / 2;
        return (
          <mesh key={slotKey} position={[0, y + h * 0.075, d / 2 + 0.003]}>
            <planeGeometry args={[w * 0.85, slotHeight - slotGap * 0.8]} />
            <meshStandardMaterial color="#252525" roughness={0.95} />
          </mesh>
        );
      })}
      {/* Status indicator strip on top */}
      <mesh position={[0, h / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          color={STATUS_COLORS[status]}
          emissive={STATUS_COLORS[status]}
          emissiveIntensity={status !== "normal" ? 0.6 : 0.15}
          roughness={0.5}
        />
      </mesh>
      {/* Selection ring */}
      {isSelected && <SelectionRing w={w} d={d} h={h} />}
    </group>
  );
}

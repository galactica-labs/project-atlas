import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ASSET_BODY_COLOR, STATUS_COLORS } from "./sceneStyles";
import type { Asset3D, AssetStatus } from "./sceneTypes";

const VENT_COUNT = 7;
const FAN_COUNT = 3;

type Props = {
  asset: Asset3D;
  status: AssetStatus;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
};

function FanDisc({
  x,
  y,
  z,
  radius,
  status,
}: {
  x: number;
  y: number;
  z: number;
  radius: number;
  status: AssetStatus;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const speed = status === "critical" ? 0.5 : status === "warning" ? 1.8 : 4;
    groupRef.current.rotation.y = clock.elapsedTime * speed;
  });

  const bladeColor = status === "critical" ? "#ef4444" : "#1f2937";
  const hubColor = status === "critical" ? "#7f1d1d" : "#0f172a";

  return (
    <group position={[x, y, z]}>
      {/* Hub */}
      <mesh>
        <cylinderGeometry args={[radius * 0.18, radius * 0.18, 0.04, 12]} />
        <meshStandardMaterial color={hubColor} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Spinning blades */}
      <group ref={groupRef}>
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2;
          return (
            <mesh
              key={`blade-${i}`}
              position={[Math.cos(angle) * radius * 0.35, 0.02, Math.sin(angle) * radius * 0.35]}
              rotation={[0, -angle, Math.PI * 0.15]}
            >
              <boxGeometry args={[radius * 0.28, 0.025, radius * 0.14]} />
              <meshStandardMaterial color={bladeColor} roughness={0.6} metalness={0.5} />
            </mesh>
          );
        })}
      </group>

      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.75, radius, 24]} />
        <meshStandardMaterial
          color="#111111"
          roughness={0.8}
          metalness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

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
      matRef.current.emissiveIntensity = 0.55 + Math.sin(clock.elapsedTime * 4) * 0.38;
    } else if (status === "warning") {
      matRef.current.emissiveIntensity = 0.22 + Math.sin(clock.elapsedTime * 2) * 0.12;
    } else {
      matRef.current.emissiveIntensity = isHovered ? 0.1 : 0.03;
    }
  });

  const emissive = status === "critical" ? "#ff0000" : status === "warning" ? "#f59e0b" : "#0a1a1a";
  const isCritical = status === "critical";
  const statusColor = STATUS_COLORS[status];

  // Fan positions across the top face (3 fans evenly spaced)
  const fanXs = useMemo(
    () => Array.from({ length: FAN_COUNT }, (_, i) => -w / 2 + (i + 0.5) * (w / FAN_COUNT)),
    [w]
  );

  // Vent slot heights
  const ventKeys = useMemo(() => Array.from({ length: VENT_COUNT }, (_, i) => `vent-${i}`), []);

  return (
    <group position={asset.position} rotation={asset.rotation ?? [0, 0, 0]}>
      {/* ── Main industrial block ───────────────────────────────── */}
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
          roughness={0.75}
          metalness={0.45}
        />
      </mesh>

      {/* ── Front face panel ─────────────────────────────────────── */}
      <mesh position={[0, 0, d / 2 + 0.003]}>
        <planeGeometry args={[w * 0.96, h * 0.96]} />
        <meshStandardMaterial color="#151515" roughness={0.88} metalness={0.15} />
      </mesh>

      {/* ── Vent grille slots on front face ──────────────────────── */}
      {ventKeys.map((vk, i) => {
        const slotH = (h * 0.7) / VENT_COUNT;
        const yPos = -h * 0.25 + i * slotH + slotH / 2;
        return (
          <mesh key={vk} position={[0, yPos, d / 2 + 0.006]}>
            <planeGeometry args={[w * 0.84, slotH * 0.55]} />
            <meshStandardMaterial
              color={isCritical ? "#3a0a0a" : "#0d1f1f"}
              emissive={isCritical ? "#ff0000" : "#001a1a"}
              emissiveIntensity={isCritical ? 0.08 : 0.04}
              roughness={0.95}
            />
          </mesh>
        );
      })}

      {/* ── Cooling exhaust indicator strip (bottom front) ─────── */}
      <mesh position={[0, -h / 2 + 0.08, d / 2 + 0.008]}>
        <planeGeometry args={[w * 0.9, 0.12]} />
        <meshStandardMaterial
          color={isCritical ? "#ef4444" : "#22d3ee"}
          emissive={isCritical ? "#ef4444" : "#22d3ee"}
          emissiveIntensity={isCritical ? 1.5 : 0.55}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* ── Status strip on front (top) ──────────────────────────── */}
      <mesh position={[0, h / 2 - 0.1, d / 2 + 0.006]}>
        <planeGeometry args={[w * 0.92, 0.15]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={isCritical ? 1.2 : 0.5}
        />
      </mesh>

      {/* ── Side panel texture ───────────────────────────────────── */}
      {[-1, 1].map((side) => (
        <mesh key={`side-${side}`} position={[(side * w) / 2 + side * 0.003, 0, 0]}>
          <planeGeometry args={[d * 0.95, h * 0.95]} />
          <meshStandardMaterial
            color="#0e0e0e"
            roughness={0.9}
            metalness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* ── Fan discs on top face ─────────────────────────────────── */}
      {fanXs.map((fx) => (
        <FanDisc
          key={`fan-${fx}`}
          x={fx}
          y={h / 2 + 0.04}
          z={0}
          radius={w / FAN_COUNT / 2 - 0.1}
          status={status}
        />
      ))}

      {/* ── Top status plane ─────────────────────────────────────── */}
      <mesh position={[0, h / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={isCritical ? 1.0 : status === "warning" ? 0.45 : 0.15}
          roughness={0.5}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* ── Selection ring ───────────────────────────────────────── */}
      {isSelected && (
        <mesh position={[0, h / 2 + 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) / 2 + 0.2, Math.max(w, d) / 2 + 0.38, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

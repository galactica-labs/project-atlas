import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RESOURCE_COLORS } from "./sceneStyles";
import type { Asset3D, DependencyEdge3D, DependencyResource, VisibleLayers } from "./sceneTypes";
import { buildCurvedPath } from "./sceneUtils";

type Props = {
  edge: DependencyEdge3D;
  assetsById: Record<string, Asset3D>;
  isActive: boolean;
  layers: VisibleLayers;
};

function isLayerVisible(resource: DependencyResource, layers: VisibleLayers): boolean {
  switch (resource) {
    case "power":
      return layers.power;
    case "cooling":
      return layers.cooling;
    case "network":
      return layers.network;
    case "dependency":
      return layers.dependency;
  }
}

// Build a tube mesh for active (incident) paths — thicker, glowing
function buildTubeMesh(pts: THREE.Vector3[], color: string): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.045, 6, false);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.2,
    roughness: 0.3,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85,
  });
  return new THREE.Mesh(tubeGeo, mat);
}

export function DependencyPath({ edge, assetsById, isActive, layers }: Props) {
  const src = assetsById[edge.sourceAssetId];
  const tgt = assetsById[edge.targetAssetId];
  const visible = isLayerVisible(edge.resource, layers);

  const color = RESOURCE_COLORS[edge.resource];

  // Resting line (always present when layer visible)
  const { lineObj, lineMat } = useMemo(() => {
    if (!src || !tgt) return { lineObj: null, lineMat: null };
    const pts = buildCurvedPath(
      new THREE.Vector3(...src.position),
      new THREE.Vector3(...tgt.position),
      src.dimensions.height,
      tgt.dimensions.height
    );
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.07 });
    return { lineObj: new THREE.Line(geo, m), lineMat: m };
  }, [src, tgt, color]);

  // Active tube (only for incident-active paths)
  const { tubeMesh, tubeMat } = useMemo(() => {
    if (!src || !tgt || !isActive) return { tubeMesh: null, tubeMat: null };
    const pts = buildCurvedPath(
      new THREE.Vector3(...src.position),
      new THREE.Vector3(...tgt.position),
      src.dimensions.height,
      tgt.dimensions.height,
      3.5 // higher arc for active path
    );
    const mesh = buildTubeMesh(pts, color);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    return { tubeMesh: mesh, tubeMat: mat };
  }, [src, tgt, isActive, color]);

  const tubeRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    if (!lineMat || !visible) return;
    // Fade inactive line
    if (!isActive) {
      lineMat.opacity = layers.criticalPathOnly ? 0 : 0.07;
    } else {
      lineMat.opacity = 0; // hide line when tube is active
    }

    // Pulse the active tube
    if (tubeMat && isActive) {
      tubeMat.emissiveIntensity = 0.9 + Math.sin(clock.elapsedTime * 5) * 0.5;
      tubeMat.opacity = 0.7 + Math.sin(clock.elapsedTime * 4) * 0.2;
    }
  });

  if (!visible) return null;

  return (
    <group>
      {lineObj && <primitive object={lineObj} />}
      {tubeMesh && <primitive ref={tubeRef} object={tubeMesh} />}
    </group>
  );
}

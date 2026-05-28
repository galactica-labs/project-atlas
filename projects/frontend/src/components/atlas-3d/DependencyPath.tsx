import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
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

export function DependencyPath({ edge, assetsById, isActive, layers }: Props) {
  const src = assetsById[edge.sourceAssetId];
  const tgt = assetsById[edge.targetAssetId];
  const visible = isLayerVisible(edge.resource, layers);

  const { lineObj, mat } = useMemo(() => {
    if (!src || !tgt) return { lineObj: null, mat: null };
    const pts = buildCurvedPath(
      new THREE.Vector3(...src.position),
      new THREE.Vector3(...tgt.position),
      src.dimensions.height,
      tgt.dimensions.height
    );
    const color = RESOURCE_COLORS[edge.resource];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.08 });
    return { lineObj: new THREE.Line(geo, m), mat: m };
  }, [src, tgt, edge.resource]);

  useFrame(({ clock }) => {
    if (!mat || !visible) return;
    mat.opacity = isActive ? 0.55 + Math.sin(clock.elapsedTime * 4) * 0.35 : 0.08;
  });

  if (!visible || !lineObj) return null;
  return <primitive object={lineObj} />;
}

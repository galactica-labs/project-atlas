import * as THREE from "three";
import type { Asset3D } from "./sceneTypes";
import { clusterBoundingCenter, clusterRadius } from "./sceneUtils";

export type CameraTarget = {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
};

export const OVERVIEW_CAMERA: CameraTarget = {
  position: new THREE.Vector3(-4, 22, 19),
  lookAt: new THREE.Vector3(-2, 0, 0),
};

export function cameraForAsset(asset: Asset3D): CameraTarget {
  const [x, y, z] = asset.position;
  const h = asset.dimensions.height;
  const w = Math.max(asset.dimensions.width, asset.dimensions.depth);
  const dist = w * 5 + 4;
  return {
    position: new THREE.Vector3(x + dist * 0.7, y + h * 1.2 + 3, z + dist),
    lookAt: new THREE.Vector3(x, y, z),
  };
}

export function cameraForCluster(assets: Asset3D[]): CameraTarget {
  if (assets.length === 0) return OVERVIEW_CAMERA;
  const center = clusterBoundingCenter(assets);
  const radius = clusterRadius(assets, center);
  const camDist = radius * 2.2 + 8;
  return {
    position: new THREE.Vector3(center.x, center.y + camDist * 0.7, center.z + camDist * 0.8),
    lookAt: center.clone().setY(2),
  };
}

export function cameraForIncident(rootAsset: Asset3D, affectedAssets: Asset3D[]): CameraTarget {
  const all = [rootAsset, ...affectedAssets];
  const center = clusterBoundingCenter(all);
  const radius = clusterRadius(all, center);
  const camDist = radius * 2.0 + 10;
  return {
    position: new THREE.Vector3(
      center.x - camDist * 0.3,
      center.y + camDist * 0.75,
      center.z - camDist * 0.9
    ),
    lookAt: center.clone().setY(2),
  };
}

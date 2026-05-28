import * as THREE from "three";
import type { Asset3D } from "./sceneTypes";

export function getAssetTopCenter(asset: Asset3D): THREE.Vector3 {
  return new THREE.Vector3(
    asset.position[0],
    asset.position[1] + asset.dimensions.height / 2 + 0.1,
    asset.position[2]
  );
}

export function getAssetCenter(asset: Asset3D): THREE.Vector3 {
  return new THREE.Vector3(...asset.position);
}

export function clusterBoundingCenter(assets: Asset3D[]): THREE.Vector3 {
  if (assets.length === 0) return new THREE.Vector3(0, 0, 0);
  const sum = assets.reduce(
    (acc, a) => acc.add(new THREE.Vector3(...a.position)),
    new THREE.Vector3()
  );
  return sum.divideScalar(assets.length);
}

export function clusterRadius(assets: Asset3D[], center: THREE.Vector3): number {
  return Math.max(5, ...assets.map((a) => new THREE.Vector3(...a.position).distanceTo(center)));
}

export function buildCurvedPath(
  srcPos: THREE.Vector3,
  tgtPos: THREE.Vector3,
  srcHeight: number,
  tgtHeight: number,
  arcLift = 2.5
): THREE.Vector3[] {
  const start = srcPos.clone().setY(srcPos.y + srcHeight / 2 + 0.2);
  const end = tgtPos.clone().setY(tgtPos.y + tgtHeight / 2 + 0.2);
  const mid = new THREE.Vector3(
    (start.x + end.x) / 2,
    Math.max(start.y, end.y) + arcLift,
    (start.z + end.z) / 2
  );
  const curve = new THREE.CatmullRomCurve3([start, mid, end]);
  return curve.getPoints(48);
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Vector3 } from "three";
import {
  type CameraTarget,
  cameraForAsset,
  cameraForCluster,
  cameraForIncident,
  OVERVIEW_CAMERA,
} from "./cameraUtils";
import { useCommandCenterStore } from "./commandCenterStore";
import { SCENE_ASSETS } from "./sceneData";

const LERP_SPEED = 0.045;

type OrbitControlsHandle = {
  target: Vector3;
  update: () => void;
};

export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  const targetPos = useRef(OVERVIEW_CAMERA.position.clone());
  const targetLookAt = useRef(OVERVIEW_CAMERA.lookAt.clone());
  const isAnimating = useRef(false);

  const focusRequest = useCommandCenterStore((s) => s.cameraFocusRequest);
  const clearRequest = useCommandCenterStore((s) => s.clearCameraRequest);

  const assetsById = useMemo(() => Object.fromEntries(SCENE_ASSETS.map((a) => [a.id, a])), []);

  const applyTarget = useCallback((t: CameraTarget) => {
    targetPos.current.copy(t.position);
    targetLookAt.current.copy(t.lookAt);
    isAnimating.current = true;
  }, []);

  useEffect(() => {
    if (!focusRequest) return;
    clearRequest();

    switch (focusRequest.type) {
      case "overview": {
        applyTarget(OVERVIEW_CAMERA);
        break;
      }
      case "asset": {
        const asset = assetsById[focusRequest.assetId];
        if (asset) applyTarget(cameraForAsset(asset));
        break;
      }
      case "cluster": {
        const assets = focusRequest.assetIds.map((id) => assetsById[id]).filter(Boolean);
        if (assets.length) applyTarget(cameraForCluster(assets));
        break;
      }
      case "incident": {
        const root = assetsById[focusRequest.rootAssetId];
        const affected = focusRequest.affectedAssetIds.map((id) => assetsById[id]).filter(Boolean);
        if (root) applyTarget(cameraForIncident(root, affected));
        break;
      }
    }
  }, [focusRequest, clearRequest, assetsById, applyTarget]);

  useFrame(() => {
    if (!isAnimating.current) return;

    camera.position.lerp(targetPos.current, LERP_SPEED);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, LERP_SPEED);
      controlsRef.current.update();
    }

    const distToPos = camera.position.distanceTo(targetPos.current);
    const distToLookAt = controlsRef.current?.target.distanceTo(targetLookAt.current) ?? 0;
    if (distToPos < 0.05 && distToLookAt < 0.05) {
      isAnimating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={(controls) => {
        controlsRef.current = controls as OrbitControlsHandle | null;
      }}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={3}
      maxDistance={60}
      target={OVERVIEW_CAMERA.lookAt.toArray() as [number, number, number]}
    />
  );
}

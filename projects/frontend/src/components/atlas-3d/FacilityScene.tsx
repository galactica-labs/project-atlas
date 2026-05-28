import { useCallback, useMemo } from "react";
import { AssetLabel } from "./AssetLabel";
import { AssetModel } from "./AssetModel";
import { CameraController } from "./CameraController";
import { useCommandCenterStore } from "./commandCenterStore";
import { DependencyPath } from "./DependencyPath";
import { FacilityFloor } from "./FacilityFloor";
import { FacilityWalls } from "./FacilityWalls";
import { SceneLighting } from "./SceneLighting";
import { FLOORS_3D } from "./sceneData";
import { ZoneBlock } from "./ZoneBlock";

export function FacilityScene() {
  const {
    activeFloorId,
    selectedAssetId,
    hoveredAssetId,
    assetStatuses,
    activeEdgeIds,
    visibleLayers,
    selectAsset,
    hoverAsset,
    requestCameraFocus,
  } = useCommandCenterStore();

  const { assets: SCENE_ASSETS, edges: SCENE_EDGES, zones: SCENE_ZONES } = FLOORS_3D[activeFloorId];

  const assetsById = useMemo(
    () => Object.fromEntries(SCENE_ASSETS.map((a) => [a.id, a])),
    [SCENE_ASSETS]
  );

  const handleClick = useCallback(
    (id: string) => {
      selectAsset(id);
      requestCameraFocus({ type: "asset", assetId: id });
    },
    [selectAsset, requestCameraFocus]
  );

  return (
    <>
      <SceneLighting />
      <CameraController />

      {/* Floor */}
      <FacilityFloor showGrid={visibleLayers.grid} />

      {/* Perimeter walls and zone dividers */}
      <FacilityWalls />

      {/* Zone boundaries */}
      {SCENE_ZONES.map((zone) => (
        <ZoneBlock key={zone.id} zone={zone} visible={visibleLayers.zoneBoundaries} />
      ))}

      {/* Dependency paths */}
      {SCENE_EDGES.map((edge) => {
        const isActive = activeEdgeIds.includes(edge.id);
        if (visibleLayers.criticalPathOnly && !isActive) return null;
        return (
          <DependencyPath
            key={edge.id}
            edge={edge}
            assetsById={assetsById}
            isActive={isActive}
            layers={visibleLayers}
          />
        );
      })}

      {/* Assets */}
      {SCENE_ASSETS.map((asset) => {
        const status = assetStatuses[asset.id] ?? asset.status;
        const isSelected = selectedAssetId === asset.id;
        const isHovered = hoveredAssetId === asset.id;

        return (
          <group key={asset.id}>
            <AssetModel
              asset={asset}
              status={status}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={() => handleClick(asset.id)}
              onPointerOver={() => {
                hoverAsset(asset.id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                hoverAsset(null);
                document.body.style.cursor = "default";
              }}
            />
            {visibleLayers.labels && (
              <AssetLabel asset={asset} status={status} isSelected={isSelected} />
            )}
          </group>
        );
      })}
    </>
  );
}

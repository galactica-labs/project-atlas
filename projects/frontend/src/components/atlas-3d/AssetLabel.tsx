import { Html } from "@react-three/drei";
import { STATUS_COLORS } from "./sceneStyles";
import type { Asset3D, AssetStatus } from "./sceneTypes";

type Props = {
  asset: Asset3D;
  status: AssetStatus;
  isSelected: boolean;
};

const STATUS_BG: Record<AssetStatus, string> = {
  normal: "rgba(0,0,0,0.65)",
  warning: "rgba(30,16,0,0.85)",
  critical: "rgba(40,0,0,0.90)",
  offline: "rgba(10,10,10,0.75)",
};

export function AssetLabel({ asset, status, isSelected }: Props) {
  const topY = asset.position[1] + asset.dimensions.height / 2 + 0.4;
  const labelPos: [number, number, number] = [asset.position[0], topY, asset.position[2]];

  return (
    <Html
      position={labelPos}
      center
      distanceFactor={20}
      occlude={false}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          fontFamily: "Geist Variable, monospace",
          fontSize: "8px",
          fontWeight: isSelected ? 700 : 500,
          letterSpacing: "0.08em",
          padding: "2px 5px",
          borderRadius: "3px",
          background: STATUS_BG[status],
          border: `1px solid ${STATUS_COLORS[status]}40`,
          color: status === "normal" ? "#a1a1aa" : STATUS_COLORS[status],
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
          boxShadow: isSelected ? `0 0 8px ${STATUS_COLORS[status]}60` : "none",
        }}
      >
        {asset.name}
      </div>
    </Html>
  );
}

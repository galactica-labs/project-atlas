import { CRACModel } from "./CRACModel";
import { PDUModel } from "./PDUModel";
import { RackModel } from "./RackModel";
import { SensorModel } from "./SensorModel";
import { SwitchModel } from "./SwitchModel";
import type { Asset3D, AssetStatus } from "./sceneTypes";
import { UPSModel } from "./UPSModel";

type Props = {
  asset: Asset3D;
  status: AssetStatus;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
};

export function AssetModel(props: Props) {
  const { asset } = props;
  switch (asset.type) {
    case "rack":
      return <RackModel {...props} />;
    case "crac":
      return <CRACModel {...props} />;
    case "cooling_unit":
      return <CRACModel {...props} />;
    case "pdu":
      return <PDUModel {...props} />;
    case "ups":
      return <UPSModel {...props} />;
    case "switch":
      return <SwitchModel {...props} />;
    case "sensor":
      return <SensorModel {...props} isHovered={props.isHovered} />;
    default:
      return <RackModel {...props} />;
  }
}

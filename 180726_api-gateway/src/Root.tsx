import "./index.css";
import { Composition } from "remotion";
import { ApiGateway } from "./scenes/ApiGateway";
import { FPS, H, LOOP, W } from "./scenes/ApiGateway/constants";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ApiGateway"
      component={ApiGateway}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={LOOP}
    />
  );
};

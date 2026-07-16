import "./index.css";
import { Composition } from "remotion";
import { NPlusOne } from "./scenes/NPlusOne";
import { FPS, H, LOOP, W } from "./scenes/NPlusOne/constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NPlusOne"
        component={NPlusOne}
        width={W}
        height={H}
        fps={FPS}
        durationInFrames={LOOP}
      />
    </>
  );
};

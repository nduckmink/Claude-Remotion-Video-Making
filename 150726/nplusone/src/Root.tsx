import "./index.css";
import { Composition } from "remotion";
import { NPlusOne } from "./scenes/NPlusOne";
import { FPS, H, LOOP, W } from "./scenes/NPlusOne/constants";
import { RateLimit } from "./scenes/RateLimit";
import {
  FPS as RL_FPS,
  H as RL_H,
  LOOP as RL_LOOP,
  W as RL_W,
} from "./scenes/RateLimit/constants";
import { RateLimitV2 } from "./scenes/RateLimit/v2";

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
      <Composition
        id="RateLimit"
        component={RateLimit}
        width={RL_W}
        height={RL_H}
        fps={RL_FPS}
        durationInFrames={RL_LOOP}
      />
      <Composition
        id="RateLimitV2"
        component={RateLimitV2}
        width={RL_W}
        height={RL_H}
        fps={RL_FPS}
        durationInFrames={RL_LOOP}
      />
    </>
  );
};

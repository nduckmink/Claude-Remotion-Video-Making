import "./index.css";
import { Composition } from "remotion";
import { IdempotencyKey } from "./scenes/IdempotencyKey";
import { FPS, H, LOOP, W } from "./scenes/IdempotencyKey/constants";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="IdempotencyKey"
      component={IdempotencyKey}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={LOOP}
    />
  );
};

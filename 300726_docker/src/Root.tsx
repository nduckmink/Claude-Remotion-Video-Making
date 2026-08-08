import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/Docker/constants";
import { Docker } from "./scenes/Docker";

export const RemotionRoot: React.FC = () => (
  <Composition id="Docker" component={Docker} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

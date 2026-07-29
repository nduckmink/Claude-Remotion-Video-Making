import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/Cors/constants";
import { Cors } from "./scenes/Cors";

export const RemotionRoot: React.FC = () => (
  <Composition id="Cors" component={Cors} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

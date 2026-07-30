import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/Cdn/constants";
import { Cdn } from "./scenes/Cdn";

export const RemotionRoot: React.FC = () => (
  <Composition id="Cdn" component={Cdn} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

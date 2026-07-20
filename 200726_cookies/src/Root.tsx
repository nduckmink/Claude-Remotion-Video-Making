import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/Cookies/constants";
import { Cookies } from "./scenes/Cookies";

export const RemotionRoot: React.FC = () => (
  <Composition id="Cookies" component={Cookies} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

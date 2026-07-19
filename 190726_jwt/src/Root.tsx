import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/Jwt/constants";
import { Jwt } from "./scenes/Jwt";

export const RemotionRoot: React.FC = () => (
  <Composition id="Jwt" component={Jwt} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

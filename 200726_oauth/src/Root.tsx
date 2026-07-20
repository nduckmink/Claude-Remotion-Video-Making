import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/Oauth/constants";
import { Oauth } from "./scenes/Oauth";

export const RemotionRoot: React.FC = () => (
  <Composition id="Oauth" component={Oauth} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

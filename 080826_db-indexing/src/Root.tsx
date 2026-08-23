import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/DbIndexing/constants";
import { DbIndexing } from "./scenes/DbIndexing";

export const RemotionRoot: React.FC = () => (
  <Composition id="DbIndexing" component={DbIndexing} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

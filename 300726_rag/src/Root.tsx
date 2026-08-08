import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/Rag/constants";
import { Rag } from "./scenes/Rag";

export const RemotionRoot: React.FC = () => (
  <Composition id="Rag" component={Rag} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

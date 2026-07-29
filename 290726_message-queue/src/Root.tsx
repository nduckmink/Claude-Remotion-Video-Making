import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/MessageQueue/constants";
import { MessageQueue } from "./scenes/MessageQueue";

export const RemotionRoot: React.FC = () => (
  <Composition id="MessageQueue" component={MessageQueue} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

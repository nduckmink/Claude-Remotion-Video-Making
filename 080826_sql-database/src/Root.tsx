import { Composition } from "remotion";
import { FPS, H, LOOP, W } from "./scenes/Sql/constants";
import { Sql } from "./scenes/Sql";

export const RemotionRoot: React.FC = () => (
  <Composition id="Sql" component={Sql} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
);

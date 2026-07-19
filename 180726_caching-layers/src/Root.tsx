import "./index.css";
import { Composition } from "remotion";
import { CachingLayers } from "./scenes/CachingLayers";
import { FPS, H, LOOP, W } from "./scenes/CachingLayers/constants";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="CachingLayers" component={CachingLayers} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
  );
};

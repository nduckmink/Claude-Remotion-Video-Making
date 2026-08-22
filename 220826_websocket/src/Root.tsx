import React from "react";
import { Composition } from "remotion";
import { WebSocketScene } from "./scenes/WebSocket";
import { FPS, H, LOOP, W } from "./scenes/WebSocket/constants";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="WebSocket"
    component={WebSocketScene}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={LOOP}
  />
);

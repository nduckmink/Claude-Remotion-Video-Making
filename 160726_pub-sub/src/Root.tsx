import "./index.css";
import { Composition } from "remotion";
import { PubSub } from "./scenes/PubSub";
import { FPS, H, LOOP, W } from "./scenes/PubSub/constants";
import { PubSubV2 } from "./scenes/PubSub/v2";
import {
  FPS as V2_FPS,
  H as V2_H,
  LOOP as V2_LOOP,
  W as V2_W,
} from "./scenes/PubSub/v2/constants";

// Đăng ký TẤT CẢ version — để so A/B cạnh nhau trong Studio, và để không bao
// giờ mất bản đang tốt vì một lần thử (Resource/scene_revision.md).
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PubSub"
        component={PubSub}
        width={W}
        height={H}
        fps={FPS}
        durationInFrames={LOOP}
      />
      <Composition
        id="PubSubV2"
        component={PubSubV2}
        width={V2_W}
        height={V2_H}
        fps={V2_FPS}
        durationInFrames={V2_LOOP}
      />
    </>
  );
};

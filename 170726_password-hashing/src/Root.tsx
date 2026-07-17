import "./index.css";
import { Composition } from "remotion";
import { PasswordHashing } from "./scenes/PasswordHashing";
import { FPS, H, LOOP, W } from "./scenes/PasswordHashing/constants";
import { PasswordHashingV2 } from "./scenes/PasswordHashing/v2";
import { LOOP as V2_LOOP } from "./scenes/PasswordHashing/v2/constants";
import { PasswordHashingV3 } from "./scenes/PasswordHashing/v3";
import { LOOP as V3_LOOP } from "./scenes/PasswordHashing/v3/constants";

// Đăng ký TẤT CẢ version — so A/B cạnh nhau trong Studio, và không bao giờ mất
// bản đang tốt vì một lần thử (Resource/scene_revision.md).
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="PasswordHashing" component={PasswordHashing} width={W} height={H} fps={FPS} durationInFrames={LOOP} />
      <Composition id="PasswordHashingV2" component={PasswordHashingV2} width={W} height={H} fps={FPS} durationInFrames={V2_LOOP} />
      <Composition id="PasswordHashingV3" component={PasswordHashingV3} width={W} height={H} fps={FPS} durationInFrames={V3_LOOP} />
    </>
  );
};

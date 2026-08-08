import { AbsoluteFill } from "remotion";
import { C } from "../lib/tokens";

/**
 * Nền toả tròn: tâm khung sáng hơn mép, để mắt tự rơi vào giữa.
 *
 * MỘT gradient làm cả hai việc — nâng tâm lên bgLift rồi tắt về bg ở mép
 * CHÍNH LÀ vignette, chỉ viết ngược lại. Không chồng hai lớp.
 *
 * Tâm ở 48% chứ không phải 50%: stage bắt đầu từ y=310 nên tâm bản vẽ nằm
 * cao hơn tâm hình học của khung.
 */
export const GridBg: React.FC<{ cell?: number }> = ({ cell = 90 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 52% at 50% 48%, ${C.bgLift} 0%, ${C.bg} 72%)`,
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${C.gridDim} 1.5px, transparent 1.6px)`,
        backgroundSize: `${cell}px ${cell}px`,
      }}
    />
  </AbsoluteFill>
);

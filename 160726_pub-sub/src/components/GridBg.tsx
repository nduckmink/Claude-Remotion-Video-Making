import { AbsoluteFill } from "remotion";
import { C } from "../lib/tokens";

/**
 * Nền + grid chấm + vignette. Không bao giờ nổi hơn nội dung.
 *
 * Không có chữ ghost: ở 560px thì chỉ lọt ~3 ký tự trong 1080 — "PUB/SUB"
 * không vừa, mà cắt cụt thì hết là chủ đề.
 */
export const GridBg: React.FC<{ cell?: number }> = ({ cell = 90 }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${C.gridDim} 1.5px, transparent 1.6px)`,
        backgroundSize: `${cell}px ${cell}px`,
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 55% at 50% 55%, transparent 0%, ${C.bg} 100%)`,
      }}
    />
  </AbsoluteFill>
);

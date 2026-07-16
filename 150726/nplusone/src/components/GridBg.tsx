import { AbsoluteFill } from "remotion";
import { C, F } from "../lib/tokens";

/**
 * Nền + grid chấm + vignette + (tuỳ chọn) chữ khổng lồ chìm mang tên khái niệm.
 * Chữ ghost là CHỦ ĐỀ, không phải trang trí. Cả ba không bao giờ nổi hơn nội dung.
 */
export const GridBg: React.FC<{ cell?: number; ghost?: string }> = ({
  cell = 90,
  ghost,
}) => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${C.gridDim} 1.5px, transparent 1.6px)`,
        backgroundSize: `${cell}px ${cell}px`,
      }}
    />
    {ghost ? (
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.title,
          fontWeight: 800,
          fontSize: 560,
          letterSpacing: "-0.04em",
          color: C.ghost,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {ghost}
      </AbsoluteFill>
    ) : null}
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 55% at 50% 55%, transparent 0%, ${C.bg} 100%)`,
      }}
    />
  </AbsoluteFill>
);

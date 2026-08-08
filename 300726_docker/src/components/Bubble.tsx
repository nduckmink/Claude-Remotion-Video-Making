import { C, F } from "../lib/tokens";

/**
 * Bong bóng thoại — cái đuôi chỉ xuống người đang nói. Đây là kênh CẢM XÚC của
 * video: mở bằng hào hứng, đóng bằng ăn mừng; đoạn giữa để cơ chế nói.
 */
export const Bubble: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  lines: string[];
  accent: string;
  tail?: "left" | "right";
  grow?: number;
  opacity?: number;
}> = ({ x, y, w, h, lines, accent, tail = "left", grow = 1, opacity = 1 }) => {
  const tx = tail === "left" ? 44 : w - 44;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `scale(${0.86 + 0.14 * grow})`,
        transformOrigin: tail === "left" ? "20% 100%" : "80% 100%",
        opacity,
      }}
    >
      <svg width={w} height={h + 22} viewBox={`0 0 ${w} ${h + 22}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={16} fill={C.bgPanel} stroke={accent} strokeWidth={2.2} />
        <path d={`M ${tx - 14} ${h - 4} L ${tx} ${h + 18} L ${tx + 16} ${h - 4} Z`} fill={C.bgPanel} stroke={accent} strokeWidth={2.2} strokeLinejoin="round" />
        <rect x={tx - 12} y={h - 8} width={28} height={7} fill={C.bgPanel} />
      </svg>
      <div style={{ position: "relative", height: h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
        {lines.map((t) => (
          <span key={t} style={{ fontFamily: F.mono, fontSize: 17, color: C.text, whiteSpace: "nowrap" }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

import { C, F, nodeGlow } from "../lib/tokens";

/**
 * EDGE (điểm hiện diện) — bản sao đặt SÁT người dùng. Ô bên trong TRỐNG lúc mới
 * dựng (miss: phải chạy về origin), rồi có FILE nằm trong đó (hit: trả ngay).
 * Cái ô đầy/rỗng chính là "cache hit/miss" — không cần chữ.
 */
export const Edge: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  present?: number; // 0..1
  filled?: number; // 0..1 đã có bản sao
  miss?: number; // 0..1 loé khi tra thấy trống
  accent: string;
  opacity?: number;
}> = ({ x, y, w, h, present = 1, filled = 0, miss = 0, accent, opacity = 1 }) => {
  const col = miss > 0.15 ? C.brand : filled > 0.5 ? accent : C.line;
  const slotW = w - 44;
  const slotH = 34;

  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `scale(${0.6 + 0.4 * present})`,
        transformOrigin: "center",
        opacity: opacity * present,
      }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={10} fill={C.bgPanel} stroke={col} strokeWidth={2.2} style={{ filter: filled > 0.5 || miss > 0.15 ? `drop-shadow(${nodeGlow(miss > 0.15 ? C.brand : accent, Math.max(filled, miss) * 0.8)})` : undefined }} />
        {/* ô chứa bản sao — RỖNG hoặc CÓ FILE */}
        <rect x={22} y={h / 2 - slotH / 2 + 4} width={slotW} height={slotH} rx={5} fill="none" stroke={filled > 0.5 ? accent : C.line} strokeWidth={1.8} strokeDasharray={filled > 0.5 ? undefined : "6 5"} />
        {filled > 0.5 && (
          <g opacity={filled}>
            <rect x={26} y={h / 2 - slotH / 2 + 8} width={slotW - 8} height={slotH - 8} rx={3} fill={accent} opacity={0.16} />
            <rect x={34} y={h / 2 - 6} width={slotW * 0.5} height={4} rx={2} fill={accent} />
            <rect x={34} y={h / 2 + 2} width={slotW * 0.3} height={4} rx={2} fill={accent} opacity={0.65} />
          </g>
        )}
        {/* dấu ✗ khi miss */}
        {miss > 0.15 && (
          <g opacity={miss}>
            <line x1={w / 2 - 10} y1={h / 2 - 6} x2={w / 2 + 10} y2={h / 2 + 14} stroke={C.brand} strokeWidth={3} strokeLinecap="round" />
            <line x1={w / 2 + 10} y1={h / 2 - 6} x2={w / 2 - 10} y2={h / 2 + 14} stroke={C.brand} strokeWidth={3} strokeLinecap="round" />
          </g>
        )}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 6, width: w, textAlign: "center", fontFamily: F.mono, fontSize: 13, letterSpacing: "0.16em", color: filled > 0.5 ? accent : C.textDim, textTransform: "uppercase" }}>edge</div>
    </div>
  );
};

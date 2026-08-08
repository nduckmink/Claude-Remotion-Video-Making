import { C, F, nodeGlow } from "../lib/tokens";

/**
 * BẢN ĐỒ VECTOR — "vector database" đúng bản chất của nó: KHÔNG phải cái bảng,
 * mà là một không gian. Chỗ đứng của một chấm chính là nghĩa của đoạn văn.
 * Vòng tìm loang ra từ chấm câu hỏi: chạm ai trước thì người đó liên quan hơn.
 */
export const VectorMap: React.FC<{
  x: number; // góc trái trên
  y: number;
  w: number;
  h: number;
  search?: { present: boolean; r: number; x: number; y: number };
  accent: string;
  opacity?: number;
}> = ({ x, y, w, h, search, accent, opacity = 1 }) => {
  const grid = 4;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity, overflow: "visible" }}>
      {/* lưới mờ */}
      {Array.from({ length: grid - 1 }).map((_, i) => {
        const t = ((i + 1) / grid) * w;
        return (
          <g key={i}>
            <line x1={x + t} y1={y} x2={x + t} y2={y + h} stroke={C.gridDim} strokeWidth={1} />
            <line x1={x} y1={y + t} x2={x + w} y2={y + t} stroke={C.gridDim} strokeWidth={1} />
          </g>
        );
      })}
      {/* khung + nẹp bốn góc */}
      <rect x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.012)" stroke={C.line} strokeWidth={1.4} />
      {[
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1],
      ].map(([cx, cy, sx, sy], i) => (
        <path key={i} d={`M ${cx + sx * 26} ${cy} L ${cx} ${cy} L ${cx} ${cy + sy * 26}`} fill="none" stroke={C.lineLive} strokeWidth={2.6} strokeLinecap="round" />
      ))}

      {/* VÒNG TÌM — loang ra từ chấm câu hỏi */}
      {search?.present && search.r > 1 && (
        <>
          <circle cx={search.x} cy={search.y} r={search.r} fill={accent} fillOpacity={0.05} stroke={accent} strokeWidth={2.4} strokeDasharray="7 6" style={{ filter: `drop-shadow(${nodeGlow(accent, 0.5)})` }} />
          <circle cx={search.x} cy={search.y} r={search.r} fill="none" stroke={accent} strokeWidth={1} opacity={0.35} />
        </>
      )}

      <text x={x + 10} y={y - 12} fontFamily={F.mono} fontSize={15} letterSpacing="0.16em" fill={C.textDim}>
        VECTOR SPACE
      </text>
    </svg>
  );
};

import { C, F, nodeGlow } from "../lib/tokens";

/**
 * EMBEDDER — cỗ máy biến CHỮ thành VECTOR. Chi tiết quan trọng nhất của cả
 * video: tài liệu và câu hỏi đi qua CÙNG một cái máy này, nên hai bên mới nằm
 * chung một không gian mà so được với nhau.
 */
export const Embedder: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  active?: number;
  accent: string;
  opacity?: number;
}> = ({ x, y, w, h, active = 0, accent, opacity = 1 }) => {
  const on = active > 0.05;
  const col = on ? accent : C.line;
  const bars = 11;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        {/* thân máy */}
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={12} fill={C.bgPanel} stroke={col} strokeWidth={2.4} style={{ filter: on ? `drop-shadow(${nodeGlow(accent, active)})` : undefined }} />
        {/* phễu vào (trên) + vòi ra (dưới) */}
        <path d={`M ${w / 2 - 40} 2 L ${w / 2 - 16} -14 L ${w / 2 + 16} -14 L ${w / 2 + 40} 2`} fill="none" stroke={col} strokeWidth={2.2} />
        <path d={`M ${w / 2 - 22} ${h - 2} L ${w / 2 - 12} ${h + 14} L ${w / 2 + 12} ${h + 14} L ${w / 2 + 22} ${h - 2}`} fill="none" stroke={col} strokeWidth={2.2} />
        {/* dải "chiều" bên trong — chữ bị ép thành một dãy số */}
        {Array.from({ length: bars }).map((_, i) => {
          const bx = 34 + i * ((w - 68) / (bars - 1));
          const amp = on ? 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + active * 3)) : 0.3;
          const bh = 10 + amp * 34;
          return <rect key={i} x={bx - 4} y={h / 2 - bh / 2} width={8} height={bh} rx={3} fill={on ? accent : C.textFaint} opacity={on ? 0.55 + 0.45 * amp : 0.5} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: 0, top: h + 18, width: w, textAlign: "center", fontFamily: F.mono, fontSize: 15, letterSpacing: "0.16em", color: on ? accent : C.textDim, textTransform: "uppercase" }}>
        embedding model
      </div>
    </div>
  );
};

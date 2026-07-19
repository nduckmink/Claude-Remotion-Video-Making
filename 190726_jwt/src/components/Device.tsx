import { C, F, nodeGlow } from "../lib/tokens";

/**
 * CLIENT / SERVER — panel có HOẠ TIẾT, không phải hộp rỗng gắn nhãn.
 *   thanh chrome trên (nhãn + 3 chấm cửa sổ)
 *   thân: các KHE ngang (slot) mỗi khe một đèn trạng thái — sáng theo `live`.
 * `live` 0..1 = đang xử lý (đèn sáng dồn, viền lên `accent`).
 */
export const Device: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  label: string;
  accent: string;
  rows?: number;
  live?: number;
  opacity?: number;
}> = ({ x, y, w, h, label, accent, rows = 3, live = 0, opacity = 1 }) => {
  const left = x - w / 2;
  const top = y - h / 2;
  const chromeH = 40;
  const bodyTop = chromeH + 10;
  const rowH = (h - bodyTop - 14) / rows;
  const edge = live > 0.04 ? accent : C.line;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        borderRadius: 14,
        background: C.bgPanel,
        border: `2px solid ${edge}`,
        boxSizing: "border-box",
        opacity,
        boxShadow: live > 0.04 ? nodeGlow(accent, live) : "none",
        overflow: "hidden",
      }}
    >
      {/* chrome */}
      <div style={{ height: chromeH, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, borderBottom: `1px solid ${C.line}` }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: 999, background: C.textFaint }} />
        ))}
        <span style={{ fontFamily: F.mono, fontSize: 17, letterSpacing: "0.12em", color: C.textDim, textTransform: "uppercase", marginLeft: 6 }}>{label}</span>
      </div>
      {/* khe + đèn */}
      <svg width={w} height={h - bodyTop} viewBox={`0 0 ${w} ${h - bodyTop}`} style={{ display: "block" }}>
        {Array.from({ length: rows }).map((_, r) => {
          const ry = r * rowH + 8;
          const lit = live > (r + 0.5) / rows ? 1 : live > r / rows ? (live - r / rows) * rows : 0;
          return (
            <g key={r}>
              <rect x={16} y={ry} width={w - 74} height={rowH - 12} rx={5} fill="none" stroke={C.line} strokeWidth={1.2} />
              {[0, 1, 2, 3].map((c) => (
                <rect key={c} x={26 + c * ((w - 96) / 4)} y={ry + (rowH - 12) / 2 - 3} width={(w - 96) / 4 - 12} height={6} rx={3} fill={C.gridDim} />
              ))}
              <circle cx={w - 34} cy={ry + (rowH - 12) / 2} r={6} fill={lit > 0.1 ? accent : C.line} style={{ filter: lit > 0.1 ? `drop-shadow(0 0 ${6 * lit}px ${accent})` : undefined }} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

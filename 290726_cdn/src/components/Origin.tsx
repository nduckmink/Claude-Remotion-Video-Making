import { C, F, nodeGlow } from "../lib/tokens";

/**
 * ORIGIN — nguồn thật, nằm một chỗ, xa mọi người dùng. `heat` = đang bị đập bao
 * nhiêu: rực lên khi mọi request đổ về, TẮT NGÓM khi CDN gánh thay. Đây chính là
 * "số lần đập origin" nhưng nói bằng ánh sáng, không bằng con số.
 */
export const Origin: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rows?: number;
  heat?: number; // 0..1
  hit?: number; // 0..1 cú đập vừa xảy ra
  accent: string;
  opacity?: number;
}> = ({ x, y, w, h, rows = 3, heat = 0, hit = 0, accent, opacity = 1 }) => {
  const left = x - w / 2;
  const top = y - h / 2;
  const hot = heat > 0.06;
  void accent;
  const chromeH = 44;
  const rowH = (h - chromeH - 22) / rows;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        transform: `translate(${hit * 4 * Math.sin(hit * 40)}px, 0) scaleY(${1 - 0.03 * hit})`,
        transformOrigin: "center bottom",
        opacity,
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 14,
          background: C.bgPanel,
          border: `${2 + 2 * heat}px solid ${hot ? C.brand : C.line}`,
          boxSizing: "border-box",
          boxShadow: hot ? nodeGlow(C.brand, heat) : "none",
          overflow: "hidden",
        }}
      >
        <div style={{ height: chromeH, display: "flex", alignItems: "center", gap: 9, padding: "0 16px", borderBottom: `1px solid ${C.line}` }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 9, height: 9, borderRadius: 999, background: C.textFaint }} />
          ))}
          <span style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.12em", color: hot ? C.brand : C.textDim, textTransform: "uppercase", marginLeft: 4 }}>origin</span>
        </div>
        <svg width={w} height={h - chromeH} viewBox={`0 0 ${w} ${h - chromeH}`} style={{ display: "block" }}>
          {Array.from({ length: rows }).map((_, i) => {
            const ry = 11 + i * rowH;
            const lit = heat > (i + 0.4) / rows ? 1 : 0;
            return (
              <g key={i}>
                <rect x={18} y={ry} width={w - 76} height={rowH - 12} rx={5} fill="none" stroke={C.line} strokeWidth={1.3} />
                {[0, 1, 2, 3].map((c) => (
                  <rect key={c} x={28 + c * ((w - 96) / 4)} y={ry + (rowH - 12) / 2 - 3} width={(w - 96) / 4 - 14} height={6} rx={3} fill={C.gridDim} />
                ))}
                <circle cx={w - 36} cy={ry + (rowH - 12) / 2} r={6} fill={lit ? C.brand : C.line} style={{ filter: lit ? `drop-shadow(0 0 8px ${C.brand})` : undefined }} />
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ position: "absolute", left: 0, top: h + 8, width: w, textAlign: "center", fontFamily: F.mono, fontSize: 15, letterSpacing: "0.14em", color: hot ? C.brand : C.textFaint, textTransform: "uppercase" }}>
        us-east · one place
      </div>
    </div>
  );
};

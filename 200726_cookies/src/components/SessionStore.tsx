import { C, F, nodeGlow } from "../lib/tokens";

/**
 * TỦ GỬI ĐỒ = session store. Một ngăn giữ "áo" (session data thật). Cookie chỉ
 * trỏ tới ngăn này. XOÁ TỦ = cú dữ dội: loé đỏ + rung (scene) + áo VỠ VỤN văng
 * ra + một vệt quét đỏ chạy ngang → ngăn trống → cái vé thành vô nghĩa.
 */
const FRAG = 8;
export const SessionStore: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  cols?: number;
  rows?: number;
  cells: number[];
  activeCell: number;
  lookup?: number;
  wipe?: number; // 0..1 áo vỡ dần
  wipeFlash?: number; // 0..1 loé đỏ
  label?: string;
  opacity?: number;
}> = ({ x, y, w, h, cols = 4, rows = 2, cells, activeCell, lookup = 0, wipe = 0, wipeFlash = 0, label = "session store", opacity = 1 }) => {
  const left = x - w / 2;
  const top = y - h / 2;
  const chromeH = 38;
  const pad = 14;
  const gx = (w - pad * 2) / cols;
  const gy = (h - chromeH - pad * 2) / rows;
  const red = wipeFlash > 0.15;
  const edge = red ? C.brand : C.line;
  const wiping = wipe > 0.02 && wipe < 0.99;

  const ar = activeCell % cols;
  const arow = Math.floor(activeCell / cols);
  const acx = pad + ar * gx + gx / 2;
  const acy = pad + arow * gy + gy / 2;

  return (
    <div style={{ position: "absolute", left, top, width: w, height: h, borderRadius: 14, background: C.bgPanel, border: `${2 + 2 * wipeFlash}px solid ${edge}`, boxSizing: "border-box", opacity, overflow: "hidden", boxShadow: red ? nodeGlow(C.brand, wipeFlash) : "none" }}>
      <div style={{ height: chromeH, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, borderBottom: `1px solid ${edge}` }}>
        <span style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.12em", color: red ? C.brand : C.textDim, textTransform: "uppercase" }}>{red ? "session store · flushed" : label}</span>
      </div>
      <svg width={w} height={h - chromeH} viewBox={`0 0 ${w} ${h - chromeH}`} style={{ display: "block", overflow: "visible" }}>
        {cells.map((v, i) => {
          const rr = Math.floor(i / cols);
          const c = i % cols;
          const cx = pad + c * gx;
          const cy = pad + rr * gy;
          const isActive = i === activeCell;
          const lit = isActive ? Math.max(v, lookup) : v;
          const col = red ? C.brand : lit > 0.05 ? C.pass : C.line;
          return (
            <g key={i}>
              <rect x={cx + 4} y={cy + 4} width={gx - 8} height={gy - 8} rx={6} fill="none" stroke={col} strokeWidth={1.5 + lit + 1.5 * wipeFlash} style={{ filter: lit > 0.1 || red ? `drop-shadow(${nodeGlow(red ? C.brand : C.pass, Math.max(lit, wipeFlash))})` : undefined }} />
              {/* áo: yên khi chưa xoá */}
              {isActive && v > 0.05 && !wiping && (
                <>
                  <rect x={cx + 12} y={cy + gy / 2 - 8} width={gx - 24} height={5} rx={2.5} fill={C.pass} opacity={v} />
                  <rect x={cx + 12} y={cy + gy / 2 + 1} width={(gx - 24) * 0.6} height={5} rx={2.5} fill={C.pass} opacity={v * 0.7} />
                </>
              )}
            </g>
          );
        })}

        {/* ÁO VỠ VỤN — mảnh văng ra + rơi, mờ dần */}
        {wiping &&
          Array.from({ length: FRAG }).map((_, i) => {
            const a = (i / FRAG) * Math.PI * 2 + 0.4;
            const dist = wipe * 70;
            const fx = acx + Math.cos(a) * dist;
            const fy = acy + Math.sin(a) * dist + wipe * wipe * 46; // trọng lực
            const sz = 9 * (1 - wipe) + 3;
            return <rect key={i} x={fx - sz / 2} y={fy - sz / 2} width={sz} height={sz * 0.5} rx={1.5} fill={C.brand} opacity={1 - wipe} transform={`rotate(${i * 40 + wipe * 120} ${fx} ${fy})`} />;
          })}

        {/* VỆT QUÉT đỏ chạy ngang khi xoá */}
        {wiping && (
          <rect x={pad + wipe * (w - pad * 2) - 5} y={4} width={10} height={h - chromeH - 8} fill={C.brand} opacity={wipeFlash * 0.9} style={{ filter: `drop-shadow(${nodeGlow(C.brand, 1)})` }} />
        )}
      </svg>
    </div>
  );
};

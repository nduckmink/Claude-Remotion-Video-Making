import { C, F, nodeGlow } from "../lib/tokens";

/**
 * BROWSER — khác hẳn server: một cửa sổ trình duyệt low-fi (chrome + address bar
 * + trang nội dung skeleton). Có LOADING khi đợi server trả về (thanh tiến trình
 * quét + spinner ở address bar), để thấy rõ "client đang chờ".
 */
export const BrowserUI: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  accent: string;
  loading?: number; // 0..1
  spin?: number; // độ, xoay spinner
  sweep?: number; // 0..1 vị trí thanh loading
  live?: number;
  opacity?: number;
}> = ({ x, y, w, h, accent, loading = 0, spin = 0, sweep = 0, live = 0, opacity = 1 }) => {
  const left = x - w / 2;
  const top = y - h / 2;
  const chromeH = 46;
  const barPad = 12;
  const addrH = 26;
  const on = loading > 0.02;
  const edge = live > 0.3 || on ? accent : C.line;

  const line = (lx: number, ly: number, lw: number, op = 1) => <rect x={lx} y={ly} width={lw} height={8} rx={4} fill={C.line} opacity={op} />;

  return (
    <div style={{ position: "absolute", left, top, width: w, height: h, borderRadius: 16, background: C.bgPanel, border: `2px solid ${edge}`, boxSizing: "border-box", opacity, overflow: "hidden", boxShadow: on ? nodeGlow(accent, loading * 0.6) : "none" }}>
      {/* chrome: 3 chấm + address bar */}
      <div style={{ height: chromeH, display: "flex", alignItems: "center", padding: `0 ${barPad}px`, gap: 10, borderBottom: `1px solid ${C.line}` }}>
        {["#E5533C", "#E5B33C", "#3CB85B"].map((c) => (
          <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c, opacity: 0.85 }} />
        ))}
        <div style={{ marginLeft: 6, flex: 1, height: addrH, borderRadius: 13, background: C.bg, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 8, padding: "0 10px" }}>
          {/* favicon: khoá khi rảnh, spinner khi loading */}
          <svg width={15} height={15} viewBox="-8 -8 16 16">
            {on ? (
              <circle cx={0} cy={0} r={6} fill="none" stroke={accent} strokeWidth={2.4} strokeDasharray="20 10" transform={`rotate(${spin})`} />
            ) : (
              <>
                <rect x={-4} y={-1} width={8} height={7} rx={1.5} fill="none" stroke={C.textDim} strokeWidth={1.5} />
                <path d="M -2.5 -1 L -2.5 -3 A 2.5 2.5 0 0 1 2.5 -3 L 2.5 -1" fill="none" stroke={C.textDim} strokeWidth={1.5} />
              </>
            )}
          </svg>
          <span style={{ fontFamily: F.mono, fontSize: 14, color: C.textDim, letterSpacing: "0.02em" }}>app.example.com</span>
        </div>
      </div>

      {/* thanh loading quét ngang (indeterminate) */}
      {on && (
        <div style={{ position: "relative", height: 3 }}>
          <div style={{ position: "absolute", top: 0, left: `${-30 + sweep * 130}%`, width: "30%", height: 3, background: accent, boxShadow: `0 0 8px ${accent}`, opacity: loading }} />
        </div>
      )}

      {/* trang nội dung — skeleton low-fi */}
      <svg width={w} height={h - chromeH} viewBox={`0 0 ${w} ${h - chromeH}`} style={{ display: "block", opacity: on ? 0.4 : 1 }}>
        {/* profile */}
        <circle cx={barPad + 24} cy={38} r={18} fill="none" stroke={C.line} strokeWidth={2} />
        {line(barPad + 54, 30, w * 0.4)}
        {line(barPad + 54, 46, w * 0.26, 0.6)}
        {/* cards */}
        {[0, 1].map((i) => {
          const cy = 82 + i * 62;
          return (
            <g key={i}>
              <rect x={barPad} y={cy} width={w - barPad * 2} height={52} rx={8} fill="none" stroke={C.line} strokeWidth={1.5} />
              {line(barPad + 14, cy + 16, w * 0.55)}
              {line(barPad + 14, cy + 32, w * 0.34, 0.6)}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

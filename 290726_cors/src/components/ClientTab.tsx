import { C, F, nodeGlow } from "../lib/tokens";

/**
 * TAB TRÌNH DUYỆT = một ORIGIN. `origin` là nhãn (app.com / evil.com). `evil` →
 * đỏ + có VÒI chọc ra (bơm dữ liệu lạ vào ống). CORS xoay quanh origin: server
 * chỉ nhận origin trong danh sách cho phép.
 */
export const ClientTab: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  origin: string;
  accent: string;
  evil?: boolean;
  live?: number;
  opacity?: number;
}> = ({ x, y, w, h, origin, accent, evil = false, live = 0, opacity = 1 }) => {
  const left = x - w / 2;
  const top = y - h / 2;
  const col = evil ? C.brand : accent;
  const chromeH = 40;
  return (
    <div style={{ position: "absolute", left, top, width: w, height: h, opacity }}>
      {/* tai tab */}
      <div style={{ position: "absolute", top: -22, left: 20, width: w * 0.5, height: 26, borderRadius: "8px 8px 0 0", background: C.bgPanel, border: `2px solid ${live > 0.3 || evil ? col : C.line}`, borderBottom: "none", display: "flex", alignItems: "center", padding: "0 10px", gap: 6, boxSizing: "border-box" }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: col }} />
        <span style={{ fontFamily: F.mono, fontSize: 13, color: C.textDim, whiteSpace: "nowrap", overflow: "hidden" }}>{origin}</span>
      </div>
      {/* thân */}
      <div style={{ width: w, height: h, borderRadius: "0 10px 10px 10px", background: C.bgPanel, border: `2px solid ${live > 0.3 || evil ? col : C.line}`, boxSizing: "border-box", boxShadow: evil || live > 0.3 ? nodeGlow(col, evil ? 0.6 : live) : "none", overflow: "hidden" }}>
        <div style={{ height: chromeH, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 7, padding: "0 12px" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 9, height: 9, borderRadius: 999, background: C.textFaint }} />
          ))}
        </div>
        {/* globe origin */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: h - chromeH, gap: 8 }}>
          <svg width={54} height={54} viewBox="-27 -27 54 54">
            <circle cx={0} cy={0} r={22} fill="none" stroke={col} strokeWidth={2.5} />
            <ellipse cx={0} cy={0} rx={9} ry={22} fill="none" stroke={col} strokeWidth={1.8} />
            <line x1={-22} y1={0} x2={22} y2={0} stroke={col} strokeWidth={1.8} />
            <line x1={-19} y1={-11} x2={19} y2={-11} stroke={col} strokeWidth={1.4} opacity={0.6} />
            <line x1={-19} y1={11} x2={19} y2={11} stroke={col} strokeWidth={1.4} opacity={0.6} />
            {evil && <line x1={-16} y1={-16} x2={16} y2={16} stroke={C.brand} strokeWidth={3} strokeLinecap="round" />}
          </svg>
          <span style={{ fontFamily: F.mono, fontSize: 17, color: evil ? C.brand : C.text, letterSpacing: "0.04em" }}>{origin}</span>
        </div>
      </div>
    </div>
  );
};

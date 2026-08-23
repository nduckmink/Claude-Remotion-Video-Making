import { C, F, nodeGlow } from "../lib/tokens";

/**
 * BẢNG — đơn vị duy nhất của SQL: vào là bảng, ra cũng là bảng.
 *
 * Header ghi TÊN CỘT + KIỂU: đó là schema, và là lý do dữ liệu sai kiểu bị từ
 * chối. Mỗi dòng có thể `dim` (bị WHERE loại) hoặc mang màu `group` (đã được
 * GROUP BY gom) — trạng thái nói bằng độ sáng/màu, không bằng chữ.
 */
export const Table: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  name: string;
  cols: { name: string; type: string; w: number }[];
  rows: string[][];
  rowH: number;
  headH: number;
  states?: { on: number; dim: number; group: number; flash: number }[];
  groupColors?: string[];
  accent: string;
  on?: number;
  grow?: number;
}> = ({ x, y, w, name, cols, rows, rowH, headH, states, groupColors = [], accent, on = 1, grow = 1 }) => {
  const h = headH + rows.length * rowH;
  const left = x - w / 2;
  const top = y - h / 2;
  const colX = (i: number) => cols.slice(0, i).reduce((s, c) => s + c.w, 0);

  return (
    <div style={{ position: "absolute", left, top, width: w, height: h, transform: `scale(${0.94 + 0.06 * grow})`, transformOrigin: "center", opacity: on }}>
      {/* nhãn tên bảng */}
      <div style={{ position: "absolute", left: 2, top: -26, fontFamily: F.mono, fontSize: 16, letterSpacing: "0.16em", color: accent, textTransform: "uppercase" }}>{name}</div>

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={1} y={1} width={w - 2} height={h - 2} rx={10} fill={C.bgPanel} stroke={C.line} strokeWidth={1.8} />
        {/* nền header */}
        <rect x={1} y={1} width={w - 2} height={headH} rx={10} fill="rgba(255,255,255,0.035)" />
        <line x1={1} y1={headH} x2={w - 1} y2={headH} stroke={C.lineLive} strokeWidth={1.6} />
        {/* vạch cột */}
        {cols.slice(1).map((_, i) => (
          <line key={i} x1={colX(i + 1)} y1={2} x2={colX(i + 1)} y2={h - 2} stroke={C.line} strokeWidth={1} />
        ))}
        {/* dòng */}
        {rows.map((_, r) => {
          const st = states?.[r];
          const gc = st && st.group >= 0 ? groupColors[st.group] : null;
          const ry = headH + r * rowH;
          return (
            <g key={r} opacity={(st?.on ?? 1) * (st?.dim ? 0.22 : 1)}>
              {gc && <rect x={2} y={ry + 2} width={w - 4} height={rowH - 4} rx={5} fill={gc} opacity={0.12} />}
              {gc && <rect x={3} y={ry + 4} width={5} height={rowH - 8} rx={2.5} fill={gc} />}
              {st && st.flash > 0.02 && <rect x={2} y={ry + 2} width={w - 4} height={rowH - 4} rx={5} fill={C.pass} opacity={0.18 * st.flash} />}
              {r > 0 && <line x1={2} y1={ry} x2={w - 2} y2={ry} stroke={C.line} strokeWidth={0.8} opacity={0.6} />}
            </g>
          );
        })}
      </svg>

      {/* chữ header */}
      {cols.map((c, i) => (
        <div key={c.name} style={{ position: "absolute", left: colX(i) + 14, top: 8, width: c.w - 20 }}>
          <div style={{ fontFamily: F.mono, fontSize: 15, color: C.text, whiteSpace: "nowrap" }}>{c.name}</div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textFaint, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{c.type}</div>
        </div>
      ))}

      {/* chữ ô */}
      {rows.map((row, r) => {
        const st = states?.[r];
        const gc = st && st.group >= 0 ? groupColors[st.group] : null;
        return (
          <div key={r} style={{ position: "absolute", left: 0, top: headH + r * rowH, width: w, height: rowH, opacity: (st?.on ?? 1) * (st?.dim ? 0.28 : 1), display: "flex", alignItems: "center" }}>
            {row.map((cell, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: colX(i) + 16,
                  fontFamily: F.mono,
                  fontSize: 16,
                  color: gc ?? C.text,
                  whiteSpace: "nowrap",
                  textShadow: st && st.flash > 0.3 ? nodeGlow(C.pass, st.flash) : undefined,
                }}
              >
                {cell}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

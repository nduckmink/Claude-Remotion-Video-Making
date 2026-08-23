import { C, F, nodeGlow } from "../lib/tokens";

/**
 * Câu SQL. Mệnh đề nào đang CHẠY thì sáng lên — và thứ tự sáng là thứ tự THỰC
 * THI (FROM/JOIN → WHERE → GROUP BY → SELECT), không phải thứ tự chữ viết ra.
 * Đó là thứ hầu hết người mới hiểu ngược.
 */
export const SqlCard: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  lines: string[];
  active: number[];
  accent: string;
  on?: number;
}> = ({ x, y, w, lines, active, accent, on = 1 }) => {
  const lh = 34;
  const h = lines.length * lh + 36;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: on, borderRadius: 12, background: C.bgPanel, border: `2px solid ${C.line}`, boxSizing: "border-box", padding: "18px 22px" }}>
      {lines.map((l, i) => {
        const hot = active.includes(i);
        return (
          <div key={i} style={{ position: "relative", height: lh, display: "flex", alignItems: "center" }}>
            {hot && (
              <div style={{ position: "absolute", left: -12, top: 2, width: w - 20, height: lh - 4, borderRadius: 6, background: accent, opacity: 0.14, boxShadow: nodeGlow(accent, 0.5) }} />
            )}
            <span style={{ position: "relative", fontFamily: F.mono, fontSize: 17, color: hot ? C.text : C.textDim, whiteSpace: "nowrap", letterSpacing: "0.01em" }}>{l}</span>
          </div>
        );
      })}
    </div>
  );
};

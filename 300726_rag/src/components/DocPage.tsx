import { C, F } from "../lib/tokens";

/**
 * TÀI LIỆU nguồn. Mỗi dòng là một chunk — khi bị xắt ra, dòng đó để lại một
 * KHE TRỐNG nét đứt: thấy ngay "đoạn này đã được đưa đi nhúng".
 */
export const DocPage: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  name: string;
  lines: string[];
  gone: boolean[];
  topicColor: string[];
  opacity?: number;
}> = ({ x, y, w, h, name, lines, gone, topicColor, opacity = 1 }) => {
  const barH = 38;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity, borderRadius: 12, background: C.bgPanel, border: `2px solid ${C.line}`, boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ height: barH, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", borderBottom: `1px solid ${C.line}` }}>
        <svg width={14} height={16} viewBox="0 0 14 16">
          <path d="M2 1 h6 l4 4 v10 h-10 z" fill="none" stroke={C.textDim} strokeWidth={1.6} />
          <path d="M8 1 v4 h4" fill="none" stroke={C.textDim} strokeWidth={1.6} />
        </svg>
        <span style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: "0.1em", color: C.textDim }}>{name}</span>
      </div>
      <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
        {lines.map((t, i) =>
          gone[i] ? (
            <div key={i} style={{ height: 16, borderRadius: 4, border: `1px dashed ${C.line}`, opacity: 0.5 }} />
          ) : (
            <div key={i} style={{ height: 16, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 3, height: 12, borderRadius: 2, background: topicColor[i], flex: "none" }} />
              <span style={{ fontFamily: F.mono, fontSize: 13, color: C.textDim, whiteSpace: "nowrap" }}>{t}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
};

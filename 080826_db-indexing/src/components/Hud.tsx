import { C, F, nodeGlow } from "../lib/tokens";

/**
 * Bảng số kiểu KHUNG GÓC — bốn nẹp ở bốn góc, không viền kín. Dùng cho con số
 * kể chuyện của scene (ở đây: ĐỘ SÂU HÀNG ĐỢI). Đổi sang `brand` khi vượt ngưỡng.
 */
export const Hud: React.FC<{
  x: number; // tâm
  y: number;
  w?: number;
  value: string;
  label: string;
  warn?: number; // 0..1
  accent?: string;
  opacity?: number;
}> = ({ x, y, w = 250, value, label, warn = 0, accent, opacity = 1 }) => {
  const h = 156;
  const col = warn > 0.15 ? C.brand : accent ?? C.pass;
  const b = 26; // độ dài nẹp góc

  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {[
          [2, 2, 1, 1],
          [w - 2, 2, -1, 1],
          [2, h - 2, 1, -1],
          [w - 2, h - 2, -1, -1],
        ].map(([cx, cy, sx, sy], i) => (
          <path
            key={i}
            d={`M ${cx + sx * b} ${cy} L ${cx} ${cy} L ${cx} ${cy + sy * b}`}
            fill="none"
            stroke={col}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ filter: warn > 0.15 ? `drop-shadow(${nodeGlow(C.brand, warn)})` : undefined }}
          />
        ))}
      </svg>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <span
          style={{
            fontFamily: F.title,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1,
            color: col,
            textShadow: warn > 0.15 ? nodeGlow(C.brand, warn) : undefined,
          }}
        >
          {value}
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: "0.16em", color: C.textDim, textTransform: "uppercase", textAlign: "center", lineHeight: 1.4, whiteSpace: "pre-line" }}>{label}</span>
      </div>
    </div>
  );
};

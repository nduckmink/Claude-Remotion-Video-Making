import { C, F, nodeGlow } from "../lib/tokens";

/**
 * HACKER — lục giác đỏ nguy hiểm (đúng quy ước đã dùng ở password-hashing).
 * Trong lòng có vạch hatch dày (nhiễu), và MỘT ô khoá bị GẠCH CHÉO (⊘): nó
 * KHÔNG có secret — đó là lý do nó sửa được payload nhưng ký lại thì trượt.
 * `live` = độ hung hãn (nhịp đập + glow), scene bơm vào.
 */
export const Hacker: React.FC<{
  x: number;
  y: number;
  size?: number;
  live?: number; // 0..1
  opacity?: number;
}> = ({ x, y, size = 150, live = 0, opacity = 1 }) => {
  const r = size / 2;
  const pts = Array.from({ length: 6 }).map((_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
  });
  const col = C.brand;
  return (
    <div style={{ position: "absolute", left: x - r - 20, top: y - r - 20, width: size + 40, height: size + 66, opacity }}>
      <svg width={size + 40} height={size + 40} viewBox={`${-r - 20} ${-r - 20} ${size + 40} ${size + 40}`} style={{ overflow: "visible" }}>
        <defs>
          <clipPath id="hexclip">
            <polygon points={pts.join(" ")} />
          </clipPath>
        </defs>
        <polygon points={pts.join(" ")} fill={C.bgPanel} stroke={col} strokeWidth={2.5 + 1.5 * live} style={{ filter: `drop-shadow(${nodeGlow(col, 0.5 + live)})` }} />
        {/* hatch nhiễu */}
        <g clipPath="url(#hexclip)" opacity={0.4 + 0.3 * live}>
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={-r + i * (size / 12)} y1={-r} x2={-r + i * (size / 12) - size} y2={r} stroke={col} strokeWidth={1} />
          ))}
        </g>
        {/* ô khoá bị gạch chéo — KHÔNG có secret */}
        <circle cx={0} cy={-4} r={19} fill="none" stroke={col} strokeWidth={2.5} />
        <line x1={-13} y1={-17} x2={13} y2={9} stroke={col} strokeWidth={2.5} strokeLinecap="round" />
      </svg>
      <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.16em", color: col, textAlign: "center", textTransform: "uppercase", marginTop: -14, textShadow: nodeGlow(col, 0.4 + live) }}>
        hacker
      </div>
    </div>
  );
};

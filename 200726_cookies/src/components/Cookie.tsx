import { C, F, nodeGlow } from "../lib/tokens";

/**
 * COOKIE — cái "vé" trình duyệt giữ. Hình bánh quy (đúng chủ đề, không cliché
 * ngẫu nhiên) + nhãn `sid=…` = CON SỐ, không phải dữ liệu thật (dữ liệu ở tủ
 * server). `dead` → hết hiệu lực (xám/đỏ) khi tủ bị xoá.
 */
const GOLD = "#D9A441";

export const Cookie: React.FC<{
  x: number;
  y: number;
  r?: number;
  label?: string;
  scale?: number;
  rot?: number;
  opacity?: number;
  glow?: number;
  dead?: number; // 0..1 hết hiệu lực
}> = ({ x, y, r = 30, label, scale = 1, rot = 0, opacity = 1, glow = 0, dead = 0 }) => {
  const col = dead > 0.5 ? C.textFaint : GOLD;
  const S = r * 2 + 20;
  const chips = [
    [-0.35, -0.3],
    [0.3, -0.15],
    [-0.1, 0.35],
    [0.4, 0.35],
    [-0.45, 0.15],
  ];
  return (
    <div style={{ position: "absolute", left: x - (S * scale) / 2, top: y - (S * scale) / 2, width: S, height: S, transform: `scale(${scale}) rotate(${rot}deg)`, transformOrigin: "center", opacity }}>
      <svg width={S} height={S} viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} style={{ overflow: "visible" }}>
        <circle cx={0} cy={0} r={r} fill={C.bgPanel} stroke={col} strokeWidth={3} style={{ filter: glow > 0.02 ? `drop-shadow(${nodeGlow(GOLD, glow)})` : `drop-shadow(0 0 6px ${col}55)` }} />
        {chips.map(([cx, cy], i) => (
          <circle key={i} cx={cx * r} cy={cy * r} r={r * 0.11} fill={col} />
        ))}
        {dead > 0.5 && <line x1={-r * 0.7} y1={-r * 0.7} x2={r * 0.7} y2={r * 0.7} stroke={C.brand} strokeWidth={3} strokeLinecap="round" />}
      </svg>
      {label && (
        <div style={{ position: "absolute", left: -20, top: S - 8, width: S + 40, textAlign: "center", fontFamily: F.mono, fontSize: 15, letterSpacing: "0.04em", color: dead > 0.5 ? C.textFaint : C.textDim, whiteSpace: "nowrap" }}>{label}</div>
      )}
    </div>
  );
};

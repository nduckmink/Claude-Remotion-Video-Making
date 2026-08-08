import { C, F, nodeGlow } from "../lib/tokens";

/** Lỗi nổ ra ở máy B — đỏ, giật một cái khi vừa hiện. */
export const Toast: React.FC<{
  x: number; // tâm
  y: number;
  text: string;
  shake?: number;
  opacity?: number;
}> = ({ x, y, text, shake = 0, opacity = 1 }) => {
  const w = 42 + text.length * 10.4;
  const h = 50;
  const dx = shake > 0.02 ? Math.sin(shake * 22) * 7 * shake : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2 + dx,
        top: y - h / 2,
        width: w,
        height: h,
        opacity,
        borderRadius: 10,
        background: C.bgPanel,
        border: `2px solid ${C.brand}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 14px",
        boxShadow: nodeGlow(C.brand, 0.4 + 0.6 * shake),
      }}
    >
      <svg width={16} height={16} viewBox="-8 -8 16 16" style={{ flex: "none" }}>
        <line x1={-5} y1={-5} x2={5} y2={5} stroke={C.brand} strokeWidth={2.6} strokeLinecap="round" />
        <line x1={5} y1={-5} x2={-5} y2={5} stroke={C.brand} strokeWidth={2.6} strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: F.mono, fontSize: 16, color: C.brand, whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
};

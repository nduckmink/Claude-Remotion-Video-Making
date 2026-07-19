import { C, F } from "../lib/tokens";

/**
 * Một CLAIM rơi vào phễu: `user:42`, `role:user`, `exp:2h`…
 * Chip nhỏ, có chấm màu định danh + nhãn mono đọc được. Rơi có xoay, có spring
 * (scene bơm x,y,rot,scale) — không trôi đơ.
 */
export const ClaimChip: React.FC<{
  x: number;
  y: number;
  label: string;
  color: string;
  scale?: number;
  rot?: number;
  opacity?: number;
}> = ({ x, y, label, color, scale = 1, rot = 0, opacity = 1 }) => {
  const w = 22 + label.length * 12.5;
  const h = 46;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `scale(${scale}) rotate(${rot}deg)`,
        transformOrigin: "center",
        opacity,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 14px",
        boxSizing: "border-box",
        borderRadius: 10,
        background: C.bgPanel,
        border: `1.5px solid ${C.line}`,
      }}
    >
      <span style={{ width: 11, height: 11, borderRadius: 999, background: color, boxShadow: `0 0 8px ${color}`, flex: "none" }} />
      <span style={{ fontFamily: F.mono, fontSize: 21, color: C.text, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
};

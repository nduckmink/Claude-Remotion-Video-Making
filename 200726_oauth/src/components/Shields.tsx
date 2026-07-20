import { C, nodeGlow } from "../lib/tokens";

/**
 * Các lớp KHIÊN DÀY — mỗi lớp là một vòng gần kín, chừa một KHE HẸP. Khe scattered
 * ⇒ không có đường thẳng vào (bảo vệ dày đặc). Đồng ý → mọi khe xoay về cùng góc
 * corridor ⇒ lộ ĐÚNG MỘT khe hẹp thẳng hàng, vừa đủ cho tàu chui qua.
 *
 * Màu: mỗi lớp một màu định danh. `red` → cả khối đỏ (bị bắn). `green` → xanh
 * (đã mở khe, drive↔tàu giao tiếp).
 */
export type Shield = { r: number; gapAng: number; gapSpan: number; color: string; red: number; green: number };

const P = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

export const Shields: React.FC<{
  cx: number;
  cy: number;
  shields: Shield[];
  opacity?: number;
}> = ({ cx, cy, shields, opacity = 1 }) => {
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity, overflow: "visible" }}>
      {shields.map((s, i) => {
        // cung PHỦ = 360 - khe, từ mép khe này vòng sang mép khe kia
        const a0 = s.gapAng + s.gapSpan / 2;
        const a1 = s.gapAng - s.gapSpan / 2 + 360;
        const p0 = P(cx, cy, s.r, a0);
        const p1 = P(cx, cy, s.r, a1);
        const col = s.green > 0.35 ? C.pass : s.red > 0.35 ? C.brand : s.color;
        const emph = Math.max(s.red, s.green);
        const w = 15;
        return (
          <path
            key={i}
            d={`M ${p0.x} ${p0.y} A ${s.r} ${s.r} 0 1 1 ${p1.x} ${p1.y}`}
            fill="none"
            stroke={col}
            strokeWidth={w + 3 * emph}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(${nodeGlow(col, 0.35 + 0.8 * emph)})` }}
          />
        );
      })}
    </svg>
  );
};

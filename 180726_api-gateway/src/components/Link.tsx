import { C } from "../lib/tokens";

/**
 * Một kết nối. Nằm trong <svg> chung của scene để mọi đường ở cùng một lớp,
 * dưới lớp node (node nền đục nên che được đầu đường chui vào nó).
 *
 * Ba trạng thái, ứng với trục "nét" trong style_guide.md:
 *   - solid, live  → kết nối có thật, đang chạy dữ liệu.
 *   - broken       → ĐỨT: dashed + màu accent + nhấp nháy. Cùng từ vựng với
 *                    đường-đáng-lẽ-nối ở pub/sub. Đây là chỗ DUY nhất đường
 *                    mang accent, vì đứt kết nối đúng là thứ đáng nhìn nhất.
 *   - draw 0→1     → đang vẽ ra (strokeDashoffset). Kết nối vừa được lập lại.
 */
export const Link: React.FC<{
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  live?: number;
  /** 0→1 độ hiện của cú ĐỨT. Bật lên là đường thành dashed accent nhấp nháy. */
  broken?: number;
  /** 0→1 vẽ ra. Chỉ dùng với solid. */
  draw?: number;
  opacity?: number;
  width?: number;
  color?: string;
}> = ({ x0, y0, x1, y1, live = 0, broken = 0, draw = 1, opacity = 1, width = 3, color }) => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const isBroken = broken > 0.02;
  const stroke = isBroken
    ? C.brand
    : color
      ? live > 0.02
        ? color
        : `${color}59`
      : live > 0.02
        ? C.lineLive
        : C.line;

  return (
    <line
      x1={x0}
      y1={y0}
      x2={x1}
      y2={y1}
      stroke={stroke}
      strokeWidth={width}
      strokeDasharray={isBroken ? "12 10" : draw < 1 ? len : undefined}
      strokeDashoffset={!isBroken && draw < 1 ? len * (1 - draw) : 0}
      opacity={isBroken ? opacity * broken : opacity}
    />
  );
};

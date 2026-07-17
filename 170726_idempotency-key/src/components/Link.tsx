import { C } from "../lib/tokens";

/**
 * Đường ống — hạ tầng, nên TRUNG TÍNH. Phải nằm trong <svg> chung của scene.
 *
 * Nó chạy suốt frontend → database ngay từ frame 0. Khối bcrypt lát nữa CHEN
 * VÀO giữa đường ống này chứ không đẻ ra đường mới — đó là lý do ô giữa được
 * đặt chỗ sẵn từ đầu.
 */
export const Link: React.FC<{
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** 0 = trơ, 1 = đang có dữ liệu chạy qua */
  live?: number;
  opacity?: number;
  width?: number;
  dashed?: boolean;
}> = ({ x0, y0, x1, y1, live = 0, opacity = 1, width = 3, dashed = false }) => (
  <line
    x1={x0}
    y1={y0}
    x2={x1}
    y2={y1}
    stroke={live > 0.02 ? C.lineLive : C.line}
    strokeWidth={width}
    strokeDasharray={dashed ? "10 10" : undefined}
    opacity={opacity}
  />
);

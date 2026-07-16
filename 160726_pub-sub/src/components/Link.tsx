import { C } from "../lib/tokens";

/**
 * Một kết nối, vẽ dưới dạng <line> — phải nằm trong <svg> chung của scene để
 * mọi đường ở CÙNG một lớp, dưới lớp node (node có nền đục nên che được đầu
 * đường chui vào nó).
 *
 * Hai chế độ, ứng với trục "nét" trong style_guide.md:
 *   - solid  → kết nối CÓ THẬT. `draw` 0→1 để vẽ ra (strokeDashoffset).
 *   - dashed → kết nối mới chỉ là TIỀM NĂNG: đáng lẽ phải có, nhưng chưa ai
 *              nối. Đây là chỗ duy nhất trong scene mà một cái ĐƯỜNG mặc accent.
 *
 * Đường này là thứ SVG vẽ; sim cho packet bay bằng chính toạ độ đó qua
 * pathAt() trong constants.ts — vẽ một đằng bay một nẻo là nói dối người xem.
 */
export const Link: React.FC<{
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** 0 = trơ, 1 = đang có dữ liệu chạy qua */
  live?: number;
  /** 0→1: đường đang được vẽ ra. Chỉ dùng với solid. */
  draw?: number;
  dashed?: boolean;
  opacity?: number;
  /** Màu định danh (V2). Không truyền → đơn sắc như V1. */
  color?: string;
  width?: number;
}> = ({
  x0,
  y0,
  x1,
  y1,
  live = 0,
  draw = 1,
  dashed = false,
  opacity = 1,
  color,
  width = 1.5,
}) => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const stroke = dashed
    ? C.accent
    : color
      ? live > 0.02
        ? color
        : `${color}59` // rỗi thì tối đi, đừng để màu sáng thường trực
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
      strokeDasharray={dashed ? "12 12" : len}
      strokeDashoffset={dashed ? 0 : len * (1 - draw)}
      opacity={opacity}
    />
  );
};

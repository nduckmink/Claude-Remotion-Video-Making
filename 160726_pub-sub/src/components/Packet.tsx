import { nodeGlow } from "../lib/tokens";

/**
 * Data unit đang bay — circle ĐẶC có glow. Đây là diễn viên.
 *
 * Packet trong scene này LUÔN trắng (`data`): tương phản 3-vs-1 do SỐ LƯỢNG
 * gánh, không do hue. Tô màu cho nó là để màu trượt thành phân loại.
 */
export const Packet: React.FC<{
  x: number;
  y: number;
  color: string;
  size?: number;
  opacity?: number;
}> = ({ x, y, color, size = 26, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: color,
      boxShadow: nodeGlow(color, 0.7),
      opacity,
    }}
  />
);

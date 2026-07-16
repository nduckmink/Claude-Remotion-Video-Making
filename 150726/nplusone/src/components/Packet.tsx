import { nodeGlow } from "../lib/tokens";

/**
 * Data unit đang bay — circle ĐẶC có glow. Đây là diễn viên.
 * Nó là thứ gần như duy nhất trong scene được mặc accent.
 */
export const Packet: React.FC<{
  x: number;
  y: number;
  size?: number;
  color: string;
  opacity?: number;
  /** ring mảnh bên ngoài — packet mang nhiều dữ liệu */
  ring?: boolean;
}> = ({ x, y, size = 30, color, opacity = 1, ring = false }) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: color,
      boxShadow: nodeGlow(color),
      opacity,
      outline: ring ? `2px solid ${color}66` : undefined,
      outlineOffset: ring ? 7 : undefined,
    }}
  />
);

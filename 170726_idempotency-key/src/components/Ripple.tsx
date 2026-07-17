/**
 * Ring nở ra rồi tan — một sự kiện vừa xảy ra tại đây.
 * `t` 0→1 là tiến độ của chính sự kiện đó, không phải một nhịp trang trí.
 */
export const Ripple: React.FC<{
  x: number;
  y: number;
  t: number;
  color: string;
  from?: number;
  to?: number;
  width?: number;
}> = ({ x, y, t, color, from = 20, to = 90, width = 3 }) => {
  if (t <= 0 || t >= 1) return null;
  const r = from + (to - from) * t;

  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: 999,
        border: `${width}px solid ${color}`,
        opacity: (1 - t) * 0.8,
      }}
    />
  );
};

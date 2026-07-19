import { C } from "../lib/tokens";

/**
 * Một tầng cache = một MÀNG TRAMPOLINE căng ngang cột.
 *
 * Đây là ẩn dụ lõi của cả video, và nó KHÔNG phải trang trí: "hứng được thì
 * bật về" với "rơi xuyên qua" là hai trạng thái vật lý khác hẳn, đọc ra ngay.
 *
 *   RÁCH  (taut≈0): dashed, mờ, có khe hở giữa — cache MISS, request rơi xuyên.
 *   CĂNG  (taut≈1): solid, sáng, mang màu định danh của tầng — cache HIT.
 *   VÕNG  (dip>0):  màng lún xuống chỗ request chạm rồi bật lên — cú nảy.
 *
 * Vẽ bằng <path> (pathLength/deform trên <rect> chết trong headless).
 */
export const Trampoline: React.FC<{
  x0: number;
  x1: number;
  y: number;
  /** 0 = rách (dashed mờ), 1 = căng (solid sáng). */
  taut: number;
  /** px màng võng xuống ở giữa khi hứng. */
  dip?: number;
  /** Vị trí x của chỗ võng (chỗ request chạm). Mặc định giữa. */
  dipX?: number;
  color: string;
  width?: number;
  opacity?: number;
}> = ({ x0, x1, y, taut, dip = 0, dipX, color, width = 3, opacity = 1 }) => {
  const cx = dipX ?? (x0 + x1) / 2;
  // Điểm điều khiển bezier bậc 2: để đỉnh võng chạm y+dip thì control ở y+2·dip.
  const ctrlY = y + 2 * dip;
  const path = `M ${x0} ${y} Q ${cx} ${ctrlY} ${x1} ${y}`;

  const solid = taut > 0.5;
  const stroke = solid ? color : C.line;
  // Rách: dashed thưa + khe hở giữa để đọc ra "thủng".
  const dash = solid ? undefined : "16 14";

  return (
    <svg
      width={x1 - x0 + 40}
      height={Math.max(60, dip * 2 + 40)}
      viewBox={`${x0 - 20} ${y - 30} ${x1 - x0 + 40} ${Math.max(60, dip * 2 + 40)}`}
      style={{ position: "absolute", left: x0 - 20, top: y - 30, opacity, overflow: "visible" }}
    >
      {/* Hai cọc neo hai đầu — màng bám vào khung. */}
      {[x0, x1].map((px) => (
        <line key={px} x1={px} y1={y - 12} x2={px} y2={y + 12} stroke={C.lineLive} strokeWidth={width} strokeLinecap="round" opacity={0.6} />
      ))}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dash}
        opacity={solid ? 1 : 0.5}
        style={solid ? { filter: `drop-shadow(0 0 ${8 + dip * 0.4}px ${color}aa)` } : undefined}
      />
    </svg>
  );
};

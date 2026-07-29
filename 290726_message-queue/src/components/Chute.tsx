import { C } from "../lib/tokens";

/**
 * MÁNG XẾP HÀNG = hàng đợi. Task rơi vào từ trên, dồn xuống đáy, worker lấy ở
 * ĐÁY (FIFO). Máng đầy tới đâu chính là ĐỘ SÂU HÀNG ĐỢI — không cần đọc số cũng
 * thấy đang dồn. Vạch tread chạy xuống cho ra chất "dây chuyền".
 */
export const Chute: React.FC<{
  x: number;
  topY: number;
  botY: number;
  width: number;
  tread?: number; // 0..1 pha chạy của vạch
  warn?: number; // 0..1 đang dồn việc
  opacity?: number;
}> = ({ x, topY, botY, width, tread = 0, warn = 0, opacity = 1 }) => {
  const left = x - width / 2;
  const right = x + width / 2;
  const col = warn > 0.15 ? C.brand : C.line;
  const step = 34;
  const n = Math.ceil((botY - topY) / step) + 1;

  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity, overflow: "visible" }}>
      {/* lòng máng */}
      <rect x={left} y={topY} width={width} height={botY - topY} fill="rgba(255,255,255,0.015)" />

      {/* hai ray */}
      <line x1={left} y1={topY} x2={left} y2={botY} stroke={col} strokeWidth={3} opacity={0.5 + 0.5 * warn} />
      <line x1={right} y1={topY} x2={right} y2={botY} stroke={col} strokeWidth={3} opacity={0.5 + 0.5 * warn} />

      {/* vạch tread chạy XUỐNG trên hai ray */}
      {Array.from({ length: n }).map((_, i) => {
        const ty = topY + ((i * step + tread * step) % (botY - topY));
        return (
          <g key={i} opacity={0.5}>
            <line x1={left - 9} y1={ty} x2={left} y2={ty} stroke={col} strokeWidth={2} />
            <line x1={right} y1={ty} x2={right + 9} y2={ty} stroke={col} strokeWidth={2} />
          </g>
        );
      })}

      {/* cửa ra ở ĐÁY — chỗ worker rút task */}
      <line x1={left - 12} y1={botY} x2={right + 12} y2={botY} stroke={warn > 0.15 ? C.brand : C.lineLive} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
};

import { C, F, nodeGlow } from "../lib/tokens";

/**
 * MÁY DẬP (producer) — đầu dập thụt xuống mỗi lần nhả ra một task. Nhịp dập
 * CHÍNH LÀ tần suất sinh việc: dập thưa = tải êm, dập dồn = cao điểm. Không cần
 * chữ "3 msg/s", mắt đọc ra ngay bằng nhịp.
 */
export const Press: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  punch?: number; // 0..1 đầu dập đi xuống
  accent: string;
  opacity?: number;
}> = ({ x, y, w, h, punch = 0, accent, opacity = 1 }) => {
  const left = x - w / 2;
  const top = y - h / 2;
  const ramDrop = 34 * punch;
  const hot = punch > 0.05;

  return (
    <div style={{ position: "absolute", left: left - 20, top: top - 26, width: w + 40, height: h + 96, opacity }}>
      <svg width={w + 40} height={h + 96} viewBox={`0 0 ${w + 40} ${h + 96}`} style={{ overflow: "visible" }}>
        {/* xà trên + hai trụ */}
        <rect x={20} y={26} width={w} height={26} rx={6} fill={C.bgPanel} stroke={hot ? accent : C.lineLive} strokeWidth={2.5} />
        <line x1={34} y1={52} x2={34} y2={26 + h} stroke={C.line} strokeWidth={4} />
        <line x1={20 + w - 14} y1={52} x2={20 + w - 14} y2={26 + h} stroke={C.line} strokeWidth={4} />

        {/* pit-tông + ĐẦU DẬP */}
        <line x1={20 + w / 2} y1={52} x2={20 + w / 2} y2={70 + ramDrop} stroke={C.textDim} strokeWidth={7} />
        <rect
          x={20 + w / 2 - 58}
          y={70 + ramDrop}
          width={116}
          height={40}
          rx={5}
          fill={C.bgPanel}
          stroke={hot ? accent : C.lineLive}
          strokeWidth={3}
          style={{ filter: hot ? `drop-shadow(${nodeGlow(accent, punch)})` : undefined }}
        />
        {/* răng dập */}
        {[-34, -12, 10, 32].map((dx) => (
          <rect key={dx} x={20 + w / 2 + dx - 4} y={110 + ramDrop} width={8} height={9} rx={1.5} fill={hot ? accent : C.textDim} />
        ))}

        {/* đe dưới — khe nhả task */}
        <rect x={20} y={26 + h} width={w} height={16} rx={4} fill={C.bgPanel} stroke={C.lineLive} strokeWidth={2.5} />
        <rect x={20 + w / 2 - 56} y={26 + h + 4} width={112} height={8} rx={4} fill={C.bg} />
      </svg>
      <div style={{ position: "absolute", left: 0, top: -2, width: w + 40, textAlign: "center", fontFamily: F.mono, fontSize: 17, letterSpacing: "0.16em", color: hot ? accent : C.textDim, textTransform: "uppercase" }}>
        producer
      </div>
    </div>
  );
};

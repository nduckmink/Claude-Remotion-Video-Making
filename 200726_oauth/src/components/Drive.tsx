import { C, F, nodeGlow } from "../lib/tokens";

/**
 * DRIVE ở TÂM — tài nguyên được các lớp khiên bảo vệ. Sáng xanh `pass` khi đã
 * cấp quyền (tên lửa vào tới nơi). Icon đơn giản (cái ổ/đĩa), không cầu kỳ.
 */
export const Drive: React.FC<{
  x: number;
  y: number;
  r?: number;
  granted?: number; // 0..1
  opacity?: number;
}> = ({ x, y, r = 96, granted = 0, opacity = 1 }) => {
  const col = granted > 0.02 ? C.pass : C.lineLive;
  const S = r * 2 + 20;
  return (
    <div style={{ position: "absolute", left: x - S / 2, top: y - S / 2, width: S, height: S, opacity }}>
      <svg width={S} height={S} viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} style={{ overflow: "visible" }}>
        <circle cx={0} cy={0} r={r} fill={C.bgPanel} stroke={col} strokeWidth={3} style={{ filter: granted > 0.02 ? `drop-shadow(${nodeGlow(C.pass, granted)})` : `drop-shadow(0 0 10px ${col}55)` }} />
        {granted > 0.02 && <circle cx={0} cy={0} r={r} fill={C.pass} opacity={0.08 * granted} />}
        {/* icon ổ đĩa: hình trụ */}
        <g stroke={col} strokeWidth={3} fill="none">
          <ellipse cx={0} cy={-20} rx={38} ry={13} />
          <path d={`M -38 -20 L -38 20 A 38 13 0 0 0 38 20 L 38 -20`} />
          <ellipse cx={0} cy={20} rx={38} ry={13} opacity={0.5} />
          <circle cx={0} cy={2} r={4} fill={col} stroke="none" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 0, top: S / 2 + r - 8, width: S, textAlign: "center", fontFamily: F.mono, fontSize: 18, letterSpacing: "0.14em", color: granted > 0.5 ? C.pass : C.textDim, textTransform: "uppercase" }}>your drive</div>
    </div>
  );
};

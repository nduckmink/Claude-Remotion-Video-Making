import { C, F, nodeGlow } from "../lib/tokens";

/**
 * NGƯỜI DÙNG ở một vùng địa lý — tên thành phố là thứ nói "họ ở XA nhau, và xa
 * origin". Sáng lên khi vừa gửi request / vừa nhận được file.
 */
export const UserNode: React.FC<{
  x: number;
  y: number;
  r?: number;
  city: string;
  accent: string;
  live?: number;
  opacity?: number;
}> = ({ x, y, r = 46, city, accent, live = 0, opacity = 1 }) => {
  const S = r * 2 + 20;
  const on = live > 0.35;
  const col = on ? accent : C.lineLive;
  return (
    <div style={{ position: "absolute", left: x - S / 2, top: y - S / 2, width: S, height: S, opacity }}>
      <svg width={S} height={S} viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} style={{ overflow: "visible" }}>
        <circle cx={0} cy={0} r={r} fill={C.bgPanel} stroke={col} strokeWidth={2.4} style={{ filter: on ? `drop-shadow(${nodeGlow(accent, live)})` : undefined }} />
        {/* màn hình nhỏ = thiết bị người dùng */}
        <rect x={-22} y={-17} width={44} height={30} rx={4} fill="none" stroke={col} strokeWidth={2.2} />
        <line x1={-10} y1={19} x2={10} y2={19} stroke={col} strokeWidth={2.2} strokeLinecap="round" />
        <line x1={0} y1={13} x2={0} y2={19} stroke={col} strokeWidth={2.2} />
      </svg>
      <div style={{ position: "absolute", left: -30, top: S - 6, width: S + 60, textAlign: "center", fontFamily: F.mono, fontSize: 16, letterSpacing: "0.1em", color: on ? accent : C.textDim, textTransform: "uppercase" }}>{city}</div>
    </div>
  );
};

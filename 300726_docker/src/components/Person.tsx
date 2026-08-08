import { C, F, nodeGlow } from "../lib/tokens";

/**
 * MỘT LẬP TRÌNH VIÊN ngồi sau màn hình: đầu + vai ở phía sau, màn hình che nửa
 * thân trước. Dưới chân là chip MÔI TRƯỜNG của máy đó — chỗ khác nhau giữa hai
 * máy chính là nguyên nhân của cả câu chuyện.
 * `envDim` = môi trường máy này hết quan trọng (vì cái hộp tự mang theo).
 */
export const Person: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  name: string;
  env: string[];
  accent: string;
  live?: number;
  envDim?: number;
  opacity?: number;
}> = ({ x, y, w, h, name, env, accent, live = 0, envDim = 0, opacity = 1 }) => {
  const on = live > 0.45;
  const col = on ? accent : C.lineLive;
  const headR = 25;
  const headY = 34;
  const shoulderY = 92;
  const monY = 104;
  const monH = 78;
  const monW = w - 40;

  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h + 86, opacity }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        {/* NGƯỜI phía sau: đầu ngồi ngay trên vai */}
        <g>
          <path d={`M ${w / 2 - 58} ${monY + 30} q 0 -${monY + 30 - shoulderY} 58 -${monY + 30 - shoulderY} q 58 0 58 ${monY + 30 - shoulderY}`} fill={C.bgPanel} stroke={col} strokeWidth={2.4} />
          <circle cx={w / 2} cy={headY} r={headR} fill={C.bgPanel} stroke={col} strokeWidth={2.4} />
        </g>

        {/* MÀN HÌNH che nửa thân trước */}
        <rect x={20} y={monY} width={monW} height={monH} rx={9} fill={C.bgPanel} stroke={col} strokeWidth={2.4} style={{ filter: on ? `drop-shadow(${nodeGlow(accent, live)})` : undefined }} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={36} y={monY + 16 + i * 16} width={(monW - 32) * (i === 1 ? 0.58 : 0.84)} height={5} rx={2.5} fill={on ? accent : C.textFaint} opacity={on ? 0.9 : 0.45} />
        ))}
        {/* chân đế + mặt bàn */}
        <path d={`M ${w / 2 - 14} ${monY + monH} l -4 12 h 36 l -4 -12`} fill="none" stroke={col} strokeWidth={2.2} />
        <line x1={12} y1={monY + monH + 13} x2={w - 12} y2={monY + monH + 13} stroke={C.line} strokeWidth={3.5} strokeLinecap="round" />
      </svg>

      <div style={{ position: "absolute", left: 0, top: monY + monH + 22, width: w, textAlign: "center", fontFamily: F.mono, fontSize: 16, letterSpacing: "0.16em", color: on ? accent : C.textDim, textTransform: "uppercase" }}>{name}</div>

      {/* chip môi trường của MÁY này */}
      <div style={{ position: "absolute", left: -14, top: monY + monH + 50, width: w + 28, display: "flex", justifyContent: "center", gap: 7, opacity: 1 - 0.72 * envDim }}>
        {env.map((e) => (
          <span key={e} style={{ fontFamily: F.mono, fontSize: 13, color: C.textDim, border: `1px solid ${C.line}`, borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap" }}>
            {e}
          </span>
        ))}
      </div>
    </div>
  );
};

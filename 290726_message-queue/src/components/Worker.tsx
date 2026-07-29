import { C, F, nodeGlow } from "../lib/tokens";

const rad = (d: number) => (d * Math.PI) / 180;
/** Cung tiến độ vẽ bằng <path> — `pathLength` trên <rect> chết trong headless. */
const arcPath = (cx: number, cy: number, r: number, p: number) => {
  if (p <= 0.001) return "";
  const a1 = -90 + 360 * Math.min(p, 0.9999);
  const x0 = cx + r * Math.cos(rad(-90));
  const y0 = cy + r * Math.sin(rad(-90));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 + 90 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

/**
 * WORKER (consumer) — rút task ở đáy máng rồi xử lý. Vòng cung ngoài là tiến độ
 * của task đang làm; bánh răng quay khi bận, đứng khi rỗi. Thêm một worker là
 * thêm một cỗ máy chạy song song — đó là toàn bộ cách chữa việc dồn hàng.
 */
export const Worker: React.FC<{
  x: number;
  y: number;
  r?: number;
  label: string;
  accent: string;
  present?: number; // 0..1 (worker phụ bung vào / rút đi)
  busy?: number;
  prog?: number;
  spin?: number; // độ, góc bánh răng
  opacity?: number;
}> = ({ x, y, r = 96, label, accent, present = 1, busy = 0, prog = 0, spin = 0, opacity = 1 }) => {
  const S = r * 2 + 40;
  const on = busy > 0.5;
  const col = on ? accent : C.lineLive;
  const teeth = 8;

  return (
    <div style={{ position: "absolute", left: x - S / 2, top: y - S / 2, width: S, height: S, transform: `scale(${0.6 + 0.4 * present})`, transformOrigin: "center", opacity: opacity * present }}>
      <svg width={S} height={S} viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} style={{ overflow: "visible" }}>
        {/* vành máy */}
        <circle cx={0} cy={0} r={r} fill={C.bgPanel} stroke={col} strokeWidth={2.5} style={{ filter: on ? `drop-shadow(${nodeGlow(accent, busy)})` : undefined }} />
        {/* cung TIẾN ĐỘ */}
        <circle cx={0} cy={0} r={r + 12} fill="none" stroke={C.line} strokeWidth={5} opacity={0.5} />
        {prog > 0.001 && <path d={arcPath(0, 0, r + 12, prog)} fill="none" stroke={accent} strokeWidth={5} strokeLinecap="round" style={{ filter: `drop-shadow(${nodeGlow(accent, 0.8)})` }} />}

        {/* bánh răng — quay khi bận */}
        <g transform={`rotate(${spin})`} opacity={on ? 1 : 0.55}>
          {Array.from({ length: teeth }).map((_, i) => {
            const a = (360 / teeth) * i;
            return <rect key={i} x={-7} y={-r * 0.62} width={14} height={16} rx={2} fill={col} transform={`rotate(${a})`} />;
          })}
          <circle cx={0} cy={0} r={r * 0.44} fill="none" stroke={col} strokeWidth={3} />
          <circle cx={0} cy={0} r={r * 0.14} fill={col} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 0, top: S - 4, width: S, textAlign: "center", fontFamily: F.mono, fontSize: 16, letterSpacing: "0.14em", color: on ? accent : C.textDim, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
};

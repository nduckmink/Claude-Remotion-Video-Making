import { C, F, nodeGlow } from "../lib/tokens";

/**
 * LLM — nó KHÔNG nhớ tài liệu. Nó chỉ nhận câu hỏi + mấy đoạn vừa lấy được rồi
 * viết câu trả lời. `fed` = đã nhận được bao nhiêu đoạn (ba ô ngữ cảnh sáng dần).
 */
export const Llm: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  present?: number;
  work?: number;
  fed?: number; // 0..1
  accent: string;
  opacity?: number;
}> = ({ x, y, w, h, present = 1, work = 0, fed = 0, accent, opacity = 1 }) => {
  const on = work > 0.05;
  const col = on ? accent : C.lineLive;
  const slots = 3;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `scale(${0.7 + 0.3 * present})`, transformOrigin: "center", opacity: opacity * present }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={14} fill={C.bgPanel} stroke={col} strokeWidth={2.4} style={{ filter: on ? `drop-shadow(${nodeGlow(accent, work)})` : undefined }} />
        {/* ba ô NGỮ CẢNH — sáng lên khi nhận được đoạn */}
        {Array.from({ length: slots }).map((_, i) => {
          const sw = (w - 60) / slots - 10;
          const sx = 30 + i * ((w - 60) / slots);
          const lit = fed > (i + 0.5) / slots ? 1 : 0;
          return <rect key={i} x={sx} y={20} width={sw} height={16} rx={5} fill="none" stroke={lit ? C.pass : C.line} strokeWidth={2} style={{ filter: lit ? `drop-shadow(0 0 8px ${C.pass})` : undefined }} />;
        })}
        {/* lưới "suy nghĩ" — nhấp nháy khi đang viết */}
        {Array.from({ length: 14 }).map((_, i) => {
          const bx = 30 + i * ((w - 60) / 13);
          const amp = on ? 0.3 + 0.7 * Math.abs(Math.sin(i * 1.3 + work * 6)) : 0.25;
          const bh = 8 + amp * 26;
          return <rect key={i} x={bx - 3} y={h - 26 - bh} width={6} height={bh} rx={3} fill={on ? accent : C.textFaint} opacity={on ? 0.5 + 0.5 * amp : 0.4} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 44, width: w, textAlign: "center", fontFamily: F.mono, fontSize: 17, letterSpacing: "0.18em", color: on ? accent : C.textDim, textTransform: "uppercase" }}>llm</div>
    </div>
  );
};

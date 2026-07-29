import { C, F, nodeGlow } from "../lib/tokens";

/**
 * TASK — một đơn vị việc. Màu là DANH TÍNH nên mọi task chung một màu; trạng
 * thái nói bằng ĐỘ SÁNG: chờ thì tối, đang xử lý thì sáng theo màu worker, xong
 * thì loé xanh `pass` rồi tan.
 */
export const TaskBlock: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  id: number;
  state: "wait" | "move" | "serve" | "done";
  tint: string; // màu worker đang xử lý
  prog?: number;
  scale?: number;
  opacity?: number;
}> = ({ x, y, w, h, id, state, tint, prog = 0, scale = 1, opacity = 1 }) => {
  const active = state === "move" || state === "serve";
  const col = state === "done" ? C.pass : active ? tint : C.lineLive;
  const dim = state === "wait" ? 0.82 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "center",
        opacity: opacity * dim,
      }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <rect
          x={2}
          y={2}
          width={w - 4}
          height={h - 4}
          rx={9}
          fill={C.bgPanel}
          stroke={col}
          strokeWidth={active || state === "done" ? 2.6 : 2}
          style={{ filter: active || state === "done" ? `drop-shadow(${nodeGlow(col, state === "done" ? 1 : 0.6)})` : undefined }}
        />
        {/* hoạ tiết: hai dòng "nội dung" + chấm trạng thái */}
        <rect x={16} y={h / 2 - 11} width={w * 0.42} height={5} rx={2.5} fill={C.textDim} opacity={0.75} />
        <rect x={16} y={h / 2 + 1} width={w * 0.26} height={5} rx={2.5} fill={C.textFaint} opacity={0.75} />
        <circle cx={w - 22} cy={h / 2} r={5} fill={col} opacity={state === "wait" ? 0.5 : 1} />
        {/* thanh tiến độ khi đang xử lý */}
        {state === "serve" && <rect x={2} y={h - 6} width={(w - 4) * prog} height={4} rx={2} fill={tint} />}
      </svg>
      <div style={{ position: "absolute", left: 12, top: -1, fontFamily: F.mono, fontSize: 12, color: C.textFaint, letterSpacing: "0.06em" }}>#{id}</div>
    </div>
  );
};

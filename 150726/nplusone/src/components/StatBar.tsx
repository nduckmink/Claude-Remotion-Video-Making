import { C, F, textGlow } from "../lib/tokens";

/** Mép phải scoreboard — khối 190..890 căn giữa trục, né action rail (x≥950). */
export const STAT_RIGHT = 890;

/**
 * Thanh đo + counter. Vừa là readout sống, vừa là bằng chứng nằm lại
 * để act sau đối chiếu.
 *
 * Chiều dài thanh TỶ LỆ THẲNG với ms — đó là toàn bộ lập luận của scene,
 * và là lý do bỏ được màu thứ hai: **độ dài không nói dối được**.
 */
export const StatBar: React.FC<{
  x: number;
  y: number;
  /** chiều dài hiện tại (px) */
  w: number;
  /** chiều dài rãnh (px) */
  track: number;
  h: number;
  label: string;
  queries: number;
  ms: number;
  /** 1 khi thanh đã khoá — số liệu sáng lên */
  locked?: number;
  opacity?: number;
}> = ({ x, y, w, track, h, label, queries, ms, locked = 0, opacity = 1 }) => {
  // Chưa chạy thì chưa có gì "đang xảy ra" → không được mặc accent.
  // Rọi đèn vào một số 0 là rò accent.
  const idle = ms < 0.5;
  return (
  <div style={{ position: "absolute", left: 0, top: y, opacity }}>
    <div
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: STAT_RIGHT - x,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        fontFamily: F.mono,
      }}
    >
      <span
        style={{
          fontSize: 22,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.textDim,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 22, letterSpacing: "0.12em", color: C.textDim }}>
        {`${queries} ${queries === 1 ? "QUERY" : "QUERIES"}`}
      </span>
      <span
        style={{
          fontSize: 44,
          color: idle ? C.textFaint : C.accent,
          textShadow: locked > 0.02 ? textGlow(C.accent) : "none",
        }}
      >
        {`${ms.toFixed(0)}ms`}
      </span>
    </div>

    <div
      style={{
        position: "absolute",
        left: x,
        top: 58,
        width: track,
        height: h,
        borderRadius: 999,
        backgroundColor: C.gridDim,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: x,
        top: 58,
        width: w,
        height: h,
        borderRadius: 999,
        backgroundColor: C.accent,
        boxShadow: `0 0 ${14 + 12 * locked}px ${C.accent}${locked > 0.5 ? "88" : "44"}`,
      }}
    />
  </div>
  );
};

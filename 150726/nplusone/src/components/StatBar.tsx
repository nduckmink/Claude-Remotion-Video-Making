import { C, F, textGlow } from "../lib/tokens";

/** Mép phải scoreboard — khối căn giữa trục, né action rail (x≥950). */
export const STAT_RIGHT = 890;

/**
 * Thanh đo + readout. Vừa là số liệu sống trong lúc chạy, vừa là bằng chứng
 * nằm lại để act sau đối chiếu.
 *
 * Chiều dài thanh TỶ LỆ THẲNG với đại lượng nó đo — đó là lý do bỏ được màu
 * thứ hai: **độ dài không nói dối được**.
 *
 * `live` do CALLER quyết, không phải component tự đoán: đây là luật đèn rọi,
 * và chỉ caller mới biết cái gì đang xảy ra lúc này.
 */
export const StatBar: React.FC<{
  x: number;
  y: number;
  /** chiều dài rãnh (px) */
  track: number;
  h: number;
  label: string;
  /** chữ giữa — ngữ cảnh (vd "9 QUERIES", "7 QUEUED") */
  note?: string;
  /** số lớn bên phải (vd "27ms", "75%") */
  value: string;
  /** 0..1 — phần rãnh được lấp */
  fill: number;
  /** luật đèn rọi: thứ này có ĐANG xảy ra không? */
  live?: boolean;
  /** 1 khi đã khoá — số liệu sáng lên */
  locked?: number;
  opacity?: number;
}> = ({
  x,
  y,
  track,
  h,
  label,
  note,
  value,
  fill,
  live = true,
  locked = 0,
  opacity = 1,
}) => (
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
        {note ?? ""}
      </span>
      <span
        style={{
          fontSize: 44,
          color: live ? C.accent : C.textFaint,
          textShadow: locked > 0.02 ? textGlow(C.accent) : "none",
        }}
      >
        {value}
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
        width: Math.max(0, Math.min(1, fill)) * track,
        height: h,
        borderRadius: 999,
        backgroundColor: live ? C.accent : C.textFaint,
        boxShadow: live
          ? `0 0 ${14 + 12 * locked}px ${C.accent}${locked > 0.5 ? "88" : "44"}`
          : "none",
      }}
    />
  </div>
);

import type { CSSProperties, ReactNode } from "react";
import { C, F } from "../lib/tokens";

/**
 * Thành phần hệ thống: rounded rect RỖNG. Hệ thống thì rỗng, dữ liệu thì đặc.
 *
 * Khung là SÂN KHẤU, không phải diễn viên — nó không bao giờ mặc accent.
 * Nó chỉ sáng lên (`line` → `lineLive`) khi đang tham gia.
 */
export const Node: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  sub?: string;
  /** 0 = rỗi, 1 = đang tham gia → viền sáng lên, KHÔNG đổi màu */
  live?: number;
  radius?: number;
  children?: ReactNode;
  style?: CSSProperties;
}> = ({ x, y, w, h, label, sub, live = 0, radius = 16, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: radius,
      border: `1.5px solid ${live > 0.02 ? C.lineLive : C.line}`,
      backgroundColor: C.bgPanel,
      ...style,
    }}
  >
    {label ? (
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 20,
          fontFamily: F.mono,
          fontSize: 30,
          letterSpacing: "0.14em",
          color: C.text,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    ) : null}
    {sub ? (
      <div
        style={{
          position: "absolute",
          right: 26,
          top: 26,
          fontFamily: F.mono,
          fontSize: 22,
          color: C.textDim,
        }}
      >
        {sub}
      </div>
    ) : null}
    {children}
  </div>
);

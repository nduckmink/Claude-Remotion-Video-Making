import type { ReactNode } from "react";
import { C, F, nodeGlow } from "../lib/tokens";

/**
 * Thành phần hệ thống: rounded rect RỖNG, viền TRUNG TÍNH.
 *
 * Trong scene này không station nào mang màu định danh — frontend, bcrypt,
 * database đều là HẠ TẦNG, và hạ tầng thì rỗng và không màu. Màu để dành cho
 * thứ chảy qua chúng: dữ liệu của từng người dùng.
 *
 * Nền ĐỤC (bgPanel) — thành phần nằm trên đường đi thì phải che được đường đi.
 * bgPanel phải sáng hơn bgLift, nếu không card thành cái lỗ giữa khung.
 */
export const Node: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  sub?: string;
  /** 0 = rỗi, 1 = đang tham gia → viền sáng lên (line → lineLive) */
  live?: number;
  /** 0→1: loé TRẮNG — vừa xong việc. Không ăn mừng. */
  flash?: number;
  /** 0→1: đèn rọi cam — CHỈ dùng cho khoảnh khắc HỎNG. */
  alarm?: number;
  radius?: number;
  opacity?: number;
  scale?: number;
  /** px lệch ngang — dùng cho cú RUNG khi node từ chối thứ gì đó. */
  dx?: number;
  labelSize?: number;
  subSize?: number;
  strokeWidth?: number;
  labelAtTop?: boolean;
  children?: ReactNode;
}> = ({
  x,
  y,
  w,
  h,
  label,
  sub,
  live = 0,
  flash = 0,
  alarm = 0,
  radius = 16,
  opacity = 1,
  scale = 1,
  dx = 0,
  labelSize = 24,
  subSize = 17,
  strokeWidth = 3,
  labelAtTop = false,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      opacity,
      transform:
        scale === 1 && dx === 0
          ? undefined
          : `translateX(${dx}px) scale(${scale})`,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        border: `${strokeWidth}px solid ${live > 0.02 ? C.lineLive : C.line}`,
        backgroundColor: C.bgPanel,
      }}
    />

    {flash > 0.005 ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          border: `${strokeWidth}px solid ${C.data}`,
          boxShadow: nodeGlow(C.data, flash * 0.8),
          opacity: flash,
        }}
      />
    ) : null}

    {alarm > 0.005 ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          border: `${strokeWidth * 2}px solid ${C.brand}`,
          boxShadow: nodeGlow(C.brand, alarm),
          opacity: alarm,
        }}
      />
    ) : null}

    {label ? (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: labelAtTop ? 18 : undefined,
          bottom: labelAtTop ? undefined : 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          padding: "0 10px",
        }}
      >
        <div
          style={{
            fontFamily: F.mono,
            fontSize: labelSize,
            letterSpacing: "0.06em",
            textIndent: "0.06em",
            color: C.text,
            textTransform: "uppercase",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
        {sub ? (
          <div
            style={{
              fontFamily: F.mono,
              fontSize: subSize,
              color: C.textDim,
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    ) : null}

    {children}
  </div>
);

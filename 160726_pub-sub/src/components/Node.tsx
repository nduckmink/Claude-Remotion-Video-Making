import type { ReactNode } from "react";
import { C, F, nodeGlow } from "../lib/tokens";

/**
 * Thành phần hệ thống: rect (hoặc tròn) RỖNG. Hệ thống thì rỗng, dữ liệu thì đặc.
 *
 * Nền ĐỤC (bgPanel) — luật "thành phần nằm trên đường đi thì phải che được
 * đường đi". Node trong suốt là để lộ ra "mấy hình vẽ chồng lên nhau".
 *
 * `live` sáng viền lên (line → lineLive) mà KHÔNG đổi màu: khung là sân khấu,
 * không phải diễn viên. `accent` là đèn rọi — chỉ bật khi node này đúng là thứ
 * quan trọng nhất frame đó, và tắt ngay khi tiêu điểm đi chỗ khác.
 *
 * Mọi prop thêm cho V2 đều có default giữ nguyên hành vi V1 — hai scene dùng
 * chung file này, sửa hỏng một cái là hỏng cả hai.
 */
export const Node: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  /** Dòng mô tả dưới nhãn — mono nhỏ, textDim. */
  sub?: string;
  /** 0 = rỗi, 1 = đang tham gia → viền sáng lên */
  live?: number;
  /** 0 = không, 1 = đèn rọi đầy: viền accent + glow */
  accent?: number;
  /** 0→1: loé TRẮNG — vừa nhận xong. Xong việc thì im, không ăn mừng. */
  flash?: number;
  /** Màu định danh (V2). Không truyền → viền đơn sắc như V1. */
  tint?: string;
  radius?: number;
  opacity?: number;
  scale?: number;
  labelSize?: number;
  subSize?: number;
  labelSpacing?: string;
  strokeWidth?: number;
  children?: ReactNode;
}> = ({
  x,
  y,
  w,
  h,
  label,
  sub,
  live = 0,
  accent = 0,
  flash = 0,
  tint,
  radius = 16,
  opacity = 1,
  scale = 1,
  labelSize = 30,
  subSize = 22,
  labelSpacing = "0.14em",
  strokeWidth = 1.5,
  children,
}) => {
  // Viền mang màu định danh khi đang tham gia; lúc rỗi vẫn đơn sắc để màu
  // không tụt xuống thành trang trí thường trực.
  const idle = tint ? `${tint}66` : C.line;
  const active = tint ?? C.lineLive;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity,
        transform: scale === 1 ? undefined : `scale(${scale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          border: `${strokeWidth}px solid ${live > 0.02 ? active : idle}`,
          backgroundColor: C.bgPanel,
        }}
      />

      {/* Loé trắng: xong việc. `data` chứ không phải accent — thành công thì im. */}
      {flash > 0.005 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            border: `${strokeWidth * 1.4}px solid ${tint ?? C.data}`,
            boxShadow: nodeGlow(tint ?? C.data, flash * 0.8),
            opacity: flash,
          }}
        />
      ) : null}

      {/* Đèn rọi chồng lên viền gốc — fade mượt thay vì bật/tắt cứng.
          Viền dày hơn đi kèm accent (trục "độ dày viền" — style_guide.md). */}
      {accent > 0.005 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            border: `${strokeWidth * 2}px solid ${C.accent}`,
            boxShadow: nodeGlow(C.accent, accent),
            opacity: accent,
          }}
        />
      ) : null}

      {label ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: sub ? 10 : 0,
            padding: "0 14px",
          }}
        >
          <div
            style={{
              fontFamily: F.mono,
              fontSize: labelSize,
              letterSpacing: labelSpacing,
              textIndent: labelSpacing, // letterSpacing đẩy chữ lệch trái nửa nhịp
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
};

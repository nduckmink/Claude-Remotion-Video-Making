import { C, F, nodeGlow } from "../lib/tokens";

/**
 * Một bản ghi mật khẩu — khối ĐẶC có chữ nằm trong. Đây là diễn viên.
 *
 * Đặc, không rỗng: "hệ thống thì rỗng, dữ liệu thì đặc" (style_guide.md).
 * Chữ khoét bằng màu nền — cùng thủ pháp với nắp phong bì ở video trước.
 *
 * MÀU LÀ DANH TÍNH: mỗi người dùng một màu, và màu đó theo bản ghi suốt
 * đường frontend → bcrypt → database → tay hacker. Nội dung thì đổi (mật khẩu
 * thành hash), người sở hữu thì không. Nhờ vậy hai người dùng gõ CÙNG một mật
 * khẩu vẫn nhìn ra là hai người — và lát nữa ra hai hash khác nhau.
 */
export const DataBlock: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  text: string;
  /** Số ký tự đã hiện — dùng cho hiệu ứng gõ ở frontend. */
  chars?: number;
  opacity?: number;
  scale?: number;
  rotate?: number;
  glow?: number;
}> = ({
  x,
  y,
  w,
  h,
  color,
  text,
  chars,
  opacity = 1,
  scale = 1,
  rotate = 0,
  glow = 0.5,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      borderRadius: 4,
      backgroundColor: color,
      boxShadow: glow > 0 ? nodeGlow(color, glow) : undefined,
      opacity,
      transform:
        scale === 1 && rotate === 0
          ? undefined
          : `scale(${scale}) rotate(${rotate}deg)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}
  >
    <span
      style={{
        fontFamily: F.mono,
        fontSize: 16,
        letterSpacing: "0.01em",
        color: C.bg,
        whiteSpace: "pre",
      }}
    >
      {chars === undefined ? text : text.slice(0, chars)}
    </span>
  </div>
);

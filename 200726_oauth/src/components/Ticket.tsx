import { C, F } from "../lib/tokens";

/**
 * CODE uỷ quyền — vé NGẮN HẠN, dùng MỘT LẦN. Viền nét đứt = "tạm/sẽ hết hạn",
 * khác hẳn token (chìa đặc). App đổi vé này lấy token qua kênh sau rồi vé tiêu.
 */
export const Ticket: React.FC<{
  x: number;
  y: number;
  label?: string;
  scale?: number;
  rot?: number;
  opacity?: number;
}> = ({ x, y, label = "code", scale = 1, rot = 0, opacity = 1 }) => {
  const w = 150;
  const h = 52;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `scale(${scale}) rotate(${rot}deg)`,
        transformOrigin: "center",
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        borderRadius: 10,
        background: C.bgPanel,
        border: `2px dashed ${C.textDim}`,
        boxSizing: "border-box",
      }}
    >
      <span style={{ fontFamily: F.mono, fontSize: 21, color: C.text, letterSpacing: "0.08em" }}>{label}</span>
      <span style={{ fontFamily: F.mono, fontSize: 12, color: C.textFaint, letterSpacing: "0.1em" }}>one-time</span>
    </div>
  );
};

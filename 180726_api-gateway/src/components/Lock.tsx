import { C } from "../lib/tokens";

/**
 * Ổ khoá auth — cái chốt kiểm "mày là ai" trên một kết nối.
 *
 * Vẽ bằng <path>, KHÔNG phải <rect> (pathLength trên rect chết trong headless).
 *
 * Đây là chỗ AUTH hiện thành hình. Đếm ổ khoá là đọc được luận điểm A: không
 * gateway thì mỗi service một ổ (auth lặp lại N lần); có gateway thì một ổ ở
 * cửa, trong nhà tin nhau.
 *
 * Xanh (`pass`) = qua. Cam (`brand`) = chặn. Xám (`line`) = chưa kiểm tới.
 * Xanh/đỏ là quy ước ai cũng đọc được ngay, không cần học — cùng cặp màu với
 * cuống vé ở video idempotency.
 */
export const Lock: React.FC<{
  x: number;
  y: number;
  r?: number;
  /** -1 = trơ (xám), 0→1 = đang kiểm (sáng), 2 = pass (xanh), 3 = reject (cam). */
  state: number;
  opacity?: number;
  /** 0→1: vừa được kiểm — pulse nhẹ. */
  pulse?: number;
  /** >1: ổ khoá to ra bền — mỗi update auth "tăng cường" một bậc. */
  scale?: number;
}> = ({ x, y, r: rBase = 22, state, opacity = 1, pulse = 0, scale = 1 }) => {
  const r = rBase * scale;
  const color =
    state >= 3 ? C.brand : state >= 2 ? C.pass : state >= 0 ? C.data : C.line;
  const s = r / 22;

  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        opacity,
        transform: pulse > 0.02 ? `scale(${1 + 0.18 * pulse})` : undefined,
      }}
    >
      {/* Nền đục để khoá che được đường chạy dưới nó — nó ngồi TRÊN kết nối. */}
      <div
        style={{
          position: "absolute",
          inset: r * 0.18,
          borderRadius: 999,
          backgroundColor: C.bgPanel,
          boxShadow:
            state >= 2 ? `0 0 ${16 * s}px ${color}88, 0 0 ${5 * s}px ${color}` : undefined,
        }}
      />
      <svg width={r * 2} height={r * 2} viewBox="0 0 44 44" style={{ position: "absolute", inset: 0 }}>
        {/* Quai khoá */}
        <path
          d="M15 20 L15 15 A7 7 0 0 1 29 15 L29 20"
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Thân khoá */}
        <path
          d="M13 20 L31 20 A2 2 0 0 1 33 22 L33 32 A2 2 0 0 1 31 34 L13 34 A2 2 0 0 1 11 32 L11 22 A2 2 0 0 1 13 20 Z"
          fill={state >= 2 ? `${color}33` : "none"}
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

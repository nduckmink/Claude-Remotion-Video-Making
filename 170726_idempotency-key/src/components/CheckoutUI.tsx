import { C, F, nodeGlow } from "../lib/tokens";
import { Spinner } from "./Spinner";

/**
 * UI thanh toán low-fi — client.
 *
 * KEY NẰM TRÊN ĐƠN HÀNG, không sinh ra lúc click. Đây là chỗ quan trọng nhất
 * của cả component: nếu mỗi cú click đẻ một key mới thì bốn click ra bốn key,
 * và key vô dụng. Ngoài đời người ta sai đúng chỗ này. Cho nó hiện sẵn cạnh
 * `order #1042` thì người xem thấy ngay vì sao bốn request cùng mang một key —
 * chúng chỉ NHẶT nó lên mang đi.
 */
export const CheckoutUI: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  order: string;
  amount: string;
  /** null = act 1, chưa có key. */
  idemKey: string | null;
  button: { x: number; y: number; w: number; h: number };
  /** 0→1: nút vừa bị bấm. */
  press?: number;
  /** Đang chờ hồi âm — spinner quay, chữ trên nút biến mất. */
  spinning?: number;
  spinRot?: number;
  strokeWidth?: number;
}> = ({
  x,
  y,
  w,
  h,
  order,
  amount,
  idemKey,
  button,
  press = 0,
  spinning = 0,
  spinRot = 0,
  strokeWidth = 3,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 16,
        border: `${strokeWidth}px solid ${C.line}`,
        backgroundColor: C.bgPanel,
      }}
    />

    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 30,
        textAlign: "center",
        fontFamily: F.mono,
        fontSize: 20,
        letterSpacing: "0.06em",
        color: C.textDim,
      }}
    >
      {order}
    </div>

    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 66,
        textAlign: "center",
        fontFamily: F.mono,
        fontSize: 52,
        letterSpacing: "-0.01em",
        color: C.text,
      }}
    >
      {amount}
    </div>

    {/* Pill vì "câu chữ trong hệ này sống trong pill" (style_guide.md). */}
    {idemKey ? (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 142,
          transform: "translateX(-50%)",
          padding: "6px 18px",
          borderRadius: 999,
          border: `2px solid ${C.lineLive}`,
          fontFamily: F.mono,
          fontSize: 19,
          color: C.text,
          whiteSpace: "nowrap",
        }}
      >
        {idemKey}
      </div>
    ) : null}

    {/* Nút: góc cạnh hơn card (bo 8) — nó là thứ để bấm, không phải chỗ chứa. */}
    <div
      style={{
        position: "absolute",
        left: button.x - x,
        top: button.y - y,
        width: button.w,
        height: button.h,
        borderRadius: 8,
        border: `${strokeWidth}px solid ${press > 0.02 ? C.data : C.lineLive}`,
        backgroundColor: press > 0.02 ? C.bgPanel : "transparent",
        boxShadow: press > 0.02 ? nodeGlow(C.data, press * 0.7) : undefined,
        transform: `scale(${1 - 0.03 * press})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {spinning > 0.02 ? null : (
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 26,
            letterSpacing: "0.1em",
            textIndent: "0.1em",
            textTransform: "uppercase",
            color: C.text,
          }}
        >
          purchase
        </span>
      )}
    </div>

    {spinning > 0.02 ? (
      <Spinner
        x={button.x - x + button.w / 2}
        y={button.y - y + button.h / 2}
        r={16}
        rot={spinRot}
        opacity={spinning}
      />
    ) : null}
  </div>
);

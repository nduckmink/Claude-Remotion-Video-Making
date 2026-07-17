import { C } from "../lib/tokens";

/**
 * Con trỏ chuột.
 *
 * Đây KHÔNG phải icon clipart theo nghĩa `creative_rule.md` cấm (robot, bóng
 * đèn, bánh răng vô nghĩa). Nó là chính cái cơ chế: người dùng đang tác động.
 * Bỏ nó đi thì không ai biết mấy cái request từ đâu ra.
 */
export const Cursor: React.FC<{
  x: number;
  y: number;
  /** 0→1: đang nhấn — mũi tên thụt lại một chút, như bấm thật. */
  press?: number;
  opacity?: number;
}> = ({ x, y, press = 0, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 0,
      height: 0,
      opacity,
      transform: `scale(${1 - 0.12 * press})`,
      transformOrigin: "0 0",
    }}
  >
    <svg width={34} height={44} viewBox="0 0 34 44" style={{ display: "block" }}>
      <path
        d="M2 2 L2 34 L10.5 26.5 L16 40 L22 37.5 L16.5 24.5 L27 24 Z"
        fill={C.data}
        stroke={C.bg}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

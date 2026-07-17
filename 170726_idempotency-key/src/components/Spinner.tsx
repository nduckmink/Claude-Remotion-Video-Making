import { C } from "../lib/tokens";

/**
 * Vòng quay "đang chờ" trên nút.
 *
 * Vẽ bằng <path>, KHÔNG phải <rect pathLength>: `pathLength` trên `<rect>`
 * không chạy trong Chrome headless — ra trắng trơn, không báo lỗi gì.
 * (Bẫy đã trả giá, ghi trong Resource/remotion_conventions.md.)
 *
 * Nó quay theo `frame`, và chính cái quay mãi không dứt là lý do người dùng
 * mất kiên nhẫn rồi spam. Spinner ở đây không phải trang trí — nó là ĐỘNG CƠ
 * của cú spam.
 */
export const Spinner: React.FC<{
  x: number;
  y: number;
  r: number;
  /** Góc quay, độ — sim tính, component chỉ vẽ. */
  rot: number;
  opacity?: number;
}> = ({ x, y, r, rot, opacity = 1 }) => {
  const arc = 0.72; // phần chu vi được vẽ
  const circ = 2 * Math.PI * r;

  return (
    <div
      style={{
        position: "absolute",
        left: x - r - 3,
        top: y - r - 3,
        width: (r + 3) * 2,
        height: (r + 3) * 2,
        opacity,
        transform: `rotate(${rot}deg)`,
      }}
    >
      <svg width={(r + 3) * 2} height={(r + 3) * 2} style={{ display: "block" }}>
        <path
          d={`M ${r + 3} 3 A ${r} ${r} 0 1 1 ${r + 3 - 0.01} 3`}
          fill="none"
          stroke={C.lineLive}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${circ * arc} ${circ}`}
        />
      </svg>
    </div>
  );
};

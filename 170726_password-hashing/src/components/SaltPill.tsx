import { C, F } from "../lib/tokens";

/**
 * Một hạt salt đang rơi vào bản ghi trước khi búa gõ.
 *
 * Pill (bo 999) vì trong hệ này **câu chữ sống trong pill** (style_guide.md).
 * Mỗi hạt mang một giá trị KHÁC NHAU — đó chính là việc của salt, và là lý do
 * hai người dùng gõ cùng một mật khẩu vẫn ra hai hash khác nhau. Hạt giống
 * nhau thì salt vô nghĩa, nên giá trị phải nhìn thấy được.
 */
export const SaltPill: React.FC<{
  x: number;
  y: number;
  value: string;
  opacity?: number;
  scale?: number;
}> = ({ x, y, value, opacity = 1, scale = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x - 34,
      top: y - 14,
      width: 68,
      height: 28,
      borderRadius: 999,
      border: `2px solid ${C.lineLive}`,
      backgroundColor: C.bgPanel,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: F.mono,
      fontSize: 15,
      color: C.text,
      opacity,
      transform: scale === 1 ? undefined : `scale(${scale})`,
    }}
  >
    {value}
  </div>
);

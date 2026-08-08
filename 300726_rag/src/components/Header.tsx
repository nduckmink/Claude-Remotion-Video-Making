import { BRAND, C, F } from "../lib/tokens";

// Vùng header cố định — Resource/scene_composition.md
export const HEADER = {
  handleY: 100,
  titleY: 142,
  hairlineY: 270,
  stageY: 310,
} as const;

const centered = {
  position: "absolute",
  left: 0,
  width: "100%",
  textAlign: "center",
} as const;

/**
 * Header block — HAI dòng: handle + title. Title mang màu `brand`.
 *
 * Cam ở đây là CHỮ KÝ CỦA KÊNH, không phải lời chỉ đường: nó nằm đúng một
 * chỗ, đúng một cỡ, trong mọi video. Nó không tranh việc với cam dưới stage
 * vì hai thứ khác nhau ở CHUYỂN ĐỘNG chứ không ở màu — header tĩnh tuyệt đối,
 * nên cam nào nhúc nhích thì cam đó là cơ chế.
 *
 * Hệ quả: TUYỆT ĐỐI không cho title nhấp nháy / breathe / sweep. Mất cái tĩnh
 * là mất luôn thứ phân biệt hai vai.
 */
export const Header: React.FC<{ title: string }> = ({ title }) => (
  <>
    <div
      style={{
        ...centered,
        top: HEADER.handleY,
        fontFamily: F.mono,
        fontSize: 22,
        color: C.textFaint,
        letterSpacing: "0.04em",
      }}
    >
      {BRAND.handle}
    </div>

    <div
      style={{
        ...centered,
        top: HEADER.titleY,
        fontFamily: F.title,
        fontSize: 76,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: C.brand,
      }}
    >
      {title}
    </div>

    <div
      style={{
        position: "absolute",
        left: 0,
        top: HEADER.hairlineY,
        width: "100%",
        height: 1,
        backgroundColor: C.line,
      }}
    />
  </>
);

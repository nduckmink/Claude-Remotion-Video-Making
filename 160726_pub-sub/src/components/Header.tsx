import { BRAND, C, F } from "../lib/tokens";

// Vùng header cố định — Resource/scene_composition.md
// Căn GIỮA trên trục x=540: 9:16 chỉ có một sống lưng dọc, và trục dòng chảy
// của stage nằm trên đó. Hai trục là connector bị đẩy lệch để né chữ.
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
 * Header block — HAI dòng: handle + title. Tĩnh hoàn toàn, đơn sắc.
 *
 * ĐƠN SẮC: accent không bao giờ lên header. Thứ cam đầu tiên người xem thấy
 * phải là cơ chế, không phải cái tên video.
 *
 * KHÔNG hook, KHÔNG eyebrow, KHÔNG số tập. Muốn thêm chữ vào đây = dấu hiệu
 * stage kể chưa đủ rõ. Sửa stage.
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
        color: C.text,
      }}
    >
      {title}
    </div>

    {/* hairline tràn mép — tách title block khỏi bản vẽ */}
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

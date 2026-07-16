import { BRAND, C, F } from "../lib/tokens";

// Vùng header cố định — Resource/scene_composition.md
// Căn GIỮA trên trục x=540: 9:16 chỉ có một sống lưng dọc, và stage nằm trên đó.
export const HEADER = {
  handleY: 100,
  eyebrowY: 142,
  titleY: 190,
  hairlineY: 330,
  stageY: 370,
} as const;

const centered = {
  position: "absolute",
  left: 0,
  width: "100%",
  textAlign: "center",
} as const;

/**
 * Header block — BẮT BUỘC trên mọi video. Ba dòng, tĩnh hoàn toàn.
 *
 * ĐƠN SẮC: accent không bao giờ lên header. Thứ cam đầu tiên người xem
 * thấy phải là cơ chế, không phải cái tên. Phân cấp do ba bậc sáng lo.
 *
 * KHÔNG có dòng hook, KHÔNG đánh số tập. Aha moment thuộc về animation —
 * viết nó thành câu ở giây 0 là spoil chính mình, và là chữ giành việc của hình.
 */
export const Header: React.FC<{
  /** cặp tương phản — vế đang chạy sáng 100%, vế kia mờ 30% */
  left: string;
  right: string;
  /** 0 = vế trái đang chạy, 1 = vế phải đang chạy */
  side: number;
  title: string;
}> = ({ left, right, side, title }) => (
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

    {/* eyebrow = đồng hồ báo giai đoạn, không phải chữ trang trí */}
    <div
      style={{
        ...centered,
        top: HEADER.eyebrowY,
        display: "flex",
        justifyContent: "center",
        gap: 18,
        fontFamily: F.mono,
        fontSize: 28,
        textTransform: "uppercase",
        letterSpacing: "0.25em",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: C.text, opacity: 1 - side * 0.7 }}>{left}</span>
      <span style={{ color: C.textFaint }}>vs</span>
      <span style={{ color: C.text, opacity: 0.3 + side * 0.7 }}>{right}</span>
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

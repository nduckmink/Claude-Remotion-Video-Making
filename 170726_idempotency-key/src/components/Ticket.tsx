import { C, F, nodeGlow } from "../lib/tokens";

export type StubKind = "attached" | "new" | "used";

/**
 * VÉ — thân vé + cuống vé.
 *
 * Ẩn dụ đúng nhất của cả kênh, vì nó KHÔNG phải ẩn dụ: xé vé giữ cuống chính
 * là cách con người làm idempotency từ trước khi có máy tính. Cuống đã xé rồi
 * thì vé đó không dùng lại được — không cần giải thích một chữ nào.
 *
 * Cuống CHÍNH LÀ key. Vé không cuống = request không key: chẳng có gì để đối
 * chiếu, nên lần nào tới cũng được tính là mới.
 *
 * Xé (`torn` 0→1) là CÚ KIỂM, nhìn thấy được. Cuống xanh = key mới, giữ lại.
 * Cuống đỏ = key này xé rồi, vé vô giá trị.
 */
export const Ticket: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  text: string;
  /** null = vé KHÔNG cuống (act 1: không có key). */
  stub: { text: string; kind: StubKind } | null;
  stubW?: number;
  /** 0 = liền, 1 = cuống rời hẳn ra. */
  torn?: number;
  opacity?: number;
  glow?: number;
}> = ({ x, y, w, h, color, text, stub, stubW = 58, torn = 0, opacity = 1, glow = 0.4 }) => {
  const bodyW = stub ? w - stubW - 4 : w;
  const left = x - w / 2;
  const stubColor =
    stub?.kind === "new" ? C.pass : stub?.kind === "used" ? C.brand : color;

  return (
    <div style={{ position: "absolute", left, top: y - h / 2, width: w, height: h, opacity }}>
      {/* Thân vé */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: bodyW,
          height: h,
          borderRadius: 4,
          backgroundColor: color,
          boxShadow: glow > 0 ? nodeGlow(color, glow) : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontSize: 15,
          color: C.bg,
          whiteSpace: "pre",
        }}
      >
        {text}
      </div>

      {stub ? (
        <>
          {/* Đường răng cưa — chỗ vé SẼ bị xé. Đứt nét vì nó là ranh giới,
              không phải vật thể (trục "nét" trong style_guide.md). */}
          <div
            style={{
              position: "absolute",
              left: bodyW + 1,
              top: 3,
              width: 2,
              height: h - 6,
              opacity: 1 - torn,
              backgroundImage: `repeating-linear-gradient(to bottom, ${C.bg} 0 3px, transparent 3px 6px)`,
            }}
          />
          {/* Cuống vé — rời ra khi bị xé */}
          <div
            style={{
              position: "absolute",
              left: bodyW + 4 + torn * 22,
              top: 0,
              width: stubW,
              height: h,
              borderRadius: 4,
              backgroundColor: stubColor,
              boxShadow: torn > 0.5 ? nodeGlow(stubColor, torn * 0.9) : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.mono,
              fontSize: 14,
              color: C.bg,
              transform: `rotate(${torn * 6}deg)`,
            }}
          >
            {stub.text}
          </div>
        </>
      ) : null}
    </div>
  );
};

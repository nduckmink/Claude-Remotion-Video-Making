import { C, F } from "../lib/tokens";

/**
 * Hacker — lục giác ĐẶC, màu `brand`.
 *
 * Cam vì nó LÀ cú hỏng, không phải vì cam nghĩa là "xấu". Nó là thứ cam duy
 * nhất động trên stage, nên không lẫn với title cam đứng yên trên hairline.
 *
 * NHÃN thì có, ICON thì không. Hai thứ khác nhau: nhãn GỌI TÊN (đúng việc của
 * nhãn, và mọi node khác trong scene đều có một cái), còn mặt trùm hoodie là
 * clipart cliché mà `creative_rule.md` xếp cùng chỗ với robot và bóng đèn.
 * Khối này là thứ duy nhất trong khung không có tên thì đó là thiếu nhất quán,
 * không phải kỷ luật.
 */
export const Hexagon: React.FC<{
  x: number;
  y: number;
  r: number;
  label?: string;
  opacity?: number;
  /** 0→1: vừa húc trúng — viền dày lên và glow mạnh. */
  impact?: number;
  rotate?: number;
}> = ({ x, y, r, label, opacity = 1, impact = 0, rotate = 0 }) => {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2; // đỉnh nhọn hướng LÊN — nó húc lên
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`;
  }).join(" ");

  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        opacity,
        transform: rotate === 0 ? undefined : `rotate(${rotate}deg)`,
        filter: `drop-shadow(0 0 ${18 + 26 * impact}px ${C.brand}${impact > 0.5 ? "cc" : "77"})`,
      }}
    >
      <svg width={r * 2} height={r * 2} style={{ display: "block" }}>
        <polygon
          points={pts}
          fill={C.brand}
          stroke={C.data}
          strokeWidth={2 + 4 * impact}
          strokeLinejoin="round"
        />
      </svg>

      {/* Chữ XOAY NGƯỢC lại đúng bằng góc thân — thân là mũi tên nên phải quay
          theo hướng bay, còn chữ thì luôn phải đọc được. Quên bù là cái tên
          nằm nghiêng theo cú húc. */}
      {label ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: rotate === 0 ? undefined : `rotate(${-rotate}deg)`,
            fontFamily: F.mono,
            fontSize: 20,
            letterSpacing: "0.08em",
            textIndent: "0.08em",
            textTransform: "uppercase",
            color: C.bg,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

import { C, F, nodeGlow } from "../lib/tokens";

/**
 * CON DẤU KÝ = secret key. Sợi chỉ xuyên suốt: đóng dấu lúc đúc, kiểm lúc dùng,
 * và là thứ HACKER KHÔNG CÓ.
 *
 * Vẽ như một khối die vuông bo góc, trong lòng là "răng khoá" (bitting) — lưới
 * 3×3 ô, vài ô đặc theo một mẫu cố định = bí mật. Sáng xanh `pass` khi đang ký.
 * `press` kéo con dấu chúc xuống (đè lên token) — scene bơm bằng spring.
 */
const BIT = [1, 0, 1, 0, 1, 1, 1, 0, 0]; // mẫu răng khoá cố định
const S = 74;

export const Seal: React.FC<{
  x: number;
  y: number;
  active?: number; // 0..1 độ sáng khi ký/kiểm
  press?: number; // px chúc xuống
  scale?: number;
  opacity?: number;
  label?: string;
}> = ({ x, y, active = 0, press = 0, scale = 1, opacity = 1, label = "secret" }) => {
  const col = active > 0.02 ? C.pass : C.textDim;
  return (
    <div style={{ position: "absolute", left: x - S / 2, top: y - S / 2 + press, transform: `scale(${scale})`, transformOrigin: "center", opacity }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ overflow: "visible" }}>
        <rect x={5} y={5} width={S - 10} height={S - 10} rx={12} fill={C.bgPanel} stroke={col} strokeWidth={2.5} style={{ filter: active > 0.02 ? `drop-shadow(${nodeGlow(C.pass, active)})` : undefined }} />
        {/* răng khoá 3×3 */}
        {BIT.map((on, i) => {
          const r = Math.floor(i / 3);
          const c = i % 3;
          const cell = (S - 26) / 3;
          return (
            <rect
              key={i}
              x={13 + c * cell + 3}
              y={13 + r * cell + 3}
              width={cell - 6}
              height={cell - 6}
              rx={2}
              fill={on ? col : "none"}
              stroke={on ? "none" : C.line}
              strokeWidth={1.2}
              opacity={on ? 0.5 + 0.5 * active : 0.6}
            />
          );
        })}
      </svg>
      <div style={{ fontFamily: F.mono, fontSize: 13, letterSpacing: "0.1em", color: active > 0.02 ? C.pass : C.textFaint, textAlign: "center", textTransform: "uppercase", marginTop: 3 }}>
        {label}
      </div>
    </div>
  );
};

import { barcode } from "../lib/anim";
import { C, F, nodeGlow } from "../lib/tokens";

/**
 * Khối JWT — pill BA ĐỐT: `header . payload . signature`.
 *
 *   header    — thuật toán ký (nhỏ, hoạ tiết chấm).
 *   payload   — claim ĐỌC ĐƯỢC (role:user…). Không mã hoá, chỉ được ký.
 *   signature — MÃ VẠCH băm từ payload lúc đóng dấu. Sửa payload thì lộ.
 *
 * QUAN TRỌNG (bài học jitter): KHÔNG dùng `transformBox: fill-box` /
 * `transformOrigin` kiểu CSS trên <text>/<g> SVG — khi token xoay, browser đo
 * lại bbox chữ mỗi frame → chữ NHÁY LOẠN. Vỡ token thì dùng `transform`
 * attribute native của SVG (user units, tâm xoay chỉ định rõ) — tất định, không nháy.
 */
const W = 328;
const H = 96;
const SEG = [0, 60, 216, W]; // ranh giới header|payload|signature
const NBAR = 9;
const CENTER = [SEG[1] / 2, (SEG[1] + SEG[2]) / 2, (SEG[2] + SEG[3]) / 2]; // tâm mỗi đốt

export const Token: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rot?: number; // độ
  payload: string;
  ownSig: string;
  seal?: number;
  tamper?: number;
  shatter?: number;
  verdict?: "none" | "pass" | "reject";
  opacity?: number;
}> = ({ x, y, scale = 1, rot = 0, payload, ownSig, seal = 1, tamper = 0, shatter = 0, verdict = "none", opacity = 1 }) => {
  const bars = barcode(ownSig, NBAR);
  const edge = verdict === "pass" ? C.pass : verdict === "reject" ? C.brand : C.lineLive;
  const sigColor = verdict === "pass" ? C.pass : verdict === "reject" ? C.brand : "#D9B24A";
  const glowF = verdict === "pass" ? `drop-shadow(${nodeGlow(C.pass, 1)})` : verdict === "reject" ? `drop-shadow(${nodeGlow(C.brand, 1.2)})` : undefined;
  const payColor = tamper > 0.02 ? C.brand : C.text;
  const bh = 46;

  // Vỡ: mỗi đốt tách ra, xoay quanh tâm ĐỐT — dùng transform attribute SVG.
  const piece = (i: number) => {
    if (shatter <= 0) return undefined;
    const dir = [-1, 0, 1][i];
    return `translate(${dir * 90 * shatter} ${40 * shatter * shatter}) rotate(${dir * 22 * shatter} ${CENTER[i]} ${H / 2})`;
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x - (W * scale) / 2,
        top: y - (H * scale) / 2,
        width: W,
        height: H,
        transform: `scale(${scale}) rotate(${rot}deg)`,
        transformOrigin: "center",
        opacity,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* ── HEADER ── */}
        <g transform={piece(0)}>
          <rect x={2} y={2} width={SEG[1] - 4} height={H - 4} rx={13} fill={C.bgPanel} stroke={edge} strokeWidth={2} style={{ filter: glowF }} />
          {[0, 1, 2].map((rr) => [0, 1].map((c) => <circle key={`${rr}-${c}`} cx={20 + c * 20} cy={30 + rr * 18} r={2.4} fill={C.textDim} />))}
        </g>

        {/* ── PAYLOAD (đọc được) ── */}
        <g transform={piece(1)}>
          <rect x={SEG[1] + 2} y={2} width={SEG[2] - SEG[1] - 4} height={H - 4} fill={C.bgPanel} stroke={edge} strokeWidth={2} />
          <text x={(SEG[1] + SEG[2]) / 2} y={H / 2 - 8} textAnchor="middle" fontFamily={F.mono} fontSize={22} fill={payColor}>
            {payload}
          </text>
          <text x={(SEG[1] + SEG[2]) / 2} y={H / 2 + 20} textAnchor="middle" fontFamily={F.mono} fontSize={13} fill={C.textFaint}>
            payload
          </text>
        </g>

        {/* ── SIGNATURE (mã vạch) ── */}
        <g transform={piece(2)}>
          <rect x={SEG[2] + 2} y={2} width={SEG[3] - SEG[2] - 4} height={H - 4} rx={13} fill={C.bgPanel} stroke={edge} strokeWidth={2} style={{ filter: glowF }} />
          {bars.map((v, i) => {
            const bw = (SEG[3] - SEG[2] - 20) / NBAR;
            const hgt = bh * v * seal;
            return <rect key={i} x={SEG[2] + 10 + i * bw + 1} y={H / 2 + bh / 2 - hgt} width={bw - 2} height={hgt} rx={1.5} fill={sigColor} opacity={0.55 + 0.45 * seal} />;
          })}
        </g>

        {/* dấu "." ngăn đốt — đọc ra cấu trúc a.b.c */}
        {shatter <= 0 &&
          [SEG[1], SEG[2]].map((sx) => (
            <text key={sx} x={sx} y={H / 2 + 8} textAnchor="middle" fontFamily={F.mono} fontSize={26} fill={C.textDim}>
              .
            </text>
          ))}
      </svg>
    </div>
  );
};

import { C } from "../lib/tokens";

/**
 * PHỄU ĐÚC — gom các claim rơi vào miệng, khuấy ở cổ, nhả JWT ra đáy.
 *
 * Không phải cái hộp: thành phễu là hai đường chéo hội tụ, trong lòng có các
 * đường dẫn hướng cùng chụm về cổ, và một xoáy quay đều ở cổ (guồng đang chạy).
 * Xoáy quay LIÊN TỤC = "máy vẫn sống" cả lúc rỗi; sáng lên khi đang nuốt claim.
 */
export const Funnel: React.FC<{
  cx: number; // tâm miệng phễu (x)
  top: number; // y miệng
  mouthW: number;
  neckW: number;
  height: number;
  glow?: number; // 0..1 độ sáng khi đang nuốt
  opacity?: number;
}> = ({ cx, top, mouthW, neckW, height, glow = 0, opacity = 1 }) => {
  const pad = 40;
  const w = mouthW + pad * 2;
  const h = height + pad * 2;
  const ox = cx - w / 2;
  const oy = top - pad;
  // toạ độ nội bộ, gốc ở tâm miệng
  const mL = -mouthW / 2;
  const mR = mouthW / 2;
  const nL = -neckW / 2;
  const nR = neckW / 2;
  const wallCol = glow > 0.02 ? C.lineLive : C.line;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`${-w / 2} ${-pad} ${w} ${h}`}
      style={{ position: "absolute", left: ox, top: oy, opacity, overflow: "visible" }}
    >
      {/* thành phễu */}
      <path d={`M ${mL} 0 L ${nL} ${height}`} stroke={wallCol} strokeWidth={4} strokeLinecap="round" fill="none" style={{ filter: glow > 0.02 ? `drop-shadow(0 0 ${10 * glow}px ${C.data}66)` : undefined }} />
      <path d={`M ${mR} 0 L ${nR} ${height}`} stroke={wallCol} strokeWidth={4} strokeLinecap="round" fill="none" style={{ filter: glow > 0.02 ? `drop-shadow(0 0 ${10 * glow}px ${C.data}66)` : undefined }} />
      {/* vành miệng */}
      <line x1={mL - 10} y1={0} x2={mL + 22} y2={0} stroke={C.lineLive} strokeWidth={4} strokeLinecap="round" />
      <line x1={mR - 22} y1={0} x2={mR + 10} y2={0} stroke={C.lineLive} strokeWidth={4} strokeLinecap="round" />
      {/* đường dẫn hướng trong lòng — hội tụ về cổ */}
      {[0.28, 0.55, 0.82].map((t) => (
        <path
          key={t}
          d={`M ${mL * (1 - t) + nL * t} ${height * t} L ${nL} ${height}`}
          stroke={C.gridDim}
          strokeWidth={1.5}
          fill="none"
        />
      ))}
      {[0.28, 0.55, 0.82].map((t) => (
        <path key={`r${t}`} d={`M ${mR * (1 - t) + nR * t} ${height * t} L ${nR} ${height}`} stroke={C.gridDim} strokeWidth={1.5} fill="none" />
      ))}
      {/* Vành cổ — sáng lên khi đang nuốt (đứng yên, không quay) */}
      <line x1={nL} y1={height} x2={nR} y2={height} stroke={glow > 0.02 ? C.data : C.textDim} strokeWidth={3} strokeLinecap="round" opacity={0.5 + 0.5 * glow} />
    </svg>
  );
};

import { C, nodeGlow } from "../lib/tokens";

export type Pt = { x: number; y: number };

/**
 * ỐNG trong suốt — HỞ HAI ĐẦU, dùng cho MỌI hướng (from → to).
 *
 * Một component cho cả ống chính (client↔server) lẫn ống evil chọc vào: cùng
 * chất liệu thì người xem đọc ngay "nó cắm cùng loại ống vào ống của mình",
 * không phải một sợi dây lạ. Hai đầu chỉ có VÀNH (ellipse) chứ không bịt —
 * bịt kín thì dòng chảy không đi lại được, hình sẽ nói dối cơ chế.
 *
 * Vẽ trong hệ toạ độ CỤC BỘ (chạy dọc +X từ 0→len) rồi xoay về đúng hướng.
 */
export const Tube: React.FC<{
  from: Pt;
  to: Pt;
  width: number;
  tint?: string; // màu thành ống
  crack?: number; // 0..1 mức nứt
  crackAt?: number; // 0..1 vị trí nứt dọc ống
  opacity?: number;
}> = ({ from, to, width, tint, crack = 0, crackAt = 0.5, opacity = 1 }) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const h = width / 2;
  const rimRx = 9; // độ dẹt của miệng ống

  const wallCol = tint ? tint : "rgba(255,255,255,0.22)";
  const rimCol = tint ? tint : "rgba(255,255,255,0.34)";
  const glow = tint ? `drop-shadow(0 0 10px ${tint}55)` : undefined;

  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity, overflow: "visible" }}>
      <g transform={`translate(${from.x} ${from.y}) rotate(${deg})`} style={{ filter: glow }}>
        {/* lòng ống — kính mờ, KHÔNG viền bịt hai đầu */}
        <rect x={0} y={-h} width={len} height={width} fill={tint ? `${tint}14` : "rgba(255,255,255,0.02)"} />

        {/* hai thành ống */}
        <line x1={0} y1={-h} x2={len} y2={-h} stroke={wallCol} strokeWidth={3} />
        <line x1={0} y1={h} x2={len} y2={h} stroke={wallCol} strokeWidth={3} />

        {/* highlight dọc — ra chất kính */}
        <line x1={22} y1={-h + 11} x2={len - 22} y2={-h + 11} stroke="rgba(255,255,255,0.12)" strokeWidth={2} strokeLinecap="round" />

        {/* MIỆNG HỞ hai đầu: vành elip (nửa gần đậm, nửa xa mờ → chiều sâu) */}
        {[0, len].map((mx) => (
          <g key={mx}>
            <ellipse cx={mx} cy={0} rx={rimRx} ry={h} fill="none" stroke={rimCol} strokeWidth={2.2} opacity={0.45} />
            <path d={`M ${mx} ${-h} A ${rimRx} ${h} 0 0 0 ${mx} ${h}`} fill="none" stroke={rimCol} strokeWidth={3} strokeLinecap="round" />
          </g>
        ))}

        {/* VẾT NỨT — trên thành -y (ống chính dựng đứng ⇒ hoá ra mép phải) */}
        {crack > 0.02 && (
          <g style={{ filter: `drop-shadow(${nodeGlow(C.brand, crack)})` }}>
            <path
              d={`M ${crackAt * len - 34 * crack} ${-h + 2} l ${10 * crack} ${-10 * crack} l ${9 * crack} ${12 * crack} l ${11 * crack} ${-14 * crack} l ${9 * crack} ${10 * crack} l ${9 * crack} ${-8 * crack}`}
              fill="none"
              stroke={C.brand}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </g>
    </svg>
  );
};

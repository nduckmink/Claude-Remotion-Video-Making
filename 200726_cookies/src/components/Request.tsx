import { C, F, nodeGlow } from "../lib/tokens";

const GOLD = "#D9A441";

/**
 * REQUEST — gói tin browser gửi server. Điểm mấu chốt: khi đã có phiên, cookie
 * TỰ ĐỘNG dán lên mọi request (`hasCookie`) — không ai bảo. `rejected` → server
 * không tìm thấy phiên (tủ bị xoá) → đỏ.
 */
export const Request: React.FC<{
  x: number;
  y: number;
  scale?: number;
  rot?: number;
  opacity?: number;
  hasCookie?: boolean;
  rejected?: number; // 0..1
}> = ({ x, y, scale = 1, rot = 0, opacity = 1, hasCookie = false, rejected = 0 }) => {
  const w = 92;
  const h = 62;
  const col = rejected > 0.3 ? C.brand : C.data;
  return (
    <div style={{ position: "absolute", left: x - (w * scale) / 2, top: y - (h * scale) / 2, width: w, height: h, transform: `scale(${scale}) rotate(${rot}deg)`, transformOrigin: "center", opacity }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        {/* phong bì */}
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={7} fill={C.bgPanel} stroke={col} strokeWidth={2} style={{ filter: rejected > 0.3 ? `drop-shadow(${nodeGlow(C.brand, rejected)})` : undefined }} />
        <path d={`M 4 8 L ${w / 2} ${h / 2} L ${w - 4} 8`} fill="none" stroke={col} strokeWidth={2} />
        {/* cookie tự dán ở góc */}
        {hasCookie && (
          <g>
            <circle cx={w - 12} cy={h - 12} r={13} fill={C.bg} stroke={GOLD} strokeWidth={2.5} style={{ filter: `drop-shadow(${nodeGlow(GOLD, 0.6)})` }} />
            {[
              [-0.3, -0.2],
              [0.25, 0.1],
              [-0.1, 0.3],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={w - 12 + cx * 13} cy={h - 12 + cy * 13} r={2} fill={GOLD} />
            ))}
          </g>
        )}
        {/* bị từ chối */}
        {rejected > 0.3 && (
          <text x={w / 2} y={h / 2 + 8} textAnchor="middle" fontFamily={F.mono} fontSize={22} fill={C.brand} fontWeight={700}>
            401
          </text>
        )}
      </svg>
    </div>
  );
};

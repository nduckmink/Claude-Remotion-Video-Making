import { C, nodeGlow } from "../lib/tokens";

/**
 * TÊN LỬA — sứ giả của 3rd party app. Bay theo hướng `point` (độ). Có ngọn lửa
 * đẩy khi `thrust`. Vẽ như icon đơn giản (mũi + thân + vây + lửa), không cố kỳ công.
 */
export const Rocket: React.FC<{
  x: number;
  y: number;
  point?: number; // độ, hướng mũi
  scale?: number;
  thrust?: number; // 0..1 lửa đẩy
  color?: string;
  opacity?: number;
}> = ({ x, y, point = 0, scale = 1, thrust = 0, color = C.brand, opacity = 1 }) => {
  const S = 96;
  return (
    <div style={{ position: "absolute", left: x - S / 2, top: y - S / 2, width: S, height: S, transform: `scale(${scale}) rotate(${point}deg)`, transformOrigin: "center", opacity }}>
      <svg width={S} height={S} viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} style={{ overflow: "visible" }}>
        {/* lửa đẩy (phía đuôi = trái) */}
        {thrust > 0.02 && (
          <path d={`M -20 -7 L ${-20 - 22 * thrust} 0 L -20 7 Z`} fill={C.brand} opacity={0.5 + 0.5 * thrust} style={{ filter: `drop-shadow(${nodeGlow(C.brand, thrust)})` }} />
        )}
        {/* thân */}
        <g style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}>
          <path d={`M -20 -12 L 16 -12 Q 30 0 16 12 L -20 12 Q -14 0 -20 -12 Z`} fill={C.bgPanel} stroke={color} strokeWidth={2.5} />
          {/* mũi */}
          <path d={`M 16 -12 Q 30 0 16 12`} fill={color} opacity={0.85} />
          {/* cửa sổ */}
          <circle cx={2} cy={0} r={6} fill="none" stroke={color} strokeWidth={2.2} />
          {/* vây */}
          <path d="M -20 -12 L -28 -20 L -14 -12 Z" fill={color} />
          <path d="M -20 12 L -28 20 L -14 12 Z" fill={color} />
        </g>
      </svg>
    </div>
  );
};

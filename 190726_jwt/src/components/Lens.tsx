import { C, nodeGlow } from "../lib/tokens";

/**
 * KÍNH LÚP — server soi token để kiểm chữ ký. Lia qua token; đúng thì (scene)
 * bung dấu V xanh, sai thì token vỡ. Trực quan hơn hẳn kiểu so "=" hai mã vạch.
 */
export const Lens: React.FC<{
  x: number; // tâm thấu kính
  y: number;
  r?: number;
  tint?: string; // màu vành (trung tính / pass / reject)
  opacity?: number;
}> = ({ x, y, r = 34, tint = C.data, opacity = 1 }) => {
  const size = r * 2 + 60;
  return (
    <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity, overflow: "visible" }}>
      {/* mặt kính — hơi sáng, có vệt loé */}
      <circle cx={0} cy={0} r={r} fill={tint} fillOpacity={0.06} stroke={tint} strokeWidth={3} style={{ filter: `drop-shadow(${nodeGlow(tint, 0.7)})` }} />
      <path d={`M ${-r * 0.5} ${-r * 0.45} A ${r * 0.72} ${r * 0.72} 0 0 1 ${r * 0.1} ${-r * 0.78}`} stroke={tint} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.7} />
      {/* cán */}
      <line x1={r * 0.72} y1={r * 0.72} x2={r * 0.72 + 24} y2={r * 0.72 + 24} stroke={tint} strokeWidth={6} strokeLinecap="round" />
    </svg>
  );
};

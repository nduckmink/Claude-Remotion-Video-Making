import { C, F, nodeGlow } from "../lib/tokens";

/**
 * Một ĐOẠN VĂN và cái BÓNG VECTOR của nó là CÙNG MỘT VẬT: `asDot` 0 → thẻ chữ
 * đọc được, 1 → chấm trên bản đồ. Chính cú co lại đó là "embedding": chữ bị nén
 * thành một toạ độ. Lúc được lấy ra, nó bung lại thành chữ.
 */
export const ChunkCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
  asDot?: number; // 0 thẻ … 1 chấm
  scale?: number;
  opacity?: number;
  selected?: number;
  showLabel?: boolean;
}> = ({ x, y, w, h, text, color, asDot = 0, scale = 1, opacity = 1, selected = 0, showLabel = false }) => {
  const card = 1 - asDot;
  const dotR = 11 + 3 * selected;
  const sel = selected > 0.15;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity }}>
      {/* THẺ CHỮ */}
      {card > 0.02 && (
        <div
          style={{
            position: "absolute",
            left: -w / 2,
            top: -h / 2,
            width: w,
            height: h,
            transform: `scale(${scale * (0.55 + 0.45 * card)})`,
            transformOrigin: "center",
            opacity: card,
            borderRadius: 10,
            background: C.bgPanel,
            border: `2px solid ${sel ? C.pass : color}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 13px",
            boxShadow: sel ? nodeGlow(C.pass, selected) : `0 0 12px ${color}33`,
          }}
        >
          <span style={{ width: 4, height: h - 22, borderRadius: 2, background: sel ? C.pass : color, flex: "none" }} />
          <span style={{ fontFamily: F.mono, fontSize: 16, color: C.text, whiteSpace: "nowrap" }}>{text}</span>
        </div>
      )}

      {/* CHẤM VECTOR */}
      {asDot > 0.02 && (
        <svg width={120} height={120} viewBox="-60 -60 120 120" style={{ position: "absolute", left: -60, top: -60, overflow: "visible", opacity: asDot }}>
          {sel && <circle cx={0} cy={0} r={dotR + 9} fill="none" stroke={C.pass} strokeWidth={2.4} opacity={selected} style={{ filter: `drop-shadow(${nodeGlow(C.pass, selected)})` }} />}
          <circle cx={0} cy={0} r={dotR} fill={sel ? C.pass : color} style={{ filter: `drop-shadow(0 0 ${sel ? 14 : 8}px ${sel ? C.pass : color})` }} />
        </svg>
      )}

      {/* Nhãn cạnh chấm — chỉ hiện cho đoạn ĐƯỢC CHỌN, để khỏi rối bản đồ */}
      {showLabel && sel && asDot > 0.5 && (
        <div style={{ position: "absolute", left: 20, top: -11, opacity: selected }}>
          <span style={{ fontFamily: F.mono, fontSize: 14, color: C.pass, whiteSpace: "nowrap", textShadow: `0 0 10px ${C.bg}` }}>{text}</span>
        </div>
      )}
    </div>
  );
};

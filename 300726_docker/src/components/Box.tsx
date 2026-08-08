import { C, F, nodeGlow } from "../lib/tokens";

/**
 * CÁI HỘP — image rồi thành container.
 *
 *   open   — nắp bật lên, đang nhét đồ vào
 *   sealed — nắp đóng, dán nhãn `myapp:1.0`: đã niêm phong, chỉ đọc
 *   running— bật lên ở máy bên kia: viền xanh, ô cửa sáng, KHÔNG cần mở nắp
 *
 * Ô CỬA nhỏ trên nắp là chi tiết quan trọng: bên kia nhìn thấy app chạy mà
 * chẳng phải mở hộp ra bao giờ.
 */
export const Box: React.FC<{
  x: number; // tâm
  y: number;
  w: number;
  h: number;
  open?: number; // 0..1 nắp mở
  sealed?: number;
  running?: number;
  scale?: number;
  tag: string;
  accent: string;
  opacity?: number;
  pulse?: number;
}> = ({ x, y, w, h, open = 0, sealed = 0, running = 0, scale = 1, tag, accent, opacity = 1, pulse = 0 }) => {
  const run = running > 0.1;
  const col = run ? C.pass : sealed > 0.5 ? accent : C.lineLive;
  const lidH = 30;
  const lidOpen = 42 * open; // độ mở của nắp — có BẢN LỀ ở mép trái, không bay lơ lửng

  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `scale(${scale})`, transformOrigin: "center", opacity }}>
      <svg width={w} height={h + 70} viewBox={`0 0 ${w} ${h + 70}`} style={{ position: "absolute", left: 0, top: -60, overflow: "visible" }}>
        {/* thân hộp */}
        <rect
          x={4}
          y={60 + lidH}
          width={w - 8}
          height={h - lidH - 4}
          rx={10}
          fill={C.bgPanel}
          stroke={col}
          strokeWidth={run ? 3.4 : 2.6}
          style={{ filter: run ? `drop-shadow(${nodeGlow(C.pass, 0.5 + 0.5 * pulse)})` : sealed > 0.5 ? `drop-shadow(${nodeGlow(accent, 0.4)})` : undefined }}
        />
        {/* gân thùng */}
        {[0.3, 0.7].map((t) => (
          <line key={t} x1={4} y1={60 + lidH + (h - lidH - 4) * t} x2={w - 4} y2={60 + lidH + (h - lidH - 4) * t} stroke={C.line} strokeWidth={1.4} opacity={0.6} />
        ))}

        {/* NẮP — bật lên khi đang nhét đồ, đóng lại khi niêm phong */}
        <g transform={`rotate(${-lidOpen} 8 ${60 + lidH})`}>
          <rect x={-2} y={60} width={w + 4} height={lidH} rx={7} fill={C.bgPanel} stroke={col} strokeWidth={2.6} />
          <rect x={w / 2 - 26} y={60 + lidH - 6} width={52} height={9} rx={4} fill={col} opacity={0.5} />
        </g>

        {/* Ô CỬA: nhìn thấy app chạy mà không phải mở hộp */}
        {sealed > 0.5 && (
          <g opacity={sealed}>
            <circle cx={w - 46} cy={60 + lidH + 40} r={17} fill="none" stroke={col} strokeWidth={2.2} />
            <circle cx={w - 46} cy={60 + lidH + 40} r={7} fill={run ? C.pass : C.textFaint} style={{ filter: run ? `drop-shadow(0 0 10px ${C.pass})` : undefined }} opacity={run ? 0.6 + 0.4 * pulse : 0.5} />
          </g>
        )}

        {/* niêm phong: băng dán + nhãn */}
        {sealed > 0.02 && (
          <g opacity={sealed}>
            <line x1={w / 2} y1={60 + lidH - 8} x2={w / 2} y2={60 + h - 8} stroke={col} strokeWidth={3} strokeDasharray="9 7" opacity={0.55} />
            <rect x={18} y={60 + h - 40} width={w - 100} height={28} rx={6} fill={C.bg} stroke={col} strokeWidth={1.8} />
          </g>
        )}
      </svg>

      {sealed > 0.3 && (
        <div style={{ position: "absolute", left: 18, top: h - 40, width: w - 100, height: 28, display: "flex", alignItems: "center", justifyContent: "center", opacity: sealed }}>
          <span style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: "0.06em", color: run ? C.pass : accent, whiteSpace: "nowrap" }}>{tag}</span>
        </div>
      )}

      <div style={{ position: "absolute", left: 0, top: h + 8, width: w, textAlign: "center", fontFamily: F.mono, fontSize: 14, letterSpacing: "0.18em", color: run ? C.pass : C.textDim, textTransform: "uppercase" }}>
        {run ? "container · running" : sealed > 0.5 ? "image · sealed" : "packing…"}
      </div>
    </div>
  );
};

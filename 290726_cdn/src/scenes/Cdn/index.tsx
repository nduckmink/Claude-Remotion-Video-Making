import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Edge } from "../../components/Edge";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Origin } from "../../components/Origin";
import { UserNode } from "../../components/UserNode";
import { arc } from "../../lib/anim";
import { C, F, idColor } from "../../lib/tokens";
import { EDGES, EDGE_BOX, LOOP, ORIGIN, ORIGIN_BOX, TITLE, USERS, USER_R } from "./constants";
import { EVENTS, STATES, type Ev, type LegS } from "./sim";

const USER_COLOR = idColor(0, 4);
const EDGE_COLOR = C.pass; // bản sao ở gần = trạng thái "tốt"
const ASSET = "#D9A441"; // FILE — một danh tính duy nhất, đi đâu cũng vàng
const VOL: Record<Ev["kind"], number> = { emit: 0.42, attach: 0.8, arrive: 0.45, fill: 0.8, fail: 0.9, drop: 0.7, slow: 0.85, travel: 0.3 };

/** Vệt đường đi: lấy mẫu ĐÚNG cung mà gói bay (chung hàm arc) → không thể lệch. */
const trailPath = (l: LegS) => {
  const a = { x: l.ax, y: l.ay };
  const b = { x: l.bx, y: l.by };
  const n = Math.max(2, Math.round(40 * l.prog));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const p = arc(a, b, (i / n) * l.prog, l.bend);
    d += `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
  }
  return d;
};

export const Cdn: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* VỆT ĐƯỜNG ĐI — quãng đường chính là con số, nên nó phải được VẼ RA */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {s.legs.map((l, k) => {
          const col = l.carry ? ASSET : l.long ? C.brand : EDGE_COLOR;
          return (
            <path
              key={k}
              d={trailPath(l)}
              fill="none"
              stroke={col}
              strokeWidth={l.long ? 3 : 4}
              strokeLinecap="round"
              opacity={l.fade * (l.long ? 0.5 : 0.62)}
              style={{ filter: `drop-shadow(0 0 6px ${col}55)` }}
            />
          );
        })}
      </svg>

      <Origin x={ORIGIN.x} y={ORIGIN.y} w={ORIGIN_BOX.w} h={ORIGIN_BOX.h} rows={ORIGIN_BOX.rows} heat={s.origin.heat} hit={s.origin.hit} accent={idColor(3, 4)} />

      {s.edges.map((e, i) =>
        e.present > 0.01 ? <Edge key={i} x={EDGES[i].x} y={EDGES[i].y} w={EDGE_BOX.w} h={EDGE_BOX.h} present={e.present} filled={e.filled} miss={e.miss} accent={EDGE_COLOR} /> : null,
      )}

      {USERS.map((u, i) => (
        <UserNode key={i} x={u.p.x} y={u.p.y} r={USER_R} city={u.city} accent={USER_COLOR} live={s.users[i].live} />
      ))}

      {/* Gói đang bay — mang FILE thì vàng, đi xin thì rỗng */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {s.packets.map((p, k) =>
          p.carry ? (
            <g key={k}>
              <rect x={p.x - 15} y={p.y - 11} width={30} height={22} rx={4} fill={C.bgPanel} stroke={ASSET} strokeWidth={2.6} style={{ filter: `drop-shadow(0 0 10px ${ASSET})` }} />
              <rect x={p.x - 8} y={p.y - 4} width={16} height={3} rx={1.5} fill={ASSET} />
              <rect x={p.x - 8} y={p.y + 2} width={10} height={3} rx={1.5} fill={ASSET} opacity={0.7} />
            </g>
          ) : (
            <circle key={k} cx={p.x} cy={p.y} r={8} fill="none" stroke={C.data} strokeWidth={3} style={{ filter: `drop-shadow(0 0 8px ${C.data}88)` }} />
          ),
        )}
      </svg>

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, top: 1808, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        latency is distance · keep a copy nearby
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

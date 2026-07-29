import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ClientTab } from "../../components/ClientTab";
import { Device } from "../../components/Device";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Tube } from "../../components/Tube";
import { C, F, idColor, nodeGlow } from "../../lib/tokens";
import { ALLOW_ORIGIN, BLUE, CLIENT, CRACK_Y, EVIL, EVIL_ORIGIN, GREEN, HOSE_FROM, HOSE_TO, HOSE_W, LOOP, SERVER, TITLE, TUBE } from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

const G = GREEN;
const B = BLUE;
const VOL: Record<Ev["kind"], number> = { emit: 0.5, attach: 0.85, arrive: 0.7, fill: 0.8, fail: 0.95, drop: 0.85, slow: 0.7, travel: 0.32 };
/** Tiếng có nhiều cao độ thì file có hậu tố index (travel-1 / travel-2). */
const sfxFile = (e: Ev) => (e.i ? `${e.kind}-${e.i}.wav` : `${e.kind}.wav`);

export const Cors: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* Ống chính, hở hai đầu (+ vết nứt) */}
      <Tube
        from={{ x: TUBE.x, y: TUBE.topY }}
        to={{ x: TUBE.x, y: TUBE.botY }}
        width={TUBE.w}
        crack={s.crack}
        crackAt={(CRACK_Y - TUBE.topY) / (TUBE.botY - TUBE.topY)}
      />

      {/* Ống của EVIL — CÙNG loại ống, cắm ngang vào vết nứt */}
      {s.hose > 0.02 && <Tube from={HOSE_FROM} to={HOSE_TO} width={HOSE_W} tint={C.brand} opacity={s.hose} />}

      {/* Dòng chảy 2 chiều + cam độc hại */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {s.green.map((d, i) => (
          <circle key={`g${i}`} cx={d.x} cy={d.y} r={8} fill={G} style={{ filter: `drop-shadow(0 0 6px ${G})` }} />
        ))}
        {s.blue.map((d, i) => (
          <circle key={`b${i}`} cx={d.x} cy={d.y} r={8} fill={B} style={{ filter: `drop-shadow(0 0 6px ${B})` }} />
        ))}
        {s.orange.map((d, i) => (
          <circle key={`o${i}`} cx={d.x} cy={d.y} r={8} fill={C.brand} opacity={d.opacity} style={{ filter: `drop-shadow(0 0 7px ${C.brand})` }} />
        ))}
        {/* MỘT VIÊN ĐẠN + vệt đuôi */}
        {s.bullet.present && (
          <>
            <line x1={s.bullet.x + 34} y1={s.bullet.y} x2={s.bullet.x + 6} y2={s.bullet.y} stroke={C.brand} strokeWidth={5} strokeLinecap="round" opacity={0.45} />
            <ellipse cx={s.bullet.x} cy={s.bullet.y} rx={11} ry={7} fill={C.brand} style={{ filter: `drop-shadow(${nodeGlow(C.brand, 1)})` }} />
          </>
        )}
        {/* Nổ khi đạn TRÚNG ống */}
        {s.impact > 0.02 &&
          [0, 40, 80, 130, 170, 215, 260, 310].map((a) => {
            const rr = 10 + 34 * (1 - s.impact);
            const bx = HOSE_TO.x + rr * Math.cos((a * Math.PI) / 180);
            const by = CRACK_Y - 16 + rr * Math.sin((a * Math.PI) / 180);
            const sz = 4 + 7 * s.impact;
            return <rect key={a} x={bx - sz / 2} y={by - sz / 2} width={sz} height={sz} fill={C.brand} opacity={s.impact} />;
          })}
      </svg>

      {/* CLIENT hợp lệ (origin cho phép) */}
      <ClientTab x={CLIENT.x} y={CLIENT.y} w={CLIENT.w} h={CLIENT.h} origin={ALLOW_ORIGIN} accent={idColor(0, 4)} live={s.client.live} />

      {/* SERVER + allow-list + đếm chặn */}
      <div style={{ transform: s.serverReject > 0.02 ? `translate(${s.serverReject * 5 * Math.sin(frame * 2)}px, 0)` : undefined }}>
        <Device x={SERVER.x} y={SERVER.y} w={SERVER.w} h={SERVER.h} rows={SERVER.rows} label="server" accent={s.serverReject > 0.3 ? C.brand : idColor(3, 4)} live={s.server.live} />
      </div>
      {/* allow-origin tag */}
      <div style={{ position: "absolute", left: SERVER.x - 150, top: SERVER.y + SERVER.h / 2 + 14, width: 300, textAlign: "center" }}>
        <span style={{ fontFamily: F.mono, fontSize: 17, color: C.pass, border: `1.5px solid ${C.pass}`, borderRadius: 8, padding: "5px 12px", letterSpacing: "0.02em" }}>
          allow-origin: {ALLOW_ORIGIN}
        </span>
        {s.blocked > 0 && (
          <div style={{ marginTop: 12, fontFamily: F.mono, fontSize: 20, color: C.brand, textShadow: s.serverReject > 0.1 ? nodeGlow(C.brand, s.serverReject) : undefined }}>
            blocked · {EVIL_ORIGIN} ✗
          </div>
        )}
      </div>

      {/* CLIENT ĐỘC HẠI */}
      {s.evil > 0.01 && <ClientTab x={EVIL.x} y={EVIL.y} w={EVIL.w} h={EVIL.h} origin={EVIL_ORIGIN} accent={C.brand} evil opacity={s.evil} />}

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, top: 1808, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        only allowed origins get through
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${sfxFile(e)}`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

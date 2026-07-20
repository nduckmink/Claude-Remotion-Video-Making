import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BrowserUI } from "../../components/BrowserUI";
import { Cookie } from "../../components/Cookie";
import { Device } from "../../components/Device";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Request } from "../../components/Request";
import { SessionStore } from "../../components/SessionStore";
import { C, F, idColor } from "../../lib/tokens";
import { BROWSER, COOKIE_HOME, LOOP, SERVER, SID, STORE, STORE_CELL, TITLE } from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

const VOL: Record<Ev["kind"], number> = { emit: 0.5, attach: 0.85, arrive: 0.7, fill: 0.8, fail: 1, drop: 0.85, slow: 0.7 };

export const Cookies: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* Server ↔ tủ (bộ nhớ của server) */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={SERVER.x} y1={SERVER.y + SERVER.h / 2} x2={STORE.x} y2={STORE.y - STORE.h / 2} stroke={C.line} strokeWidth={2} strokeDasharray="4 6" />
      </svg>

      <BrowserUI x={BROWSER.x} y={BROWSER.y} w={BROWSER.w} h={BROWSER.h} accent={idColor(0, 4)} loading={s.loading} spin={(frame * 9) % 360} sweep={(frame % 44) / 44} live={s.browser.live} />
      <Device x={SERVER.x} y={SERVER.y} w={SERVER.w} h={SERVER.h} rows={SERVER.rows} label="server" accent={idColor(3, 4)} live={s.server.live} />

      {/* Tủ — RUNG khi bị xoá */}
      <div style={{ transform: `translate(${s.wipeFlash * 7 * Math.sin(frame * 1.9)}px, ${s.wipeFlash * 7 * Math.cos(frame * 2.4)}px)` }}>
        <SessionStore x={STORE.x} y={STORE.y} w={STORE.w} h={STORE.h} cols={STORE.cols} rows={STORE.rows} cells={s.cells} activeCell={STORE_CELL} lookup={s.lookup} wipe={s.wipe} wipeFlash={s.wipeFlash} />
      </div>

      {/* Hũ cookie dưới browser */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M ${COOKIE_HOME.x - 52} ${COOKIE_HOME.y - 20} L ${COOKIE_HOME.x - 44} ${COOKIE_HOME.y + 56} Q ${COOKIE_HOME.x} ${COOKIE_HOME.y + 70} ${COOKIE_HOME.x + 44} ${COOKIE_HOME.y + 56} L ${COOKIE_HOME.x + 52} ${COOKIE_HOME.y - 20}`} fill="none" stroke={C.line} strokeWidth={2} />
        <line x1={COOKIE_HOME.x - 58} y1={COOKIE_HOME.y - 20} x2={COOKIE_HOME.x + 58} y2={COOKIE_HOME.y - 20} stroke={C.lineLive} strokeWidth={3} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: COOKIE_HOME.x - 80, top: COOKIE_HOME.y + 78, width: 160, textAlign: "center", fontFamily: F.mono, fontSize: 14, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>cookie jar</div>

      {/* Ghost JWT — đối chiếu: tự mang mọi thứ, khỏi cần tủ */}
      {s.ghost > 0.01 && (
        <div style={{ position: "absolute", left: 250 - 170, top: STORE.y - 44, width: 340, opacity: s.ghost * 0.9 }}>
          <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: "0.14em", color: C.textDim, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>vs JWT</div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 8 }}>
            {["head", "role:user", "sig"].map((t, i) => (
              <div key={i} style={{ padding: "8px 10px", borderRadius: 6, border: `1.5px solid ${C.pass}`, fontFamily: F.mono, fontSize: 14, color: C.text }}>{t}</div>
            ))}
          </div>
          <div style={{ textAlign: "center", fontFamily: F.mono, fontSize: 15, color: C.pass }}>carries itself · no store</div>
        </div>
      )}

      {/* Cookie trong hũ / đang bay */}
      {s.cookie.present && <Cookie x={s.cookie.x} y={s.cookie.y} label={SID} dead={s.cookie.dead} opacity={s.cookie.opacity} glow={s.cookie.dead > 0.5 ? 0 : 0.4} />}

      {/* Request (tự kèm cookie) */}
      {s.packet && <Request x={s.packet.x} y={s.packet.y} rot={s.packet.rot} hasCookie={s.packet.hasCookie} rejected={s.packet.rejected} opacity={s.packet.opacity} />}

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, top: 1792, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        cookie = the ticket · server keeps the state
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ConsentPopup } from "../../components/ConsentPopup";
import { Drive } from "../../components/Drive";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Rocket } from "../../components/Rocket";
import { Shields } from "../../components/Shields";
import { Ticket } from "../../components/Ticket";
import { C, F, idColor, nodeGlow } from "../../lib/tokens";
import { APP, CENTER, DRIVE_R, LOOP, N_SHIELD, POPUP, TITLE } from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

const VOL: Record<Ev["kind"], number> = { emit: 0.5, attach: 0.85, arrive: 0.7, fill: 0.8, fail: 1, drop: 0.85, slow: 0.7 };
const SHIELD_COLOR = Array.from({ length: N_SHIELD }, (_, i) => idColor(i, N_SHIELD)); // mỗi lớp một màu

export const Oauth: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];
  const shields = s.shields.map((sh, i) => ({ ...sh, color: SHIELD_COLOR[i], red: s.shieldRed, green: s.shieldGreen }));

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* Các lớp khiên dày quay quanh drive */}
      <Shields cx={CENTER.x} cy={CENTER.y} shields={shields} />

      {/* Drive ở tâm */}
      <Drive x={CENTER.x} y={CENTER.y} r={DRIVE_R} granted={s.driveGranted} />

      {/* Đạn 8-bit + nổ khi chạm khiên */}
      {(s.shots.length > 0 || s.burst > 0.02) && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, shapeRendering: "crispEdges" }}>
          {s.shots.map((p, k) => (
            <rect key={k} x={p.x - 7} y={p.y - 7} width={14} height={14} fill={C.brand} />
          ))}
          {s.burst > 0.02 &&
            [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
              const rr = 10 + 26 * (1 - s.burst);
              const bx = s.burstPos.x + rr * Math.cos((a * Math.PI) / 180);
              const by = s.burstPos.y + rr * Math.sin((a * Math.PI) / 180);
              const sz = 5 + 6 * s.burst;
              return <rect key={a} x={bx - sz / 2} y={by - sz / 2} width={sz} height={sz} fill={C.brand} opacity={s.burst} />;
            })}
        </svg>
      )}

      {/* Vé (access token) phát ra tên lửa */}
      {s.ticket.present && <Ticket x={s.ticket.x} y={s.ticket.y} label="token" scale={s.ticket.scale} opacity={s.ticket.opacity} />}

      {/* Tên lửa của 3rd party app */}
      <Rocket x={s.rocket.x} y={s.rocket.y} point={s.rocket.point} thrust={s.rocket.thrust} opacity={s.rocket.opacity} />

      {/* 3RD PARTY APP — góc trên phải */}
      <div
        style={{
          position: "absolute",
          left: APP.x - APP.w / 2,
          top: APP.y - APP.h / 2,
          width: APP.w,
          height: APP.h,
          borderRadius: 12,
          background: C.bgPanel,
          border: `2px solid ${s.app.live > 0.3 ? C.brand : C.line}`,
          boxShadow: s.app.live > 0.3 ? nodeGlow(C.brand, s.app.live) : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontFamily: F.mono, fontSize: 19, letterSpacing: "0.1em", color: C.textDim, textTransform: "uppercase" }}>3rd party app</span>
      </div>

      {/* Popup xin quyền */}
      {s.popup.present && <ConsentPopup x={POPUP.x} y={POPUP.y} w={POPUP.w} appName="3rd party app" scope="your Drive" appear={s.popup.appear} approve={s.popup.approve} opacity={s.popup.opacity} />}

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, top: 1792, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        access granted only on consent
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

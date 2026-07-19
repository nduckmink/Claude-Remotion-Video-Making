import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ClaimChip } from "../../components/ClaimChip";
import { Device } from "../../components/Device";
import { Funnel } from "../../components/Funnel";
import { GridBg } from "../../components/GridBg";
import { Hacker } from "../../components/Hacker";
import { Header } from "../../components/Header";
import { Lens } from "../../components/Lens";
import { Seal } from "../../components/Seal";
import { Token } from "../../components/Token";
import { C, F, idColor } from "../../lib/tokens";
import {
  CLAIMS,
  CLIENT,
  FUNNEL,
  HACKER,
  INTERCEPT,
  LOOP,
  MINT_SEAL,
  OWN_SIG,
  SERVER,
  SERVER_SEAL,
  TITLE,
} from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

const CLAIM_COLOR = [idColor(0, 3), idColor(1, 3), idColor(2, 3)];
const CLIENT_COLOR = idColor(0, 4);
const SERVER_COLOR = idColor(3, 4);

const VOL: Record<Ev["kind"], number> = { emit: 0.55, attach: 0.9, fill: 0.8, arrive: 0.7, fail: 1, slow: 0.7, drop: 0.85 };

export const Jwt: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* PHỄU ĐÚC */}
      <Funnel cx={FUNNEL.cx} top={FUNNEL.top} mouthW={FUNNEL.mouthW} neckW={FUNNEL.neckW} height={FUNNEL.height} glow={s.funnel.glow} />

      {/* Claims rơi vào phễu */}
      {s.claims.map((c, i) => (
        <ClaimChip key={i} x={c.x} y={c.y} label={CLAIMS[i].label} color={CLAIM_COLOR[i]} scale={c.scale} rot={c.rot} opacity={c.opacity} />
      ))}

      {/* Con dấu đúc (secret) ở cổ phễu */}
      {s.mintSeal.opacity > 0.01 && (
        <Seal x={MINT_SEAL.x} y={MINT_SEAL.y} active={s.mintSeal.active} press={s.mintSeal.press} opacity={s.mintSeal.opacity} label="secret" />
      )}

      {/* CLIENT / SERVER */}
      <Device x={CLIENT.x} y={CLIENT.y} w={CLIENT.w} h={CLIENT.h} rows={CLIENT.rows} label="client" accent={CLIENT_COLOR} live={s.client.live} />
      <Device x={SERVER.x} y={SERVER.y} w={SERVER.w} h={SERVER.h} rows={SERVER.rows} label="server" accent={SERVER_COLOR} live={s.server.live} />

      {/* Secret của server (giữ khoá để ký lại) */}
      <Seal x={SERVER_SEAL.x} y={SERVER_SEAL.y} active={s.serverSeal.active} scale={0.55} label="secret" />

      {/* HACKER + cánh tay chộp */}
      {s.hacker.opacity > 0.01 && (
        <>
          {s.hacker.grab > 0.02 && (
            <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
              <line
                x1={HACKER.x}
                y1={HACKER.y - HACKER.size / 2}
                x2={INTERCEPT.x}
                y2={INTERCEPT.y + 20}
                stroke={C.brand}
                strokeWidth={2.5}
                strokeDasharray="6 5"
                opacity={s.hacker.grab * 0.8}
              />
            </svg>
          )}
          <Hacker x={HACKER.x} y={HACKER.y} size={HACKER.size} live={s.hacker.live} opacity={s.hacker.opacity} />
        </>
      )}

      {/* TOKEN — nhân vật chính */}
      {s.token.present && (
        <Token x={s.token.x} y={s.token.y} scale={s.token.scale} rot={s.token.rot} payload={s.token.payload} ownSig={OWN_SIG} seal={s.token.seal} tamper={s.token.tamper} shatter={s.token.shatter} verdict={s.token.verdict} opacity={s.token.opacity} />
      )}

      {/* KÍNH LÚP soi token — vẽ SAU token để nổi LÊN TRÊN. Lia qua rồi phán quyết. */}
      {s.verify.present && s.token.present && (
        <Lens
          x={s.token.x - 150 + s.verify.scan * 300}
          y={s.token.y}
          tint={s.verify.verdict === "pass" ? C.pass : s.verify.verdict === "reject" ? C.brand : C.data}
          opacity={s.verify.opacity}
        />
      )}

      {/* Đúng → dấu V XANH bung lên (pop) */}
      {s.verify.verdict === "pass" && s.verify.pop > 0.01 && s.token.present && (
        <div style={{ position: "absolute", left: s.token.x + 96, top: s.token.y - 104, transform: `scale(${s.verify.pop})`, transformOrigin: "center", opacity: s.verify.opacity }}>
          <svg width={76} height={76} viewBox="0 0 76 76" style={{ overflow: "visible" }}>
            <circle cx={38} cy={38} r={31} fill={C.pass} fillOpacity={0.16} stroke={C.pass} strokeWidth={3.5} style={{ filter: `drop-shadow(0 0 18px ${C.pass})` }} />
            <path d="M 23 39 L 33 50 L 54 27" stroke={C.pass} strokeWidth={5.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Caption nền tảng — stateless: token TỰ mang danh tính, server khỏi tra sổ */}
      <div style={{ position: "absolute", left: 0, top: 1770, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        stateless · no session store
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

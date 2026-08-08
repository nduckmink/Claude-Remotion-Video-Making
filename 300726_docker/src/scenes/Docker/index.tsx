import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Box } from "../../components/Box";
import { Bubble } from "../../components/Bubble";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Person } from "../../components/Person";
import { Toast } from "../../components/Toast";
import { pulse } from "../../lib/anim";
import { C, F, idColor, nodeGlow } from "../../lib/tokens";
import { A, B, BOX, BOX_TAG, BUBBLE_A, BUBBLE_B, CODE_NAME, ERRORS, ERR_AT, ERR_GAP, IDLE_PERIOD, ITEMS, LOOP, PERSON, SAY_A, SAY_B, TITLE } from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

const A_COLOR = idColor(0, 4);
const B_COLOR = idColor(2, 4);
const BOX_COLOR = idColor(1, 4);
const VOL: Record<Ev["kind"], number> = { emit: 0.5, attach: 0.75, arrive: 0.6, fill: 0.6, fail: 0.9, drop: 0.7, slow: 0.7, travel: 0.3 };

export const Docker: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];
  const beat = pulse(frame, IDLE_PERIOD);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* HAI NGƯỜI, HAI MÁY — chỗ khác nhau chính là nguồn cơn */}
      <Person x={A.x} y={A.y} w={PERSON.w} h={PERSON.h} name={A.name} env={A.env} accent={A_COLOR} live={s.a.live} />
      <Person x={B.x} y={B.y} w={PERSON.w} h={PERSON.h} name={B.name} env={B.env} accent={B_COLOR} live={s.b.live} envDim={s.b.envDim} />

      {/* CÁI HỘP */}
      {s.box.present && s.box.opacity > 0.01 && (
        <Box x={s.box.x} y={s.box.y} w={BOX.w} h={BOX.h} open={s.box.open} sealed={s.box.sealed} running={s.box.running} scale={s.box.scale} tag={BOX_TAG} accent={BOX_COLOR} opacity={s.box.opacity} pulse={beat} />
      )}

      {/* BỐN THỨ bay từ máy A vào hộp — runtime, thư viện, cấu hình, chính app */}
      {s.items.map((it) =>
        it.opacity > 0.01 ? (
          <div
            key={it.i}
            style={{
              position: "absolute",
              left: it.x - 60,
              top: it.y - 17,
              width: 120,
              height: 34,
              transform: `scale(${it.scale})`,
              transformOrigin: "center",
              opacity: it.opacity,
              borderRadius: 8,
              background: C.bgPanel,
              border: `2px solid ${it.landed ? BOX_COLOR : C.lineLive}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: it.landed ? "none" : nodeGlow(C.data, 0.4),
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 14, color: C.text, whiteSpace: "nowrap" }}>{ITEMS[it.i]}</span>
          </div>
        ) : null,
      )}

      {/* CODE TRẦN — cách sai: gửi mỗi file, bên kia không chạy nổi */}
      {s.code.present && s.code.opacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: s.code.x - 66,
            top: s.code.y - 26,
            width: 132,
            height: 52,
            transform: `rotate(${s.code.rot}deg)`,
            transformOrigin: "center",
            opacity: s.code.opacity,
            borderRadius: 9,
            background: C.bgPanel,
            border: `2px solid ${s.code.rejected > 0.4 ? C.brand : C.data}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: s.code.rejected > 0.4 ? nodeGlow(C.brand, s.code.rejected) : nodeGlow(C.data, 0.35),
          }}
        >
          <svg width={13} height={16} viewBox="0 0 13 16" style={{ flex: "none" }}>
            <path d="M2 1 h5 l4 4 v10 h-9 z" fill="none" stroke={s.code.rejected > 0.4 ? C.brand : C.textDim} strokeWidth={1.6} />
          </svg>
          <span style={{ fontFamily: F.mono, fontSize: 16, color: s.code.rejected > 0.4 ? C.brand : C.text }}>{CODE_NAME}</span>
        </div>
      )}

      {/* LỖI ở máy B */}
      {s.errors.map((e, k) =>
        e.present && e.opacity > 0.01 ? <Toast key={k} x={ERR_AT.x} y={ERR_AT.y - k * ERR_GAP} text={ERRORS[k]} shake={e.shake} opacity={e.opacity} /> : null,
      )}

      {/* THOẠI */}
      {s.bubbleA.present && s.bubbleA.opacity > 0.01 && (
        <Bubble x={BUBBLE_A.x} y={BUBBLE_A.y} w={BUBBLE_A.w} h={BUBBLE_A.h} lines={SAY_A} accent={A_COLOR} tail="left" grow={s.bubbleA.grow} opacity={s.bubbleA.opacity} />
      )}
      {s.bubbleB.present && s.bubbleB.opacity > 0.01 && (
        <Bubble x={BUBBLE_B.x} y={BUBBLE_B.y} w={BUBBLE_B.w} h={BUBBLE_B.h} lines={SAY_B} accent={C.pass} tail="right" grow={s.bubbleB.grow} opacity={s.bubbleB.opacity} />
      )}

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, top: 1808, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        ship the box · not just the code
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

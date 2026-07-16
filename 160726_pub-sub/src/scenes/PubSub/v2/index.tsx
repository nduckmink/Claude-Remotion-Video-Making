import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Envelope } from "../../../components/Envelope";
import { GridBg } from "../../../components/GridBg";
import { Header } from "../../../components/Header";
import { Link } from "../../../components/Link";
import { Node } from "../../../components/Node";
import { Ripple } from "../../../components/Ripple";
import { SubToken } from "../../../components/SubToken";
import { C, SVC_COLORS } from "../../../lib/tokens";
import {
  BROKER_C,
  BROKER_LABEL,
  BROKER_SUB,
  DIAG,
  H,
  LABEL_SIZE,
  LOOP,
  N_INITIAL,
  N_TOTAL,
  PUB,
  PUB_LABEL,
  PUB_SUB,
  SPOKE,
  STEM,
  STROKE,
  SUB_SIZE,
  SVC,
  SVC_LABEL,
  SVC_LABEL_SIZE,
  SVC_LABEL_SPACING,
  TITLE,
  W,
  attachPt,
  svcX,
} from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

// Mỗi tiếng neo vào MỘT sự kiện có thật trong sim. Lịch do sim chốt.
const sfxFile = (e: Ev) =>
  e.kind === "recv"
    ? `recv-${(e.i ?? 0) + 1}.wav`
    : `${e.kind.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}.wav`;

const VOL: Record<Ev["kind"], number> = {
  publish: 0.9,
  recv: 0.75,
  miss: 1,
  svcIn: 0.7,
  subscribe: 0.6,
  attach: 0.8,
  wire: 0.55,
  brokerIn: 0.9,
  brokerHit: 0.7,
};

/**
 * Pub / Sub V2 — component chỉ ĐỌC STATES[frame] và vẽ.
 *
 * Thứ tự lớp: đường → thư/chốt → node → chốt đã cắm → ripple.
 * Node nền ĐỤC nên nó che đầu đường và che thư lúc thư chui vào — thư đọc ra
 * là "bị hấp thụ" chứ không phải "nằm đè lên".
 */
export const PubSubV2: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {/* Direct: publisher tự nối tới TỪNG service — mỗi cái một nan quạt,
              mang đúng màu của đứa nó phục vụ. */}
          {DIAG.slice(0, N_INITIAL).map((seg, i) => (
            <Link
              key={`diag-${i}`}
              {...{ x0: seg.x0, y0: seg.y0, x1: seg.x1, y1: seg.y1 }}
              live={s.diagLive[i]}
              opacity={s.diag}
              color={SVC_COLORS[i]}
              width={STROKE}
            />
          ))}

          {/* Kết nối đáng lẽ phải có tới svc 4 — chưa ai nối. Đứt nét, và là
              đường duy nhất mặc accent: nó là chỗ đang hỏng. */}
          <Link
            {...{ x0: DIAG[3].x0, y0: DIAG[3].y0, x1: DIAG[3].x1, y1: DIAG[3].y1 }}
            dashed
            opacity={s.dash}
            width={STROKE}
          />

          {/* Stem: đường DUY NHẤT không mang màu ai — publisher bắn thư vào
              topic mà không biết ai sẽ đọc. Chính là cả luận điểm. */}
          <Link
            {...{ x0: STEM.x0, y0: STEM.y0, x1: STEM.x1, y1: STEM.y1 }}
            live={s.stemLive}
            draw={s.stemDraw}
            opacity={s.stemOn}
            width={STROKE}
          />

          {/* Nan hoa: mọc ra từ chính cái chốt mà service đã mang lên cắm. */}
          {SPOKE.map((seg, i) => (
            <Link
              key={`spoke-${i}`}
              {...{ x0: seg.x0, y0: seg.y0, x1: seg.x1, y1: seg.y1 }}
              live={s.spokeLive[i]}
              draw={s.spokeDraw[i]}
              opacity={s.spokeOn[i]}
              color={SVC_COLORS[i]}
              width={STROKE}
            />
          ))}
        </svg>
      </AbsoluteFill>

      {/* Thư. Màu = địa chỉ. Trắng = chưa có người nhận. */}
      {s.msgs.map((m) => (
        <Envelope
          key={m.id}
          x={m.x}
          y={m.y}
          color={m.svc === null ? C.data : SVC_COLORS[m.svc]}
        />
      ))}

      {/* Chốt đăng ký đang bay lên topic. */}
      {s.flying.map((t) => (
        <SubToken key={`fly-${t.i}`} x={t.x} y={t.y} color={SVC_COLORS[t.i]} />
      ))}

      <Node
        x={PUB.x}
        y={PUB.y}
        w={PUB.w}
        h={PUB.h}
        label={PUB_LABEL}
        sub={PUB_SUB}
        labelSize={LABEL_SIZE}
        subSize={SUB_SIZE}
        strokeWidth={STROKE}
        live={s.pubLive}
      />

      {s.broker > 0.001 ? (
        <Node
          x={BROKER_C.cx - BROKER_C.r}
          y={BROKER_C.cy - BROKER_C.r}
          w={BROKER_C.r * 2}
          h={BROKER_C.r * 2}
          radius={999}
          label={BROKER_LABEL}
          sub={BROKER_SUB}
          labelSize={LABEL_SIZE}
          subSize={SUB_SIZE}
          strokeWidth={STROKE}
          live={s.brokerLive}
          accent={s.brokerAccent}
          opacity={s.broker}
        />
      ) : null}

      {Array.from({ length: N_TOTAL }, (_, i) => {
        const isNew = i === N_TOTAL - 1;
        if (isNew && s.svc4In < 0.001) return null;
        return (
          <Node
            key={`svc-${i}`}
            x={svcX(i)}
            y={SVC.y}
            w={SVC.w}
            h={SVC.h}
            label={SVC_LABEL[i]}
            labelSize={SVC_LABEL_SIZE}
            labelSpacing={SVC_LABEL_SPACING}
            strokeWidth={STROKE}
            tint={SVC_COLORS[i]}
            live={s.svcFlash[i]}
            flash={s.svcFlash[i]}
            accent={isNew ? s.svcMiss : 0}
            opacity={isNew ? s.svc4In : 1}
            scale={isNew ? 0.92 + 0.08 * s.svc4In : 1}
          />
        );
      })}

      {/* Chốt đã cắm — nằm TRÊN node broker để thấy được nó gắn vào vành. */}
      {s.attached.map((a, i) =>
        a > 0.001 ? (
          <SubToken
            key={`att-${i}`}
            x={attachPt(i).x}
            y={attachPt(i).y}
            color={SVC_COLORS[i]}
            snap={s.snap[i]}
            opacity={a}
          />
        ) : null,
      )}

      {/* Broker vừa nhận thư — ring nở ra ở đúng chỗ thư chui vào vành. */}
      {s.brokerRipple >= 0 ? (
        <Ripple
          x={STEM.x1}
          y={STEM.y1}
          t={s.brokerRipple}
          color={C.data}
          from={24}
          to={100}
          width={STROKE}
        />
      ) : null}

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${sfxFile(e)}`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

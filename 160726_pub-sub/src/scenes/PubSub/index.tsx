import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Link } from "../../components/Link";
import { Node } from "../../components/Node";
import { Packet } from "../../components/Packet";
import { Ripple } from "../../components/Ripple";
import { C } from "../../lib/tokens";
import {
  BROKER,
  BROKER_LABEL,
  DIAG,
  H,
  LABEL_SIZE,
  LOOP,
  N_INITIAL,
  N_TOTAL,
  PUB,
  PUB_LABEL,
  STEM,
  SVC,
  SVC_LABEL,
  TITLE,
  VERT,
  W,
  svcX,
} from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

// Mỗi tiếng neo vào MỘT sự kiện có thật trong sim — không có tiếng nào tự
// sinh ra để cho vui. Lịch do sim chốt, verify.ts canh biên loop.
const sfxFile = (e: Ev) =>
  e.kind === "recv" ? `recv-${(e.i ?? 0) + 1}.wav` : `${e.kind.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}.wav`;

const VOL: Record<Ev["kind"], number> = {
  publish: 0.9,
  recv: 0.75,
  miss: 1,
  svcIn: 0.7,
  wire: 0.6,
  brokerIn: 0.9,
  brokerHit: 0.7,
};

/**
 * Pub / Sub — component chỉ ĐỌC STATES[frame] và vẽ. Không tính gì ở đây;
 * mọi con số đã được sim chốt, và verify.ts đã canh.
 *
 * Thứ tự lớp: đường → packet → node → ripple.
 * Node có nền ĐỤC nên nó che đầu đường và che packet lúc packet chui vào —
 * nhờ vậy packet đọc ra là "bị hấp thụ" chứ không phải "nằm đè lên".
 */
export const PubSub: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* Mọi đường ở CÙNG một lớp svg, dưới lớp node. */}
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {/* Direct: publisher tự nối tới TỪNG service — mỗi cái một nan quạt. */}
          {DIAG.slice(0, N_INITIAL).map((seg, i) => (
            <Link
              key={`diag-${i}`}
              {...{ x0: seg.x0, y0: seg.y0, x1: seg.x1, y1: seg.y1 }}
              live={s.diagLive[i]}
              opacity={s.diag}
            />
          ))}

          {/* Kết nối đáng lẽ phải có tới svc 4 — chưa ai nối. Đứt nét, nhấp nháy,
              và là cái ĐƯỜNG duy nhất trong scene được mặc accent. */}
          <Link
            {...{ x0: DIAG[3].x0, y0: DIAG[3].y0, x1: DIAG[3].x1, y1: DIAG[3].y1 }}
            dashed
            opacity={s.dash}
          />

          {/* Pub/sub: một cọng từ publisher, rồi 4 đường dọc song song từ broker. */}
          <Link
            {...{ x0: STEM.x0, y0: STEM.y0, x1: STEM.x1, y1: STEM.y1 }}
            live={s.stemLive}
            draw={s.stemDraw}
            opacity={s.stemOn}
          />
          {VERT.map((seg, i) => (
            <Link
              key={`vert-${i}`}
              {...{ x0: seg.x0, y0: seg.y0, x1: seg.x1, y1: seg.y1 }}
              live={s.vertLive[i]}
              draw={s.vertDraw[i]}
              opacity={s.vertOn[i]}
            />
          ))}
        </svg>
      </AbsoluteFill>

      {/* Packet: LUÔN trắng. Tương phản 3-vs-1 do số lượng gánh, không do màu. */}
      {s.items.map((it) => (
        <Packet key={it.id} x={it.x} y={it.y} color={C.data} />
      ))}

      <Node
        x={PUB.x}
        y={PUB.y}
        w={PUB.w}
        h={PUB.h}
        label={PUB_LABEL}
        labelSize={LABEL_SIZE}
        live={s.pubLive}
      />

      {s.broker > 0.001 ? (
        <Node
          x={BROKER.x}
          y={BROKER.y}
          w={BROKER.w}
          h={BROKER.h}
          radius={BROKER.radius}
          label={BROKER_LABEL}
          labelSize={LABEL_SIZE}
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
            label={SVC_LABEL(i)}
            labelSize={LABEL_SIZE}
            live={s.svcFlash[i]}
            flash={s.svcFlash[i]}
            accent={isNew ? s.svcMiss : 0}
            opacity={isNew ? s.svc4In : 1}
            scale={isNew ? 0.92 + 0.08 * s.svc4In : 1}
          />
        );
      })}

      {/* Broker vừa nhận — ring nở ra ở đúng chỗ packet chui vào.
          Chỉ MỘT ring: cú phát ra đã có 4 packet xuất hiện nói hộ rồi, thêm
          ring thứ hai ở mép dưới là vừa thừa vừa sai — broker giữ packet 12
          frame chứ không vào-ra cùng lúc. */}
      {s.brokerRipple >= 0 ? (
        <Ripple x={STEM.x1} y={STEM.y1} t={s.brokerRipple} color={C.lineLive} />
      ) : null}

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${sfxFile(e)}`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

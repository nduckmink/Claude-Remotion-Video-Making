import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Chute } from "../../components/Chute";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Hud } from "../../components/Hud";
import { Press } from "../../components/Press";
import { TaskBlock } from "../../components/TaskBlock";
import { Worker } from "../../components/Worker";
import { loopPhase } from "../../lib/anim";
import { C, F, idColor } from "../../lib/tokens";
import { BLOCK, CHUTE, DEPTH_HUD, LOOP, PRESS, TITLE, TREAD_K, WORKERS, WORKER_R } from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

const PRESS_COLOR = idColor(0, 4); // producer
const WORK_COLOR = [idColor(2, 4), idColor(3, 4)]; // worker 1 · worker 2
const VOL: Record<Ev["kind"], number> = { emit: 0.5, attach: 0.5, arrive: 0.4, fill: 0.8, fail: 0.9, drop: 0.75, slow: 0.7, travel: 0.3 };

export const MessageQueue: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* MÁNG = hàng đợi */}
      <Chute x={CHUTE.x} topY={CHUTE.topY} botY={CHUTE.botY} width={CHUTE.w} tread={loopPhase(frame, LOOP, TREAD_K)} warn={s.warn} />

      {/* MÁY DẬP */}
      <Press x={PRESS.x} y={PRESS.y} w={PRESS.w} h={PRESS.h} punch={s.press} accent={PRESS_COLOR} />

      {s.workers.map((w, i) =>
        w.present > 0.01 ? (
          <Worker
            key={`w${i}`}
            x={WORKERS[i].x}
            y={WORKERS[i].y}
            r={WORKER_R}
            label={`worker ${i + 1}`}
            accent={WORK_COLOR[i]}
            present={w.present}
            busy={w.busy}
            prog={w.prog}
            spin={w.busy > 0.5 ? frame * 4 : 0}
          />
        ) : null,
      )}

      {/* TASK — chờ trong máng / bay tới worker / đang xử lý */}
      {s.tasks.map((t) => (
        <TaskBlock key={t.id} x={t.x} y={t.y} w={BLOCK.w} h={BLOCK.h} id={t.id} state={t.state} tint={WORK_COLOR[t.w] ?? C.lineLive} prog={t.prog} scale={t.scale} opacity={t.opacity} />
      ))}

      {/* CON SỐ KỂ CHUYỆN: độ sâu hàng đợi */}
      <Hud x={DEPTH_HUD.x} y={DEPTH_HUD.y} value={String(s.depth)} label={"queue depth\nmessages waiting"} warn={s.warn} />

      {/* Số worker đang chạy */}
      <Hud
        x={DEPTH_HUD.x}
        y={DEPTH_HUD.y + 214}
        w={250}
        value={String(s.workers.filter((w) => w.present > 0.5).length)}
        label={"workers\nconsuming"}
        accent={WORK_COLOR[1]}
      />

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, top: 1808, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        queue absorbs the spike · add workers to drain
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

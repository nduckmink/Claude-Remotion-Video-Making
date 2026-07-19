import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Node } from "../../components/Node";
import { Trampoline } from "../../components/Trampoline";
import { C, F, idColor } from "../../lib/tokens";
import {
  CLIENT,
  CLIENT_LABEL,
  COL,
  DB,
  DB_BOX,
  LABEL_SIZE,
  LAYER_LABEL,
  LAYER_SUB,
  LAYER_Y,
  LOOP,
  READ_KEY,
  STROKE,
  SUB_SIZE,
  TITLE,
} from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

/** Màu theo tầng. Hai cache mang màu định danh; DB mang cam (brand). Read khi
 *  BẬT VỀ lấy đúng màu tầng đã phục vụ — cả dòng đổi cam→tím→xanh khi cache ấm. */
const CACHE_COLOR = [idColor(0, 2), idColor(1, 2)]; // client-cache (xanh), redis (tím)
const CATCH_COLOR = [idColor(0, 2), idColor(1, 2), C.brand]; // client · redis · DB(cam)

const sfxFile = (e: Ev) => `${e.kind}.wav`;
const VOL: Record<Ev["kind"], number> = {
  emit: 0.6,
  bounce: 0.85,
  arrive: 0.7,
  fall: 0.6,
  fill: 0.8,
  slow: 1,
};

export const CachingLayers: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      <Node
        x={CLIENT.x}
        y={CLIENT.y}
        w={CLIENT.w}
        h={CLIENT.h}
        label={CLIENT_LABEL}
        sub={READ_KEY}
        labelSize={LABEL_SIZE}
        subSize={SUB_SIZE}
        strokeWidth={STROKE}
        live={s.clientLive}
      />

      {/* Hai tầng cache = màng trampoline. Rách (miss) ↔ căng (hit). */}
      {[0, 1].map((L) => {
        const lay = s.layers[L];
        return (
          <div key={`layer-${L}`}>
            <Trampoline
              x0={COL.x0}
              x1={COL.x1}
              y={LAYER_Y[L]}
              taut={lay.taut}
              dip={lay.dip}
              dipX={lay.dipX}
              color={CACHE_COLOR[L]}
              width={STROKE}
              opacity={s.vis}
            />
            {/* Nhãn tầng — trái cột. */}
            <div
              style={{
                position: "absolute",
                left: COL.x0 - 210,
                top: LAYER_Y[L] - 34,
                width: 190,
                textAlign: "right",
                opacity: s.vis,
              }}
            >
              <div style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: "0.06em", color: lay.taut > 0.5 ? C.text : C.textDim, textTransform: "uppercase" }}>
                {LAYER_LABEL[L]}
              </div>
              <div style={{ fontFamily: F.mono, fontSize: SUB_SIZE, color: C.textFaint }}>{LAYER_SUB[L]}</div>
            </div>
          </div>
        );
      })}

      {/* DATABASE — sàn cứng, nguồn sự thật. Squash nhẹ khi bị đập. */}
      <div
        style={{
          transform: `scaleY(${1 - 0.04 * s.layers[DB].bounceFlash})`,
          transformOrigin: `center ${DB_BOX.y}px`,
        }}
      >
        <Node
          x={DB_BOX.x}
          y={DB_BOX.y}
          w={DB_BOX.w}
          h={DB_BOX.h}
          label={LAYER_LABEL[DB]}
          sub={LAYER_SUB[DB]}
          labelSize={LABEL_SIZE}
          subSize={SUB_SIZE}
          strokeWidth={STROKE}
          radius={4}
          opacity={s.vis}
          live={s.layers[DB].bounceFlash}
          flash={s.layers[DB].bounceFlash}
        />
      </div>

      {/* DÒNG read — VÒNG TRÒN RỖNG, hơi lệch trục. Rơi = TRẮNG (chưa biết tầng
          nào trả lời). Bật về = màu tầng đã phục vụ: cam(DB)·tím(redis)·xanh(client). */}
      {s.balls.map((b, k) => {
        const col = b.rising ? CATCH_COLOR[b.catch] : C.data;
        return (
          <div
            key={`ball-${k}`}
            style={{
              position: "absolute",
              left: b.x - 19,
              top: b.y - 19,
              width: 38,
              height: 38,
              borderRadius: 999,
              border: `4px solid ${col}`,
              boxShadow: `0 0 14px ${col}66`,
              opacity: b.opacity,
            }}
          />
        );
      })}

      {/* Bộ đếm DB QUERY — cache lạnh thì cứ LEO (mọi read đập DB); cache ấm thì
          ĐỨNG IM. Con số đứng lại chính là "cache đã đỡ cho database". */}
      <div
        style={{
          position: "absolute",
          left: DB_BOX.x + DB_BOX.w + 30,
          top: DB_BOX.y + 34,
          opacity: s.vis,
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: "0.1em", color: C.textDim, textTransform: "uppercase" }}>
          db queries
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 58,
            color: C.brand,
            transform: `scale(${1 + 0.12 * s.dbQueryFlash})`,
            transformOrigin: "left center",
            textShadow: s.dbQueryFlash > 0.02 ? `0 0 20px ${C.brand}aa` : undefined,
          }}
        >
          {s.dbQueries}
        </div>
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${sfxFile(e)}`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};


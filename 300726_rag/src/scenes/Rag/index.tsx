import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ChunkCard } from "../../components/ChunkCard";
import { DocPage } from "../../components/DocPage";
import { Embedder } from "../../components/Embedder";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Llm } from "../../components/Llm";
import { VectorMap } from "../../components/VectorMap";
import { C, F, idColor, nodeGlow } from "../../lib/tokens";
import { ANSWER, ANSWER_TEXT, CARD, CHUNKS, DOC, DOC_NAME, EMB, LLM, LOOP, MAP, QUERY, Q_CARD, TITLE } from "./constants";
import { EVENTS, STATES, type Ev } from "./sim";

const TOPIC = [idColor(0, 4), idColor(2, 4)]; // hai chủ đề = hai danh tính
const EMB_COLOR = idColor(1, 4);
const LLM_COLOR = idColor(3, 4);
const VOL: Record<Ev["kind"], number> = { emit: 0.45, attach: 0.7, arrive: 0.55, fill: 0.6, fail: 0.9, drop: 0.7, slow: 0.7, travel: 0.3 };

export const Rag: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[Math.min(frame, LOOP)];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <GridBg />
      <Header title={TITLE} />

      {/* BẢN ĐỒ VECTOR + vòng tìm */}
      <VectorMap x={MAP.x} y={MAP.y} w={MAP.w} h={MAP.h} search={s.search} accent={C.pass} opacity={s.mapOn} />

      {/* TÀI LIỆU nguồn */}
      {s.doc.opacity > 0.01 && (
        <DocPage
          x={DOC.x}
          y={DOC.y}
          w={DOC.w}
          h={DOC.h}
          name={DOC_NAME}
          lines={CHUNKS.map((c) => c.text)}
          gone={s.doc.gone}
          topicColor={CHUNKS.map((c) => TOPIC[c.topic])}
          opacity={s.doc.opacity}
        />
      )}

      {/* EMBEDDER — tài liệu VÀ câu hỏi cùng đi qua đây */}
      <Embedder x={EMB.x} y={EMB.y} w={EMB.w} h={EMB.h} active={s.emb.active} accent={EMB_COLOR} />

      {/* LLM */}
      {s.llm.present > 0.01 && <Llm x={LLM.x} y={LLM.y} w={LLM.w} h={LLM.h} present={s.llm.present} work={s.llm.work} fed={s.llm.fed} accent={LLM_COLOR} />}

      {/* BẢN GỐC ở lại DB khi đoạn được lấy ra — retrieval chỉ ĐỌC, không xoá */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {s.chunks.map((c) =>
          c.ghost > 0.01 ? <circle key={`gh${c.i}`} cx={c.gx} cy={c.gy} r={11} fill={C.pass} opacity={c.ghost * 0.42} style={{ filter: `drop-shadow(0 0 7px ${C.pass}66)` }} /> : null,
        )}
      </svg>

      {/* CHUNK — thẻ chữ ↔ chấm vector, cùng một vật */}
      {s.chunks.map((c) =>
        c.present && c.opacity > 0.01 ? (
          <ChunkCard
            key={c.i}
            x={c.x}
            y={c.y}
            w={CARD.w}
            h={CARD.h}
            text={CHUNKS[c.i].text}
            color={TOPIC[CHUNKS[c.i].topic]}
            asDot={c.asDot}
            scale={c.scale}
            opacity={c.opacity}
            selected={c.selected}
            showLabel
          />
        ) : null,
      )}

      {/* CÂU HỎI — cùng đường ống, thành chấm cùng loại */}
      {s.query.present && s.query.opacity > 0.01 && (
        <ChunkCard x={s.query.x} y={s.query.y} w={Q_CARD.w} h={Q_CARD.h} text={QUERY} color={C.data} asDot={s.query.asDot} scale={s.query.scale} opacity={s.query.opacity} />
      )}

      {/* CÂU TRẢ LỜI */}
      {s.answer.present && s.answer.opacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: ANSWER.x - ANSWER.w / 2,
            top: ANSWER.y - ANSWER.h / 2,
            width: ANSWER.w,
            height: ANSWER.h,
            transform: `scale(${0.88 + 0.12 * s.answer.grow})`,
            transformOrigin: "center",
            opacity: s.answer.opacity,
            borderRadius: 14,
            background: C.bgPanel,
            border: `2px solid ${C.pass}`,
            boxSizing: "border-box",
            boxShadow: nodeGlow(C.pass, 0.55),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: "0.18em", color: C.textDim, textTransform: "uppercase" }}>answer</span>
          {ANSWER_TEXT.map((t) => (
            <span key={t} style={{ fontFamily: F.mono, fontSize: 21, color: C.text, whiteSpace: "nowrap" }}>{t}</span>
          ))}
        </div>
      )}

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, top: 1808, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.14em", color: C.textFaint, textTransform: "uppercase" }}>
        same space · nearest wins · llm reads them
      </div>

      {EVENTS.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
          <Audio src={staticFile(`sfx/${e.kind}.wav`)} volume={VOL[e.kind]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

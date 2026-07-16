import { Fragment } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Node } from "../../components/Node";
import { Packet } from "../../components/Packet";
import { StatBar } from "../../components/StatBar";
import { C, F } from "../../lib/tokens";
import {
  APP_CX,
  APP_X,
  AXIS,
  BAR,
  BATCH_CX,
  BATCH_IN,
  BATCH_X,
  CLIENT,
  CLIENT_BOTTOM,
  GATE,
  GATE_CY,
  INSIGHT_Y,
  LIMIT_IN,
  LOOP,
  MAX_MS,
  MERGE_DIST,
  PACKET,
  RESET,
  SERVER,
  TITLE,
} from "./constants";
import { appTrips, BASE_MS, PEAK_MS, STATES } from "./sim";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Câu chốt TÍNH RA từ mô phỏng, không gõ tay: app chưa từng ăn một cái 429
// nào — tỷ lệ lỗi của nó y hệt trước và sau. Thứ duy nhất đổi là latency.
const INSIGHT = `app · 0% → 0% rejected · ${PEAK_MS}ms → ${BASE_MS}ms`;

// Điểm hai nhánh gặp trục — packet đi đúng đường này (sim lerp x tuyến tính
// theo y), nên đường vẽ phải TRÙNG KHÍT đường bay. Vẽ một đằng bay một nẻo
// là nói dối người xem.
const MERGE_Y = GATE_CY + MERGE_DIST;

const pct = (v: number) => `${Math.round(v * 100)}%`;

export const RateLimit: React.FC = () => {
  const frame = useCurrentFrame();
  // % LOOP chứ không clamp: mô phỏng CHÍNH LÀ vòng lặp. Nó bắt đầu và kết
  // thúc ở cùng một trạng thái (hàng đợi rỗng, server rỗi — verify.ts kiểm),
  // nên frame 600 quay về đúng frame 0.
  const s = STATES[frame % LOOP];


  // Batch phải hiện TRƯỚC lúc nó bắn phát đầu (f=BATCH_IN), và chỉ tan sau
  // khi packet cuối của nó về đích (~f574) — nếu không sẽ có packet mồ côi
  // bay ra từ hư không.
  const batchOp = interpolate(
    frame,
    [BATCH_IN - 16, BATCH_IN, 576, 596],
    [0, 1, 1, 0],
    CLAMP,
  );
  // Gate sập xuống nhanh (8f) rồi đá 429 ngay — cú vào phải dứt khoát.
  const gateOp = interpolate(
    frame,
    [LIMIT_IN - 8, LIMIT_IN, RESET, RESET + 16],
    [0, 1, 1, 0],
    CLAMP,
  );
  const insightOp = interpolate(
    frame,
    [532, 546, RESET, RESET + 10],
    [0, 1, 1, 0],
    CLAMP,
  );

  // ─── Luật đèn rọi: accent = thứ ĐANG xảy ra ──────────────────────────
  // Act 1: chẳng có gì → không accent.
  // Act 2: hàng đợi dồn → latency là nỗi đau → latency accent.
  // Act 3: 429 bay → batch trả giá → batch accent.
  // Hàng app thì KHÔNG BAO GIỜ sáng. Đó chính là cú chốt.
  //
  // Ngưỡng 2 chứ không phải 1: một gói đang chờ trong khi server làm gói
  // khác là vận hành BÌNH THƯỜNG, không phải nghẽn. Lấy ngưỡng 1 thì act 3
  // thanh này nhấp nháy theo dao động 0–1 — rọi đèn vào chỗ không có chuyện gì.
  const latLive = s.queueLen >= 2;
  const batchRejLive = s.batchRej > 0.01;

  return (
    <AbsoluteFill>
      <GridBg />

      <Header title={TITLE} />

      {/* Đường đi — trùng khít đường bay của packet trong sim */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <path
          d={`M ${APP_CX} ${CLIENT_BOTTOM} L ${APP_CX} ${GATE_CY} L ${AXIS} ${MERGE_Y}`}
          fill="none"
          stroke={C.line}
          strokeWidth={1.5}
        />
        <path
          d={`M ${BATCH_CX} ${CLIENT_BOTTOM} L ${BATCH_CX} ${GATE_CY} L ${AXIS} ${MERGE_Y}`}
          fill="none"
          stroke={C.line}
          strokeWidth={1.5}
          opacity={batchOp}
        />
        <path
          d={`M ${AXIS} ${MERGE_Y} L ${AXIS} ${SERVER.y}`}
          fill="none"
          stroke={C.line}
          strokeWidth={1.5}
        />
      </svg>

      <Node
        x={APP_X}
        y={CLIENT.y}
        w={CLIENT.w}
        h={CLIENT.h}
        label="app"
        sub="8 req/s"
        radius={16}
      />
      <div style={{ opacity: batchOp }}>
        <Node
          x={BATCH_X}
          y={CLIENT.y}
          w={CLIENT.w}
          h={CLIENT.h}
          label="batch"
          sub="40 req/s"
          radius={16}
        />
      </div>

      {/* Gate cắt ngang CẢ HAI nhánh — limiter đếm riêng từng client */}
      <div style={{ opacity: gateOp }}>
        <Node
          x={GATE.x}
          y={GATE.y}
          w={GATE.w}
          h={GATE.h}
          radius={8}
          live={s.gateFlash > 0.02 ? 1 : 0}
        />
        <div
          style={{
            position: "absolute",
            left: GATE.x,
            top: GATE.y,
            width: GATE.w,
            height: GATE.h,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.mono,
            fontSize: 22,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.text,
          }}
        >
          rate limit · 10 req/s each
        </div>
      </div>

      {/* Server: góc cạnh, nặng — và nhịp của nó KHÔNG BAO GIỜ đổi.
          Nó chỉ sáng lên lúc đang làm việc. Act 1 nó nhấp nháy vì rỗi
          phần lớn thời gian; act 2 nó sáng liên tục mà vẫn không kịp. */}
      <Node
        x={SERVER.x}
        y={SERVER.y}
        w={SERVER.w}
        h={SERVER.h}
        label="server"
        sub="1 req / 25ms"
        radius={4}
        live={s.serverLive ? 1 : 0}
      />

      {/* Packet — accent CHỈ dành cho 429, thứ đang thật sự xảy ra */}
      {s.items.map((it) => (
        <Packet
          key={it.id}
          x={it.x}
          y={it.y}
          size={PACKET}
          color={it.kind === "bounce" ? C.accent : C.data}
          opacity={it.fade}
        />
      ))}

      <StatBar
        x={BAR.x}
        y={BAR.latY}
        track={BAR.track}
        h={BAR.h}
        label="latency"
        note={`${s.queueLen} queued`}
        value={`${s.latencyMs}ms`}
        fill={s.latencyMs / MAX_MS}
        live={latLive}
      />
      <StatBar
        x={BAR.x}
        y={BAR.appY}
        track={BAR.track}
        h={BAR.h}
        label="app · rejected"
        value={pct(s.appRej)}
        fill={s.appRej}
        live={false}
      />
      <div style={{ opacity: batchOp }}>
        <StatBar
          x={BAR.x}
          y={BAR.batchY}
          track={BAR.track}
          h={BAR.h}
          label="batch · rejected"
          value={pct(s.batchRej)}
          fill={s.batchRej}
          live={batchRejLive}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          top: INSIGHT_Y,
          width: "100%",
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 26,
          color: C.textDim,
          opacity: insightOp,
        }}
      >
        {INSIGHT}
      </div>

      {/* SFX: chỉ vòng đời request của APP — hỏi (query) rồi đáp (hit).
          Khoảng giữa hai tiếng CHÍNH LÀ latency của app, và nó giãn từ
          1.23s lên 2.63s rồi co về đúng 1.23s. Đo bằng sim, không gõ tay.
          Batch câm lặng: nó là tiếng ồn, mà tiếng ồn không có tiếng nói. */}
      {appTrips.map(({ fire, done }) => (
        <Fragment key={fire}>
          <Sequence from={fire} durationInFrames={4} layout="none">
            <Audio src={staticFile("query.wav")} />
          </Sequence>
          <Sequence from={done} durationInFrames={6} layout="none">
            <Audio src={staticFile("hit.wav")} />
          </Sequence>
        </Fragment>
      ))}
    </AbsoluteFill>
  );
};

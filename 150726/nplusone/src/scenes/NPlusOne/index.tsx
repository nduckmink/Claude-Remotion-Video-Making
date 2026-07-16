import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Connector } from "../../components/Connector";
import { Cylinder } from "../../components/Cylinder";
import { GridBg } from "../../components/GridBg";
import { Header } from "../../components/Header";
import { Node } from "../../components/Node";
import { Packet } from "../../components/Packet";
import { RowCard } from "../../components/RowCard";
import { StatBar } from "../../components/StatBar";
import { breathe } from "../../lib/motion";
import { C, F } from "../../lib/tokens";
import {
  A1_END,
  A1_MS,
  A1_START,
  A1_TRIPS,
  A2_END,
  A2_MS,
  A2_START,
  A2_TRIPS,
  APP,
  AUTHORS,
  BAR,
  DB,
  EYEBROW_L,
  EYEBROW_R,
  FLIP_START,
  INSIGHT,
  INSIGHT_Y,
  AXIS,
  LINE_Y0,
  LINE_Y1,
  PAYOFF_START,
  PX_PER_MS,
  RESET_START,
  ROW,
  ROW_STAGGER_A1,
  ROW_STAGGER_A2,
  ROWS,
  SQL,
  SQL_BATCH,
  SQL_LIST,
  sqlAuthor,
  TITLE,
  TRIP,
  TRIP_DOWN,
} from "./constants";
import { tripAt } from "./trip";

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ─── SFX: MỘT TIẾNG = MỘT SỰ KIỆN ────────────────────────────────────
// Luật ở Resource/motion_language.md. Không tiếng nào tồn tại mà không ứng
// với một round trip có thật. Nhịp tự kể chuyện: Act 1 kêu 9 lần suốt 6.3s,
// Act 2 kêu 2 lần rồi im 2.7s — khoảng chết từ chỗ NHÌN THẤY thành NGHE THẤY.
//
// Âm thanh KHÔNG mang thông tin: feed autoplay tắt tiếng, video phải hiểu
// trọn vẹn khi câm. Đây chỉ là thưởng thêm cho ai bật loa.
//
// File sinh bằng toán, không sample pack — xem scripts/gen-sfx.mjs.
type Sfx = { key: string; frame: number; src: string };

const sfx: Sfx[] = [];
const emitSfx = (act: string, start: number, count: number) => {
  for (let i = 0; i < count; i++) {
    const f = start + i * TRIP;
    sfx.push({ key: `${act}-q${i}`, frame: f, src: "query.wav" });
    sfx.push({ key: `${act}-h${i}`, frame: f + TRIP_DOWN, src: "hit.wav" });
  }
};
emitSfx("a1", A1_START, A1_TRIPS); // 9 round trip
emitSfx("a2", A2_START, A2_TRIPS); // 2 round trip

// Sự kiện cuối ở f273 + đuôi 75ms → im lặng tuyệt đối từ ~f276 tới f360.
// Biên loop PHẢI im: tai bắt mối nối giỏi hơn mắt nhiều.
const SFX_HOLD = 6; // frames — dài hơn tiếng dài nhất (75ms ≈ 2.3f), không cắt cụt

// Từng có một "request" rơi từ ngoài khung vào APP. Đã bỏ, vì hai lý do:
//   1. Nó bay xuyên vùng header — vùng đó bất khả xâm phạm.
//   2. Nó là HTTP request: một diễn viên thứ ba mà scene không bao giờ giải
//      thích. Scene này là APP hỏi DB. Request tới từ đâu là chuyện ngoài
//      phạm vi, và nó không giúp người xem hiểu thêm gì về N+1.
// Cú reset loop không cần nó motivate: row tan + thanh rút cạn đã đọc ra
// "chạy lại" rồi.

export const NPlusOne: React.FC = () => {
  const frame = useCurrentFrame();

  const a1 = tripAt(frame, A1_START, A1_TRIPS);
  const a2 = tripAt(frame, A2_START, A2_TRIPS);
  const trip = a1 ?? a2;

  // Packet của list query luôn TRẮNG ở cả hai act — nó là số "1" trong "N+1",
  // thứ duy nhất hai bên dùng chung, và không phải thứ đang được giải thích.
  // Chỉ phần "N" mới được mặc accent.
  const isList = trip?.index === 0;
  const isBatch = Boolean(a2 && a2.index === 1);
  const packetColor = isList ? C.data : C.accent;

  // ─── Eyebrow = đồng hồ báo giai đoạn (thay hẳn phase tag) ────────────
  const side = interpolate(
    frame,
    [FLIP_START, A2_START, RESET_START, RESET_START + 12],
    [0, 1, 1, 0],
    CLAMP,
  );

  // ─── Scoreboard ──────────────────────────────────────────────────────
  const statsOp = interpolate(
    frame,
    [0, 8, RESET_START, RESET_START + 12],
    [0, 1, 1, 0],
    CLAMP,
  );
  const ms1 = interpolate(frame, [A1_START, A1_END], [0, A1_MS], CLAMP);
  const ms2 = interpolate(frame, [A2_START, A2_END], [0, A2_MS], CLAMP);
  const q1 =
    frame < A1_START
      ? 0
      : clamp(Math.floor((frame - A1_START) / TRIP) + 1, 0, A1_TRIPS);
  const q2 =
    frame < A2_START
      ? 0
      : clamp(Math.floor((frame - A2_START) / TRIP) + 1, 0, A2_TRIPS);
  const locked1 = interpolate(frame, [A1_END - 2, A1_END + 4], [0, 1], CLAMP);
  const locked2 = interpolate(frame, [A2_END - 2, A2_END + 4], [0, 1], CLAMP);

  // ─── SQL readout — đổi theo từng trip, đó chính là bằng chứng N+1 ────
  const isAct2 = frame >= FLIP_START;
  const sqlIdx = isAct2
    ? clamp(Math.floor((frame - A2_START) / TRIP), 0, A2_TRIPS - 1)
    : clamp(Math.floor((frame - A1_START) / TRIP), 0, A1_TRIPS - 1);
  const sqlText = isAct2
    ? sqlIdx === 0
      ? SQL_LIST
      : SQL_BATCH
    : sqlIdx === 0
      ? SQL_LIST
      : sqlAuthor(sqlIdx);
  const sqlOp = interpolate(
    frame,
    [
      8,
      14,
      A1_END - 2,
      A1_END + 4,
      A2_START - 4,
      A2_START + 2,
      A2_END + 2,
      A2_END + 8,
    ],
    [0, 1, 1, 0, 0, 1, 1, 0],
    CLAMP,
  );

  // ─── Khung SÁNG LÊN khi tham gia — không đổi màu. Accent để dành packet ──
  const dbLive = trip
    ? interpolate(trip.ripple, [0, 0.12, 1], [0, 1, 0], CLAMP)
    : 0;
  const dbScale = 1 + 0.008 * breathe(frame, 60); // 6 chu kỳ / 360 → seamless

  const insightOp = interpolate(
    frame,
    [PAYOFF_START + 6, PAYOFF_START + 18, RESET_START, RESET_START + 10],
    [0, 1, 1, 0],
    CLAMP,
  );

  return (
    <AbsoluteFill>
      {/* Không dùng ghost ở scene này: stage kín, chữ khổng lồ bị APP + vignette
          cắt vụn thành mấy mảng lem nhem — thêm nhiễu chứ không thêm chiều sâu.
          Để dành cho scene có khoảng trống thật. */}
      <GridBg />

      <Header
        left={EYEBROW_L}
        right={EYEBROW_R}
        side={side}
        title={TITLE}
      />

      <Node
        x={APP.x}
        y={APP.y}
        w={APP.w}
        h={APP.h}
        label="app"
        sub="/posts"
        live={trip ? 0.5 : 0}
      />

      {/* 8 record — ô author trống chính là lý do một query nữa phải bắn đi */}
      {Array.from({ length: ROWS }).map((_, i) => {
        const bornA1 = A1_START + TRIP + i * ROW_STAGGER_A1;
        const bornA2 = A2_END + i * ROW_STAGGER_A2;
        const op = interpolate(
          frame,
          [
            bornA1,
            bornA1 + 6,
            FLIP_START,
            FLIP_START + 12,
            bornA2,
            bornA2 + 6,
            RESET_START,
            RESET_START + 12,
          ],
          [0, 1, 1, 0, 0, 1, 1, 0],
          CLAMP,
        );
        if (op <= 0.01) return null;

        const useAct2 = frame >= FLIP_START + 12;
        const filled = useAct2 || frame >= A1_START + (i + 2) * TRIP;

        // Act 1: đúng MỘT row chờ tại một thời điểm — nối đuôi nhau.
        // Act 2: không row nào phải chờ; chúng đáp xuống đã đầy sẵn.
        const waiting =
          !useAct2 && a1 && a1.index === i + 1
            ? interpolate(a1.local, [0, 3, 18, TRIP], [0, 1, 1, 0], CLAMP)
            : 0;

        return (
          <RowCard
            key={i}
            x={ROW.x}
            y={ROW.y0 + i * (ROW.h + ROW.gap)}
            w={ROW.w}
            h={ROW.h}
            index={i}
            author={filled ? AUTHORS[i] : null}
            waiting={waiting}
            opacity={op}
          />
        );
      })}

      <Connector x={AXIS} y0={LINE_Y0} y1={LINE_Y1} live={trip ? 1 : 0} />

      {/* SQL readout nằm TRONG APP — chính APP phát ra query này */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: SQL.y,
          width: "100%",
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: SQL.size,
          color: C.textDim,
          opacity: sqlOp,
          whiteSpace: "nowrap",
          letterSpacing: "0.02em",
        }}
      >
        {sqlText}
      </div>

      <Cylinder
        x={DB.x}
        y={DB.y}
        w={DB.w}
        h={DB.h}
        label="db"
        sub="posts · authors"
        live={dbLive}
        scale={dbScale}
      />

      {/* ripple: DB phản ứng đúng lúc packet chạm — không gì đi xuyên qua mà hệ thống trơ ra */}
      {trip && trip.ripple > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: AXIS - 24,
            top: LINE_Y1 - 24,
            width: 48,
            height: 48,
            borderRadius: 999,
            border: `2px solid ${packetColor}`,
            scale: String(1 + trip.ripple * (isBatch ? 8 : 5)),
            opacity: (1 - trip.ripple) * 0.85,
          }}
        />
      ) : null}

      {trip ? (
        <Packet
          x={AXIS}
          y={trip.packetY}
          size={isBatch ? 42 : isList ? 34 : 26}
          color={packetColor}
          ring={isBatch}
        />
      ) : null}

      <StatBar
        x={BAR.x}
        y={BAR.row1Y}
        w={ms1 * PX_PER_MS}
        track={BAR.track}
        h={BAR.h}
        label="N+1 · lazy"
        queries={q1}
        ms={ms1}
        locked={locked1}
        opacity={statsOp}
      />
      <StatBar
        x={BAR.x}
        y={BAR.row2Y}
        w={ms2 * PX_PER_MS}
        track={BAR.track}
        h={BAR.h}
        label="eager · batched"
        queries={q2}
        ms={ms2}
        locked={locked2}
        opacity={statsOp}
      />

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

      {sfx.map((e) => (
        <Sequence
          key={e.key}
          from={e.frame}
          durationInFrames={SFX_HOLD}
          layout="none"
        >
          <Audio src={staticFile(e.src)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

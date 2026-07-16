import { Fragment } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { GridBg } from "../../../components/GridBg";
import { Header } from "../../../components/Header";
import { Node } from "../../../components/Node";
import { Packet } from "../../../components/Packet";
import { C, F } from "../../../lib/tokens";
import {
  C1_CX,
  C1_X,
  AXIS,
  C2_CX,
  C2_IN,
  C2_X,
  CLIENT,
  CLIENT_BOTTOM,
  GATE,
  GATE_CY,
  LIMIT_IN,
  LABEL,
  LOOP,
  MERGE_CP,
  MERGE_Y,
  MS_PER_SERVICE,
  PACKET,
  rejectAt,
  REJECT_TO,
  RESET,
  SERVER,
  TITLE,
} from "./constants";
import { c1Trips, STATES } from "./sim";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Đường đi tới: thẳng xuống tới gate, rồi cong S mềm vào trục.
 *
 * Điểm điều khiển đặt ở 1/3 và 2/3 chiều dọc là một mẹo có chủ đích: khi đó
 * y TUYẾN TÍNH theo tham số bezier, còn x rơi đúng vào smoothstep. Sim cho
 * packet rơi đều (y += SPEED) rồi lấy x = smoothstep — thế là packet bám
 * đường vẽ chính xác tới từng pixel, không cần đo lại đường cong.
 */
const outbound = (cx: number) =>
  [
    `M ${cx} ${CLIENT_BOTTOM}`,
    `V ${GATE_CY}`,
    `C ${cx} ${GATE_CY + MERGE_CP}, ${AXIS} ${MERGE_Y - MERGE_CP}, ${AXIS} ${MERGE_Y}`,
  ].join(" ");

/** Đường bật 429 — lấy thẳng từ rejectAt(), cùng hàm sim dùng để bay. */
const rejectPath = (owner: "c1" | "c2") => {
  const p0 = rejectAt(owner, 0);
  const to = REJECT_TO[owner];
  // Bezier bậc 2, điểm điều khiển ở góc (rx, GATE_CY) — đúng công thức rejectAt
  return `M ${p0.x} ${p0.y} Q ${to.x} ${GATE_CY}, ${to.x} ${to.y}`;
};

/**
 * Vòng chạy quanh viền server. MỘT vòng = MỘT request xử lý xong, và vòng
 * LUÔN dài đúng SERVICE frame — ở cả ba act, không bao giờ nhanh hơn hay
 * chậm hơn. Đó là chốt chặn của scene, giờ nhìn thấy được thay vì phải đọc.
 *
 * Act 1 vòng chạy rồi nghỉ dài — server rỗi phần lớn thời gian.
 * Act 2 vòng chạy liên tục không nghỉ — hết cỡ rồi mà hàng đợi vẫn dài ra.
 * Act 3 vòng lại có quãng nghỉ — và không ai phải chờ.
 *
 * pathLength=1 → dasharray/dashoffset tính theo tỷ lệ, không cần đo chu vi.
 */
// Rounded rect vẽ bằng <path>, KHÔNG phải <rect>: Chrome headless bỏ qua
// pathLength trên <rect> — ring không hiện một nét nào. Trên <path> thì chạy.
// Bắt đầu từ ĐỈNH GIỮA, chạy theo chiều kim đồng hồ — như mọi đồng hồ đo.
const RING_R = 4;
const ringPath = (w: number, h: number, i = 1.5) => {
  const r = RING_R;
  const x0 = i;
  const y0 = i;
  const x1 = w - i;
  const y1 = h - i;
  const cx = w / 2;
  return [
    `M ${cx} ${y0}`,
    `H ${x1 - r}`,
    `A ${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V ${y1 - r}`,
    `A ${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
    `H ${x0 + r}`,
    `A ${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V ${y0 + r}`,
    `A ${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
    `Z`,
  ].join(" ");
};

const ServerRing: React.FC<{ progress: number }> = ({ progress }) => {
  const d = ringPath(SERVER.w, SERVER.h);
  return (
    <svg
      width={SERVER.w}
      height={SERVER.h}
      style={{ position: "absolute", left: SERVER.x, top: SERVER.y }}
    >
      <path d={d} fill={C.bgPanel} stroke={C.line} strokeWidth={2} />
      {progress > 0.001 ? (
        <path
          d={d}
          fill="none"
          stroke={C.data}
          strokeWidth={4}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          style={{ filter: `drop-shadow(0 0 8px ${C.data}66)` }}
        />
      ) : null}
    </svg>
  );
};

export const RateLimitV2: React.FC = () => {
  const frame = useCurrentFrame();
  const s = STATES[frame % LOOP];

  const c2Op = interpolate(
    frame,
    [C2_IN - 16, C2_IN, 576, 596],
    [0, 1, 1, 0],
    CLAMP,
  );
  const gateOp = interpolate(
    frame,
    [LIMIT_IN - 8, LIMIT_IN, RESET, RESET + 16],
    [0, 1, 1, 0],
    CLAMP,
  );

  return (
    <AbsoluteFill>
      <GridBg />
      <Header title={TITLE} />

      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* Đường ĐI TỚI — hội tụ bằng cong S, trùng khít đường bay trong sim */}
        <path
          d={outbound(C1_CX)}
          fill="none"
          stroke={C.line}
          strokeWidth={1.5}
        />
        <path
          d={outbound(C2_CX)}
          fill="none"
          stroke={C.line}
          strokeWidth={1.5}
          opacity={c2Op}
        />
        <path
          d={`M ${AXIS} ${MERGE_Y} V ${SERVER.y}`}
          fill="none"
          stroke={C.line}
          strokeWidth={1.5}
        />

        {/* Đường TRẢ VỀ của 429 — cong riêng, văng ngang khỏi gate rồi vòng
            lên client. Tách hẳn đường đi tới.
            Client 1 có đường này y hệt client 2. Nó chỉ không bao giờ dùng tới.
            Cái làn trống ấy chính là cú chốt. */}
        <path
          d={rejectPath("c1")}
          fill="none"
          stroke={C.line}
          strokeWidth={1.5}
          opacity={gateOp}
        />
        <path
          d={rejectPath("c2")}
          fill="none"
          stroke={C.line}
          strokeWidth={1.5}
          opacity={gateOp * c2Op}
        />
      </svg>

      {/* Tên trung lập — hai client khác nhau ở NHỊP GỬI, không ở cái tên.
          Người xem tự thấy client 2 bắn nhanh gấp 5, không cần ai mách. */}
      <Node
        x={C1_X}
        y={CLIENT.y}
        w={CLIENT.w}
        h={CLIENT.h}
        label={LABEL.c1}
        sub="8 req/s"
        radius={16}
      />
      <div style={{ opacity: c2Op }}>
        <Node
          x={C2_X}
          y={CLIENT.y}
          w={CLIENT.w}
          h={CLIENT.h}
          label={LABEL.c2}
          sub="40 req/s"
          radius={16}
        />
      </div>

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

      <ServerRing progress={s.serverProgress} />
      <div
        style={{
          position: "absolute",
          left: SERVER.x,
          top: SERVER.y,
          width: SERVER.w,
          height: SERVER.h,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 34,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.text,
          }}
        >
          server
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.textDim }}>
          {`1 req / ${MS_PER_SERVICE}ms`}
        </div>
      </div>

      {/* Luật đèn rọi: accent = request KHÔNG được phục vụ.
          Đang xếp hàng (bị hoãn) hoặc bị đá về (bị từ chối) → accent.
          Đang bay hoặc đang được xử lý → trắng, nó vẫn đang tiến.
          Act 1 sạch bóng accent. Act 2 cả đống cam. Act 3 accent dạt sang
          làn trả về của client 2 — và làn của client 1 vẫn trống trơn. */}
      {s.items.map((it) => (
        <Packet
          key={it.id}
          x={it.x}
          y={it.y}
          size={PACKET}
          color={
            it.kind === "queue" || it.kind === "bounce" ? C.accent : C.data
          }
          opacity={it.fade}
        />
      ))}

      {/* SFX: chỉ vòng đời request của client 1 — hỏi rồi đáp. Khoảng giữa hai
          tiếng CHÍNH LÀ latency của client 1: giãn 1.07s → 2.47s rồi co về 1.07s. */}
      {c1Trips.map(({ fire, done }) => (
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


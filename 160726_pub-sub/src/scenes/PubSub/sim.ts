import {
  BROKER_CALM,
  BROKER_CALM_DUR,
  BROKER_DRAW,
  BROKER_DRAW_DUR,
  BROKER_HOLD,
  DASH_BLINK,
  DASH_IN,
  DASH_IN_DUR,
  DASH_OUT,
  DASH_OUT_DUR,
  DIAG,
  DIAG_FRAMES,
  DIAG_OUT,
  DIAG_OUT_DUR,
  LOOP,
  MISS_FLASH,
  N_INITIAL,
  N_TOTAL,
  PUBLISH_BROKER,
  PUBLISH_DIRECT,
  RECV_FLASH,
  RESET,
  RESET_DUR,
  RIPPLE_DUR,
  SEND_STAGGER,
  STEM,
  STEM_DRAW,
  STEM_DRAW_DUR,
  STEM_FRAMES,
  SVC4_IN,
  SVC4_IN_DUR,
  VERT,
  VERT_DRAW,
  VERT_DRAW_DUR,
  VERT_DRAW_STAGGER,
  VERT_FRAMES,
  segAt,
  type Seg,
} from "./constants";

/**
 * Mô phỏng thật, từng frame. Component chỉ ĐỌC STATES[frame] và vẽ.
 *
 * Không import lib/motion.ts: file đó kéo `Easing` từ remotion vào, mà
 * verify.ts chạy trong Node — bundle cả runtime browser vào là gãy.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (f: number, from: number, dur: number) => clamp01((f - from) / dur);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);

export type LinkRef =
  | { kind: "diag"; i: number }
  | { kind: "stem" }
  | { kind: "vert"; i: number };

/** Một packet đang bay trên một đoạn cụ thể, từ frame `start`. */
type Flight = {
  id: number;
  seg: Seg;
  start: number;
  frames: number;
  /** service đích, hoặc null nếu đích là broker */
  svc: number | null;
  link: LinkRef;
};

export type EvKind =
  | "publish" // publisher gửi MỘT lần (direct: 3 lần/round, pub/sub: 1)
  | "recv" // service nhận
  | "miss" // svc 4 không nhận được trong khi cả đám nhận
  | "svcIn" // svc 4 mọc ra
  | "wire" // một đường được nối
  | "brokerIn" // broker xuất hiện
  | "brokerHit"; // packet vào tới broker

export type Ev = { f: number; kind: EvKind; i?: number };

export type Item = { id: number; x: number; y: number };

export type State = {
  items: Item[];
  /** 0→1 loé TRẮNG: vừa nhận xong. Xong thì im, không ăn mừng. */
  svcFlash: number[];
  /** 0→1 nháy ACCENT: cả đám nhận mà svc 4 thì không. */
  svcMiss: number;
  svc4In: number;
  diag: number;
  dash: number;
  broker: number;
  brokerAccent: number;
  brokerLive: number;
  brokerRipple: number;
  /**
   * VẼ và HIỆN DIỆN là hai việc khác nhau, nên là hai số khác nhau.
   * Gộp làm một thì lúc reset đường sẽ TỰ RÚT LUI (draw tụt về 0) thay vì mờ
   * đi — dây thụt còn broker mờ, hai ẩn dụ đánh nhau ngay trong một cú fade.
   */
  stemDraw: number; // 0→1: đường đang được vẽ ra. Vẽ xong thì ở nguyên 1.
  stemOn: number; // opacity: đường có mặt trong khung hay không.
  vertDraw: number[];
  vertOn: number[];
  diagLive: number[];
  stemLive: number;
  vertLive: number[];
  pubLive: number;
};

/** Số lần publisher GỬI trong một round — con số kể chuyện của cả video. */
export type Round = { at: number; mode: "direct" | "broker"; sends: number };

const flights: Flight[] = [];
const events: Ev[] = [];
const rounds: Round[] = [];
const arrivals: { f: number; svc: number }[] = [];
const misses: number[] = [];

let nextId = 0;

const addFlight = (
  seg: Seg,
  start: number,
  frames: number,
  svc: number | null,
  link: LinkRef,
) => {
  flights.push({ id: nextId++, seg, start, frames, svc, link });
  if (svc !== null) arrivals.push({ f: start + frames, svc });
};

// ─── Direct: publisher tự nối tới từng service, và GỬI LẦN LƯỢT ────────
// Ba lần gửi so le SEND_STAGGER. Đây là chỗ khác biệt nằm: publisher gánh
// toàn bộ việc phát tán, và cái giá đó nghe được — ba tiếng tick, không phải một.
//
// LOOP nằm trong danh sách để trạng thái ở f=672 trùng khít f=0: ở đó cũng có
// đúng một packet vừa rời publisher. Đó là điều kiện seamless.
for (const p of [...PUBLISH_DIRECT, LOOP]) {
  let sends = 0;
  for (let i = 0; i < N_INITIAL; i++) {
    const start = p + i * SEND_STAGGER;
    addFlight(DIAG[i], start, DIAG_FRAMES[i], i, { kind: "diag", i });
    if (p < LOOP) events.push({ f: start, kind: "publish" });
    sends++;
  }
  if (p < LOOP) rounds.push({ at: p, mode: "direct", sends });

  // svc 4 đã mọc ra nhưng publisher KHÔNG BIẾT nó tồn tại → không có lần gửi
  // thứ tư. Nó nháy đúng lúc service cuối cùng trong đám nối sẵn sáng lên:
  // "cả nhà nhận rồi, còn mình thì không."
  if (p >= SVC4_IN && p < LOOP) {
    const lastArrival = Math.max(
      ...Array.from({ length: N_INITIAL }, (_, i) => p + i * SEND_STAGGER + DIAG_FRAMES[i]),
    );
    misses.push(lastArrival);
    events.push({ f: lastArrival, kind: "miss" });
  }
}

// ─── Pub/sub: publisher gửi MỘT lần. Broker mới là chỗ fan-out ─────────
// Cùng luật so le, nhưng nhịp so le đã CHUYỂN CHỖ — từ publisher sang broker.
// Nhìn chỗ nào có nhịp so le là biết ai đang gánh việc.
for (const p of PUBLISH_BROKER) {
  addFlight(STEM, p, STEM_FRAMES, null, { kind: "stem" });
  events.push({ f: p, kind: "publish" });
  rounds.push({ at: p, mode: "broker", sends: 1 });

  const hit = p + STEM_FRAMES;
  events.push({ f: hit, kind: "brokerHit" });

  for (let i = 0; i < N_TOTAL; i++) {
    const start = hit + BROKER_HOLD + i * SEND_STAGGER;
    addFlight(VERT[i], start, VERT_FRAMES[i], i, { kind: "vert", i });
  }
}

for (const a of arrivals) {
  if (a.f <= LOOP) events.push({ f: a.f, kind: "recv", i: a.svc });
}

events.push({ f: SVC4_IN, kind: "svcIn" });
events.push({ f: BROKER_DRAW, kind: "brokerIn" });
events.push({ f: STEM_DRAW, kind: "wire" });
for (let i = 0; i < N_TOTAL; i++) {
  events.push({ f: VERT_DRAW + i * VERT_DRAW_STAGGER, kind: "wire", i });
}

events.sort((a, b) => a.f - b.f);

/** Lịch SFX. Cửa sổ reset phải LẶNG — tai bắt mối nối giỏi hơn mắt nhiều. */
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET);

export const ROUNDS: Round[] = rounds;
export const ARRIVALS = arrivals;
export const MISSES = misses;

const flashAt = (times: number[], f: number, dur: number) => {
  let v = 0;
  for (const t of times) {
    if (f >= t && f < t + dur) v = Math.max(v, 1 - (f - t) / dur);
  }
  return v;
};

const simulate = (): State[] => {
  const out: State[] = [];

  for (let f = 0; f <= LOOP; f++) {
    const items: Item[] = [];
    const diagLive = Array.from({ length: N_TOTAL }, () => 0);
    const vertLive = Array.from({ length: N_TOTAL }, () => 0);
    let stemLive = 0;
    let pubLive = 0;

    for (const fl of flights) {
      if (f < fl.start || f > fl.start + fl.frames) continue;
      // Tới nơi rồi thì biến mất — service loé lên thay nó. State flip.
      if (f === fl.start + fl.frames) continue;

      const p = segAt(fl.seg, (f - fl.start) / fl.frames);
      items.push({ id: fl.id, x: p.x, y: p.y });

      if (fl.link.kind === "diag") diagLive[fl.link.i] = 1;
      else if (fl.link.kind === "vert") vertLive[fl.link.i] = 1;
      else stemLive = 1;

      if (fl.link.kind !== "vert") pubLive = 1;
    }

    // Broker đang giữ packet: từ lúc nó vào tới lúc lần phát cuối rời đi.
    let brokerLive = 0;
    let brokerRipple = -1;
    for (const p of PUBLISH_BROKER) {
      const hit = p + STEM_FRAMES;
      const lastEmit = hit + BROKER_HOLD + (N_TOTAL - 1) * SEND_STAGGER;
      if (f >= hit && f <= lastEmit) brokerLive = 1;
      if (f >= hit && f < hit + RIPPLE_DUR) brokerRipple = (f - hit) / RIPPLE_DUR;
    }

    const resetT = ramp(f, RESET, RESET_DUR);

    // Nan quạt: có → tan lúc tái nối → hiện lại trong cửa sổ reset.
    // f=0 và f=672 cùng ra 1 — đó là điều kiện seamless.
    const diag = clamp01(1 - ramp(f, DIAG_OUT, DIAG_OUT_DUR) + resetT);

    const dashBase =
      ramp(f, DASH_IN, DASH_IN_DUR) * (1 - ramp(f, DASH_OUT, DASH_OUT_DUR));
    const blink = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin((2 * Math.PI * f) / DASH_BLINK));

    out.push({
      items,
      svcFlash: Array.from({ length: N_TOTAL }, (_, i) =>
        flashAt(
          arrivals.filter((a) => a.svc === i).map((a) => a.f),
          f,
          RECV_FLASH,
        ),
      ),
      svcMiss: flashAt(misses, f, MISS_FLASH),
      svc4In: easeOut(ramp(f, SVC4_IN, SVC4_IN_DUR)) * (1 - resetT),
      diag,
      dash: dashBase * blink,
      broker: ramp(f, BROKER_DRAW, BROKER_DRAW_DUR) * (1 - resetT),
      brokerAccent:
        ramp(f, BROKER_DRAW, BROKER_DRAW_DUR) *
        (1 - ramp(f, BROKER_CALM, BROKER_CALM_DUR)),
      brokerLive,
      brokerRipple,
      stemDraw: ramp(f, STEM_DRAW, STEM_DRAW_DUR),
      stemOn: (f >= STEM_DRAW ? 1 : 0) * (1 - resetT),
      vertDraw: Array.from({ length: N_TOTAL }, (_, i) =>
        ramp(f, VERT_DRAW + i * VERT_DRAW_STAGGER, VERT_DRAW_DUR),
      ),
      vertOn: Array.from(
        { length: N_TOTAL },
        (_, i) => (f >= VERT_DRAW + i * VERT_DRAW_STAGGER ? 1 : 0) * (1 - resetT),
      ),
      diagLive,
      stemLive,
      vertLive,
      pubLive,
    });
  }

  return out;
};

export const STATES = simulate();

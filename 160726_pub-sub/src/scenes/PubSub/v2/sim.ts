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
  SNAP_DUR,
  SPOKE,
  SPOKE_DRAW_DUR,
  SPOKE_FRAMES,
  STEM,
  STEM_DRAW,
  STEM_DRAW_DUR,
  STEM_FRAMES,
  SUB_FLY,
  SUB_FLY_FRAMES,
  SVC4_IN,
  SVC4_IN_DUR,
  attachAt,
  attachPt,
  segAt,
  spokeReady,
  subFlyStart,
  type Seg,
} from "./constants";

/**
 * Mô phỏng thật, từng frame. Component chỉ ĐỌC STATES[frame] và vẽ.
 * Không import lib/motion.ts — file đó kéo `Easing` của remotion vào, mà
 * verify.ts chạy trong Node.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (f: number, from: number, dur: number) => clamp01((f - from) / dur);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);

export type LinkRef =
  | { kind: "diag"; i: number }
  | { kind: "stem" }
  | { kind: "spoke"; i: number };

type Flight = {
  id: number;
  seg: Seg;
  start: number;
  frames: number;
  svc: number | null;
  link: LinkRef;
};

export type EvKind =
  | "publish"
  | "recv"
  | "miss"
  | "svcIn"
  | "subscribe"
  | "attach"
  | "wire"
  | "brokerIn"
  | "brokerHit";

export type Ev = { f: number; kind: EvKind; i?: number };

/** Một phong bì đang bay. `svc = null` → thư CHƯA CÓ ĐỊA CHỈ (trắng). */
export type Msg = { id: number; x: number; y: number; svc: number | null };

/** Chốt subscription đang bay lên topic. */
export type Token = { i: number; x: number; y: number };

export type State = {
  msgs: Msg[];
  flying: Token[];
  /** Chốt đã cắm vào vành broker: 0→1 độ hiện, kèm `snap` là ring loé. */
  attached: number[];
  snap: number[];
  svcFlash: number[];
  svcMiss: number;
  svc4In: number;
  diag: number;
  dash: number;
  broker: number;
  brokerAccent: number;
  brokerLive: number;
  brokerRipple: number;
  stemDraw: number;
  stemOn: number;
  spokeDraw: number[];
  spokeOn: number[];
  diagLive: number[];
  stemLive: number;
  spokeLive: number[];
  pubLive: number;
};

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
// Mỗi phong bì rời publisher ĐÃ MANG MÀU của người nhận: gửi trực tiếp thì
// publisher phải biết đích danh từng đứa. Ba lần gửi, ba tiếng tick.
//
// LOOP nằm trong danh sách để f=672 trùng khít f=0 — điều kiện seamless.
for (const p of [...PUBLISH_DIRECT, LOOP]) {
  for (let i = 0; i < N_INITIAL; i++) {
    const start = p + i * SEND_STAGGER;
    addFlight(DIAG[i], start, DIAG_FRAMES[i], i, { kind: "diag", i });
    if (p < LOOP) events.push({ f: start, kind: "publish" });
  }
  if (p < LOOP) rounds.push({ at: p, mode: "direct", sends: N_INITIAL });

  // svc 4 đã mọc ra nhưng publisher KHÔNG BIẾT nó tồn tại → không có lần gửi
  // thứ tư. Nó nháy đúng lúc service cuối trong đám nối sẵn sáng lên.
  if (p >= SVC4_IN && p < LOOP) {
    const last = Math.max(
      ...Array.from(
        { length: N_INITIAL },
        (_, i) => p + i * SEND_STAGGER + DIAG_FRAMES[i],
      ),
    );
    misses.push(last);
    events.push({ f: last, kind: "miss" });
  }
}

// ─── Đăng ký: service tự mang chốt bay lên cắm vào topic ──────────────
for (let i = 0; i < N_TOTAL; i++) {
  events.push({ f: subFlyStart(i), kind: "subscribe", i });
  events.push({ f: attachAt(i), kind: "attach", i });
  events.push({ f: attachAt(i), kind: "wire", i });
}
events.push({ f: STEM_DRAW, kind: "wire" });

// ─── Pub/sub: publisher gửi MỘT phong bì, KHÔNG địa chỉ ───────────────
// Broker mới là chỗ dán địa chỉ và nhân bản. Nhịp so le đã chuyển chỗ —
// từ publisher sang broker.
for (const p of PUBLISH_BROKER) {
  addFlight(STEM, p, STEM_FRAMES, null, { kind: "stem" });
  events.push({ f: p, kind: "publish" });
  rounds.push({ at: p, mode: "broker", sends: 1 });

  const hit = p + STEM_FRAMES;
  events.push({ f: hit, kind: "brokerHit" });

  // Phong bì ra khỏi topic qua ĐÚNG cái chốt của từng subscriber.
  for (let i = 0; i < N_TOTAL; i++) {
    const start = hit + BROKER_HOLD + i * SEND_STAGGER;
    addFlight(SPOKE[i], start, SPOKE_FRAMES[i], i, { kind: "spoke", i });
  }
}

for (const a of arrivals) {
  if (a.f <= LOOP) events.push({ f: a.f, kind: "recv", i: a.svc });
}
events.push({ f: SVC4_IN, kind: "svcIn" });
events.push({ f: BROKER_DRAW, kind: "brokerIn" });
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
    const resetT = ramp(f, RESET, RESET_DUR);

    const msgs: Msg[] = [];
    const diagLive = Array.from({ length: N_TOTAL }, () => 0);
    const spokeLive = Array.from({ length: N_TOTAL }, () => 0);
    let stemLive = 0;
    let pubLive = 0;

    for (const fl of flights) {
      if (f < fl.start || f >= fl.start + fl.frames) continue;

      const p = segAt(fl.seg, (f - fl.start) / fl.frames);
      msgs.push({ id: fl.id, x: p.x, y: p.y, svc: fl.svc });

      if (fl.link.kind === "diag") diagLive[fl.link.i] = 1;
      else if (fl.link.kind === "spoke") spokeLive[fl.link.i] = 1;
      else stemLive = 1;

      if (fl.link.kind !== "spoke") pubLive = 1;
    }

    // Chốt subscription: đang bay ↔ đã cắm.
    const flying: Token[] = [];
    const attached: number[] = [];
    const snap: number[] = [];
    for (let i = 0; i < N_TOTAL; i++) {
      const s0 = subFlyStart(i);
      const at = attachAt(i);
      if (f >= s0 && f < at) {
        const p = segAt(SUB_FLY[i], (f - s0) / SUB_FLY_FRAMES[i]);
        flying.push({ i, x: p.x, y: p.y });
      }
      attached.push((f >= at ? 1 : 0) * (1 - resetT));
      snap.push(f >= at && f < at + SNAP_DUR ? (f - at) / SNAP_DUR : 0);
    }

    let brokerLive = 0;
    let brokerRipple = -1;
    for (const p of PUBLISH_BROKER) {
      const hit = p + STEM_FRAMES;
      const lastEmit = hit + BROKER_HOLD + (N_TOTAL - 1) * SEND_STAGGER;
      if (f >= hit && f <= lastEmit) brokerLive = 1;
      if (f >= hit && f < hit + RIPPLE_DUR) brokerRipple = (f - hit) / RIPPLE_DUR;
    }

    // Nan quạt: có → tan lúc tái nối → hiện lại trong cửa sổ reset.
    // f=0 và f=672 cùng ra 1 — đó là điều kiện seamless.
    const diag = clamp01(1 - ramp(f, DIAG_OUT, DIAG_OUT_DUR) + resetT);

    const dashBase =
      ramp(f, DASH_IN, DASH_IN_DUR) * (1 - ramp(f, DASH_OUT, DASH_OUT_DUR));
    const blink = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin((2 * Math.PI * f) / DASH_BLINK));

    out.push({
      msgs,
      flying,
      attached,
      snap,
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
      // VẼ và HIỆN DIỆN là hai việc khác nhau, nên là hai số khác nhau. Gộp
      // làm một thì lúc reset đường TỰ RÚT LUI thay vì mờ đi.
      stemDraw: ramp(f, STEM_DRAW, STEM_DRAW_DUR),
      stemOn: (f >= STEM_DRAW ? 1 : 0) * (1 - resetT),
      spokeDraw: Array.from({ length: N_TOTAL }, (_, i) =>
        ramp(f, attachAt(i), SPOKE_DRAW_DUR),
      ),
      spokeOn: Array.from(
        { length: N_TOTAL },
        (_, i) => (f >= attachAt(i) ? 1 : 0) * (1 - resetT),
      ),
      diagLive,
      stemLive,
      spokeLive,
      pubLive,
    });
  }

  return out;
};

export const STATES = simulate();

/** Chốt cắm phải nằm ĐÚNG trên vành, không "gần gần" — verify.ts đo lại. */
export const ATTACH = Array.from({ length: N_TOTAL }, (_, i) => attachPt(i));
export const SPOKE_READY = Array.from({ length: N_TOTAL }, (_, i) => spokeReady(i));

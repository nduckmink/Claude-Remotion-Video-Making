import {
  AXIS,
  BOUNCE_FLASH,
  CLIENT_CACHE,
  DB,
  DIP,
  EMIT_COUNT,
  EMIT_GAP,
  EMIT_START,
  LAYER_Y,
  LOOP,
  N_LAYER,
  PROC,
  READ_HOLD,
  REDIS,
  RESET,
  RESET_DUR,
  SPAWN,
  SPEED,
  fallFrames,
  lerp,
} from "./constants";

/**
 * Mô phỏng thật, từng frame. Component chỉ ĐỌC STATES[frame] và vẽ.
 * Không import lib/motion.ts — nó kéo Easing của remotion vào, mà verify chạy Node.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (f: number, from: number, dur: number) => clamp01((f - from) / dur);

export type EvKind = "emit" | "bounce" | "arrive" | "fall" | "fill" | "slow";
export type Ev = { f: number; kind: EvKind; i?: number };

export type Ball = { x: number; y: number; catch: number; rising: boolean; opacity: number };
/** Lệch trục xác định theo index — dòng chảy KHÔNG thẳng một cột, hơi tản ra.
 *  Băm cho ra khoảng [-52, 52], không nhìn thấy chu kỳ. Không dùng Math.random
 *  (vỡ determinism — motion_language.md cấm). */
const xOffset = (i: number) => (((i * 2654435761) >>> 0) % 105) - 52;
export type LayerState = { taut: number; dip: number; dipX: number; bounceFlash: number };
export type State = {
  layers: LayerState[]; // 0 client-cache · 1 redis · 2 database
  balls: Ball[];
  clientLive: number;
  vis: number;
  /** Số lần đập DB tính tới frame này — cache lạnh thì đếm CỨ LEO. */
  dbQueries: number;
  dbQueryFlash: number;
};

// ─── Dựng DÒNG read + mô phỏng CACHE ẤM DẦN (tiến về trước) ────────────
// Read k rơi tới tầng TAUT cao nhất lúc nó chạm tới. Cache chỉ ấm khi một read
// TRƯỚC đó đã đi xuống tận nơi rồi bật ngược lên ngang qua tầng ấy — đúng nhân
// quả: cache lạnh thì mọi read đập DB; read đầu về mới đổ đầy redis; v.v.
type Read = { i: number; te: number; catch: number; fallStart: number; fallEnd: number; procEnd: number; riseEnd: number };
const STREAM: Read[] = [];
const events: Ev[] = [];
let redisTaut = Infinity;
let clientTaut = Infinity;

for (let k = 0; k < EMIT_COUNT; k++) {
  const te = EMIT_START + k * EMIT_GAP;
  const fallStart = te + READ_HOLD;
  // Read đi qua client-cache trước (gần nhất), rồi redis, rồi DB. Bắt ở tầng
  // TAUT cao nhất mà nó chạm tới.
  let ct: number;
  if (clientTaut <= fallStart + fallFrames(CLIENT_CACHE)) ct = CLIENT_CACHE;
  else if (redisTaut <= fallStart + fallFrames(REDIS)) ct = REDIS;
  else ct = DB;

  const fl = fallFrames(ct);
  const fallEnd = fallStart + fl;
  const procEnd = fallEnd + PROC[ct];
  const riseEnd = procEnd + fl;

  // Đổ đầy tầng NGAY TRÊN, khi read bật lên ngang qua nó (chỉ read ĐẦU tiên tới
  // mỗi tầng làm việc này — cache đã ấm thì thôi).
  if (ct === DB && redisTaut === Infinity) redisTaut = procEnd + Math.round((LAYER_Y[DB] - LAYER_Y[REDIS]) / SPEED);
  if (ct === REDIS && clientTaut === Infinity) clientTaut = procEnd + Math.round((LAYER_Y[REDIS] - LAYER_Y[CLIENT_CACHE]) / SPEED);

  STREAM.push({ i: k, te, catch: ct, fallStart, fallEnd, procEnd, riseEnd });
  events.push({ f: fallStart, kind: "emit", i: k });
  events.push({ f: fallEnd, kind: ct === DB ? "slow" : "bounce", i: ct });
  events.push({ f: riseEnd, kind: "arrive", i: k });
}
if (redisTaut < Infinity) events.push({ f: redisTaut, kind: "fill", i: REDIS });
if (clientTaut < Infinity) events.push({ f: clientTaut, kind: "fill", i: CLIENT_CACHE });
events.sort((a, b) => a.f - b.f);
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET);

const tautFrom = [clientTaut, redisTaut, 0]; // DB luôn (0)

const simulate = (): State[] => {
  const out: State[] = [];

  for (let f = 0; f <= LOOP; f++) {
    const resetT = ramp(f, RESET, RESET_DUR);
    const vis = ramp(f, 0, 24) * (1 - resetT);

    // ── Balls đang bay (nhiều cái cùng lúc = dòng chảy) ──
    const balls: Ball[] = [];
    let clientLive = 0;
    for (const r of STREAM) {
      if (f < r.fallStart || f >= r.riseEnd) continue;
      const catchY = LAYER_Y[r.catch];
      const fl = r.fallEnd - r.fallStart;
      let y: number;
      let rising: boolean;
      if (f < r.fallEnd) {
        y = lerp(SPAWN.y, catchY, (f - r.fallStart) / fl);
        rising = false; // đang rơi → TRẮNG
      } else if (f < r.procEnd) {
        const p = (f - r.fallEnd) / (r.procEnd - r.fallEnd);
        y = catchY + DIP[r.catch] * Math.sin(p * Math.PI);
        rising = p > 0.5; // qua đáy võng là bắt đầu bật → đổi màu
      } else {
        y = lerp(catchY, SPAWN.y, (f - r.procEnd) / fl);
        rising = true; // đang lên → màu của tầng đã phục vụ
      }
      const bx = AXIS + xOffset(r.i);
      balls.push({ x: bx, y, catch: r.catch, rising, opacity: 1 });
      if (y < SPAWN.y + 70) clientLive = 1;
      void bx;
    }

    // ── Tầng ──
    const layers: LayerState[] = [];
    for (let L = 0; L < N_LAYER; L++) {
      const isDB = L === DB;
      const taut = isDB ? vis : (f >= tautFrom[L] && f < RESET ? 1 : 0) * (1 - resetT) * vis;
      let dip = 0;
      let dipX = AXIS;
      let bounceFlash = 0;
      for (const r of STREAM) {
        if (r.catch !== L) continue;
        if (f >= r.fallEnd && f < r.procEnd) {
          const d = DIP[L] * Math.sin(((f - r.fallEnd) / (r.procEnd - r.fallEnd)) * Math.PI);
          if (d > dip) { dip = d; dipX = AXIS + xOffset(r.i); } // võng ở CHỖ ball chạm
        }
        if (f >= r.fallEnd && f < r.fallEnd + BOUNCE_FLASH) bounceFlash = Math.max(bounceFlash, 1 - (f - r.fallEnd) / BOUNCE_FLASH);
      }
      layers.push({ taut, dip, dipX, bounceFlash });
    }

    const dbHits = STREAM.filter((r) => r.catch === DB).map((r) => r.fallEnd);
    const dbQueries = dbHits.filter((t) => t <= f).length;
    const lastHit = dbHits.filter((t) => t <= f).sort((a, b) => b - a)[0] ?? -99;
    const dbQueryFlash = clamp01(1 - (f - lastHit) / 12);

    out.push({ layers, balls, clientLive, vis, dbQueries, dbQueryFlash });
  }

  return out;
};

export const STATES = simulate();

// ─── Kết cục — verify canh ────────────────────────────────────────────
const catchSeq = STREAM.map((r) => r.catch);
export const OUTCOME = {
  catchSeq, // [DB…, REDIS…, CLIENT…] — ấm dần
  dbCount: catchSeq.filter((c) => c === DB).length,
  redisCount: catchSeq.filter((c) => c === REDIS).length,
  clientCount: catchSeq.filter((c) => c === CLIENT_CACHE).length,
  redisTaut,
  clientTaut,
  // Thứ tự phục vụ chỉ được LEO LÊN, không tụt: DB → redis → client, không quay lui.
  monotoneUp: (() => {
    let last = DB + 1;
    for (const c of catchSeq) {
      if (c > last) return false; // c nhỏ hơn = tầng cao hơn (0=client trên cùng)
      last = c;
    }
    return true;
  })(),
  lastCatch: catchSeq[catchSeq.length - 1],
  firstCatch: catchSeq[0],
  streamEnd: STREAM[STREAM.length - 1].riseEnd,
};

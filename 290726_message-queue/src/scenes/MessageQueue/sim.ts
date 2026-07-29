import { clamp01, easeInOutCubic, easeOutCubic, lerp, pulse, ramp, spring01 } from "../../lib/anim";
import {
  BURST_FROM,
  BURST_TO,
  CHUTE,
  DEEP,
  FPS,
  LOOP,
  MOVE,
  PRESS_MOUTH,
  PUNCH,
  RESET,
  SERVICE,
  STAMPS,
  W2_GONE,
  W2_IN,
  W2_OUT,
  W2_READY,
  WORKERS,
  slotY,
} from "./constants";

/**
 * MÔ PHỎNG THẬT hàng đợi — không tính tay.
 *
 * Độ sâu hàng đợi là HỆ QUẢ của (nhịp dập) vs (số worker × tốc độ xử lý). Gõ tay
 * một con số "6" là nói dối; ở đây nó tự dâng lên rồi tự rút xuống. Component chỉ
 * đọc STATES[f]. Không import remotion (verify chạy bằng Node).
 */

export type TaskS = { id: number; x: number; y: number; state: "wait" | "move" | "serve" | "done"; prog: number; opacity: number; scale: number; w: number };
export type WorkerS = { present: number; busy: number; prog: number; live: number };
export type State = {
  tasks: TaskS[];
  depth: number; // ĐỘ SÂU HÀNG ĐỢI (task đang chờ, chưa được xử lý)
  press: number; // 0..1 cú dập
  workers: WorkerS[];
  warn: number; // 0..1 đang dồn việc
  produced: number;
  done: number;
};

export type EvKind = "emit" | "attach" | "arrive" | "fill" | "fail" | "drop" | "slow" | "travel";
export type Ev = { f: number; kind: EvKind; i?: number };

type Rec = { id: number; arriveF: number; startF: number; endF: number; w: number; x: number; y: number; sx: number; sy: number };

const events: Ev[] = [];
const recs: Rec[] = [];

const simulate = (): State[] => {
  const out: State[] = [];
  const queue: number[] = [];
  const busyUntil = [-1, -1];
  const byId = new Map<number, Rec>();
  let nextId = 1;
  let produced = 0;
  let done = 0;
  let warned = false;
  let lastDoneSound = -99;

  for (let f = 0; f <= LOOP; f++) {
    // ── 1. Máy dập nhả task mới ──
    if (STAMPS.includes(f)) {
      const r: Rec = { id: nextId++, arriveF: f, startF: -1, endF: -1, w: -1, x: PRESS_MOUTH.x, y: PRESS_MOUTH.y, sx: 0, sy: 0 };
      recs.push(r);
      byId.set(r.id, r);
      queue.push(r.id);
      produced++;
      events.push({ f, kind: "attach" });
    }

    // ── 2. Worker rảnh thì lấy task ĐẦU hàng (FIFO) ──
    for (let w = 0; w < 2; w++) {
      const active = w === 0 || (f >= W2_READY && f < W2_OUT);
      if (!active || busyUntil[w] > f || queue.length === 0) continue;
      const r = byId.get(queue.shift()!)!;
      r.startF = f;
      r.endF = f + SERVICE;
      r.w = w;
      r.sx = r.x;
      r.sy = r.y;
      busyUntil[w] = f + SERVICE;
    }

    // ── 3. Vị trí task đang CHỜ: trôi xuống chỗ trống thấp nhất ──
    const tasks: TaskS[] = [];
    queue.forEach((id, idx) => {
      const r = byId.get(id)!;
      const ty = slotY(idx);
      r.x = CHUTE.x;
      r.y += (ty - r.y) * 0.28; // trôi có quán tính, không nhảy cóc
      if (Math.abs(ty - r.y) < 0.4) r.y = ty;
      tasks.push({ id, x: r.x, y: r.y, state: "wait", prog: 0, opacity: 1, scale: 1, w: -1 });
    });

    // ── 4. Task đang được xử lý / vừa xong ──
    const wProg = [0, 0];
    const wBusy = [0, 0];
    for (const r of recs) {
      if (r.startF < 0 || f < r.startF || f >= r.endF + 10) continue;
      // Task nằm ở NỬA TRÊN cỗ máy, không đè lên bánh răng — cả hai cùng đọc được.
      const wp = { x: WORKERS[r.w].x, y: WORKERS[r.w].y - 34 };
      if (f < r.startF + MOVE) {
        const p = easeInOutCubic((f - r.startF) / MOVE);
        tasks.push({ id: r.id, x: lerp(r.sx, wp.x, p), y: lerp(r.sy, wp.y, p), state: "move", prog: 0, opacity: 1, scale: 1 - 0.15 * p, w: r.w });
        wBusy[r.w] = 1;
      } else if (f < r.endF) {
        const prog = (f - r.startF - MOVE) / (SERVICE - MOVE);
        tasks.push({ id: r.id, x: wp.x, y: wp.y, state: "serve", prog, opacity: 1, scale: 0.85, w: r.w });
        wProg[r.w] = prog;
        wBusy[r.w] = 1;
      } else {
        // Xong thì BAY LÊN rồi tan — rời khỏi máy để chỗ cho task kế
        const p = (f - r.endF) / 10;
        tasks.push({ id: r.id, x: wp.x, y: wp.y - 62 * p, state: "done", prog: 1, opacity: 1 - p, scale: 0.85 + 0.35 * p, w: r.w });
      }
      if (f === r.endF) {
        done++;
        if (f - lastDoneSound >= 6) {
          events.push({ f, kind: "arrive" });
          lastDoneSound = f;
        }
      }
    }

    // ── 5. Máy dập: cú punch nhanh xuống, chậm lên ──
    let press = 0;
    for (const s of STAMPS) {
      if (f < s || f >= s + PUNCH) continue;
      const p = (f - s) / PUNCH;
      press = p < 0.35 ? easeOutCubic(p / 0.35) : 1 - easeInOutCubic((p - 0.35) / 0.65);
    }

    // ── 6. Worker ──
    const w2 = clamp01(spring01((f - W2_IN) / FPS, { omega: 12, zeta: 0.5 })) * (1 - ramp(f, W2_OUT, W2_GONE - W2_OUT));
    const workers: WorkerS[] = [
      { present: 1, busy: wBusy[0], prog: wProg[0], live: clamp01(0.25 + 0.75 * wBusy[0]) },
      { present: clamp01(w2), busy: wBusy[1], prog: wProg[1], live: clamp01(0.25 + 0.75 * wBusy[1]) * clamp01(w2) },
    ];

    const depth = queue.length;
    if (depth >= DEEP && !warned) {
      warned = true;
      events.push({ f, kind: "slow" });
    }
    const warn = clamp01((depth - DEEP + 1) / 3) * (0.65 + 0.35 * pulse(f, 20));

    out.push({ tasks, depth, press, workers, warn: clamp01(warn), produced, done });
  }
  return out;
};

export const STATES = simulate();

events.push({ f: W2_IN, kind: "fill" }); // worker phụ tới
events.push({ f: W2_OUT, kind: "drop" }); // worker phụ rời
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET).sort((a, b) => a.f - b.f);

// ─── Kết cục cho verify ────────────────────────────────────────────────
const depthAt = (f: number) => STATES[f].depth;
const doneIn = (a: number, b: number) => STATES[b].done - STATES[a].done;
export const OUTCOME = {
  totalProduced: STATES[LOOP].produced,
  totalDone: STATES[LOOP].done,
  peakDepth: Math.max(...STATES.map((s) => s.depth)),
  depthAtCalm: depthAt(100), // trước cao điểm — gần 0
  depthAtBurstEnd: depthAt(BURST_TO), // cuối cao điểm — dồn cao
  depthEnd: depthAt(LOOP),
  // Thông lượng: 100 frame với MỘT worker vs 100 frame với HAI worker
  thruOne: doneIn(BURST_FROM, BURST_FROM + 96),
  thruTwo: doneIn(W2_READY, W2_READY + 96),
  // FIFO: task nào tới trước phải được nhận trước
  fifo: (() => {
    const started = recs.filter((r) => r.startF >= 0).slice().sort((a, b) => a.startF - b.startF || a.w - b.w);
    for (let i = 1; i < started.length; i++) if (started[i].arriveF < started[i - 1].arriveF) return false;
    return true;
  })(),
  // Worker phụ chỉ có mặt ở đoạn giữa
  w2AbsentEnds: STATES[0].workers[1].present < 0.01 && STATES[LOOP].workers[1].present < 0.01,
  w2LeavesAfterDrain: depthAt(W2_OUT) === 0,
  lastDoneF: Math.max(...recs.filter((r) => r.endF > 0).map((r) => r.endF)),
};

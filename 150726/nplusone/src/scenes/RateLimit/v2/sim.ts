import {
  C1_CX,
  C1_PERIOD,
  AXIS,
  C2_CX,
  C2_IN,
  C2_OUT,
  C2_PERIOD,
  BOUNCE_FRAMES,
  CLIENT_BOTTOM,
  GATE_CY,
  LIMIT_IN,
  LIMIT_PERIOD,
  LOOP,
  MERGE_DIST,
  smoothstep,
  QUEUE_BOTTOM,
  QUEUE_PITCH,
  REJ_WINDOW,
  rejectAt,
  RESET,
  SERVER,
  SERVICE,
  SHIFT,
  SPEED,
} from "./constants";

/**
 * Mô phỏng thật, từng frame: arrival → gate → hàng đợi FIFO → server.
 * Không hardcode con số nào trên màn hình. Deterministic tuyệt đối.
 */

export type Owner = "c1" | "c2";
export type Kind = "fall" | "bounce" | "queue" | "service";

export type Item = {
  id: number;
  owner: Owner;
  kind: Kind;
  x: number;
  y: number;
  fade: number;
};

export type State = {
  items: Item[];
  queueLen: number;
  /** 0→1: server đang chạy hết một vòng viền cho MỘT request. */
  serverProgress: number;
  serverLive: boolean;
  c1Rej: number; // chỉ để verify — không vẽ ra
  c2Rej: number;
  gateFlash: number;
};

type Sim = {
  id: number;
  owner: Owner;
  born: number;
  x: number;
  y: number;
  kind: Kind | "done";
  gateAt: number;
  bounceAt: number;
  slot: number;
  prevSlot: number;
  slotAt: number;
  serveAt: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const cx = (o: Owner) => (o === "c1" ? C1_CX : C2_CX);
const slotY = (slot: number) => QUEUE_BOTTOM - slot * QUEUE_PITCH;

/** SFX: vòng đời request của CLIENT 1. Tai bám nhân vật chính, không bám tiếng ồn. */
export const c1Trips: { fire: number; done: number }[] = [];

const DOOR = 3; // frames: từ slot 0 vào cửa server rồi biến mất

const simulate = (): State[] => {
  const all: Sim[] = [];
  const waiting: Sim[] = [];
  let serving: Sim | null = null;
  let serviceEnd = -1;
  let nextId = 0;
  let lastFlash = -99;

  const lastOk: Record<Owner, number> = { c1: -9999, c2: -9999 };
  const gateLog: { f: number; owner: Owner; rejected: boolean }[] = [];
  const out: State[] = [];

  c1Trips.length = 0;

  const spawn = (owner: Owner, born: number) => {
    all.push({
      id: nextId++,
      owner,
      born,
      x: cx(owner),
      y: CLIENT_BOTTOM,
      kind: "fall",
      gateAt: -1,
      bounceAt: -1,
      slot: 0,
      prevSlot: 0,
      slotAt: 0,
      serveAt: -1,
    });
  };

  for (let f = 0; f < LOOP; f++) {
    if (serving && f >= serviceEnd) {
      serving.kind = "done";
      if (serving.owner === "c1") {
        c1Trips.push({ fire: serving.born, done: f });
      }
      serving = null;
    }

    if (f % C1_PERIOD === 0) spawn("c1", f);
    if (f >= C2_IN && f <= C2_OUT && (f - C2_IN) % C2_PERIOD === 0) {
      spawn("c2", f);
    }

    for (const s of all) {
      if (s.kind === "fall") {
        s.y += SPEED;

        if (s.gateAt < 0 && s.y >= GATE_CY) {
          s.gateAt = f;
          const limitOn = f >= LIMIT_IN && f < RESET;
          const rejected = limitOn && f - lastOk[s.owner] < LIMIT_PERIOD;
          gateLog.push({ f, owner: s.owner, rejected });
          if (rejected) {
            s.kind = "bounce";
            s.bounceAt = f;
            lastFlash = f;
            continue;
          }
          lastOk[s.owner] = f;
        }

        // smoothstep, KHÔNG phải lerp: đường vẽ là bezier có điểm điều khiển
        // ở 1/3–2/3 chiều dọc, và x của bezier đó chính xác là smoothstep(t).
        // Đổi sang lerp là packet rời khỏi đường vẽ ngay.
        if (s.gateAt >= 0) {
          s.x = lerp(
            cx(s.owner),
            AXIS,
            smoothstep(clamp01((s.y - GATE_CY) / MERGE_DIST)),
          );
        }

        const pileTop = slotY(waiting.length);
        if (s.gateAt >= 0 && s.y >= pileTop) {
          s.kind = "queue";
          s.x = AXIS;
          s.slot = waiting.length;
          s.prevSlot = s.slot;
          s.slotAt = f;
          s.y = slotY(s.slot);
          waiting.push(s);
        }
      } else if (s.kind === "bounce") {
        // Đường cong RIÊNG, văng ngang khỏi gate rồi vòng lên về client.
        // Dùng CHUNG hàm rejectAt() với SVG → không thể lệch nhau.
        const t = clamp01((f - s.bounceAt) / BOUNCE_FRAMES);
        const p = rejectAt(s.owner, t);
        s.x = p.x;
        s.y = p.y;
        if (t >= 1) s.kind = "done";
      }
    }

    if (!serving && waiting.length > 0) {
      const s = waiting.shift()!;
      s.kind = "service";
      s.serveAt = f;
      serving = s;
      serviceEnd = f + SERVICE;
    }

    waiting.forEach((s, i) => {
      if (s.slot !== i) {
        s.prevSlot = s.slot;
        s.slot = i;
        s.slotAt = f;
      }
    });
    for (const s of waiting) {
      s.y = lerp(
        slotY(s.prevSlot),
        slotY(s.slot),
        clamp01((f - s.slotAt) / SHIFT),
      );
    }

    if (serving) {
      serving.y = lerp(
        QUEUE_BOTTOM,
        SERVER.y,
        clamp01((f - serving.serveAt) / DOOR),
      );
    }

    const rate = (owner: Owner) => {
      let n = 0;
      let bad = 0;
      for (const e of gateLog) {
        if (e.owner === owner && e.f > f - REJ_WINDOW && e.f <= f) {
          n++;
          if (e.rejected) bad++;
        }
      }
      return n === 0 ? 0 : bad / n;
    };

    const items: Item[] = [];
    for (const s of all) {
      if (s.kind === "done") continue;
      items.push({
        id: s.id,
        owner: s.owner,
        kind: s.kind,
        x: s.x,
        y: s.y,
        fade:
          s.kind === "bounce"
            ? 1 - clamp01(((f - s.bounceAt) / BOUNCE_FRAMES - 0.75) / 0.25)
            : s.kind === "service"
              ? 1 - clamp01((f - s.serveAt) / DOOR)
              : 1,
      });
    }

    out.push({
      items,
      queueLen: waiting.length,
      // Vòng viền: 0→1 trong đúng SERVICE frame. Luôn luôn. Đó là cả lập luận.
      serverProgress: serving ? clamp01((f - serving.serveAt) / SERVICE) : 0,
      serverLive: serving !== null,
      c1Rej: rate("c1"),
      c2Rej: rate("c2"),
      gateFlash: clamp01(1 - (f - lastFlash) / 6),
    });

    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i].kind === "done") all.splice(i, 1);
    }
  }

  return out;
};

export const STATES = simulate();
export const PEAK_QUEUE = Math.max(...STATES.map((s) => s.queueLen));

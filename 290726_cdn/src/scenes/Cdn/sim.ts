import { arc, clamp01, easeInOutCubic, pulse, ramp, spring01 } from "../../lib/anim";
import {
  BEND_EDGE,
  BEND_LONG,
  BEND_SHORT,
  EDGES,
  FPS,
  HEAT_DECAY,
  HOLD_EDGE_FILL,
  HOLD_EDGE_HIT,
  HOLD_EDGE_MISS,
  HOLD_ORIGIN,
  IDLE_PERIOD,
  LOOP,
  ORIGIN,
  RESET,
  SPEED,
  T,
  TRAIL_FADE,
  USERS,
  type Pt,
} from "./constants";

/**
 * Mô phỏng từng frame. KHÔNG có con số nào lên hình, nên mọi thứ phải đúng về
 * HÌNH HỌC: một tốc độ cho mọi gói, vệt vẽ đúng quãng đã đi, độ nóng origin
 * đúng số lần bị đập. Component chỉ đọc STATES[f]. Không import remotion.
 */

export type LegS = { ax: number; ay: number; bx: number; by: number; bend: number; prog: number; fade: number; carry: boolean; long: boolean };
export type State = {
  legs: LegS[];
  packets: { x: number; y: number; carry: boolean }[];
  edges: { present: number; filled: number; miss: number }[];
  origin: { heat: number; hit: number };
  users: { live: number }[];
};

export type EvKind = "emit" | "attach" | "arrive" | "fill" | "fail" | "drop" | "slow" | "travel";
export type Ev = { f: number; kind: EvKind; i?: number };

// ─── Đo độ dài cung bằng LẤY MẪU, không đoán ──────────────────────────
const arcLen = (a: Pt, b: Pt, bend: number) => {
  let L = 0;
  let p = arc(a, b, 0, bend);
  for (let i = 1; i <= 48; i++) {
    const q = arc(a, b, i / 48, bend);
    L += Math.hypot(q.x - p.x, q.y - p.y);
    p = q;
  }
  return L;
};
const dur = (a: Pt, b: Pt, bend: number) => Math.max(2, Math.round(arcLen(a, b, bend) / SPEED));

type Leg = { a: Pt; b: Pt; bend: number; carry: boolean; long: boolean; t0: number; t1: number };
const legs: Leg[] = [];
const events: Ev[] = [];
const originHits: number[] = [];
const edgeFill: number[] = [-1, -1, -1];
const edgeMiss: { i: number; f: number }[] = [];
const push = (a: Pt, b: Pt, bend: number, carry: boolean, long: boolean, t0: number) => {
  const d = dur(a, b, bend);
  legs.push({ a, b, bend, carry, long, t0, t1: t0 + d });
  return t0 + d;
};

// ── Act 1: KHÔNG CDN — đi thẳng tới origin, cung dài vắt cả khung ──
const farArrive: number[] = [];
T.farFire.forEach((f0, i) => {
  const u = USERS[i].p;
  events.push({ f: f0, kind: "emit" });
  const atOrigin = push(u, ORIGIN, BEND_LONG[i], false, true, f0);
  originHits.push(atOrigin);
  // Cung về RETRACE đúng đường cũ ⇒ đảo dấu độ cong (cùng điểm điều khiển).
  const back = push(ORIGIN, u, -BEND_LONG[i], true, true, atOrigin + HOLD_ORIGIN);
  farArrive.push(back);
});

// ── Act 2: bật CDN, lần đầu edge TRỐNG (miss) → phải về origin đúng một lần ──
const missArrive: number[] = [];
T.missFire.forEach((f0, i) => {
  const u = USERS[i].p;
  const e = EDGES[i];
  events.push({ f: f0, kind: "emit" });
  const atEdge = push(u, e, BEND_SHORT[i], false, false, f0);
  edgeMiss.push({ i, f: atEdge });
  const atOrigin = push(e, ORIGIN, BEND_EDGE[i], false, true, atEdge + HOLD_EDGE_MISS);
  originHits.push(atOrigin);
  const backEdge = push(ORIGIN, e, -BEND_EDGE[i], true, true, atOrigin + HOLD_ORIGIN);
  edgeFill[i] = backEdge + HOLD_EDGE_FILL;
  events.push({ f: edgeFill[i], kind: "fill" });
  const toUser = push(e, u, -BEND_SHORT[i], true, false, edgeFill[i]);
  missArrive.push(toUser);
});

// ── Act 3: bản sao đã nằm SÁT người dùng — chỉ còn stub ngắn, origin ngủ ──
const hitArrive: number[] = [];
T.hitFire.forEach((f0, k) => {
  const i = k % 3;
  const u = USERS[i].p;
  const e = EDGES[i];
  const atEdge = push(u, e, BEND_SHORT[i], false, false, f0);
  const back = push(e, u, -BEND_SHORT[i], true, false, atEdge + HOLD_EDGE_HIT);
  hitArrive.push(back);
});

[...farArrive, ...missArrive, ...hitArrive].forEach((f) => events.push({ f, kind: "arrive" }));
originHits.forEach((f) => events.push({ f, kind: "slow" })); // cú đập nặng vào origin
events.push({ f: T.cdnOn, kind: "attach" }); // edge dựng lên
events.push({ f: T.edgeOut, kind: "drop" });

export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET).sort((a, b) => a.f - b.f);

const simulate = (): State[] => {
  const out: State[] = [];
  for (let f = 0; f <= LOOP; f++) {
    // Vệt + gói đang bay
    const ls: LegS[] = [];
    const packets: { x: number; y: number; carry: boolean }[] = [];
    for (const g of legs) {
      if (f < g.t0 || f > g.t1 + TRAIL_FADE) continue;
      const prog = clamp01((f - g.t0) / (g.t1 - g.t0));
      const fade = f <= g.t1 ? 1 : clamp01(1 - (f - g.t1) / TRAIL_FADE);
      ls.push({ ax: g.a.x, ay: g.a.y, bx: g.b.x, by: g.b.y, bend: g.bend, prog, fade, carry: g.carry, long: g.long });
      if (f <= g.t1) {
        const p = arc(g.a, g.b, easeInOutCubic(prog), g.bend);
        packets.push({ x: p.x, y: p.y, carry: g.carry });
      }
    }

    // Edge: bung vào, giữ bản sao sau khi ghi, rút đi ở cuối
    const present = clamp01(spring01((f - T.cdnOn) / FPS, { omega: 12, zeta: 0.5 })) * (1 - ramp(f, T.edgeOut, T.edgeGone - T.edgeOut));
    const edges = EDGES.map((_, i) => ({
      present: clamp01(present),
      filled: edgeFill[i] > 0 && f >= edgeFill[i] ? clamp01(present) : 0,
      miss: clamp01(Math.max(0, ...edgeMiss.filter((m) => m.i === i).map((m) => 1 - Math.abs(f - m.f) / 10))),
    }));

    // Origin: NÓNG theo số cú bị đập gần đây, nguội tuyến tính về ĐÚNG 0
    let heat = 0;
    let hit = 0;
    for (const hf of originHits) {
      if (f < hf) continue;
      heat += Math.max(0, 1 - (f - hf) / HEAT_DECAY);
      hit = Math.max(hit, Math.max(0, 1 - (f - hf) / 12));
    }
    const origin = { heat: clamp01(heat), hit: clamp01(hit) };

    const users = USERS.map((u, i) => {
      const fires = [...T.farFire.filter((_, k) => k === i), ...T.missFire.filter((_, k) => k === i), ...T.hitFire.filter((_, k) => k % 3 === i)];
      const live = Math.max(0.22, ...fires.map((ff) => (f >= ff ? Math.max(0, 1 - (f - ff) / 14) : 0)));
      void u;
      // Chu kỳ thở PHẢI chia hết LOOP, nếu không f0 ≠ fLOOP (đã trả giá).
      return { live: clamp01(live * (0.85 + 0.15 * pulse(f, IDLE_PERIOD))) };
    });

    out.push({ legs: ls, packets, edges, origin, users });
  }
  return out;
};

export const STATES = simulate();

// ─── Kết cục cho verify ────────────────────────────────────────────────
const longLen = arcLen(USERS[0].p, ORIGIN, BEND_LONG[0]);
const shortLen = arcLen(USERS[0].p, EDGES[0], BEND_SHORT[0]);
export const OUTCOME = {
  longLen,
  shortLen,
  ratio: longLen / shortLen,
  farRoundTrip: legs[1].t1 - legs[0].t0, // act 1: đi + về
  hitRoundTrip: (() => {
    const k = legs.findIndex((g) => g.t0 === T.hitFire[0]);
    return legs[k + 1].t1 - legs[k].t0;
  })(),
  originHits: originHits.length,
  // Sau khi cache ấm (act 3) origin KHÔNG bị đập lần nào nữa
  originHitsInHitPhase: originHits.filter((f) => f >= T.hitFire[0]).length,
  requestsInHitPhase: T.hitFire.length,
  heatEnd: STATES[LOOP].origin.heat,
  edgesAtEnds: STATES[0].edges[0].present < 0.01 && STATES[LOOP].edges[0].present < 0.01,
  filledAfterMiss: STATES[T.hitFire[0]].edges.every((e) => e.filled > 0.9),
  lastActivity: Math.max(...legs.map((g) => g.t1 + TRAIL_FADE)),
};

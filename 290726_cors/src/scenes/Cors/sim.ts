import { clamp01, easeInOutCubic, lerp, pulse, ramp } from "../../lib/anim";
import {
  BREATHE,
  BULLET_FROM,
  BULLET_TO,
  CRACK_Y,
  FLOW_K,
  HOSE_FROM,
  HOSE_TO,
  HOSE_TRAVEL,
  LANE,
  LOOP,
  N_FLOW,
  ORANGE_IN,
  ORANGE_SPAWN,
  ORANGE_SPILL,
  RESET,
  T,
  TICK_BLUE,
  TICK_GREEN,
  TICK_QUIET,
  TUBE,
} from "./constants";

/** Mô phỏng từng frame. Component chỉ đọc STATES[f]. Không import remotion. */

export type Dot = { x: number; y: number; opacity: number; spill: number };
export type State = {
  green: { x: number; y: number }[]; // server→client (lên)
  blue: { x: number; y: number }[]; // client→server (xuống)
  orange: Dot[]; // độc hại — bị chặn, tràn ra ngoài
  crack: number;
  evil: number; // opacity
  bullet: { present: boolean; x: number; y: number; trail: number }; // MỘT viên đạn
  impact: number; // 0..1 nổ khi đạn trúng ống
  hose: number; // opacity ống evil cắm vào
  serverReject: number; // loé đỏ khi từ chối cam
  blocked: number; // đếm số cam bị chặn
  client: { live: number };
  server: { live: number };
};

export type EvKind = "emit" | "attach" | "arrive" | "fill" | "fail" | "drop" | "slow" | "travel";
export type Ev = { f: number; kind: EvKind; i?: number };
const events: Ev[] = [
  { f: T.shot, kind: "emit" }, // tiếng bóp cò
  { f: T.hit, kind: "fail" }, // đạn trúng → ống vỡ
  { f: T.hoseIn, kind: "attach" }, // cắm ống vào vết nứt
  ...ORANGE_SPAWN.map((s) => ({ f: s + ORANGE_IN, kind: "fail" as EvKind })), // mỗi cam bị chặn
  { f: T.attackEnd, kind: "drop" }, // evil biến mất
];

const len = TUBE.botY - TUBE.topY;

const simulate = (): State[] => {
  const out: State[] = [];
  for (let f = 0; f <= LOOP; f++) {
    // Dòng hợp lệ — chảy liên tục, seamless (K nguyên)
    const green: { x: number; y: number }[] = [];
    const blue: { x: number; y: number }[] = [];
    for (let i = 0; i < N_FLOW; i++) {
      const tg = ((i / N_FLOW + (f / LOOP) * FLOW_K) % 1 + 1) % 1;
      green.push({ x: TUBE.x - LANE, y: TUBE.botY - tg * len }); // đi LÊN
      const tb = ((i / N_FLOW + 0.5 / N_FLOW + (f / LOOP) * FLOW_K) % 1 + 1) % 1;
      blue.push({ x: TUBE.x + LANE, y: TUBE.topY + tb * len }); // đi XUỐNG
    }

    // Cam độc hại — bơm từ vết nứt xuống server rồi bị chặn, TRÀN RA NGOÀI
    const orange: Dot[] = [];
    let serverReject = 0;
    let blocked = 0;
    ORANGE_SPAWN.forEach((st, k) => {
      const age = f - st;
      if (age < -HOSE_TRAVEL || age > ORANGE_IN + ORANGE_SPILL) return;
      if (age < 0) {
        // Chạy TRONG ỐNG CỦA EVIL, hướng về vết nứt
        const p = (age + HOSE_TRAVEL) / HOSE_TRAVEL;
        orange.push({ x: lerp(HOSE_FROM.x, HOSE_TO.x, p), y: CRACK_Y, opacity: 1, spill: 0 });
      } else if (age <= ORANGE_IN) {
        const p = easeInOutCubic(age / ORANGE_IN);
        orange.push({ x: TUBE.x, y: lerp(CRACK_Y, TUBE.botY, p), opacity: 1, spill: 0 });
      } else {
        // Bị từ chối ở cửa server → BẬT NGƯỢC LÊN + văng RA hai bên (không vào được)
        const sp = (age - ORANGE_IN) / ORANGE_SPILL;
        const dir = k % 2 === 0 ? 1 : -1;
        orange.push({ x: TUBE.x + dir * (45 + sp * 175), y: TUBE.botY - sp * 90 - Math.sin(sp * Math.PI) * 26, opacity: 1 - sp, spill: sp });
      }
      if (age >= ORANGE_IN) blocked++;
      // loé đỏ quanh lúc cam đập cửa server
      serverReject = Math.max(serverReject, clamp01(1 - Math.abs(f - (st + ORANGE_IN)) / 10));
    });

    const crack = clamp01(ramp(f, T.crackAt, 16) - ramp(f, T.heal, T.healEnd - T.heal));
    const evil = clamp01(ramp(f, T.evilIn, 30) - ramp(f, T.attackEnd, 40));

    // MỘT viên đạn bay từ evil sang ống (không phải tia liên tục)
    const flying = f >= T.shot && f < T.hit;
    const bp = clamp01((f - T.shot) / (T.hit - T.shot));
    const bullet = {
      present: flying,
      x: lerp(BULLET_FROM.x, BULLET_TO.x, bp),
      y: BULLET_FROM.y,
      trail: flying ? 1 : 0,
    };
    const impact = f >= T.hit ? clamp01(1 - (f - T.hit) / 14) : 0;

    const hose = clamp01(ramp(f, T.hoseIn, 10) - ramp(f, T.attackEnd, 22));

    const client = { live: clamp01(0.2 + 0.3 * (0.5 + 0.5 * pulse(f, BREATHE))) };
    const server = { live: clamp01(0.2 + Math.max(serverReject, 0.15)) };

    out.push({ green, blue, orange, crack, evil, bullet, impact, hose, serverReject: clamp01(serverReject), blocked, client, server });
  }
  return out;
};

export const STATES = simulate();

// ─── Tiếng DÒNG CHẢY — bắt lúc chấm chạm miệng ống ─────────────────────
// Không tính bằng công thức mà ĐỌC từ STATES: chấm nào vừa vòng lại (y nhảy
// một quãng lớn) tức là nó vừa tới miệng và ra khỏi ống. Hỏi sim, đừng đoán.
const flowEvents: Ev[] = [];
for (let f = 1; f <= LOOP; f++) {
  for (const i of TICK_GREEN) {
    // xanh lá đi LÊN: tới miệng trên thì y nhảy ngược xuống đáy
    if (STATES[f].green[i].y - STATES[f - 1].green[i].y > len / 2) flowEvents.push({ f, kind: "travel", i: 1 });
  }
  for (const i of TICK_BLUE) {
    // xanh dương đi XUỐNG: tới miệng dưới thì y nhảy ngược lên đỉnh
    if (STATES[f - 1].blue[i].y - STATES[f].blue[i].y > len / 2) flowEvents.push({ f, kind: "travel", i: 2 });
  }
}

export const EVENTS: Ev[] = [...events, ...flowEvents]
  .filter((e) => e.f >= 0 && e.f < (e.kind === "travel" ? LOOP - TICK_QUIET : RESET))
  .sort((a, b) => a.f - b.f);

// ─── Kết cục cho verify ────────────────────────────────────────────────
export const OUTCOME = {
  // Dòng 2 CHIỀU: xanh lá đi lên, xanh dương đi xuống.
  greenGoesUp: STATES[40].green[0].y > STATES[48].green[0].y,
  blueGoesDown: STATES[40].blue[0].y < STATES[48].blue[0].y,
  // Cam có được bơm vào (trong lúc tấn công).
  orangeInjected: STATES.slice(T.hoseIn, T.injectEnd).some((s) => s.orange.some((o) => o.spill === 0)),
  // MỌI cam đều bị TRÀN RA NGOÀI (spill>0) — không con nào lọt vào server.
  allOrangeSpilled: (() => {
    // với mỗi cam, ở tuổi tối đa nó phải đang spill (ra ngoài, mờ dần)
    return ORANGE_SPAWN.every((st) => {
      const s = STATES[st + ORANGE_IN + ORANGE_SPILL - 1];
      const spilling = s.orange.some((o) => o.spill > 0.5 && (o.x > TUBE.x + 120 || o.x < TUBE.x - 120));
      return spilling;
    });
  })(),
  serverRejected: STATES.some((s) => s.serverReject > 0.8),
  // Sạch sau tấn công: hết cam, evil mờ, ống lành.
  cleanAfter: STATES[RESET].orange.length === 0 && STATES[RESET].evil < 0.05 && STATES[RESET].crack < 0.05,
};

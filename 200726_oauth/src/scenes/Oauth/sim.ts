import { clamp01, easeInOutCubic, lerp, pulse, ramp, spring01 } from "../../lib/anim";
import {
  APP,
  BLOCK_R,
  CENTER,
  CORRIDOR_ANG,
  DRIVE_R,
  D_DOCK,
  D_FIRE,
  D_HOME,
  FPS,
  LOOP,
  N_SHIELD,
  RESET,
  SHIELD_GAP,
  SHIELD_PHASE,
  SHIELD_R,
  SHIELD_TURNS,
  SHOTS,
  SHOT_DUR,
  T,
  onRay,
} from "./constants";

/** Mô phỏng từng frame. Component chỉ đọc STATES[f]. Không import remotion. */

export type ShieldS = { r: number; gapAng: number; gapSpan: number };
export type Obj = { present: boolean; x: number; y: number; scale: number; opacity: number };
export type State = {
  shields: ShieldS[];
  shieldRed: number; // cả khối đỏ (bị bắn)
  shieldGreen: number; // xanh (đã mở khe, giao tiếp)
  aligned: number;
  driveGranted: number;
  rocket: { x: number; y: number; point: number; thrust: number; opacity: number };
  shots: { x: number; y: number }[]; // đạn 8-bit đang bay
  burst: number; // nổ khi đạn chạm khiên
  burstPos: { x: number; y: number };
  popup: { present: boolean; appear: number; approve: number; opacity: number };
  ticket: Obj;
  app: { live: number };
};

export type EvKind = "emit" | "attach" | "arrive" | "fill" | "fail" | "drop" | "slow";
export type Ev = { f: number; kind: EvKind };
const events: Ev[] = [
  ...SHOTS.map((f) => ({ f, kind: "emit" as EvKind })), // tiếng bắn
  { f: T.blocked, kind: "fail" }, // đạn bị chặn
  { f: T.approve, kind: "arrive" }, // đồng ý
  { f: T.alignStart, kind: "slow" }, // khiên xoay xếp
  { f: T.ticket, kind: "attach" }, // phát vé
  { f: T.docked, kind: "fill" }, // vào tới drive
];
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET).sort((a, b) => a.f - b.f);

const TOWARD = CORRIDOR_ANG + 180; // hướng từ tên lửa vào tâm
const alignW = (f: number) => clamp01(ramp(f, T.alignStart, 72) - ramp(f, 520, 70));
const orbitBase = (i: number, f: number) => SHIELD_PHASE[i] + 360 * SHIELD_TURNS[i] * (f / LOOP);

const rocketD = (f: number) => {
  if (f < T.approach) return D_HOME;
  if (f < T.atFire) return lerp(D_HOME, D_FIRE, easeInOutCubic(clamp01((f - T.approach) / (T.atFire - T.approach))));
  if (f < T.flyIn) return D_FIRE;
  if (f < T.docked) return lerp(D_FIRE, D_DOCK, easeInOutCubic(clamp01((f - T.flyIn) / (T.docked - T.flyIn))));
  if (f < T.flyOut) return D_DOCK;
  if (f < T.home) return lerp(D_DOCK, D_HOME, easeInOutCubic(clamp01((f - T.flyOut) / (T.home - T.flyOut))));
  return D_HOME;
};

const simulate = (): State[] => {
  const out: State[] = [];
  for (let f = 0; f <= LOOP; f++) {
    const w = alignW(f);

    // Khiên: KHE lerp giữa orbit và góc corridor (xếp thẳng)
    const shields: ShieldS[] = [];
    for (let i = 0; i < N_SHIELD; i++) {
      const gapAng = orbitBase(i, f) * (1 - w) + CORRIDOR_ANG * w;
      shields.push({ r: SHIELD_R[i], gapAng, gapSpan: SHIELD_GAP });
    }

    // Đạn 8-bit + nổ
    const shots: { x: number; y: number }[] = [];
    let burst = 0;
    for (const st of SHOTS) {
      if (f >= st && f < st + SHOT_DUR) {
        const p = (f - st) / SHOT_DUR;
        shots.push(onRay(lerp(D_FIRE, BLOCK_R, p)));
      }
      if (f >= st + SHOT_DUR && f < st + SHOT_DUR + 9) burst = Math.max(burst, 1 - (f - (st + SHOT_DUR)) / 9);
    }
    const burstPos = onRay(BLOCK_R);

    // Màu: ĐỎ từ lúc đạn chạm tới lúc đồng ý; XANH từ lúc mở khe tới lúc tàu rời
    const shieldRed = clamp01(Math.max(ramp(f, T.blocked, 6) - ramp(f, T.approve, 14), burst));
    const shieldGreen = clamp01(ramp(f, T.aligned - 20, 40) - ramp(f, 500, 60));

    // Tên lửa
    const d = rocketD(f);
    const pos = onRay(d);
    let point: number;
    if (f < T.docked) point = TOWARD;
    else if (f < T.flyOut) point = lerp(TOWARD, CORRIDOR_ANG, clamp01((f - T.docked) / (T.flyOut - T.docked)));
    else if (f < T.home) point = CORRIDOR_ANG;
    else point = lerp(CORRIDOR_ANG, TOWARD, clamp01((f - T.home) / 30));
    const moving = (f >= T.approach && f < T.atFire) || (f >= T.flyIn && f < T.docked) || (f >= T.flyOut && f < T.home);
    const rocket = { x: pos.x, y: pos.y, point, thrust: moving ? 1 : 0, opacity: 1 };

    // Popup
    const pPresent = f >= T.popup - 8 && f < T.flyIn;
    const popup = {
      present: pPresent,
      appear: pPresent ? clamp01(spring01((f - T.popup) / FPS, { omega: 13, zeta: 0.5 })) : 0,
      approve: clamp01(ramp(f, T.approve, 10)),
      opacity: pPresent ? clamp01(ramp(f, T.popup - 8, 8) - ramp(f, T.ticketAt, 16)) : 0,
    };

    // Vé (token) phát từ drive RA tên lửa qua khe
    const tPresent = f >= T.ticket && f < T.ticketAt + 12;
    let ticket: Obj = { present: false, x: 0, y: 0, scale: 1, opacity: 0 };
    if (tPresent) {
      const tp = easeInOutCubic(clamp01((f - T.ticket) / (T.ticketAt - T.ticket)));
      const p = onRay(lerp(DRIVE_R + 44, D_FIRE, tp));
      ticket = { present: true, x: p.x, y: p.y, scale: 1, opacity: clamp01(ramp(f, T.ticket, 8) - ramp(f, T.ticketAt, 12)) };
    }

    const driveGranted = clamp01(ramp(f, T.docked, 18) * (1 - ramp(f, 500, 44)));
    const app = { live: clamp01(0.15 + 0.5 * (shots.length || burst > 0.1 ? 0.6 + 0.4 * pulse(f, 12) : 0)) };

    out.push({ shields, shieldRed, shieldGreen, aligned: w, driveGranted, rocket, shots, burst, burstPos, popup, ticket, app });
  }
  return out;
};

export const STATES = simulate();

// ─── Kết cục cho verify ────────────────────────────────────────────────
const angDist = (a: number, b: number) => {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
};
// Corridor bị chặn nếu có lớp khiên PHỦ nó (corridor không nằm trong khe lớp đó).
const corridorBlocked = (s: State) => s.shields.some((sh) => angDist(sh.gapAng, CORRIDOR_ANG) > sh.gapSpan / 2 + 2);
export const OUTCOME = {
  blockedAtFire: corridorBlocked(STATES[T.blocked]),
  openAfterAlign: STATES[T.aligned].aligned > 0.95 && !corridorBlocked(STATES[T.aligned]),
  ticketBeforeEntry: T.ticket < T.flyIn,
  rocketInOnlyAfterAlign: Math.min(...STATES.slice(0, T.aligned).map((s) => Math.hypot(s.rocket.x - CENTER.x, s.rocket.y - CENTER.y))) > 300,
  grantedAtDock: STATES[T.docked + 20].driveGranted > 0.8,
  // đỏ khi bị bắn, xanh khi mở khe
  redAtHit: STATES[T.blocked + 6].shieldRed > 0.8,
  greenWhenOpen: STATES[T.docked].shieldGreen > 0.8,
};

void APP;

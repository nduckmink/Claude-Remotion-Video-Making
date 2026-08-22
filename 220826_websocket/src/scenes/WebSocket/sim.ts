/**
 * Mô phỏng cơ chế WebSocket từng frame. Component chỉ ĐỌC STATES[frame] và vẽ.
 * KHÔNG import remotion — verify.ts chạy bằng Node.
 */
import { clamp, decayPulse, invLerp, smoothstep, spring01 } from "../../lib/anim";
import {
  FPS,
  LOCK_AT,
  LOCK_SWEEP_F,
  LOOP,
  MSGS,
  RAILS,
  READOUT_DOWN,
  READOUT_UP,
  SETTLE,
  TRAVEL_F,
  anchor,
  lanePos,
  type Dir,
  type Kind,
} from "./constants";

export type PacketState = {
  key: string;
  dir: Dir;
  kind: Kind;
  u: number;
  x: number;
  y: number;
  /** Số frame kể từ lúc rời nguồn — dùng cho spring nảy ra. */
  age: number;
};

export type RailState = {
  key: string;
  dir: Dir;
  /** Đã vẽ được bao nhiêu phần đường: 0→1. */
  draw: number;
  /** Đang rút về: 0→1 (chỉ dây đã khoá). */
  retract: number;
  alpha: number;
  /** Đã khoá cỡ nào: 0 = dây HTTP tạm, 1 = socket mở hẳn. */
  lock: number;
};

export type RippleState = {
  key: string;
  x: number;
  y: number;
  /** 0→1 vòng đời ring. */
  t: number;
  tone: "id" | "pass";
  owner: "client" | "server";
};

export type State = {
  packets: PacketState[];
  rails: RailState[];
  ripples: RippleState[];
  clientHeat: number;
  serverHeat: number;
  /** 0 = HTTP (~700 B), 1 = WS (6 B). */
  readout: number;
  /** Sweep xanh chạy dọc hai làn lúc khoá; -1 = không chạy. */
  sweep: number;
  laneBusy: Record<Dir, boolean>;
};

export type SfxEvent = { f: number; sfx: string; vol: string };

const RIPPLE_F = 20;

const arrivalOf = (t: number) => t + TRAVEL_F;

// ── Lịch tiếng: sinh TỪ lịch sự kiện, không gõ tay frame nào ───────────
const buildEvents = (): SfxEvent[] => {
  const ev: SfxEvent[] = [];

  for (const r of RAILS) ev.push({ f: r.birth, sfx: "draw", vol: "draw" });

  let arriveN = 0;
  for (const m of MSGS) {
    ev.push({ f: m.t, sfx: "emit", vol: "emit" });

    const at = arrivalOf(m.t);
    // `101` chạm client KHÔNG kêu `arrive` — sự kiện ở đó là socket KHỚP.
    // `close` chạm server cũng vậy — sự kiện là hệ tháo ra.
    if (m.kind === "msg" || m.kind === "upgrade") {
      ev.push({ f: at, sfx: `arrive-${(arriveN % 4) + 1}`, vol: "arrive" });
      arriveN++;
    } else if (m.kind === "ok101") {
      ev.push({ f: at, sfx: "attach", vol: "attach" });
    } else if (m.kind === "close") {
      ev.push({ f: at, sfx: "drop", vol: "drop" });
    }
  }

  return ev.sort((a, b) => a.f - b.f);
};

export const EVENTS = buildEvents();

// ── Mô phỏng ──────────────────────────────────────────────────────────
const simulate = (): State[] => {
  const out: State[] = [];

  // Sự kiện làm NÓNG từng node: nó gửi đi, hoặc nó nhận được.
  const clientBeats: number[] = [];
  const serverBeats: number[] = [];
  for (const m of MSGS) {
    (m.dir === "down" ? clientBeats : serverBeats).push(m.t);
    (m.dir === "down" ? serverBeats : clientBeats).push(arrivalOf(m.t));
  }

  for (let f = 0; f <= LOOP; f++) {
    const packets: PacketState[] = [];
    const laneBusy: Record<Dir, boolean> = { down: false, up: false };

    MSGS.forEach((m, i) => {
      if (f < m.t || f > arrivalOf(m.t)) return;
      const u = (f - m.t) / TRAVEL_F;
      const p = lanePos(m.dir, u);
      packets.push({
        key: `p${i}`,
        dir: m.dir,
        kind: m.kind,
        u,
        x: p.x,
        y: p.y,
        age: f - m.t,
      });
      laneBusy[m.dir] = true;
    });

    const rails: RailState[] = [];
    RAILS.forEach((r, i) => {
      const end = r.deathAt + r.deathF;
      if (f < r.birth || f >= end) return;
      const draw = clamp((f - r.birth) / r.drawF);
      const retract = clamp((f - r.deathAt) / r.deathF);
      const locked = r.lock !== undefined && f >= r.lock;
      rails.push({
        key: `r${i}`,
        dir: r.dir,
        // Dây đã khoá thì bị RÚT về; dây HTTP tạm thì chỉ tắt.
        draw: r.lock === undefined ? draw : draw * (1 - retract),
        retract,
        alpha: r.lock === undefined ? 1 - retract : 1 - retract * 0.45,
        lock: locked ? spring01((f - (r.lock as number)) / FPS) : 0,
      });
    });

    const ripples: RippleState[] = [];
    MSGS.forEach((m, i) => {
      const at = arrivalOf(m.t);
      if (f < at || f > at + RIPPLE_F) return;
      const a = anchor(m.dir, "to");
      ripples.push({
        key: `w${i}`,
        x: a.x,
        y: a.y,
        t: (f - at) / RIPPLE_F,
        tone: m.kind === "ok101" ? "pass" : "id",
        owner: m.dir === "down" ? "server" : "client",
      });
    });

    // Xong việc thì TẮT SÁNG — và tắt HẲN, để biên loop khớp tới byte.
    const settle = 1 - smoothstep(invLerp(SETTLE[0], SETTLE[1], f));
    const heat = (beats: number[]) =>
      beats.reduce((acc, b) => Math.max(acc, decayPulse(f, b, 7)), 0) * settle;

    const readout =
      f < READOUT_UP[0]
        ? 0
        : f < READOUT_UP[1]
          ? smoothstep(invLerp(READOUT_UP[0], READOUT_UP[1], f))
          : f < READOUT_DOWN[0]
            ? 1
            : f < READOUT_DOWN[1]
              ? 1 - smoothstep(invLerp(READOUT_DOWN[0], READOUT_DOWN[1], f))
              : 0;

    const sweep =
      f >= LOCK_AT && f <= LOCK_AT + LOCK_SWEEP_F
        ? (f - LOCK_AT) / LOCK_SWEEP_F
        : -1;

    out.push({
      packets,
      rails,
      ripples,
      clientHeat: heat(clientBeats),
      serverHeat: heat(serverBeats),
      readout,
      sweep,
      laneBusy,
    });
  }

  return out;
};

/** Chạy MỘT lần ở module level. */
export const STATES = simulate();

// ── Số liệu tính RA, không gõ ─────────────────────────────────────────
export const RAIL_BUILDS_HTTP = RAILS.filter((r) => r.lock === undefined).length;
export const RAIL_BUILDS_OPEN = RAILS.filter((r) => r.lock !== undefined).length;
export const LAST_SFX_F = Math.max(...EVENTS.map((e) => e.f));

import {
  A1_EXIT,
  A1_HACKER_IN,
  A1_HIT,
  A1_LEAVE,
  A1_LUNGE,
  A1_RESET,
  A1_THROW,
  A1_TYPE,
  A2_EXIT,
  A2_HACKER_IN,
  A2_HIT,
  A2_LEAVE,
  A2_LUNGE,
  A2_THROW,
  A2_TYPE,
  ALARM_FLASH,
  ANVIL,
  ANVIL_HOLD,
  ANVIL_TO_DB,
  AUTH_ALARM,
  AUTH_C,
  AUTH_FLASH,
  AUTH_SHAKE,
  A_TO_ANVIL,
  A_TO_DB,
  BCRYPT_IN,
  BCRYPT_IN_DUR,
  BOUNCE_DIR,
  BOUNCE_DIST,
  BOUNCE_OUT,
  BOUNCE_SPIN,
  DB_ENTRY,
  DB_TO_SLOT,
  GRAB,
  HACKER_FADE,
  HACKER_HIT,
  HACKER_OUT,
  HACKER_REST,
  HACKER_RISE,
  HACKER_ROT,
  HAMMER_SWING,
  HASH,
  KNOCK,
  LOOP,
  N_USERS,
  PASS_IN,
  PASSWORD,
  RESET,
  RESET_DUR,
  RIPPLE_DUR,
  SALT_FALL,
  SHAKE_AMP,
  SHIFT_DUR,
  SHIFT_LEAD,
  STORE_FLASH,
  THROW_STAGGER,
  TYPE_DUR,
  TYPE_HOLD,
  at,
  frames,
  loot,
  slot,
  type Pt,
} from "./constants";

/**
 * Mô phỏng thật, từng frame. Component chỉ ĐỌC STATES[frame] và vẽ.
 * Không import lib/motion.ts — file đó kéo `Easing` của remotion vào, mà
 * verify.ts chạy trong Node.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (f: number, from: number, dur: number) => clamp01((f - from) / dur);

/**
 * Easing. `motion_language.md` đã ghi sẵn inOut(cubic) là MẶC ĐỊNH — bản V1/V2
 * bay tuyến tính suốt, nên mọi thứ trôi đều đều như băng chuyền và xem chán.
 * Chậm → nhanh → chậm mới ra chuyển động có trọng lượng.
 */
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
/** Cú lao: nhanh dần TỚI LÚC VA, không chậm lại. Vật lao vào mà giảm tốc
 *  trước khi đâm là nói dối về lực. */
const easeIn = (t: number) => t * t * t;

export type EvKind =
  | "emit"
  | "arrive"
  | "attach"
  | "absorb"
  | "install"
  | "fail" // database bị húc thủng · hoặc cú gõ cửa bị từ chối
  | "drop"; // hash bị vứt sau khi bị từ chối

export type Ev = { f: number; kind: EvKind; i?: number };

export type Rec = {
  i: number;
  x: number;
  y: number;
  hashed: boolean;
  chars: number;
  opacity: number;
  scale: number;
  rot: number;
  /** Đang trong tay hacker hoặc đang bay tới ô auth. */
  stolen: boolean;
};

export type Salt = { i: number; x: number; y: number; opacity: number };

export type State = {
  recs: Rec[];
  salts: Salt[];
  hacker: { x: number; y: number; impact: number; opacity: number; rot: number } | null;
  hammer: { swing: number; opacity: number } | null;
  bcrypt: number;
  bcryptLive: number;
  dbAlarm: number;
  dbLive: number;
  dbRipple: number;
  authLive: number;
  /** 0→1 loé TRẮNG: cửa mở, mật khẩu ăn trộm dùng được. */
  authPass: number;
  /** 0→1 nháy CAM: cửa đóng sập. */
  authReject: number;
  /** px lệch ngang — ô auth rung khi từ chối. */
  authShake: number;
  storeFlash: number[];
  stored: number[];
  carrying: number;
  /** chỉ để verify */
  passed: number[];
  rejected: number[];
};

const events: Ev[] = [];

type Sched = {
  i: number;
  typeAt: number;
  depart: number;
  anvilAt: number;
  anvilOut: number;
  entryAt: number;
  settled: number;
};

const buildAct = (typeAt: number[], viaBcrypt: boolean): Sched[] =>
  typeAt.map((t, i) => {
    const depart = t + TYPE_DUR + TYPE_HOLD;
    if (!viaBcrypt) {
      const entryAt = depart + A_TO_DB;
      return {
        i,
        typeAt: t,
        depart,
        anvilAt: -1,
        anvilOut: -1,
        entryAt,
        settled: entryAt + DB_TO_SLOT,
      };
    }
    const anvilAt = depart + A_TO_ANVIL;
    const anvilOut = anvilAt + ANVIL_HOLD;
    const entryAt = anvilOut + ANVIL_TO_DB;
    return { i, typeAt: t, depart, anvilAt, anvilOut, entryAt, settled: entryAt + DB_TO_SLOT };
  });

const ACT1 = buildAct(A1_TYPE, false);
const ACT2 = buildAct(A2_TYPE, true);

/** Frame búa gõ trúng bản ghi i (act 2). Sim NÓI ra, verify khỏi đoán từ x. */
export const STRUCK_AT = ACT2.map((s) => s.anvilAt + SALT_FALL + HAMMER_SWING);

/** Chỗ bản ghi i nằm trong chồng tại frame f — cơ chế ĐẨY XUỐNG. */
const posAt = (act: Sched[], i: number, f: number) =>
  act
    .filter((o) => o.i > i)
    .reduce((acc, o) => acc + ramp(f, o.entryAt - SHIFT_LEAD, SHIFT_DUR), 0);

/**
 * Lịch cú thử đăng nhập: khối ở CHỖ NẰM `lane` bay từ tay hacker tới KNOCK.
 *
 * Ném từ TRÊN xuống (lane 0 đi trước) — ngược với V2, và ngược có lý do:
 * ô auth nằm phía TRÊN chồng đồ ăn trộm, nên khối trên cùng bay ra là bay
 * XA DẦN mấy khối dưới. Cho khối đáy đi trước là nó phải xuyên qua cả chồng.
 *
 * Luật chung, không phải mẹo: ĐỨA GẦN CỬA RA NHẤT ĐI TRƯỚC. V2 ném xuống nên
 * đáy đi trước; V3 ném lên nên đỉnh đi trước. Chép nguyên thứ tự của V2 sang
 * đây là đè nhau ngay, và đã đè thật.
 */
const knockSched = (throwAt: number, hit: number, act: Sched[]) =>
  act.map((s) => {
    const lane = Math.round(posAt(act, s.i, hit));
    const from = loot(lane, HACKER_HIT.y);
    const start = throwAt + lane * THROW_STAGGER;
    const fly = frames(from, KNOCK);
    return { i: s.i, lane, from, start, fly, knockAt: start + fly };
  });

const KNOCK1 = knockSched(A1_THROW, A1_HIT, ACT1);
const KNOCK2 = knockSched(A2_THROW, A2_HIT, ACT2);

for (const s of ACT1) {
  events.push({ f: s.depart, kind: "emit", i: s.i });
  events.push({ f: s.settled, kind: "arrive", i: s.i });
}
events.push({ f: BCRYPT_IN, kind: "install" });
for (const s of ACT2) {
  events.push({ f: s.depart, kind: "emit", i: s.i });
  events.push({ f: s.anvilAt + SALT_FALL, kind: "attach", i: s.i });
  events.push({ f: s.anvilAt + SALT_FALL + HAMMER_SWING, kind: "absorb", i: s.i });
  events.push({ f: s.settled, kind: "arrive", i: s.i });
}
events.push({ f: A1_HIT, kind: "fail" });
events.push({ f: A2_HIT, kind: "fail" });
// Act 1: cửa MỞ — tiếng `arrive`, gọn và bình thản. Cửa chỉ việc mở ra, ba lần.
for (const k of KNOCK1) events.push({ f: k.knockAt, kind: "arrive", i: k.i });
// Act 2: cửa ĐÓNG SẬP — `fail` rồi `drop`. Hệ thống chống trả.
for (const k of KNOCK2) {
  events.push({ f: k.knockAt, kind: "fail" });
  events.push({ f: k.knockAt + 4, kind: "drop", i: k.i });
}
events.sort((a, b) => a.f - b.f);

export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET);
export const KNOCKS = { act1: KNOCK1, act2: KNOCK2 };

const hackerAt = (
  f: number,
  fadeIn: number,
  lunge: number,
  hit: number,
  leave: number,
  exit: number,
) => {
  if (f < fadeIn) return null;
  // Hiện ra rồi ĐỨNG IM một nhịp — anticipation. Không có nhịp lấy đà thì cú
  // lao mất hết sức nặng, và mắt không kịp đăng ký "có thứ gì vừa xuất hiện".
  if (f < lunge) {
    const o = ramp(f, fadeIn, HACKER_FADE);
    return o <= 0.001
      ? null
      : { x: HACKER_REST.x, y: HACKER_REST.y, impact: 0, opacity: o, rot: HACKER_ROT };
  }
  if (f < hit) {
    const q = at(HACKER_REST, HACKER_HIT, easeIn((f - lunge) / HACKER_RISE));
    return { x: q.x, y: q.y, impact: 0, opacity: 1, rot: HACKER_ROT };
  }
  if (f < leave) {
    const k = clamp01((f - hit) / 8);
    return { x: HACKER_HIT.x, y: HACKER_HIT.y, impact: 1 - k, opacity: 1, rot: HACKER_ROT };
  }
  const p = clamp01((f - leave) / exit);
  const q = at(HACKER_HIT, HACKER_OUT, easeIn(p));
  const opacity = 1 - clamp01((p - 0.7) / 0.3);
  return opacity <= 0.001 ? null : { x: q.x, y: q.y, impact: 0, opacity, rot: HACKER_ROT };
};

const simulate = (): State[] => {
  const out: State[] = [];

  for (let f = 0; f <= LOOP; f++) {
    const recs: Rec[] = [];
    const salts: Salt[] = [];
    const storeFlash = Array.from({ length: N_USERS }, () => 0);
    const stored: number[] = [];
    const passed: number[] = [];
    const rejected: number[] = [];
    let authLive = 0;
    let dbLive = 0;
    let carrying = 0;
    let authPass = 0;
    let authReject = 0;
    let authShake = 0;

    const inA1 = f < A1_RESET;
    const act = inA1 ? ACT1 : ACT2;
    const knocks = inA1 ? KNOCK1 : KNOCK2;
    const fadeIn = inA1 ? A1_HACKER_IN : A2_HACKER_IN;
    const lunge = inA1 ? A1_LUNGE : A2_LUNGE;
    const hit = inA1 ? A1_HIT : A2_HIT;
    const leave = inA1 ? A1_LEAVE : A2_LEAVE;
    const exit = inA1 ? A1_EXIT : A2_EXIT;

    const hacker = hackerAt(f, fadeIn, lunge, hit, leave, exit);
    const looted = f >= hit + GRAB;

    for (const s of act) {
      if (f < s.typeAt) continue;

      const struckAt = s.anvilAt >= 0 ? s.anvilAt + SALT_FALL + HAMMER_SWING : Infinity;
      const hashedNow = f >= struckAt;
      const shown = hashedNow ? HASH[s.i] : PASSWORD[s.i];
      const k = knocks.find((x) => x.i === s.i)!;

      // ── Cú thử đăng nhập ──────────────────────────────────────────────
      // Cùng một hành động ở CẢ HAI act, cùng một điểm chạm, cùng một số
      // frame. Chỉ chuyện xảy ra SAU cú chạm là khác — đó là toàn bộ luận
      // điểm, và là lý do không được để hai act ném tới hai chỗ khác nhau.
      if (f >= k.start) {
        if (f < k.knockAt) {
          const q = at(k.from, KNOCK, easeInOut((f - k.start) / k.fly));
          recs.push({
            i: s.i,
            x: q.x,
            y: q.y,
            hashed: hashedNow,
            chars: shown.length,
            opacity: 1,
            scale: 1,
            rot: 0,
            stolen: true,
          });
          continue;
        }

        const since = f - k.knockAt;

        if (inA1) {
          // MẬT KHẨU ăn trộm = chìa khoá thật. Khối XUYÊN QUA vào trong ô rồi
          // tan: cửa mở. Loé TRẮNG, không ăn mừng — cái đáng sợ nằm ở chỗ hệ
          // thống chẳng phản ứng gì. Nó chỉ mở ra. Ba lần.
          const p = clamp01(since / PASS_IN);
          authPass = Math.max(authPass, clamp01(1 - (since - PASS_IN) / AUTH_FLASH));
          if (p < 1) {
            const q = at(KNOCK, AUTH_C, easeOut(p));
            recs.push({
              i: s.i,
              x: q.x,
              y: q.y,
              hashed: hashedNow,
              chars: shown.length,
              opacity: 1 - clamp01((p - 0.55) / 0.45),
              scale: 1,
              rot: 0,
              stolen: true,
            });
          } else {
            passed.push(s.i);
          }
          continue;
        }

        // HASH không phải mật khẩu → không mở được cửa. Khối NẢY BẬT RA, ô
        // auth rung rồi nháy cam, khối xoay tít rồi tan. Đường đi nói hộ,
        // không cần một chữ nào.
        const p = clamp01(since / BOUNCE_OUT);
        authReject = Math.max(authReject, clamp01(1 - since / AUTH_ALARM));
        if (since < AUTH_SHAKE) {
          authShake +=
            SHAKE_AMP * Math.sin((since / 2.2) * Math.PI) * (1 - since / AUTH_SHAKE);
        }
        if (p < 1) {
          const to = {
            x: KNOCK.x + BOUNCE_DIR.x * BOUNCE_DIST,
            y: KNOCK.y + BOUNCE_DIR.y * BOUNCE_DIST,
          };
          const q = at(KNOCK, to, easeOut(p));
          recs.push({
            i: s.i,
            x: q.x,
            y: q.y,
            hashed: hashedNow,
            chars: shown.length,
            opacity: 1 - clamp01((p - 0.5) / 0.5),
            scale: 1,
            rot: BOUNCE_SPIN * p,
            stolen: true,
          });
        } else {
          rejected.push(s.i);
        }
        continue;
      }

      // ── Đang bị hacker cầm ────────────────────────────────────────────
      if (looted) {
        if (!hacker) continue; // nó khuất thì đồ nó cầm khuất theo
        const lane = k.lane;
        const p = clamp01((f - (hit + GRAB)) / 10);
        const from = slot(posAt(act, s.i, hit));
        const q = at(from, loot(lane, hacker.y), easeOut(p));
        recs.push({
          i: s.i,
          x: q.x,
          y: q.y,
          hashed: hashedNow,
          chars: shown.length,
          opacity: hacker.opacity,
          scale: 1,
          rot: 0,
          stolen: true,
        });
        carrying++;
        continue;
      }

      // ── Đang gõ ở ô auth ──────────────────────────────────────────────
      if (f < s.depart) {
        const n = Math.round(clamp01((f - s.typeAt) / TYPE_DUR) * PASSWORD[s.i].length);
        if (ramp(f, s.typeAt, 4) > 0.001) authLive = 1;
        recs.push({
          i: s.i,
          x: AUTH_C.x,
          y: AUTH_C.y,
          hashed: false,
          chars: n,
          opacity: ramp(f, s.typeAt, 4),
          scale: 1,
          rot: 0,
          stolen: false,
        });
        continue;
      }

      // ── Đang trên đe ──────────────────────────────────────────────────
      if (s.anvilAt >= 0 && f >= s.anvilAt && f < s.anvilOut) {
        const since = f - s.anvilAt;
        if (since < SALT_FALL) {
          salts.push({
            i: s.i,
            x: ANVIL.x,
            y: ANVIL.y - 90 + 72 * easeIn(since / SALT_FALL),
            opacity: 1,
          });
        }
        recs.push({
          i: s.i,
          x: ANVIL.x,
          y: ANVIL.y,
          hashed: hashedNow,
          chars: shown.length,
          scale: hashedNow ? 1 - 0.18 * Math.exp(-(f - struckAt) / 3) : 1,
          opacity: 1,
          rot: 0,
          stolen: false,
        });
        continue;
      }

      // ── Đang bay ──────────────────────────────────────────────────────
      let p: Pt | null = null;
      if (s.anvilAt < 0) {
        if (f < s.entryAt) p = at(AUTH_C, DB_ENTRY, easeInOut((f - s.depart) / A_TO_DB));
      } else if (f < s.anvilAt) {
        p = at(AUTH_C, ANVIL, easeInOut((f - s.depart) / A_TO_ANVIL));
      } else if (f < s.entryAt) {
        p = at(ANVIL, DB_ENTRY, easeInOut((f - s.anvilOut) / ANVIL_TO_DB));
      }
      if (p) {
        recs.push({
          i: s.i,
          x: p.x,
          y: p.y,
          hashed: hashedNow,
          chars: shown.length,
          opacity: 1,
          scale: 1,
          rot: 0,
          stolen: false,
        });
        continue;
      }

      // ── Nằm trong database, bị đẩy dần xuống ──────────────────────────
      const pos = posAt(act, s.i, f);
      const q =
        f < s.settled
          ? at(DB_ENTRY, slot(0), easeOut((f - s.entryAt) / DB_TO_SLOT))
          : slot(pos);
      if (f >= s.settled) {
        stored.push(s.i);
        storeFlash[s.i] = clamp01(1 - (f - s.settled) / STORE_FLASH);
      }
      dbLive = 1;
      recs.push({
        i: s.i,
        x: q.x,
        y: q.y,
        hashed: hashedNow,
        chars: shown.length,
        opacity: 1,
        scale: 1,
        rot: 0,
        stolen: false,
      });
    }

    const resetT = ramp(f, RESET, RESET_DUR);
    const visible = recs.filter((r) => r.opacity > 0.001);

    out.push({
      recs: visible,
      salts,
      hacker,
      hammer: (() => {
        if (inA1) return null;
        for (const s of ACT2) {
          const t0 = s.anvilAt + SALT_FALL;
          if (f >= t0 - 6 && f < t0 + HAMMER_SWING + 10) {
            const swing = clamp01((f - t0) / HAMMER_SWING);
            const up = clamp01((f - (t0 + HAMMER_SWING)) / 10);
            return { swing: easeIn(swing) * (1 - up), opacity: 1 };
          }
        }
        return null;
      })(),
      bcrypt: ramp(f, BCRYPT_IN, BCRYPT_IN_DUR) * (1 - resetT),
      bcryptLive: salts.length > 0 || visible.some((r) => Math.abs(r.x - ANVIL.x) < 2) ? 1 : 0,
      dbAlarm: f >= hit && f < hit + ALARM_FLASH ? 1 - (f - hit) / ALARM_FLASH : 0,
      dbLive,
      dbRipple: f >= hit && f < hit + RIPPLE_DUR ? (f - hit) / RIPPLE_DUR : -1,
      authLive: Math.max(authLive, authPass > 0 || authReject > 0 ? 1 : 0),
      authPass,
      authReject,
      authShake,
      storeFlash,
      stored,
      carrying,
      passed,
      rejected,
    });
  }

  return out;
};

export const STATES = simulate();

/** Kết cục của mỗi act — con số kể chuyện, verify canh. */
export const OUTCOME = {
  act1Pass: STATES[A1_LEAVE].passed.length,
  act1Reject: STATES[A1_LEAVE].rejected.length,
  act2Pass: STATES[A2_LEAVE].passed.length,
  act2Reject: STATES[A2_LEAVE].rejected.length,
};

import {
  A1_ATTACK,
  A1_EXIT,
  A1_GRAB,
  A1_HIT,
  A1_LEAVE,
  A1_RESET,
  A1_TYPE,
  A2_ATTACK,
  A2_EXIT,
  A2_GRAB,
  A2_HIT,
  A2_LEAVE,
  A2_STARE,
  A2_THROW,
  A2_THROW_DUR,
  A2_TYPE,
  ALARM_FLASH,
  ANVIL,
  ANVIL_HOLD,
  ANVIL_TO_DB,
  BCRYPT_IN,
  BCRYPT_IN_DUR,
  DB_ENTRY,
  DB_TO_SLOT,
  FRONTEND_C,
  F_TO_ANVIL,
  F_TO_DB,
  HACKER_FADE,
  HACKER_HIT,
  HACKER_OUT,
  HACKER_ROT,
  HACKER_REST,
  HACKER_RISE,
  HASH,
  LOOP,
  N_USERS,
  PASSWORD,
  RESET,
  RESET_DUR,
  RIPPLE_DUR,
  SALT_FALL,
  HAMMER_SWING,
  STORE_FLASH,
  TRASH,
  TYPE_DUR,
  TYPE_HOLD,
  SLOT_MOVE,
  at,
  loot,
  slotY,
  SHIFT_DUR,
  SHIFT_LEAD,
  type Pt,
} from "./constants";

/**
 * Mô phỏng thật, từng frame. Component chỉ ĐỌC STATES[frame] và vẽ.
 * Không import lib/motion.ts — file đó kéo `Easing` của remotion vào, mà
 * verify.ts chạy trong Node.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (f: number, from: number, dur: number) => clamp01((f - from) / dur);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t: number) => t * t;

export type EvKind =
  | "emit" // một bản ghi rời frontend
  | "arrive" // nằm xuống database
  | "attach" // salt cắm vào bản ghi
  | "absorb" // búa gõ — bản ghi bị biến đổi
  | "install" // bcrypt hiện ra
  | "fail" // hacker húc thủng database
  | "drop"; // hash bị ném xuống sàn

export type Ev = { f: number; kind: EvKind; i?: number };

/** Một bản ghi mật khẩu. `hashed` quyết định nó hiện chữ gì. */
export type Rec = {
  i: number;
  x: number;
  y: number;
  hashed: boolean;
  /** số ký tự đang hiện — chỉ < độ dài khi đang được gõ ở frontend */
  chars: number;
  opacity: number;
  scale: number;
  rot: number;
  /** Đã bị hacker ném xuống sàn. Sim NÓI ra, để verify khỏi phải đoán từ toạ
   *  độ — dời chỗ ném một cái là kiểu đoán ấy sai ngay, và nó đã sai một lần. */
  thrown: boolean;
};

export type Salt = { i: number; x: number; y: number; opacity: number };

export type State = {
  recs: Rec[];
  salts: Salt[];
  /** null = hacker không có mặt trong khung */
  hacker: { x: number; y: number; impact: number; opacity: number; rot: number } | null;
  hammer: { swing: number; opacity: number } | null;
  bcrypt: number; // 0→1 độ hiện của khối bcrypt
  bcryptLive: number;
  dbAlarm: number; // nháy cam khi bị húc
  dbLive: number;
  dbRipple: number;
  frontendLive: number;
  flowLive: number;
  storeFlash: number[]; // loé trắng khi bản ghi nằm xuống
  /** chỉ để verify — không vẽ ra */
  stored: number[];
  carrying: number;
};

const events: Ev[] = [];
/** Cái hacker cầm về mỗi act — con số kể chuyện, verify canh. */
export const HAUL: { act: number; leaves: number; hashed: boolean }[] = [];

/** Mốc thời gian của MỘT bản ghi, dựng một lần rồi tra. */
type Sched = {
  i: number;
  typeAt: number;
  depart: number;
  anvilAt: number; // -1 nếu act 1 (không qua bcrypt)
  anvilOut: number;
  entryAt: number;
  settled: number;
  hashed: boolean;
};

const buildAct = (typeAt: number[], viaBcrypt: boolean): Sched[] =>
  typeAt.map((t, i) => {
    const depart = t + TYPE_DUR + TYPE_HOLD;
    if (!viaBcrypt) {
      const entryAt = depart + F_TO_DB;
      return {
        i,
        typeAt: t,
        depart,
        anvilAt: -1,
        anvilOut: -1,
        entryAt,
        settled: entryAt + SLOT_MOVE,
        hashed: false,
      };
    }
    const anvilAt = depart + F_TO_ANVIL;
    const anvilOut = anvilAt + ANVIL_HOLD;
    const entryAt = anvilOut + ANVIL_TO_DB;
    return {
      i,
      typeAt: t,
      depart,
      anvilAt,
      anvilOut,
      entryAt,
      settled: entryAt + SLOT_MOVE,
      hashed: true,
    };
  });

const ACT1 = buildAct(A1_TYPE, false);
const ACT2 = buildAct(A2_TYPE, true);

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
// Cùng thứ tự với cú ném: dưới lên.
for (let i = 0; i < N_USERS; i++) events.push({ f: A2_THROW + (N_USERS - 1 - i) * 5, kind: "drop", i });

events.sort((a, b) => a.f - b.f);

/** Lịch SFX. Cửa sổ reset phải LẶNG — tai bắt mối nối giỏi hơn mắt nhiều. */
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET);

HAUL.push({ act: 1, leaves: N_USERS, hashed: false });
HAUL.push({ act: 2, leaves: 0, hashed: true });

/** Vị trí hacker tại frame f trong một act. */
const hackerAt = (f: number, attack: number, leave: number, exit: number) => {
  if (f < attack) return null;
  const hit = attack + HACKER_RISE;
  if (f < hit) {
    // Húc LÊN: tăng tốc dần — nó lao vào, không trôi vào.
    const p = easeIn((f - attack) / HACKER_RISE);
    const q = at(HACKER_REST, HACKER_HIT, p);
    const o = ramp(f, attack, HACKER_FADE);
    return o <= 0.001 ? null : { x: q.x, y: q.y, impact: 0, opacity: o, rot: HACKER_ROT };
  }
  if (f < leave) {
    // Giữ nguyên chỗ, rung nhẹ theo cú va rồi đứng im mà lục.
    const k = clamp01((f - hit) / 8);
    return { x: HACKER_HIT.x, y: HACKER_HIT.y, impact: 1 - k, opacity: 1, rot: HACKER_ROT };
  }
  const p = clamp01((f - leave) / exit);
  const q = at(HACKER_HIT, HACKER_OUT, easeIn(p));
  const opacity = 1 - clamp01((p - 0.75) / 0.25);
  // Tan hẳn thì trả null, đừng trả object opacity 0: ở biên loop, "không có
  // hacker" và "có hacker vô hình" phải là CÙNG một trạng thái, nếu không
  // chốt chặn seamless báo lệch ở chỗ chẳng có pixel nào khác nhau.
  // Rút lui KHÔNG quay đầu — nó là một khối cứng, giật lùi ra chứ không lượn.
  return opacity <= 0.001 ? null : { x: q.x, y: q.y, impact: 0, opacity, rot: HACKER_ROT };
};

const simulate = (): State[] => {
  const out: State[] = [];

  for (let f = 0; f <= LOOP; f++) {
    const recs: Rec[] = [];
    const salts: Salt[] = [];
    const storeFlash = Array.from({ length: N_USERS }, () => 0);
    const stored: number[] = [];
    let frontendLive = 0;
    let flowLive = 0;
    let dbLive = 0;
    let carrying = 0;

    // Act nào đang chạy? Reset của act 1 xoá sạch trước khi act 2 dựng lại.
    const inA1 = f < A1_RESET;
    const act = inA1 ? ACT1 : ACT2;
    const attack = inA1 ? A1_ATTACK : A2_ATTACK;
    const hit = inA1 ? A1_HIT : A2_HIT;
    const grab = inA1 ? A1_GRAB : A2_GRAB;
    const leave = inA1 ? A1_LEAVE : A2_LEAVE;
    const exit = inA1 ? A1_EXIT : A2_EXIT;

    const hacker = hackerAt(f, attack, leave, exit);
    // Bị nhấc khỏi database: từ lúc húc + GRAB tới lúc hacker rời đi.
    const looted = f >= hit + grab;
    const thrown = !inA1 && f >= A2_THROW;

    for (const s of act) {
      if (f < s.typeAt) continue;

      // LÀ hash hay CHƯA là hash phải hỏi CÁI BÚA, không hỏi lịch trình.
      // `s.hashed` chỉ nói "bản ghi này rồi sẽ được hash" — dùng nó để chọn
      // chữ hiển thị là mật khẩu thành chuỗi hash ngay từ lúc rời frontend,
      // trước khi qua bcrypt. Đúng thứ tự nhân quả mới là thứ phải vẽ.
      const struckAt =
        s.anvilAt >= 0 ? s.anvilAt + SALT_FALL + HAMMER_SWING : Number.POSITIVE_INFINITY;
      const hashedNow = f >= struckAt;
      const shown = hashedNow ? HASH[s.i] : PASSWORD[s.i];

      // Chỗ bản ghi này đang nằm trong chồng, tại lúc bị húc. Hacker rút ra
      // theo ĐÚNG thứ tự đang nằm — cho đứa dưới đáy bay lên đầu là ba đường
      // cắt chéo nhau, và hai khối đè nhau giữa đường.
      const posAtHit = act
        .filter((o) => o.i > s.i)
        .reduce((acc, o) => acc + ramp(hit, o.entryAt - SHIFT_LEAD, SHIFT_DUR), 0);

      // ── Bị ném xuống sàn (chỉ act 2) ──
      if (thrown) {
        // Chỗ rác gán theo CHỖ ĐANG NẰM, không theo số thứ tự người dùng — y
        // hệt lúc rút ruột. Đẩy-xuống làm bản ghi 0 nằm đáy chồng, nên gán
        // theo s.i là ba đường ném cắt chéo nhau giữa không trung.
        const lane = Math.round(posAtHit);
        // Ném từ DƯỚI lên: đứa trên cùng đi cuối. Ném từ trên xuống thì nó
        // quét ngang qua chỗ mấy đứa dưới còn đang nằm — chồng nhau giữa
        // không trung, đúng một frame sau khi rời tay.
        const p = clamp01((f - (A2_THROW + (N_USERS - 1 - lane) * 5)) / A2_THROW_DUR);
        const from = loot(posAtHit, hacker ? hacker.y : HACKER_HIT.y);
        const t = TRASH[lane];
        const q = at(from, { x: t.x, y: t.y }, easeOut(p));
        const fade = 1 - ramp(f, RESET, RESET_DUR);
        recs.push({
          i: s.i,
          x: q.x,
          y: q.y,
          hashed: hashedNow,
          chars: shown.length,
          opacity: fade,
          scale: 1,
          rot: t.rot * p,
          thrown: true,
        });
        continue;
      }

      // ── Đang bị hacker mang đi ──
      // `looted` chứ không phải `looted && hacker`: hacker tan khỏi khung
      // TRƯỚC khi act reset, nên điều kiện cũ làm bản ghi rớt khỏi nhánh này
      // rồi rơi xuống nhánh "nằm trong database" — và danh sách mật khẩu HIỆN
      // LẠI trong 6 frame, sau khi vừa bị cướp sạch.
      if (looted) {
        if (!hacker) continue; // nó cầm đi rồi thì khuất là khuất cả

        const p = clamp01((f - (hit + grab)) / 10);
        const from = { x: 850, y: slotY(posAtHit) };
        const to = loot(posAtHit, hacker.y);
        const q = at(from, to, easeOut(p));
        recs.push({
          i: s.i,
          x: q.x,
          y: q.y,
          hashed: hashedNow,
          chars: shown.length,
          opacity: hacker.opacity,
          scale: 1,
          // Act 2: hacker soi từng cái — chúng xoay chậm trong tay nó.
          rot: !inA1 && f > hit + grab + 10 ? Math.sin((f - hit) / 9 + s.i) * 5 : 0,
          thrown: false,
        });
        carrying++;
        continue;
      }

      // ── Đang gõ ở frontend ──
      if (f < s.depart) {
        const text = PASSWORD[s.i];
        const n = Math.round(clamp01((f - s.typeAt) / TYPE_DUR) * text.length);
        if (ramp(f, s.typeAt, 4) > 0.001) frontendLive = 1;
        recs.push({
          i: s.i,
          x: FRONTEND_C.x,
          y: FRONTEND_C.y,
          hashed: false,
          chars: n,
          // Hiện dần theo cú gõ đầu tiên. Ở f=0 nó CHƯA tồn tại — người dùng
          // chưa gõ gì thì không có bản ghi nào, và đó là trạng thái mà f=880
          // phải quay về cho khít.
          opacity: ramp(f, s.typeAt, 4),
          scale: 1,
          rot: 0,
          thrown: false,
        });
        continue;
      }

      // ── Đang trên đe (chỉ act 2) ──
      if (s.anvilAt >= 0 && f >= s.anvilAt && f < s.anvilOut) {
        const since = f - s.anvilAt;
        // Hạt salt rơi xuống bản ghi
        if (since < SALT_FALL) {
          const p = since / SALT_FALL;
          salts.push({
            i: s.i,
            x: ANVIL.x,
            y: ANVIL.y - 90 + 72 * easeIn(p),
            opacity: 1,
          });
        }
        recs.push({
          i: s.i,
          x: ANVIL.x,
          y: ANVIL.y,
          hashed: hashedNow,
          chars: shown.length,
          // Cú gõ dí bẹp bản ghi xuống rồi nó bật lại — đập thì được, gỡ thì không.
          scale: hashedNow ? 1 - 0.18 * Math.exp(-(f - struckAt) / 3) : 1,
          opacity: 1,
          rot: 0,
          thrown: false,
        });
        continue;
      }

      // ── Đang bay ──
      let p: Pt | null = null;
      if (s.anvilAt < 0) {
        if (f < s.entryAt) {
          p = at(FRONTEND_C, DB_ENTRY, (f - s.depart) / F_TO_DB);
          flowLive = 1;
        }
      } else if (f < s.anvilAt) {
        p = at(FRONTEND_C, ANVIL, (f - s.depart) / F_TO_ANVIL);
        flowLive = 1;
      } else if (f < s.entryAt) {
        p = at(ANVIL, DB_ENTRY, (f - s.anvilOut) / ANVIL_TO_DB);
        flowLive = 1;
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
          thrown: false,
        });
        continue;
      }

      // ── Vào chỗ trong database rồi bị đẩy dần xuống ──
      // Mỗi bản ghi tới sau đẩy bản ghi này xuống đúng MỘT chỗ. Cộng dồn các
      // cú đẩy ra vị trí lẻ, nên nó trượt liên tục chứ không nhảy cóc.
      // Đẩy tính từ lúc bản mới TỚI CỬA, không phải lúc nó nằm xuống — chỗ
      // phải trống trước khi có người đến ngồi.
      const pos = act
        .filter((o) => o.i > s.i)
        .reduce((acc, o) => acc + ramp(f, o.entryAt - SHIFT_LEAD, SHIFT_DUR), 0);
      const q =
        f < s.settled
          ? at(DB_ENTRY, { x: 850, y: slotY(0) }, easeOut((f - s.entryAt) / DB_TO_SLOT))
          : { x: 850, y: slotY(pos) };
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
        thrown: false,
      });
    }

    const resetT = ramp(f, RESET, RESET_DUR);

    // Bản ghi trong suốt KHÔNG tồn tại. Giữ chúng lại thì f=0 (chưa ai gõ gì)
    // và f=880 (rác đã tan hết) khác nhau trên giấy mà giống hệt nhau trên
    // màn hình — chốt chặn seamless sẽ báo lệch ở chỗ không có pixel nào lệch.
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
            return { swing: swing * (1 - up), opacity: 1 };
          }
        }
        return null;
      })(),
      bcrypt: ramp(f, BCRYPT_IN, BCRYPT_IN_DUR) * (1 - resetT),
      bcryptLive:
        salts.length > 0 || visible.some((r) => Math.abs(r.x - ANVIL.x) < 2) ? 1 : 0,
      dbAlarm: f >= hit && f < hit + ALARM_FLASH ? 1 - (f - hit) / ALARM_FLASH : 0,
      dbLive,
      dbRipple: f >= hit && f < hit + RIPPLE_DUR ? (f - hit) / RIPPLE_DUR : -1,
      frontendLive,
      flowLive,
      storeFlash,
      stored,
      carrying,
    });
  }

  return out;
};

export const STATES = simulate();

/** Frame mà búa gõ trúng bản ghi thứ i (act 2). Sim NÓI ra, để verify khỏi
 *  suy "đã hash chưa" từ toạ độ x — hash bị ném sang trái vẫn là hash, nên
 *  suy từ chỗ đứng là báo động giả. */
export const STRUCK_AT = ACT2.map((s) => s.anvilAt + SALT_FALL + HAMMER_SWING);

/** Hacker ở lại bao lâu — act 1 lấy xong đi ngay, act 2 chần chừ. Verify canh. */
export const DWELL = {
  act1: A1_LEAVE - A1_HIT,
  act2: A2_LEAVE - A2_HIT,
  stare: A2_STARE,
};

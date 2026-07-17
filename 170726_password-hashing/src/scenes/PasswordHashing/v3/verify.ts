import {
  A1_HACKER_IN,
  A1_HIT,
  A1_LEAVE,
  A1_LUNGE,
  A1_RESET,
  A2_HACKER_IN,
  A2_HIT,
  A2_LEAVE,
  A2_LUNGE,
  ANVIL_TO_DB,
  AUTH,
  AUTH_LABEL,
  A_TO_ANVIL,
  A_TO_DB,
  BCRYPT,
  BCRYPT_CX,
  BCRYPT_LABEL,
  BLOCK,
  DATABASE,
  DB_LABEL,
  DB_CX,
  DB_TO_SLOT,
  DIR,
  GRAB,
  GRAB_SETTLE,
  HACKER_BEAT,
  HACKER_HIT,
  HACKER_R,
  HACKER_REST,
  HACKER_RISE,
  HACKER_ROT,
  HASH,
  KNOCK,
  LABEL_SIZE,
  LOOP,
  N_USERS,
  PASSWORD,
  RESET,
  SALT,
  SPIKE,
  slot,
} from "./constants";
import { EVENTS, KNOCKS, OUTCOME, STATES, STRUCK_AT } from "./sim";

// Chốt chặn tự động. Quét cả 1072 frame, không phải liếc vài cái.

const checks: [string, boolean, string][] = [];
const add = (name: string, ok: boolean, note: string) => checks.push([name, ok, note]);

// ─── 1. LUẬN ĐIỂM: cùng một cú thử, hai kết cục ───────────────────────
// Đây là toàn bộ V3. Hacker làm ĐÚNG một việc ở cả hai act — mang thứ vừa
// trộm đi gõ cửa. Chỉ kết quả khác. Sai chỗ này là hỏng cả video.
add(
  "act 1: mật khẩu ăn trộm MỞ ĐƯỢC cửa",
  OUTCOME.act1Pass === N_USERS && OUTCOME.act1Reject === 0,
  `${OUTCOME.act1Pass}/${N_USERS} vào được — mật khẩu ăn trộm LÀ chìa khoá thật`,
);
add(
  "act 2: hash bị TỪ CHỐI sạch",
  OUTCOME.act2Reject === N_USERS && OUTCOME.act2Pass === 0,
  `${OUTCOME.act2Reject}/${N_USERS} bật ra — hash không phải mật khẩu, không mở được cửa`,
);
// Đo ĐÚNG lúc rút xong mà chưa ném cái nào. Đo muộn hơn là cú ném đầu đã đi
// rồi, và `carrying` đếm thiếu — chốt chặn báo động vào chỗ không hỏng.
const grabbed1 = STATES[A1_HIT + GRAB + GRAB_SETTLE - 2].carrying;
const grabbed2 = STATES[A2_HIT + GRAB + GRAB_SETTLE - 2].carrying;
add(
  "hacker vẫn LẤY ĐƯỢC ở cả hai act",
  grabbed1 === N_USERS && grabbed2 === N_USERS,
  `act1 ${grabbed1} · act2 ${grabbed2} — hash KHÔNG ngăn trộm, chỉ làm đồ trộm vô dụng`,
);

// ─── 2. ĐỐI CHỨNG: hai act chỉ được khác ĐÚNG MỘT biến ────────────────
// Cùng điểm chạm, cùng số frame bay, cùng quãng hacker lao. Đổi hai biến cùng
// lúc là gán nhân quả hộ người xem (creative_rule.md).
const flies1 = KNOCKS.act1.map((k) => k.fly).join("/");
const flies2 = KNOCKS.act2.map((k) => k.fly).join("/");
add(
  "hai act ném tới CÙNG một điểm",
  KNOCKS.act1.every((k, i) => k.fly === KNOCKS.act2[i].fly),
  `cùng ${flies1} frame bay tới (${KNOCK.x}, ${KNOCK.y}) — chỉ chuyện SAU cú chạm là khác`,
);
void flies2;
add(
  "hacker lao y hệt nhau ở hai act",
  A1_HIT - A1_LUNGE === A2_HIT - A2_LUNGE,
  `${HACKER_RISE}f cả hai lần`,
);
add(
  "cùng số bản ghi bị trộm",
  STATES[A1_HIT - 1].stored.length === STATES[A2_HIT - 1].stored.length,
  `${STATES[A1_HIT - 1].stored.length} bản ghi, cả hai lần`,
);

// ─── 3. Hacker: hiện ra, ĐỨNG MỘT NHỊP, rồi mới lao ───────────────────
let still = 0;
for (let f = A1_HACKER_IN; f < A1_LUNGE; f++) {
  const h = STATES[f].hacker;
  if (h && Math.abs(h.x - HACKER_REST.x) < 0.01 && Math.abs(h.y - HACKER_REST.y) < 0.01) {
    still++;
  }
}
add(
  "hiện ra rồi đứng im một nhịp mới lao",
  still >= HACKER_BEAT,
  `${still}f đứng yên trước cú lao — anticipation, không có thì cú va mất sức nặng`,
);

// ─── 4. VIỆC CỦA SALT ─────────────────────────────────────────────────
add("hai người dùng gõ CÙNG một mật khẩu", PASSWORD[1] === PASSWORD[2], `"${PASSWORD[1]}"`);
add("…nhưng salt khác nhau", SALT[1] !== SALT[2], `${SALT[1]} vs ${SALT[2]} — NGUYÊN NHÂN`);
add(
  "…nên ra hai hash KHÁC HẲN nhau",
  HASH[1] !== HASH[2] && HASH[1][0] !== HASH[2][0],
  `${HASH[1]} vs ${HASH[2]}`,
);
add(
  "hai đứa sinh đôi nằm CẠNH NHAU",
  Math.abs(slot(1).y - slot(2).y) === 56,
  "so được trong một cái liếc",
);

// ─── 5. Nhân quả: chỉ thành hash SAU khi búa gõ ───────────────────────
let early = "";
for (let f = 0; f <= LOOP && !early; f++) {
  for (const r of STATES[f].recs) {
    if (r.hashed && f < STRUCK_AT[r.i]) {
      early = `f=${f}: bản ghi ${r.i} là hash mà búa gõ ở f=${STRUCK_AT[r.i]}`;
      break;
    }
  }
}
add(
  "chỉ thành hash SAU khi búa gõ",
  !early,
  early || `búa gõ ở f=${STRUCK_AT.join("/")} — không cái nào hoá hash sớm hơn`,
);

// ─── 5b. Bản ghi trong database phải NẰM GIỮA database ────────────────
// Chốt chặn này sinh ra vì một lỗi mà chốt chặn cũ KHÔNG bắt được: verify kiểm
// slot(), còn sim tự gõ `x: HACKER_HIT.x`. Hai biểu thức, một cái đúng một cái
// lệch 36.7px, và verify xanh suốt vì nó kiểm cái sim không dùng.
// Bài học: đo THỨ SIM XUẤT RA, đừng đo hàm mình tưởng sim gọi.
// Chỉ xét bản ghi ĐÃ YÊN CHỖ — hỏi `stored` của sim, đừng đoán "đã vào chưa"
// từ toạ độ x: khối đang bay vào cũng có x lớn, và nó lệch tâm là ĐÚNG.
let offCenter = "";
for (let f = 0; f <= LOOP && !offCenter; f++) {
  const st = STATES[f];
  for (const i of st.stored) {
    const r = st.recs.find((x) => x.i === i);
    if (r && Math.abs(r.x - DB_CX) > 0.5) {
      offCenter = `f=${f}: bản ghi ${i} ở x=${r.x.toFixed(1)}, lệch ${(r.x - DB_CX).toFixed(1)}px so với tâm db x=${DB_CX}`;
      break;
    }
  }
}
add(
  "bản ghi nằm ĐÚNG giữa database",
  !offCenter,
  offCenter || `mọi bản ghi đã yên chỗ đều ở x=${DB_CX} = tâm database`,
);

// ─── 6. Không bản ghi nào đè bản ghi nào ──────────────────────────────
let overlap = "";
for (let f = 0; f <= LOOP && !overlap; f++) {
  const rs = STATES[f].recs.filter((r) => r.opacity > 0.5);
  for (let a = 0; a < rs.length && !overlap; a++) {
    for (let b = a + 1; b < rs.length; b++) {
      const dx = Math.abs(rs[a].x - rs[b].x);
      const dy = Math.abs(rs[a].y - rs[b].y);
      if (dx < BLOCK.w - 2 && dy < BLOCK.h - 2) {
        overlap = `f=${f}: bản ghi ${rs[a].i} và ${rs[b].i} cách ${Math.round(dx)}×${Math.round(dy)}px`;
        break;
      }
    }
  }
}
add("không bản ghi nào đè bản ghi nào", !overlap, overlap || `quét ${LOOP + 1} frame`);

// ─── 7. Lấy đi rồi thì không quay lại database ────────────────────────
let resurrect = -1;
for (const [hit, reset] of [
  [A1_HIT, A1_RESET],
  [A2_HIT, LOOP],
] as const) {
  for (let f = hit + 30; f < reset && resurrect < 0; f++) {
    const s = STATES[f];
    if (!s.hacker && s.recs.some((r) => !r.stolen && r.x > DATABASE.x)) resurrect = f;
  }
}
add(
  "lấy đi rồi thì không quay lại database",
  resurrect < 0,
  resurrect < 0 ? "hacker khuất thì đồ nó cầm khuất theo" : `f=${resurrect}`,
);

// ─── 8. Loop seamless ─────────────────────────────────────────────────
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    recs: s.recs.map((r) => [r.i, Math.round(r.x), Math.round(r.y), r.hashed, r.chars]),
    salts: s.salts.length,
    hacker: s.hacker ? [Math.round(s.hacker.x), Math.round(s.hacker.y)] : null,
    hammer: s.hammer,
    bcrypt: +s.bcrypt.toFixed(3),
    dbAlarm: +s.dbAlarm.toFixed(3),
    dbRipple: +s.dbRipple.toFixed(3),
    authLive: s.authLive,
    authPass: +s.authPass.toFixed(3),
    authReject: +s.authReject.toFixed(3),
    authShake: +s.authShake.toFixed(3),
    carrying: s.carrying,
  });
};
const seam = norm(0) === norm(LOOP);
add("f0 trùng khít fLOOP", seam, seam ? "byte-identical" : "LỆCH");

let dirty = -1;
for (let f = RESET; f < LOOP; f++) {
  const s = STATES[f];
  if (s.hacker || s.recs.length > 0 || s.salts.length > 0) {
    dirty = f;
    break;
  }
}
add(
  "cửa sổ reset sạch",
  dirty < 0,
  dirty < 0 ? `từ f=${RESET} không còn gì` : `f=${dirty} vẫn còn thứ đang chạy`,
);

// ─── 9. Hình học ──────────────────────────────────────────────────────
const tip = { x: HACKER_HIT.x + DIR.x * HACKER_R, y: HACKER_HIT.y + DIR.y * HACKER_R };
const tipErr = Math.hypot(tip.x - SPIKE.x, tip.y - SPIKE.y);
add(
  "đỉnh nhọn chạm ĐÚNG đáy database",
  tipErr < 0.01,
  `lệch ${tipErr.toExponential(1)}px so với (${SPIKE.x}, ${SPIKE.y})`,
);
const flightDeg = (Math.atan2(DIR.y, DIR.x) * 180) / Math.PI;
add(
  "lục giác quay đúng hướng bay",
  Math.abs(HACKER_ROT - (flightDeg + 90)) < 0.01,
  `bay ${flightDeg.toFixed(1)}° · xoay ${HACKER_ROT.toFixed(1)}°`,
);
add("hacker đứng đúng trục giữa", HACKER_REST.x === 540, `x=${HACKER_REST.x}`);
add("bcrypt nằm đúng trục 540", BCRYPT_CX === 540, `tâm x=${BCRYPT_CX}`);
const L = AUTH.x;
const R = DATABASE.x + DATABASE.w;
add("ba trạm né action rail", L >= 80 && R <= 950, `x ${L}–${R}`);
add("ba trạm đối xứng quanh trục", Math.abs((L + R) / 2 - 540) < 0.5, `tâm x=${(L + R) / 2}`);
add(
  "database chứa đủ chỗ cho bản ghi cuối",
  slot(N_USERS - 1).y + BLOCK.h / 2 < DATABASE.y + DATABASE.h,
  `đáy chồng y=${slot(N_USERS - 1).y + BLOCK.h / 2} vs đáy db y=${DATABASE.y + DATABASE.h}`,
);
add(
  "khối gõ cửa chạm đúng mép DƯỚI ô auth",
  KNOCK.y - BLOCK.h / 2 === AUTH.y + AUTH.h,
  `mép khối y=${KNOCK.y - BLOCK.h / 2} = đáy auth y=${AUTH.y + AUTH.h}`,
);
// Khe auth↔bcrypt chỉ 40px mà khối rộng 172 — gõ ở mép PHẢI là đè lên bcrypt.
add(
  "khối gõ cửa không đè ô bcrypt",
  KNOCK.x + BLOCK.w / 2 < BCRYPT.x || KNOCK.y - BLOCK.h / 2 > BCRYPT.y + BCRYPT.h,
  `khối x ${KNOCK.x - BLOCK.w / 2}–${KNOCK.x + BLOCK.w / 2} vs bcrypt bắt đầu x=${BCRYPT.x}`,
);

// ─── 10. Motion ───────────────────────────────────────────────────────
const moves = [A_TO_DB, A_TO_ANVIL, ANVIL_TO_DB, HACKER_RISE, DB_TO_SLOT, ...KNOCKS.act1.map((k) => k.fly)];
add(
  "không chuyển động nào < 8 frame",
  Math.min(...moves) >= 8,
  `ngắn nhất ${Math.min(...moves)}f (auth→bcrypt ${A_TO_ANVIL}f · cú gõ cửa ${flies1}f)`,
);

// ─── 11. Nhãn ─────────────────────────────────────────────────────────
const monoW = (s: string, size: number, sp: number) => s.length * (0.6 + sp) * size;
const fits: [string, number, number][] = [
  [AUTH_LABEL, monoW(AUTH_LABEL, LABEL_SIZE, 0.06), AUTH.w],
  [BCRYPT_LABEL, monoW(BCRYPT_LABEL, LABEL_SIZE, 0.06), BCRYPT.w],
  [DB_LABEL, monoW(DB_LABEL, LABEL_SIZE, 0.06), DATABASE.w],
];
const tight = fits.filter(([, w, box]) => w > box - 36);
add(
  "nhãn lọt trong node",
  tight.length === 0,
  tight.length === 0
    ? fits.map(([s, w, box]) => `${s}:${Math.round(w)}/${box}`).join(" ")
    : tight.map(([s, w, box]) => `"${s}" ${Math.round(w)} > ${box - 36}`).join(", "),
);
const texts = [...PASSWORD, ...HASH];
const longest = texts.reduce((a, b) => (a.length >= b.length ? a : b));
add(
  "mật khẩu & hash lọt trong khối",
  monoW(longest, 16, 0.01) <= BLOCK.w - 16,
  `dài nhất "${longest}" = ${Math.round(monoW(longest, 16, 0.01))}px / ${BLOCK.w}`,
);

// ─── 12. Âm thanh ─────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = {
  emit: 40,
  arrive: 60,
  attach: 45,
  absorb: 70,
  install: 250,
  fail: 90,
  drop: 110,
};
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add(
  "biên loop im tuyệt đối",
  soundEnd < LOOP - 2,
  `tiếng cuối tắt f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame lặng`,
);
add("không SFX trong cửa sổ reset", EVENTS.every((e) => e.f < RESET), `${EVENTS.length} sự kiện`);
add(
  "act 1 KHÔNG có tiếng của bcrypt",
  !EVENTS.some((e) => (e.kind === "attach" || e.kind === "absorb") && e.f < A1_RESET),
  "salt và búa chỉ kêu ở act 2",
);
void A1_LEAVE;
void A2_LEAVE;
void A2_HACKER_IN;

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [name, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${name.padEnd(40)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

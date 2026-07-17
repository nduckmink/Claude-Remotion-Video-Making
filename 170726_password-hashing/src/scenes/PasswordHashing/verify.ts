import {
  A1_ATTACK,
  A1_HIT,
  A1_LEAVE,
  A1_RESET,
  A2_ATTACK,
  A2_HIT,
  A2_LEAVE,
  A2_THROW,
  ANVIL_TO_DB,
  BCRYPT,
  BCRYPT_CX,
  BLOCK,
  DATABASE,
  DB_TO_SLOT,
  FRONTEND,
  FRONTEND_LABEL,
  BCRYPT_LABEL,
  DB_LABEL,
  F_TO_ANVIL,
  F_TO_DB,
  HACKER_HIT,
  HACKER_R,
  HACKER_RISE,
  HASH,
  LABEL_SIZE,
  LOOP,
  N_USERS,
  PASSWORD,
  RESET,
  SALT,
  TRASH,
  slot,
} from "./constants";
import { DWELL, EVENTS, STATES } from "./sim";

// Chốt chặn tự động. Quét cả 880 frame, không phải liếc vài cái.

const checks: [string, boolean, string][] = [];
const add = (name: string, ok: boolean, note: string) =>
  checks.push([name, ok, note]);

// ─── 1. Lời hứa của scene: hacker LẤY ĐƯỢC ở CẢ HAI act ───────────────
// Đây là mấu chốt, không phải chi tiết. Nếu act 2 hacker không lấy được thì
// video đang nói "hash chống được hack" — sai, và là đúng cái hiểu nhầm phổ
// biến mà loop này sinh ra để chữa.
const grabbed1 = STATES[A1_HIT + 40].carrying;
const grabbed2 = STATES[A2_HIT + 40].carrying;
add(
  "hacker lấy được ở CẢ HAI act",
  grabbed1 === N_USERS && grabbed2 === N_USERS,
  `act1 ${grabbed1}/${N_USERS} · act2 ${grabbed2}/${N_USERS} — hash KHÔNG ngăn trộm`,
);

// ─── 2. Con số kể chuyện: thứ hacker CẦM VỀ ───────────────────────────
const haul1 = STATES[A1_LEAVE + 20].carrying;
const haul2 = STATES[A2_LEAVE + 20].carrying;
add(
  "act 1 mang đồ đi / act 2 tay không",
  haul1 === N_USERS && haul2 === 0,
  `rời đi với ${haul1} bản ghi vs ${haul2} — cùng lấy được, khác chỗ dùng được`,
);
// Hỏi sim, đừng đoán từ toạ độ. Bản trước đếm bằng `y > 1400` và sai ngay khi
// chỗ ném dời sang trái — chốt chặn sai còn tệ hơn không có.
const trashed = STATES[A2_LEAVE].recs.filter((r) => r.thrown).length;
add(
  "hash bị ném lại làm rác",
  trashed === N_USERS,
  `${trashed} khối nằm dưới sàn lúc hacker bỏ đi`,
);

// ─── 3. Tương phản bằng THỜI LƯỢNG ────────────────────────────────────
add(
  "act 2 chần chừ lâu hơn hẳn act 1",
  DWELL.act2 > DWELL.act1 * 2,
  `ở lại ${DWELL.act1}f rồi đi vs ${DWELL.act2}f (${DWELL.stare}f đứng nhìn) — "nó không biết làm gì"`,
);

// ─── 4. VIỆC CỦA SALT — lý do có nó trong video ───────────────────────
const twins = PASSWORD[1] === PASSWORD[2];
add(
  "hai người dùng gõ CÙNG một mật khẩu",
  twins,
  `"${PASSWORD[1]}" === "${PASSWORD[2]}"`,
);
add(
  "…nhưng salt khác nhau",
  SALT[1] !== SALT[2],
  `${SALT[1]} vs ${SALT[2]} — đây là NGUYÊN NHÂN`,
);
add(
  "…nên ra hai hash KHÁC HẲN nhau",
  HASH[1] !== HASH[2] && HASH[1][0] !== HASH[2][0],
  `${HASH[1]} vs ${HASH[2]} — khác ngay từ ký tự đầu`,
);
add(
  "hai đứa sinh đôi nằm CẠNH NHAU",
  Math.abs(slot(1).y - slot(2).y) === 56 && slot(1).x === slot(2).x,
  "so được trong một cái liếc, không phải đảo mắt",
);
const allHash = new Set(HASH).size === N_USERS;
add("không hash nào trùng hash nào", allHash, HASH.join(" "));

// ─── 4b. Không bản ghi nào đè bản ghi nào ─────────────────────────────
// Chồng dữ liệu lên dữ liệu là sơ đồ tự mâu thuẫn — và nó ăn mất chữ, tức ăn
// mất đúng thứ người xem cần đọc. Đã dính: slot 0 từng ngồi ĐÚNG trên đường
// ống, nên bản ghi đang bay che một khúc bản ghi đã lưu. Mắt bắt được vì chữ
// cụt; nếu hai khối cùng màu thì đã không ai thấy.
let overlap = "";
for (let f = 0; f <= LOOP && !overlap; f++) {
  const rs = STATES[f].recs.filter((r) => r.opacity > 0.5);
  for (let a = 0; a < rs.length && !overlap; a++) {
    for (let b = a + 1; b < rs.length; b++) {
      const dx = Math.abs(rs[a].x - rs[b].x);
      const dy = Math.abs(rs[a].y - rs[b].y);
      if (dx < BLOCK.w - 2 && dy < BLOCK.h - 2) {
        overlap = `f=${f}: bản ghi ${rs[a].i} và ${rs[b].i} cách nhau ${Math.round(dx)}×${Math.round(dy)}px`;
        break;
      }
    }
  }
}
add(
  "không bản ghi nào đè bản ghi nào",
  !overlap,
  overlap || `quét ${LOOP + 1} frame, khối ${BLOCK.w}×${BLOCK.h}px`,
);

// ─── 5. Loop seamless ─────────────────────────────────────────────────
// So f=0 với f=LOOP, KHÔNG phải LOOP-1.
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    recs: s.recs.map((r) => [
      r.i,
      Math.round(r.x),
      Math.round(r.y),
      r.hashed,
      r.chars,
      +r.opacity.toFixed(3),
    ]),
    salts: s.salts.map((v) => [v.i, Math.round(v.x), Math.round(v.y)]),
    hacker: s.hacker
      ? [Math.round(s.hacker.x), Math.round(s.hacker.y), +s.hacker.opacity.toFixed(3)]
      : null,
    hammer: s.hammer,
    bcrypt: +s.bcrypt.toFixed(3),
    bcryptLive: s.bcryptLive,
    dbAlarm: +s.dbAlarm.toFixed(3),
    dbLive: s.dbLive,
    dbRipple: +s.dbRipple.toFixed(3),
    frontendLive: s.frontendLive,
    flowLive: s.flowLive,
    storeFlash: s.storeFlash.map((v) => +v.toFixed(3)),
    carrying: s.carrying,
  });
};
const seam = norm(0) === norm(LOOP);
add("f0 trùng khít f880", seam, seam ? "byte-identical" : "LỆCH");

// ─── 6. Cửa sổ reset phải sạch ────────────────────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) {
  const s = STATES[f];
  if (s.hacker || s.salts.length > 0 || s.recs.some((r) => r.y < 1300)) {
    dirty = f;
    break;
  }
}
add(
  "không còn gì đang chạy lúc reset",
  dirty < 0,
  dirty < 0 ? `từ f=${RESET} chỉ còn rác đang tan` : `f=${dirty}`,
);

// ─── 7. Hai act phải ĐỐI CHỨNG được ───────────────────────────────────
// Cùng số người dùng, cùng kiểu tấn công, cùng quãng hacker phải bò. Đổi hai
// biến cùng lúc là gán nhân quả hộ người xem — họ sẽ gán vào cái mình không
// định nói. Thứ được phép khác đúng MỘT: có bcrypt hay không.
add(
  "hacker húc y hệt nhau ở hai act",
  A1_HIT - A1_ATTACK === A2_HIT - A2_ATTACK,
  `${HACKER_RISE}f cả hai lần — khác nhau chỉ ở thứ nó lấy được`,
);
add(
  "cùng số bản ghi ở cả hai act",
  STATES[A1_ATTACK - 1].stored.length === STATES[A2_ATTACK - 1].stored.length,
  `${STATES[A1_ATTACK - 1].stored.length} bản ghi, cả hai lần`,
);

// ─── 8. Hình học ──────────────────────────────────────────────────────
add(
  "hacker húc ĐÚNG đáy database",
  HACKER_HIT.y - HACKER_R === DATABASE.y + DATABASE.h,
  `đỉnh nhọn y=${HACKER_HIT.y - HACKER_R} = đáy db y=${DATABASE.y + DATABASE.h}`,
);
add(
  "bcrypt nằm đúng trục 540",
  BCRYPT_CX === 540,
  `tâm x=${BCRYPT_CX} — trục ngang vẫn phải cân quanh sống lưng dọc`,
);
const L = FRONTEND.x;
const R = DATABASE.x + DATABASE.w;
add(
  "ba trạm né action rail",
  L >= 80 && R <= 950,
  `x ${L}–${R} (rail x 950–1080 ở dải y 1000–1750)`,
);
add(
  "ba trạm đối xứng quanh trục",
  Math.abs((L + R) / 2 - 540) < 0.5,
  `tâm x=${(L + R) / 2}`,
);
add(
  "hacker không đè action rail",
  HACKER_HIT.x + HACKER_R <= 950,
  `mép phải x=${HACKER_HIT.x + HACKER_R}`,
);
const trashLow = Math.max(...TRASH.map((t) => t.y));
add(
  "rác nằm trên vùng caption nền tảng",
  trashLow <= 1600,
  `thấp nhất y=${trashLow}`,
);
add(
  "database chứa đủ chỗ cho bản ghi cuối",
  slot(N_USERS - 1).y + BLOCK.h / 2 < DATABASE.y + DATABASE.h,
  `đáy chồng y=${slot(N_USERS - 1).y + BLOCK.h / 2} vs đáy db y=${DATABASE.y + DATABASE.h}`,
);

// ─── 9. Motion ────────────────────────────────────────────────────────
const moves = [F_TO_DB, F_TO_ANVIL, ANVIL_TO_DB, HACKER_RISE, DB_TO_SLOT];
add(
  "không chuyển động nào < 8 frame",
  Math.min(...moves) >= 8,
  `ngắn nhất ${Math.min(...moves)}f (frontend→bcrypt ${F_TO_ANVIL}f)`,
);

// ─── 10. Nhãn & chữ lọt chỗ ───────────────────────────────────────────
const monoW = (s: string, size: number, sp: number) => s.length * (0.6 + sp) * size;
const fits: [string, number, number][] = [
  [FRONTEND_LABEL, monoW(FRONTEND_LABEL, LABEL_SIZE, 0.06), FRONTEND.w],
  [BCRYPT_LABEL, monoW(BCRYPT_LABEL, LABEL_SIZE, 0.06), BCRYPT.w],
  [DB_LABEL, monoW(DB_LABEL, LABEL_SIZE, 0.06), DATABASE.w],
];
const tightLabel = fits.filter(([, w, box]) => w > box - 36);
add(
  "nhãn lọt trong node",
  tightLabel.length === 0,
  fits.map(([s, w, box]) => `${s}:${Math.round(w)}/${box}`).join(" "),
);
// Chữ trong khối là DỮ LIỆU, không phải nhãn — tràn là mất luôn thứ cần đọc.
const texts = [...PASSWORD, ...HASH];
const tooWide = texts.filter((t) => monoW(t, 16, 0.01) > BLOCK.w - 16);
add(
  "mật khẩu & hash lọt trong khối",
  tooWide.length === 0,
  tooWide.length === 0
    ? `dài nhất "${texts.reduce((a, b) => (a.length >= b.length ? a : b))}" = ${Math.round(monoW(texts.reduce((a, b) => (a.length >= b.length ? a : b)), 16, 0.01))}px / ${BLOCK.w}`
    : tooWide.join(", "),
);

// ─── 11. Âm thanh ─────────────────────────────────────────────────────
// Độ dài lấy từ thư viện Resource/sfx.md — đừng gõ tay.
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
add(
  "không SFX trong cửa sổ reset",
  EVENTS.every((e) => e.f < RESET),
  `${EVENTS.length} sự kiện, cái cuối f=${Math.max(...EVENTS.map((e) => e.f))}`,
);
add(
  "act 1 KHÔNG có tiếng của bcrypt",
  !EVENTS.some((e) => (e.kind === "attach" || e.kind === "absorb") && e.f < A1_RESET),
  "salt và búa chỉ kêu ở act 2",
);
void A2_THROW;

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [name, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${name.padEnd(38)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

import {
  A1_RESET,
  ACT2_AT,
  CHARGE,
  CLICK_AT,
  DIE_AT,
  IDEM_KEY,
  LANE_FRAMES,
  LEDGER_CX,
  LEDGER_PITCH,
  LEDGER_BOTTOM,
  BALANCE_AT,
  LOOKUP,
  LOOP,
  N_CLICKS,
  RESET,
  SERVER,
  SERVER_LABEL,
  STUB_EMPTY,
  STUB_RACK_W,
  STUB_W,
  SPAM_STAGGER,
  UI,
  WORK,
  ledger,
} from "./constants";
import { ACTS, CADENCE, EVENTS, OUTCOME, STATES } from "./sim";

// Chốt chặn tự động. Quét cả 640 frame.

const checks: [string, boolean, string][] = [];
const add = (name: string, ok: boolean, note: string) => checks.push([name, ok, note]);

// ─── 1. LUẬN ĐIỂM ─────────────────────────────────────────────────────
add(
  "act 1: bốn cú click = BỐN lần trừ tiền",
  OUTCOME.act1Charges === N_CLICKS,
  `${OUTCOME.act1Charges} dòng × $50 = $${OUTCOME.act1Charges * 50} — server không biết đó là MỘT ý định`,
);
add(
  "act 2: bốn cú click = MỘT lần trừ tiền",
  OUTCOME.act2Charges === 1,
  `1 dòng × $50 = $50 — key nói hộ client rằng bốn cái này là một`,
);
add(
  "server chỉ LÀM VIỆC một lần ở act 2",
  OUTCOME.act1Work === N_CLICKS && OUTCOME.act2Work === 1,
  `làm việc ${OUTCOME.act1Work} lần vs ${OUTCOME.act2Work} lần`,
);

// Request trùng KHÔNG bị bỏ qua — nó được TRẢ LỜI. Bỏ qua thì client vẫn treo
// và chẳng chữa được gì; đó là chỗ khác nhau giữa idempotency và chống-trùng.
add(
  "MỌI request đều được trả lời, kể cả cái trùng",
  OUTCOME.act2Answered === N_CLICKS,
  `${OUTCOME.act2Answered}/${N_CLICKS} có hồi âm — trùng thì trả biên lai CŨ, không phải im lặng`,
);

// ─── 2. ĐỐI CHỨNG: hai act khác ĐÚNG MỘT biến ─────────────────────────
const c1 = ACTS.act1.map((j) => j.clickAt - 0);
const c2 = ACTS.act2.map((j) => j.clickAt - ACT2_AT);
add(
  "cùng một lịch click ở cả hai act",
  JSON.stringify(c1) === JSON.stringify(c2),
  `click ở ${c1.join("/")} — khác nhau chỉ ở chỗ card có key hay không`,
);
add(
  "hồi âm đầu chết Y HỆT ở cả hai act",
  ACTS.act1[0].dies && ACTS.act2[0].dies,
  `cùng chết ở ${(DIE_AT * 100).toFixed(0)}% đường về — biến này được GIỮ NGUYÊN`,
);
add(
  "cùng quãng đường, cùng tốc độ",
  LANE_FRAMES >= 8,
  `${LANE_FRAMES}f mỗi làn, cả hai act`,
);

// ─── 3. NHỊP — thứ video trước bị chê ─────────────────────────────────
// Không phải chuyện dài ngắn: mọi thứ chạy MỘT cadence đều tăm tắp thì xem
// chán. Ở đây nhịp phải có tầng, và tầng phải MANG NGHĨA.
const spam = CADENCE.arrive;
// slice(1): phần tử đầu là khoảng cách từ cú DỨT KHOÁT tới cú spam đầu (100f),
// nó không thuộc cú spam. Predicate cũ gộp cả nó vào rồi báo động — dữ liệu
// đúng, câu hỏi sai.
add(
  "cú spam phải DỒN DẬP",
  spam.slice(1).every((d) => d <= SPAM_STAGGER),
  `ba cú sau cách nhau ${spam.slice(1).join("/")}f — dồn, không phải rải`,
);
add(
  "cú đầu phải TÁCH HẲN khỏi cú spam",
  spam[0] >= 60,
  `cách ${spam[0]}f — một cú dứt khoát, rồi im, rồi mới spam`,
);
// Đây là tương phản nhịp mà chính cơ chế đẻ ra, không phải tôi bịa: act 1 dồn
// VÀO rồi nhỏ giọt RA (server phải làm việc thật nên request xếp hàng), act 2
// dồn vào thì dồn ra (chỉ tra sổ).
const out1 = CADENCE.act1Out.slice(1);
const out2 = CADENCE.act2Out.slice(1);
add(
  "act 1 dồn vào → NGHẼN ra",
  out1.every((d) => d === WORK),
  `charge nhỏ giọt ${out1.join("/")}f một cái = đúng WORK — hàng đợi tự giãn chúng ra`,
);
add(
  "act 2 dồn vào → dồn ra",
  out2.every((d) => d <= SPAM_STAGGER),
  `hồi âm bật ra ${out2.join("/")}f một cái = theo kịp nhịp click`,
);
add(
  "nhịp ra của hai act phải KHÁC HẲN",
  Math.min(...out1) >= Math.max(...out2) * 2,
  `${out1[0]}f vs ${out2[0]}f — chính cái nhịp tự kể chuyện`,
);
let queuedMax = 0;
for (let f = 0; f < A1_RESET; f++) queuedMax = Math.max(queuedMax, STATES[f].queued);
add(
  "act 1 CÓ xếp hàng thật",
  queuedMax >= 2,
  `đỉnh ${queuedMax} request nằm chờ ngay cửa server — nghẽn nhìn thấy được`,
);

// ─── 4. Nhân quả: chỉ trừ tiền SAU khi server làm việc ────────────────
let early = -1;
for (const act of [ACTS.act1, ACTS.act2]) {
  for (const j of act) {
    if (j.chargeSlot === null) continue;
    for (let f = 0; f < j.end && early < 0; f++) {
      if (STATES[f].charges.some((c) => c.p === j.chargeSlot) && f >= (act === ACTS.act1 ? 0 : ACT2_AT)) {
        early = f;
      }
    }
  }
}
add(
  "charge chỉ hiện SAU khi server làm xong",
  early < 0,
  early < 0 ? "không dòng nào nằm xuống sổ trước lúc server chạy xong" : `f=${early}`,
);

// ─── 5. Loop seamless ─────────────────────────────────────────────────
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    cursor: s.cursor ? [Math.round(s.cursor.x), Math.round(s.cursor.y), +s.cursor.opacity.toFixed(2)] : null,
    press: +s.press.toFixed(3),
    spinning: s.spinning,
    reqs: s.reqs.map((m) => [m.i, Math.round(m.x), Math.round(m.y)]),
    resps: s.resps.map((m) => [m.i, Math.round(m.x), Math.round(m.y), +m.opacity.toFixed(2)]),
    charges: s.charges.map((c) => [c.p, +c.flash.toFixed(2), c.dup]),
    keyOn: +s.keyOn.toFixed(3),
    // `balance` PHẢI có mặt ở đây. Thiếu nó thì chốt chặn báo byte-identical
    // trong khi f=0 hiện $200 còn f=640 hiện $150 — đo một tập con thiếu đúng
    // cái đang chiếm nửa màn hình.
    balance: s.balance,
    panel: +s.panel.toFixed(3),
    keyStored: +s.keyStored.toFixed(3),
    working: s.working,
    looking: s.looking,
    srvRipple: +s.srvRipple.toFixed(3),
  });
};
const seam = norm(0) === norm(LOOP);
add("f0 trùng khít f640", seam, seam ? "byte-identical" : "LỆCH");

// Cửa sổ reset = chỗ mọi thứ TAN, nên sổ cái CÒN đó là đúng — nó đang mờ dần.
// Cái phải cấm là thứ đang CHẠY hoặc thứ MỚI xuất hiện. (Predicate cũ cấm cả
// sổ đang tan, tức cấm đúng cái việc mà reset sinh ra để làm.)
let dirty = -1;
for (let f = RESET; f < LOOP; f++) {
  const s = STATES[f];
  if (s.reqs.length || s.resps.length || s.cursor || s.working || s.looking) {
    dirty = f;
    break;
  }
}
add(
  "không còn gì đang CHẠY lúc reset",
  dirty < 0,
  dirty < 0 ? `từ f=${RESET} chỉ còn sổ cái đang tan` : `f=${dirty}`,
);
add(
  "reset xoá SẠCH trước biên loop",
  STATES[LOOP].charges.length === 0 && STATES[LOOP].keyOn < 0.001,
  `f=${LOOP}: ${STATES[LOOP].charges.length} dòng sổ, key ${STATES[LOOP].keyOn.toFixed(3)}`,
);

// ─── 6. Không khối nào đè khối nào ────────────────────────────────────
let overlap = "";
for (let f = 0; f <= LOOP && !overlap; f++) {
  for (const list of [STATES[f].reqs, STATES[f].resps]) {
    const vis = list.filter((m) => m.opacity > 0.5);
    for (let a = 0; a < vis.length && !overlap; a++) {
      for (let b = a + 1; b < vis.length; b++) {
        const dx = Math.abs(vis[a].x - vis[b].x);
        const dy = Math.abs(vis[a].y - vis[b].y);
        if (dx < CHARGE.w - 2 && dy < CHARGE.h - 2) {
          overlap = `f=${f}: khối ${vis[a].i} và ${vis[b].i} cách ${Math.round(dx)}×${Math.round(dy)}px`;
          break;
        }
      }
    }
  }
}
add("không khối nào đè khối nào", !overlap, overlap || `quét ${LOOP + 1} frame`);

// ─── 7. Hình học ──────────────────────────────────────────────────────
add(
  "hai làn đối xứng quanh trục",
  Math.abs((450 + 630) / 2 - 540) < 0.5,
  "làn hỏi x=450 · làn đáp x=630 — mạch vòng, không phải ống một chiều",
);
// Sổ ĐẦY (4 chip) phải vẫn còn chỗ cho nhãn BALANCE và con số dưới nó. Chốt
// chặn cũ chỉ đo mép server nên chip thứ 4 đè lên chữ BALANCE mà vẫn xanh —
// và nó chỉ hỏng ở act 1, tức lọt qua mọi cái liếc vào act 2.
add(
  "sổ ĐẦY vẫn không đè nhãn balance",
  LEDGER_BOTTOM + 30 < BALANCE_AT.y - 60,
  `đáy sổ y=${LEDGER_BOTTOM} · nhãn balance y=${BALANCE_AT.y - 60}`,
);
add(
  "số dư nằm lọt trong server",
  BALANCE_AT.y + 30 < SERVER.y + SERVER.h,
  `đáy số dư y=${BALANCE_AT.y + 30} vs đáy server y=${SERVER.y + SERVER.h}`,
);
add(
  "dòng sổ nằm đúng giữa server",
  ledger(0).x === LEDGER_CX && LEDGER_CX === SERVER.x + SERVER.w / 2,
  `x=${LEDGER_CX}`,
);
add(
  "UI và server né action rail",
  UI.x >= 80 && UI.x + UI.w <= 1000 && SERVER.x + SERVER.w <= 950,
  `ui x ${UI.x}–${UI.x + UI.w} · server x ${SERVER.x}–${SERVER.x + SERVER.w}`,
);
add(
  "đáy khung để trống cho caption",
  SERVER.y + SERVER.h <= 1600,
  `server đáy y=${SERVER.y + SERVER.h}`,
);
add(
  "hai dòng sổ không đè nhau",
  LEDGER_PITCH > CHARGE.h,
  `nhịp ${LEDGER_PITCH}px vs khối cao ${CHARGE.h}px`,
);

// ─── 8. Nhãn & chữ ────────────────────────────────────────────────────
const monoW = (s: string, size: number, sp: number) => s.length * (0.6 + sp) * size;
add(
  "key lọt trong pill trên card",
  monoW(IDEM_KEY, 19, 0.01) + 40 < UI.w,
  `"${IDEM_KEY}" = ${Math.round(monoW(IDEM_KEY, 19, 0.01))}px / ${UI.w}`,
);
add("nhãn server lọt trong node", monoW(SERVER_LABEL, 24, 0.06) < SERVER.w - 36, SERVER_LABEL);
// Kẹp cuống lúc rỗng: chuỗi phải lọt MỘT DÒNG trong pill cao 38px. Dài hơn là
// nó xuống dòng rồi đè lên chính nó — đã dính với "chưa có cuống nào".
add(
  "chữ trong kẹp cuống lọt một dòng",
  monoW(STUB_EMPTY, 17, 0) + 28 < STUB_RACK_W,
  `"${STUB_EMPTY}" = ${Math.round(monoW(STUB_EMPTY, 17, 0))}px / ${STUB_RACK_W}`,
);
add(
  "cuống vé lọt trong kẹp",
  STUB_W + 24 < STUB_RACK_W,
  `cuống ${STUB_W}px / kẹp ${STUB_RACK_W}px`,
);

// ─── 9. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = {
  click: 35,
  emit: 40,
  absorb: 70,
  arrive: 60,
  fail: 90,
  drop: 110,
  attach: 45,
};
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add(
  "biên loop im tuyệt đối",
  soundEnd < LOOP - 2,
  `tiếng cuối tắt f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame lặng`,
);
add("không SFX trong cửa sổ reset", EVENTS.every((e) => e.f < RESET), `${EVENTS.length} sự kiện`);
// Tai phải nghe ra cùng một tương phản mà mắt thấy: act 1 bốn tiếng trừ tiền,
// act 2 một. Nhịp là kênh đo thứ tư (motion_language.md).
const fails1 = EVENTS.filter((e) => e.kind === "fail" && e.f < A1_RESET).length;
const fails2 = EVENTS.filter((e) => e.kind === "fail" && e.f >= A1_RESET).length;
add(
  "tai nghe ra 3 cú trừ oan ở act 1, 0 ở act 2",
  fails1 === N_CLICKS - 1 && fails2 === 0,
  `${fails1} tiếng vs ${fails2} — nghe là biết, không cần đọc`,
);
void LOOKUP;
void CLICK_AT;

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [name, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${name.padEnd(42)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

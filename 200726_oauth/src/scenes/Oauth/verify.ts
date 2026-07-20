import { APP, CENTER, DRIVE_R, LOOP, N_SHIELD, RESET, SHIELD_R, T, W as CW } from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. LỜI HỨA LÕI: không có đường vào NẾU chưa đồng ý ────────────────
add("khiên CHẶN tia lúc bắn (chưa đồng ý)", OUTCOME.blockedAtFire, "có lớp khiên nằm trên đường tia → tia bị chặn");
add("khe MỞ sau khi khiên xếp thẳng", OUTCOME.openAfterAlign, "đồng ý → khiên dồn một phía → lộ khe thẳng");
add("tên lửa chỉ tới drive SAU khi mở khe", OUTCOME.rocketInOnlyAfterAlign, "trước aligned, rocket luôn ở ngoài (>300px tâm)");

// ─── 2. Auth: vé phát trước khi vào; cấp quyền khi tới nơi ─────────────
add("vé (token) phát TRƯỚC khi tên lửa vào", OUTCOME.ticketBeforeEntry, `vé f=${T.ticket} < bay vào f=${T.flyIn}`);
add("drive báo ĐÃ CẤP khi tên lửa tới nơi", OUTCOME.grantedAtDock, "vào tới tâm → drive sáng xanh");
add("khiên ĐỎ khi bị bắn", OUTCOME.redAtHit, "đạn chạm → cả khối đỏ lên");
add("khiên XANH khi mở khe giao tiếp", OUTCOME.greenWhenOpen, "xếp khe xong → xanh cho drive↔tàu");

// ─── 3. Seamless: so cái ĐƯỢC VẼ (góc khiên lấy mod 360) ──────────────
const r = (v: number) => Math.round(v);
const m360 = (a: number) => r(((a % 360) + 360) % 360);
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    shields: s.shields.map((sh) => m360(sh.gapAng)),
    aligned: +s.aligned.toFixed(2),
    rocket: [r(s.rocket.x), r(s.rocket.y), r(s.rocket.point)],
    granted: +s.driveGranted.toFixed(2),
    red: +s.shieldRed.toFixed(2),
    green: +s.shieldGreen.toFixed(2),
    shots: s.shots.length,
    popup: s.popup.present ? 1 : 0,
    ticket: s.ticket.present ? 1 : 0,
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");

// ─── 4. Cửa sổ reset sạch ─────────────────────────────────────────────
// Chỉ cấm thứ ĐANG CHẠY (tia/popup/vé/rocket bay). Khiên xếp→orbit là fade tĩnh
// đáp đúng f0 (seamless đã canh), KHÔNG tính là chạy.
const homeD = STATES[0].rocket;
let dirty = -1;
for (let f = RESET; f < LOOP; f++) {
  const s = STATES[f];
  const rocketMoving = Math.hypot(s.rocket.x - homeD.x, s.rocket.y - homeD.y) > 4;
  if (s.shots.length || s.burst > 0.02 || s.popup.present || s.ticket.present || rocketMoving) { dirty = f; break; }
}
add("cửa sổ reset sạch (chỉ khiên fade về orbit)", dirty < 0, dirty < 0 ? `từ f=${RESET} sạch` : `f=${dirty} còn sót`);

// ─── 5. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = { emit: 45, attach: 90, arrive: 80, fill: 55, fail: 150, drop: 90, slow: 130 };
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add("biên loop im tuyệt đối", soundEnd < LOOP - 2, `tiếng cuối f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame`);

// ─── 6. Hình học / safe-area ──────────────────────────────────────────
const outer = SHIELD_R[N_SHIELD - 1];
add("khiên ngoài không tràn khung/header", CENTER.y - outer > 300 && CENTER.x - outer > 20 && CENTER.x + outer < CW - 20, `bán kính ngoài ${outer}, tâm y=${CENTER.y}`);
add("drive nhỏ hơn lớp khiên trong", DRIVE_R < SHIELD_R[0] - 20, `drive ${DRIVE_R} < khiên trong ${SHIELD_R[0]}`);
add("3rd party app trong khung", APP.x + APP.w / 2 < CW && APP.y - APP.h / 2 > 300, "app góc trên-phải, dưới header");

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(46)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

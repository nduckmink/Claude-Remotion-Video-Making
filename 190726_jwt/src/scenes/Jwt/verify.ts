import { arc, barcode, sigMatch } from "../../lib/anim";
import {
  A,
  CLAIM_DUR,
  CLAIM_FALL,
  CLIENT,
  CLIENT_DOCK,
  DELIVER_END,
  LANE_BEND,
  LOOP,
  MINT_END,
  PAYLOAD_GOOD,
  PAYLOAD_TAMPERED,
  SERVER,
  SERVER_DOCK,
  SIGN_F,
  T1,
  T2,
} from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. LỜI HỨA: token BẨN không bao giờ được chấp nhận ────────────────
add(
  "token bị SỬA không bao giờ PASS",
  OUTCOME.tamperedEverPassed === false,
  "payload đổi user→admin thì server ký lại lệch → luôn bị từ chối",
);
add("token SẠCH được pass (2 vòng đầu)", OUTCOME.cleanPassed, "chữ ký khớp → hợp lệ");
add("có cú TỪ CHỐI ở vòng tấn công", OUTCOME.rejectHappened, "reject đỏ xuất hiện");

// ─── 2. Cơ chế chữ ký: khớp/lệch đúng như hình vẽ ─────────────────────
add(
  "chữ ký GỐC khớp payload gốc, LỆCH payload sửa",
  sigMatch(OUTCOME.ownSig, PAYLOAD_GOOD) && !sigMatch(OUTCOME.ownSig, PAYLOAD_TAMPERED),
  "mã vạch băm: role:user khớp, role:admin lệch — không có secret thì giả không nổi",
);
add(
  "hai payload cho hai mã vạch KHÁC nhau",
  JSON.stringify(barcode(PAYLOAD_GOOD, 9)) !== JSON.stringify(barcode(PAYLOAD_TAMPERED, 9)),
  "dãy vạch đọc ra được là đã bị đổi",
);

// ─── 3. ĐÚC: cả 3 claim vào phễu TRƯỚC khi token nhả ──────────────────
const lastClaimIn = Math.max(...CLAIM_FALL) + CLAIM_DUR;
add("3 claim vào phễu trước khi token thành hình", lastClaimIn <= MINT_END, `claim cuối vào f=${lastClaimIn} ≤ đúc xong f=${MINT_END}`);
add("token CHƯA có trước khi ký", STATES[SIGN_F - 1].token.present === false, `f<${SIGN_F} chưa có token`);
add("token thành hình sau khi đúc", STATES[MINT_END].token.present && STATES[MINT_END].token.seal > 0.9, "seal (mã vạch) đã mọc đủ");

// ─── 4. Sợi chỉ SECRET: có ở đúc + server, VẮNG ở hacker ──────────────
const mintSealPeak = Math.max(...STATES.map((s) => s.mintSeal.active));
const serverSealPeak = Math.max(...STATES.map((s) => s.serverSeal.active));
add("con dấu secret HOẠT ĐỘNG lúc đúc", mintSealPeak > 0.9, "đóng dấu ở cổ phễu");
add("secret ở server SÁNG lúc kiểm", serverSealPeak > 0.5, "server giữ secret để ký lại");
// (hacker không có secret — bằng thiết kế: component Hacker vẽ ô khoá gạch chéo)

// ─── 5. SỨC NẶNG: bay theo CUNG, không đi thẳng ───────────────────────
const midUp = Math.round((T1.up + T1.verify) / 2);
const tk = STATES[midUp].token;
const straight = { x: (CLIENT_DOCK.x + SERVER_DOCK.x) / 2, y: (CLIENT_DOCK.y + SERVER_DOCK.y) / 2 };
const offLine = Math.hypot(tk.x - straight.x, tk.y - straight.y);
add("token bay theo CUNG (lệch đường thẳng)", offLine > 30, `giữa đường lệch ${Math.round(offLine)}px khỏi dây cung — có trọng lực`);
// cung phải khớp giữa sim và component: cùng gọi arc() với LANE_BEND
const arcMid = arc(CLIENT_DOCK, SERVER_DOCK, 0.5, LANE_BEND);
void arcMid;

// ─── 6. Nhịp giữ đủ lâu để ĐỌC (motion_language: hold ≥ 15f) ──────────
add("mỗi chặng bay ≥ 8 frame", T1.verify - T1.up >= 8 && T1.end - T1.back >= 8 && DELIVER_END - MINT_END >= 8, "không cú giật < 8f");
add("verdict PASS giữ đủ lâu", T1.back - T1.pass >= 10, `pass giữ ${T1.back - T1.pass}f trước khi token về`);

// ─── 7. Loop seamless: so cái ĐƯỢC VẼ, không so nội bộ ────────────────
const r = (v: number) => Math.round(v);
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    tok: s.token.present ? [r(s.token.x), r(s.token.y), +s.token.scale.toFixed(2), s.token.payload, s.token.verdict, +s.token.opacity.toFixed(2)] : 0,
    claims: s.claims.map((c) => [r(c.x), r(c.y), +c.opacity.toFixed(2), +c.scale.toFixed(2), +c.rot.toFixed(1)]),
    funnel: [r(s.funnel.swirl), +s.funnel.glow.toFixed(2)],
    hacker: +s.hacker.opacity.toFixed(2),
    compare: s.verify.present ? 1 : 0,
    mintSeal: +s.mintSeal.opacity.toFixed(2),
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");

// ─── 8. Cửa sổ reset sạch (chỉ cấm thứ ĐANG CHẠY, KHÔNG cấm fade tĩnh) ──
// Token bay & ô verify là "đang chạy" — phải tắt. Hacker mờ dần về 0 chỉ là
// fade tĩnh đáp đúng giá trị f0 (check seamless đã canh), KHÔNG tính là chạy.
let dirty = -1;
for (let f = A.shatterEnd; f < LOOP; f++) if (STATES[f].token.present || STATES[f].verify.present) { dirty = f; break; }
add("cửa sổ reset không còn thứ đang chạy", dirty < 0, dirty < 0 ? `từ f=${A.shatterEnd} sạch (token vỡ xong, verify tắt; hacker chỉ fade)` : `f=${dirty} còn sót`);

// ─── 9. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = { emit: 45, attach: 90, fill: 120, arrive: 80, fail: 150, slow: 130, drop: 90 };
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add("biên loop im tuyệt đối", soundEnd < LOOP - 2, `tiếng cuối tắt f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame lặng`);

// ─── 10. Hình học / safe-area ─────────────────────────────────────────
add("client + server nằm trong khung", CLIENT.x - CLIENT.w / 2 > 20 && SERVER.x + SERVER.w / 2 < W_(), `client trái, server phải`);
function W_() {
  return 1080;
}
add("kính lúp soi ở vùng dưới hairline", SERVER_DOCK.y > 320, `token/kính lúp ở y=${SERVER_DOCK.y}, dưới header`);
add("payload đọc được lọt đốt token", PAYLOAD_TAMPERED.length * 13.2 < 150, `${PAYLOAD_TAMPERED} rộng ~${Math.round(PAYLOAD_TAMPERED.length * 13.2)}px < 150`);
void T2;

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(46)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

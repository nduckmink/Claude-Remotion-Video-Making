import { BROWSER, COOKIE_HOME, LOOP, RESET, SERVER, SID, STORE, T, W as CW } from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. LỜI HỨA LÕI ────────────────────────────────────────────────────
add("mọi request TỰ kèm cookie (auto-attach)", OUTCOME.everyReqHasCookie, "browser tự dán cookie lên mỗi request, không ai bảo");
add("phiên nằm ở TỦ server, không ở cookie", OUTCOME.sessionInStore, "ngăn tủ sáng = dữ liệu thật; cookie chỉ là con số");
add("mỗi request: server TRA TỦ (stateful)", OUTCOME.lookupEachReq, "đọc sid → mở đúng ngăn → lấy áo");

// ─── 2. Xoá tủ → cùng cookie nhưng bị từ chối ─────────────────────────
add("xoá tủ → ngăn phiên TRỐNG", OUTCOME.storeEmptyAtBad, "session store bị clear");
add("cùng cookie NHƯNG bị TỪ CHỐI (401)", OUTCOME.badRejectedWithCookie, "vé còn đó mà tủ trống → đăng xuất");
add("cookie CHẾT sau khi xoá tủ", OUTCOME.cookieDeadAfterWipe, "cái vé thành vô nghĩa");

// ─── 3. Seamless ──────────────────────────────────────────────────────
const r = (v: number) => Math.round(v);
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    cells: s.cells.map((c) => +c.toFixed(2)),
    lookup: +s.lookup.toFixed(2),
    cookie: s.cookie.present ? [r(s.cookie.x), r(s.cookie.y), +s.cookie.dead.toFixed(2), +s.cookie.opacity.toFixed(2)] : 0,
    packet: s.packet ? [r(s.packet.x), r(s.packet.y), s.packet.hasCookie ? 1 : 0, +s.packet.rejected.toFixed(2)] : 0,
    ghost: +s.ghost.toFixed(2),
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");

// ─── 4. Reset sạch (chỉ cấm packet đang bay) ──────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) if (STATES[f].packet) { dirty = f; break; }
add("cửa sổ reset sạch (không packet bay)", dirty < 0, dirty < 0 ? `từ f=${RESET} sạch` : `f=${dirty} còn sót`);

// ─── 5. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = { emit: 45, attach: 90, arrive: 80, fill: 55, fail: 150, drop: 90, slow: 130 };
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add("biên loop im tuyệt đối", soundEnd < LOOP - 2, `tiếng cuối f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame`);

// ─── 6. Hình học ──────────────────────────────────────────────────────
add("browser + server trong khung, dưới header", BROWSER.x - BROWSER.w / 2 > 20 && SERVER.x + SERVER.w / 2 < CW - 20 && BROWSER.y - BROWSER.h / 2 > 300, "hai node cân đối");
add("tủ nằm trong khung, không lấn caption", STORE.y + STORE.h / 2 < 1760 && STORE.x + STORE.w / 2 < CW - 10, `tủ đáy y=${STORE.y + STORE.h / 2}`);
add("cookie ngắn (chỉ là id)", SID.length <= 12, `${SID} — ${SID.length} ký tự`);
void COOKIE_HOME;
void T;

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(46)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

import { CLIENT, EVIL, LOOP, RESET, SERVER, T, TUBE, W as CW } from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. Dòng 2 CHIỀU chảy liên tục ────────────────────────────────────
add("xanh lá đi LÊN (server→client)", OUTCOME.greenGoesUp, "dòng phản hồi");
add("xanh dương đi XUỐNG (client→server)", OUTCOME.blueGoesDown, "dòng yêu cầu");

// ─── 2. Cam độc hại: bơm vào NHƯNG bị chặn, tràn ra ngoài ──────────────
add("client lạ bơm cam vào ống", OUTCOME.orangeInjected, "evil chọc vòi qua vết nứt");
add("server TỪ CHỐI cam (loé đỏ)", OUTCOME.serverRejected, "origin không được phép");
add("MỌI cam TRÀN RA NGOÀI (không vào server)", OUTCOME.allOrangeSpilled, "bị chặn ở cửa → văng ra, tan");

// ─── 3. Sạch sau tấn công ─────────────────────────────────────────────
add("hết cam · evil rút · ống lành", OUTCOME.cleanAfter, "về lại dòng chảy hợp lệ");

// ─── 4. Seamless ──────────────────────────────────────────────────────
const r = (v: number) => Math.round(v);
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    green: s.green.map((d) => r(d.y)),
    blue: s.blue.map((d) => r(d.y)),
    orange: s.orange.length,
    crack: +s.crack.toFixed(2),
    evil: +s.evil.toFixed(2),
    hose: +s.hose.toFixed(2),
    reject: +s.serverReject.toFixed(2),
    bullet: s.bullet.present ? [r(s.bullet.x)] : 0,
    impact: +s.impact.toFixed(2),
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");

// ─── 5. Reset sạch (không cam bay, không tia) ─────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) if (STATES[f].orange.length || STATES[f].bullet.present || STATES[f].impact > 0.02) { dirty = f; break; }
add("cửa sổ reset sạch", dirty < 0, dirty < 0 ? `từ f=${RESET} sạch, đuôi chỉ ${LOOP - RESET} frame` : `f=${dirty} còn sót`);

// Đuôi loop không được lê thê: sau khi mọi thứ xong chỉ để dòng chảy lắng lại.
add("đuôi loop gọn (≤ 60 frame)", LOOP - RESET <= 60, `${LOOP - RESET} frame (${((LOOP - RESET) / 30).toFixed(1)}s) sau khi kết thúc`);

// Đạn: MỘT viên, bay rồi trúng — không phải tia liên tục.
const bulletFrames = STATES.filter((s) => s.bullet.present).length;
add("bắn MỘT viên đạn (không phải tia)", bulletFrames > 6 && bulletFrames <= 24, `đạn bay ${bulletFrames} frame rồi trúng`);
add("đạn TRÚNG rồi ống mới nứt", STATES[T.hit + 2].impact > 0.5 && STATES[T.hit - 4].crack < 0.05, "nứt là HỆ QUẢ của cú trúng");

// ─── 6. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = { emit: 45, attach: 90, arrive: 80, fill: 55, fail: 150, drop: 90, slow: 130, travel: 38 };
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add("biên loop im tuyệt đối", soundEnd < LOOP - 2, `tiếng cuối f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame`);

// Dòng chảy PHẢI có tiếng — và phải đủ thưa để không thành tiếng ồn.
const flow = EVENTS.filter((e) => e.kind === "travel");
const gaps = flow.slice(1).map((e, k) => e.f - flow[k].f);
add("dòng chảy CÓ tiếng (hai chiều, hai cao độ)", flow.length >= 20 && flow.some((e) => e.i === 1) && flow.some((e) => e.i === 2), `${flow.length} tiếng · lên ${flow.filter((e) => e.i === 1).length} · xuống ${flow.filter((e) => e.i === 2).length}`);
add("tiếng dòng chảy đủ thưa (≥10 frame/tiếng)", Math.min(...gaps) >= 10, `khoảng nhỏ nhất ${Math.min(...gaps)} frame`);

// ─── 7. Hình học ──────────────────────────────────────────────────────
add("ống nối client→server, dưới header", TUBE.topY > CLIENT.y && TUBE.botY < SERVER.y && TUBE.topY > 300, `ống ${TUBE.topY}→${TUBE.botY}`);
add("client/server/evil trong khung", CLIENT.y - CLIENT.h / 2 > 300 && SERVER.x + SERVER.w / 2 < CW && EVIL.x + EVIL.w / 2 < CW, "không tràn mép");

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(46)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

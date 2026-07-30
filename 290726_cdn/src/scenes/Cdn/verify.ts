import { EDGES, LOOP, ORIGIN, ORIGIN_BOX, RESET, T, USERS, W as CW } from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. LỜI HỨA: bản sao NẰM GẦN ⇒ quãng đường ngắn hẳn ───────────────
add(
  "đường tới origin DÀI gấp nhiều lần đường tới edge",
  OUTCOME.ratio >= 4,
  `${Math.round(OUTCOME.longLen)}px vs ${Math.round(OUTCOME.shortLen)}px — gấp ${OUTCOME.ratio.toFixed(1)} lần`,
);
add(
  "một tốc độ ⇒ round-trip xa LÂU hơn hẳn",
  OUTCOME.farRoundTrip >= 4 * OUTCOME.hitRoundTrip,
  `xa ${OUTCOME.farRoundTrip}f (${(OUTCOME.farRoundTrip / 30).toFixed(1)}s) vs gần ${OUTCOME.hitRoundTrip}f (${(OUTCOME.hitRoundTrip / 30).toFixed(1)}s)`,
);

// ─── 2. CDN gánh cho origin: cache ấm rồi thì KHÔNG đập origin nữa ─────
add(
  "cache ấm rồi: origin KHÔNG bị đập lần nào",
  OUTCOME.originHitsInHitPhase === 0 && OUTCOME.requestsInHitPhase >= 9,
  `${OUTCOME.requestsInHitPhase} request được phục vụ · origin bị đập ${OUTCOME.originHitsInHitPhase} lần`,
);
add("mỗi edge chỉ về origin ĐÚNG một lần", OUTCOME.originHits === T.farFire.length + EDGES.length, `${OUTCOME.originHits} cú đập tổng (act1 ${T.farFire.length} + mỗi edge 1)`);
add("edge GIỮ bản sao sau cú miss", OUTCOME.filledAfterMiss, "cả 3 edge đã có file trước khi vào pha hit");

// ─── 3. Origin nguội hẳn (không còn tải) ──────────────────────────────
add("origin NGUỘI về đúng 0 cuối loop", OUTCOME.heatEnd === 0, `heat=${OUTCOME.heatEnd}`);

// ─── 4. Seamless: so cái ĐƯỢC VẼ ──────────────────────────────────────
const r = (v: number) => Math.round(v);
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    legs: s.legs.map((l) => [r(l.ax), r(l.ay), r(l.bx), r(l.by), +l.prog.toFixed(2), +l.fade.toFixed(2)]),
    packets: s.packets.map((p) => [r(p.x), r(p.y), p.carry ? 1 : 0]),
    edges: s.edges.map((e) => [+e.present.toFixed(2), +e.filled.toFixed(2), +e.miss.toFixed(2)]),
    origin: [+s.origin.heat.toFixed(2), +s.origin.hit.toFixed(2)],
    users: s.users.map((u) => +u.live.toFixed(2)),
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");
add("edge VẮNG ở hai đầu loop", OUTCOME.edgesAtEnds, "vòng mới lại bắt đầu từ trạng thái chưa có CDN");

// ─── 5. Reset sạch + đuôi gọn ─────────────────────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) if (STATES[f].packets.length || STATES[f].legs.length) { dirty = f; break; }
add("cửa sổ reset sạch", dirty < 0, dirty < 0 ? `từ f=${RESET} sạch` : `f=${dirty} còn sót`);
add("đuôi loop gọn (≤ 60 frame)", LOOP - RESET <= 60, `${LOOP - RESET} frame (${((LOOP - RESET) / 30).toFixed(1)}s)`);

// ─── 6. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = { emit: 45, attach: 90, arrive: 80, fill: 55, fail: 150, drop: 90, slow: 130, travel: 38 };
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add("biên loop im tuyệt đối", soundEnd < LOOP - 2, `tiếng cuối f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame`);
const worstSameKind = Math.min(
  ...[...new Set(EVENTS.map((e) => e.kind))].map((k) => {
    const fs = EVENTS.filter((e) => e.kind === k).map((e) => e.f);
    return fs.length < 2 ? 999 : Math.min(...fs.slice(1).map((f, i) => f - fs[i]));
  }),
);
add("cùng loại tiếng không dồn cục (≥6 frame)", worstSameKind >= 6, `khoảng nhỏ nhất trong một loại: ${worstSameKind} frame`);

// ─── 7. Hình học / safe-area ──────────────────────────────────────────
add("user + edge nằm dưới header", USERS.every((u) => u.p.y > 340) && EDGES.every((e) => e.y > 340), `user cao nhất y=${Math.min(...USERS.map((u) => u.p.y))}`);
add("origin không lấn caption", ORIGIN.y + ORIGIN_BOX.h / 2 < 1770, `origin đáy y=${ORIGIN.y + ORIGIN_BOX.h / 2}`);
add("mọi thứ trong khung ngang", USERS.every((u) => u.p.x > 40 && u.p.x < CW - 40) && EDGES.every((e) => e.x > 40 && e.x < CW - 40), "3 vùng trải đều, không tràn mép");
add("edge nằm SÁT user (gần hơn origin rất nhiều)", EDGES.every((e, i) => Math.abs(e.y - USERS[i].p.y) < 300), "đó chính là ý nghĩa của edge");

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(48)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

import { BLOCK, CAP_VISIBLE, CHUTE, DEEP, LOOP, PRESS, RESET, SLOT_PITCH, W as CW, WORKERS, WORKER_R, slotY } from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. LỜI HỨA: không mất việc, và hàng đợi hấp thụ cú tăng tải ───────
add("không task nào BIẾN MẤT (vào = ra)", OUTCOME.totalProduced === OUTCOME.totalDone, `${OUTCOME.totalProduced} task vào · ${OUTCOME.totalDone} xong`);
add(
  "tăng tần suất ⇒ hàng đợi DỒN LÊN",
  OUTCOME.depthAtCalm <= 1 && OUTCOME.peakDepth >= 5,
  `êm ${OUTCOME.depthAtCalm} → đỉnh ${OUTCOME.peakDepth} task chờ`,
);
add("cuối cao điểm vẫn còn dồn", OUTCOME.depthAtBurstEnd >= 3, `f=cuối burst còn ${OUTCOME.depthAtBurstEnd} task chờ`);

// ─── 2. Thêm worker ⇒ THÔNG LƯỢNG tăng (đây là cách chữa) ─────────────
add(
  "thêm worker ⇒ thông lượng TĂNG",
  OUTCOME.thruTwo > OUTCOME.thruOne,
  `96 frame: một worker xong ${OUTCOME.thruOne} · hai worker xong ${OUTCOME.thruTwo}`,
);

// ─── 3. FIFO + rút cạn rồi worker phụ mới rời ─────────────────────────
add("FIFO — tới trước được nhận trước", OUTCOME.fifo, "không chen ngang");
add("rút CẠN hàng đợi trước khi hết loop", OUTCOME.depthEnd === 0, `cuối loop còn ${OUTCOME.depthEnd}`);
add("worker phụ rời SAU khi đã cạn", OUTCOME.w2LeavesAfterDrain, "hết dồn mới rút người, không bỏ chạy giữa chừng");
add("worker phụ VẮNG ở hai đầu loop", OUTCOME.w2AbsentEnds, "vòng mới lại bắt đầu với một worker");

// ─── 4. Hình học: đống chờ không được TRÀN khỏi máng ───────────────────
add(
  "đỉnh hàng đợi vẫn nằm trong máng",
  OUTCOME.peakDepth <= CAP_VISIBLE,
  `đỉnh ${OUTCOME.peakDepth} ≤ sức chứa nhìn thấy ${CAP_VISIBLE} (đáy y=${slotY(0)} → đỉnh y=${slotY(OUTCOME.peakDepth - 1)})`,
);
add("task lọt trong lòng máng", BLOCK.w < CHUTE.w - 20 && BLOCK.h < SLOT_PITCH, `task ${BLOCK.w}×${BLOCK.h}, máng rộng ${CHUTE.w}`);
add("máy dập trên máng, dưới header", PRESS.y - PRESS.h / 2 > 310 && PRESS.y + PRESS.h / 2 < CHUTE.topY, `press ${PRESS.y}`);
add("hai worker trong khung, không lấn caption", WORKERS.every((w) => w.x - WORKER_R > 20 && w.x + WORKER_R < CW - 20 && w.y + WORKER_R < 1780), "worker cân hai bên");

// ─── 5. Seamless: so cái ĐƯỢC VẼ ──────────────────────────────────────
const r = (v: number) => Math.round(v);
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    tasks: s.tasks.map((t) => [r(t.x), r(t.y), t.state, +t.opacity.toFixed(2)]),
    depth: s.depth,
    press: +s.press.toFixed(2),
    workers: s.workers.map((w) => [+w.present.toFixed(2), +w.prog.toFixed(2), +w.live.toFixed(2)]),
    warn: +s.warn.toFixed(2),
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");

// ─── 6. Cửa sổ reset sạch + đuôi gọn ──────────────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) if (STATES[f].tasks.length || STATES[f].press > 0.02) { dirty = f; break; }
add("cửa sổ reset sạch", dirty < 0, dirty < 0 ? `từ f=${RESET} sạch` : `f=${dirty} còn sót`);
add("đuôi loop gọn (≤ 60 frame)", LOOP - RESET <= 60, `${LOOP - RESET} frame (${((LOOP - RESET) / 30).toFixed(1)}s)`);

// ─── 7. Âm thanh ──────────────────────────────────────────────────────
const SFX_MS: Record<string, number> = { emit: 45, attach: 90, arrive: 80, fill: 55, fail: 150, drop: 90, slow: 130, travel: 38 };
const soundEnd = Math.max(...EVENTS.map((e) => e.f + (SFX_MS[e.kind] / 1000) * 30));
add("biên loop im tuyệt đối", soundEnd < LOOP - 2, `tiếng cuối f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame`);
// Cùng MỘT loại tiếng không được dồn cục (thành tiếng ồn). Hai loại KHÁC nhau
// trùng frame thì không sao — tai nghe ra hợp âm, đúng như hai sự kiện cùng lúc.
const worstSameKind = Math.min(
  ...[...new Set(EVENTS.map((e) => e.kind))].map((k) => {
    const fs = EVENTS.filter((e) => e.kind === k).map((e) => e.f);
    return fs.length < 2 ? 999 : Math.min(...fs.slice(1).map((f, i) => f - fs[i]));
  }),
);
add("cùng loại tiếng không dồn cục (≥6 frame)", worstSameKind >= 6, `khoảng nhỏ nhất trong một loại: ${worstSameKind} frame`);
add("mật độ tiếng vừa phải (≤6/giây)", EVENTS.length / (LOOP / 30) <= 6, `${EVENTS.length} tiếng / ${(LOOP / 30).toFixed(1)}s = ${(EVENTS.length / (LOOP / 30)).toFixed(1)}/s`);
void DEEP;

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(46)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

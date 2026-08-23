import { CARD, FANOUT, HUD, INSERT_KEY, LEAF, LOOP, MID, N, PITCH, QUERY, QUERY_CARD, RESET, ROOT, SORTED, STRIP, T, TARGET, W as CW, cardX, leafX } from "./constants";
import { EVENTS, INS_LEAF, LEAF_J, MID_K, OUTCOME, STATES, leafKeys } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. LUẬN ĐIỂM: tuyến tính → logarit, và con số phải ĐẾM RA ─────────
add(
  "quét phải đụng từng dòng tới khi gặp",
  OUTCOME.scanReads === OUTCOME.targetPhysical + 1 && OUTCOME.scanReads >= 20,
  `${OUTCOME.scanReads} reads (khoá nằm ở dòng vật lý thứ ${OUTCOME.targetPhysical})`,
);
add(
  "tra bằng index chỉ tốn vài lần đọc",
  OUTCOME.indexReads === 4 && OUTCOME.indexReads * 5 < OUTCOME.scanReads,
  `${OUTCOME.indexReads} reads (3 nút + 1 dòng) — ít hơn ${(OUTCOME.scanReads / OUTCOME.indexReads).toFixed(1)} lần`,
);
add(
  "ứng viên co lại NGHIÊM NGẶT qua từng tầng",
  OUTCOME.narrowing.every((v, i) => i === 0 || v < OUTCOME.narrowing[i - 1]) && JSON.stringify(OUTCOME.narrowing) === JSON.stringify([N, N / FANOUT, FANOUT, 1]),
  `${OUTCOME.narrowing.join(" → ")} dòng còn sáng`,
);

// ─── 2. Index KHÔNG sắp lại bảng (chỗ hay bị hiểu sai nhất) ────────────
add("bảng KHÔNG bị sắp lại", OUTCOME.tableUntouched && OUTCOME.tableNotSorted, "thứ tự vật lý giữ nguyên — index là cấu trúc RIÊNG");
add("index và bảng cùng một tập khoá", OUTCOME.sameKeys, `${N} khoá, không thiếu không thừa`);

// ─── 3. Đường đi trong cây TÍNH từ khoá, và trỏ đúng dòng ──────────────
add("đường đi root → mid → leaf đúng theo khoá", OUTCOME.pathCorrect, `${TARGET} ∈ lá ${LEAF_J} (${leafKeys(LEAF_J).join(",")}) ⊂ nút giữa ${MID_K}`);
add("lá trỏ về ĐÚNG dòng chứa khoá", OUTCOME.hitsRightRow, `dòng vật lý ${OUTCOME.targetPhysical} chứa ${TARGET}`);

// ─── 4. Cái giá: ghi đụng CẢ HAI, lá đầy thì tách ──────────────────────
add("ghi thêm dòng vào bảng", OUTCOME.cardAdded, `${N} → ${N + 1} dòng`);
add("và phải luồn khoá vào cây → TÁCH NÚT", OUTCOME.leafSplit && OUTCOME.insLeafWasFull, `khoá ${INSERT_KEY} rơi vào lá ${INS_LEAF} đang đầy ${FANOUT}/${FANOUT}`);

// ─── 5. Seamless: so cái ĐƯỢC VẼ ──────────────────────────────────────
const r = (v: number) => Math.round(v);
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    q: +s.query.opacity.toFixed(2),
    scanAt: s.scan.active ? s.scan.at : -1,
    cards: s.cards.map((c) => [+c.lit.toFixed(2), c.visited, +c.opacity.toFixed(2), c.isNew ? 1 : 0]),
    root: [+s.root.on.toFixed(2), +s.root.active.toFixed(2)],
    mids: s.mids.map((m) => [+m.on.toFixed(2), +m.active.toFixed(2)]),
    leaves: s.leaves.map((l) => [+l.on.toFixed(2), +l.active.toFixed(2), +l.split.toFixed(2)]),
    hop: s.hop,
    reads: s.reads,
    ins: s.ins.present ? [r(s.ins.x), r(s.ins.y), +s.ins.opacity.toFixed(2)] : 0,
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");
add("cây VẮNG + reads = 0 ở hai đầu loop", OUTCOME.treeGoneAtEnds && OUTCOME.readsEnd === 0, "vòng mới lại bắt đầu từ bảng chưa có index");

// ─── 6. Reset sạch + đuôi gọn ─────────────────────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) if (STATES[f].query.present || STATES[f].ins.present || STATES[f].root.on > 0.01) { dirty = f; break; }
add("cửa sổ reset sạch", dirty < 0, dirty < 0 ? `từ f=${RESET} sạch` : `f=${dirty} còn sót`);
add("đuôi loop gọn (≤ 60 frame)", LOOP - RESET <= 60, `${LOOP - RESET} frame (${((LOOP - RESET) / 30).toFixed(1)}s)`);

// ─── 7. Âm thanh ──────────────────────────────────────────────────────
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

// ─── 8. Hình học / safe-area ──────────────────────────────────────────
add("dải bảng (28 card) không tràn mép", cardX(0) - CARD.w / 2 > 20 && cardX(N) + CARD.w / 2 < CW - 20, `x ${Math.round(cardX(0) - CARD.w / 2)}..${Math.round(cardX(N) + CARD.w / 2)}`);
add("card không chồng nhau", PITCH > CARD.w, `pitch ${PITCH} > card ${CARD.w}`);
add("cây xếp DỌC, không đè nhau", ROOT.y + ROOT.h / 2 < MID.y - MID.h / 2 && MID.y + MID.h / 2 < LEAF.y - LEAF.h / 2 && LEAF.y + LEAF.h / 2 < STRIP.y - CARD.h / 2, `root ${ROOT.y} → mid ${MID.y} → leaf ${LEAF.y} → bảng ${STRIP.y}`);
add("lá trải đúng bề ngang dải bảng", leafX(0) >= cardX(0) - 20 && leafX(8) <= cardX(N - 1) + 20, `lá ${leafX(0)}..${leafX(8)} · bảng ${cardX(0)}..${cardX(N - 1)}`);
add("không lấn header / caption", QUERY_CARD.y - QUERY_CARD.h / 2 > 310 && HUD.x > 0 && HUD.y + 74 < 1770, `truy vấn đỉnh y=${QUERY_CARD.y - QUERY_CARD.h / 2}, hud đáy y=${HUD.y + 74}`);
add("chữ truy vấn lọt thẻ", QUERY.length * 10.4 < QUERY_CARD.w - 40, `"${QUERY}" ≈ ${Math.round(QUERY.length * 10.4)}px < ${QUERY_CARD.w - 40}px`);
void SORTED;
void T;

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(48)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

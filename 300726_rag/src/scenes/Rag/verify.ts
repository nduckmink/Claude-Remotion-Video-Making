import { ANSWER, CARD, CHUNKS, DOC, EMB, LLM, LOOP, MAP, QUERY, Q_CARD, RESET, T, TOP_K, W as CW } from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. LỜI HỨA: gần nhau là liên quan — top-k phải TÍNH RA, không gõ tay ──
add(
  "3 đoạn được chọn ĐÚNG là cụm cùng chủ đề với câu hỏi",
  JSON.stringify(OUTCOME.topK) === JSON.stringify([0, 1, 2]),
  `chọn [${OUTCOME.topK.join(",")}] = ${OUTCOME.topK.map((i) => `"${CHUNKS[i].text}"`).join(" · ")}`,
);
add(
  "vòng tìm dừng SAU chấm thứ 3, TRƯỚC chấm thứ 4",
  OUTCOME.dK < OUTCOME.searchR && OUTCOME.searchR < OUTCOME.dNext,
  `d3=${Math.round(OUTCOME.dK)}px < R=${Math.round(OUTCOME.searchR)}px < d4=${Math.round(OUTCOME.dNext)}px — đó chính là top-${TOP_K}`,
);
add(
  "chunk cùng chủ đề DỒN THÀNH CỤM",
  OUTCOME.inter > 2 * OUTCOME.intra,
  `trong cụm ≤ ${Math.round(OUTCOME.intra)}px · sang cụm kia ≥ ${Math.round(OUTCOME.inter)}px (xa gấp ${(OUTCOME.inter / OUTCOME.intra).toFixed(1)} lần)`,
);
add("mọi chunk KHÁC chủ đề đều nằm NGOÀI vòng", OUTCOME.dNext > OUTCOME.searchR, "không đoạn shipping nào lọt vào");

// ─── 2. Trình tự: index xong mới truy vấn; có đủ 3 đoạn rồi mới trả lời ──
add("index xong TOÀN BỘ trước khi có câu hỏi", OUTCOME.allIndexedBeforeQuery, `chunk cuối vào bản đồ trước f=${T.qShow}`);
add("LLM nhận đủ 3 đoạn TRƯỚC khi sinh câu trả lời", OUTCOME.fedBeforeAnswer && OUTCOME.answerAfterPull, "không bịa — có ngữ cảnh rồi mới nói");
// Retrieval chỉ ĐỌC: lấy đoạn ra không được làm mất bản gốc trong DB.
const stillInDb = STATES[T.answerIn].chunks.filter((c) => c.ghost > 0.3).length;
add("lấy đoạn ra KHÔNG xoá bản gốc khỏi DB", stillInDb === TOP_K, `${stillInDb}/${TOP_K} bản gốc vẫn nằm trên bản đồ`);

// ─── 3. Câu hỏi đi qua CHÍNH embedder đó (nếu không thì không so được) ──
let qThroughEmb = false;
for (let f = T.qThru; f < T.qToMap; f++) {
  const q = STATES[f].query;
  if (q.present && Math.abs(q.x - EMB.x) < 6 && Math.abs(q.y - EMB.y) < 60) qThroughEmb = true;
}
add("câu hỏi qua CHÍNH cái embedder của tài liệu", qThroughEmb, "cùng một phép nhúng ⇒ mới so sánh được");

// ─── 4. Seamless: so cái ĐƯỢC VẼ ──────────────────────────────────────
const r = (v: number) => Math.round(v);
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    doc: [+s.doc.opacity.toFixed(2), s.doc.gone.map((g) => (g ? 1 : 0))],
    chunks: s.chunks.map((c) => (c.present && c.opacity > 0.01 ? [r(c.x), r(c.y), +c.asDot.toFixed(2), +c.opacity.toFixed(2), +c.selected.toFixed(2)] : 0)),
    query: s.query.present && s.query.opacity > 0.01 ? [r(s.query.x), r(s.query.y), +s.query.opacity.toFixed(2)] : 0,
    search: s.search.present ? r(s.search.r) : 0,
    llm: [+s.llm.present.toFixed(2), +s.llm.work.toFixed(2)],
    answer: +s.answer.opacity.toFixed(2),
    mapOn: +s.mapOn.toFixed(2),
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");
add("tài liệu NGUYÊN VẸN + bản đồ TRỐNG ở hai đầu loop", OUTCOME.docWholeAtEnds && OUTCOME.mapEmptyAtEnds, "vòng mới lại bắt đầu từ tài liệu chưa index");

// ─── 5. Reset sạch + đuôi gọn ─────────────────────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) if (STATES[f].search.present || STATES[f].answer.present || STATES[f].query.present) { dirty = f; break; }
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

// ─── 7. Chữ phải ĐỌC ĐƯỢC: lọt trong thẻ ──────────────────────────────
const CHAR = 9.7; // JetBrains Mono 16px
const longest = Math.max(...CHUNKS.map((c) => c.text.length));
add("chữ chunk lọt trong thẻ", longest * CHAR < CARD.w - 26, `dài nhất ${longest} ký tự ≈ ${Math.round(longest * CHAR)}px < ${CARD.w - 26}px`);
add("chữ câu hỏi lọt trong thẻ", QUERY.length * CHAR < Q_CARD.w - 26, `${QUERY.length} ký tự ≈ ${Math.round(QUERY.length * CHAR)}px < ${Q_CARD.w - 26}px`);

// ─── 8. Hình học / safe-area ──────────────────────────────────────────
add("bản đồ VUÔNG (vòng tìm là đường tròn thật)", MAP.w === MAP.h, `${MAP.w}×${MAP.h}`);
add("các tầng không chồng nhau", DOC.y + DOC.h / 2 < EMB.y - EMB.h / 2 && EMB.y + EMB.h / 2 < MAP.y && MAP.y + MAP.h < LLM.y - LLM.h / 2, "doc → embedder → map → llm xếp dọc, không đè");
add("không lấn header / caption", DOC.y - DOC.h / 2 > 310 && ANSWER.y + ANSWER.h / 2 < 1770, `doc đỉnh y=${DOC.y - DOC.h / 2}, answer đáy y=${ANSWER.y + ANSWER.h / 2}`);
add("bản đồ trong khung ngang", MAP.x > 20 && MAP.x + MAP.w < CW - 20, `x ${MAP.x}..${MAP.x + MAP.w}`);
void LLM;

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(50)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

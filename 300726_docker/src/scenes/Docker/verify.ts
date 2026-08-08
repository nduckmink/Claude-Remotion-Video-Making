import { A, B, BOX, BOX_A, BOX_B, BUBBLE_A, BUBBLE_B, ERRORS, ITEMS, LOOP, PERSON, RESET, SAY_A, SAY_B, T, W as CW } from "./constants";
import { EVENTS, OUTCOME, STATES } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. NHÂN QUẢ của câu chuyện — sai thứ tự là mất hết ý nghĩa ────────
add("gửi code TRẦN trước, rồi mới nổ lỗi", OUTCOME.codeBeforeErrors, `code tới f=${T.codeAt} ≤ lỗi đầu f=${T.err[0]}`);
add("nổ lỗi xong A mới đi đóng hộp", OUTCOME.errorsBeforeBox, `lỗi cuối f=${T.err[ERRORS.length - 1]} < mở hộp f=${T.boxOpen}`);
add("code trần KHÔNG bao giờ chạy được ở B", OUTCOME.codeNeverRan, "gửi mỗi code thì bên kia bó tay");

// ─── 2. Hộp phải ĐỦ MÔI TRƯỜNG rồi mới niêm phong ─────────────────────
add(
  "đủ cả 4 thứ mới niêm phong",
  OUTCOME.allItemsBeforeSeal && OUTCOME.fullAtSeal && OUTCOME.itemCount === 4,
  `${ITEMS.join(" · ")} — vào hết trước f=${T.seal}`,
);
add("niêm phong RỒI mới gửi đi", OUTCOME.sealBeforeShip && OUTCOME.sealedAtShip, `seal f=${T.seal} < ship f=${T.shipOut}`);
add("hộp tới nơi RỒI mới bật chạy", OUTCOME.arriveBeforeRun, `tới f=${T.shipAt} ≤ bật f=${T.run}`);

// ─── 3. Cú chốt: chạy được ở máy B, B không phải cài gì ───────────────
add("hộp CHẠY ĐƯỢC ở bên B", OUTCOME.runsAtB, "bật thẳng cái hộp, không cần mở ra");
add("môi trường của B thành không liên quan", OUTCOME.envDimmed, "hộp tự mang runtime + libs theo, máy B khỏi cài");

// ─── 4. Đúng kỹ thuật: hộp KHÔNG mang kernel ──────────────────────────
add(
  "nhãn không nói dối (không có 'cả hệ điều hành')",
  ITEMS.every((s) => !/^os$|operating system|kernel/i.test(s)) && ITEMS.includes("os libs"),
  `"os libs" — thư viện userland, KHÔNG phải kernel (container dùng chung kernel máy chủ)`,
);

// ─── 5. Seamless: so cái ĐƯỢC VẼ ──────────────────────────────────────
const r = (v: number) => Math.round(v);
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    bubbles: [+s.bubbleA.opacity.toFixed(2), +s.bubbleB.opacity.toFixed(2)],
    code: s.code.present && s.code.opacity > 0.01 ? [r(s.code.x), r(s.code.y), +s.code.opacity.toFixed(2)] : 0,
    errors: s.errors.map((e) => (e.present ? +e.opacity.toFixed(2) : 0)),
    box: s.box.present && s.box.opacity > 0.01 ? [r(s.box.x), r(s.box.y), +s.box.open.toFixed(2), +s.box.sealed.toFixed(2), +s.box.running.toFixed(2), +s.box.opacity.toFixed(2)] : 0,
    items: s.items.map((i) => (i.opacity > 0.01 ? [r(i.x), r(i.y)] : 0)),
    people: [+s.a.live.toFixed(2), +s.b.live.toFixed(2), +s.b.envDim.toFixed(2)],
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");
add("hộp VẮNG ở hai đầu loop", OUTCOME.boxAbsentAtEnds, "vòng mới lại bắt đầu từ lúc chưa có gì");

// ─── 6. Reset sạch + đuôi gọn ─────────────────────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) if (STATES[f].code.present || STATES[f].box.present || STATES[f].bubbleA.present || STATES[f].bubbleB.present) { dirty = f; break; }
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

// ─── 8. Chữ phải ĐỌC ĐƯỢC + hình học ──────────────────────────────────
const CHAR = 10.2; // JetBrains Mono 17px
add("thoại A lọt bong bóng", Math.max(...SAY_A.map((s) => s.length)) * CHAR < BUBBLE_A.w - 40, `"${SAY_A[0]}" ≈ ${Math.round(SAY_A[0].length * CHAR)}px < ${BUBBLE_A.w - 40}px`);
add("thoại B lọt bong bóng", Math.max(...SAY_B.map((s) => s.length)) * CHAR < BUBBLE_B.w - 40, `dài nhất ≈ ${Math.round(Math.max(...SAY_B.map((s) => s.length)) * CHAR)}px < ${BUBBLE_B.w - 40}px`);
add("hai người cân hai bên, không tràn khung", A.x - PERSON.w / 2 > 20 && B.x + PERSON.w / 2 < CW - 20, `A x=${A.x} · B x=${B.x}`);
add("bong bóng không đè lên nhau", BUBBLE_A.x + BUBBLE_A.w / 2 < BUBBLE_B.x - BUBBLE_B.w / 2, `A phải ${BUBBLE_A.x + BUBBLE_A.w / 2} < B trái ${BUBBLE_B.x - BUBBLE_B.w / 2}`);
add("hộp nằm dưới header, trên đầu người", BOX_A.y - BOX.h / 2 > 320 && BOX_A.y + BOX.h / 2 < A.y - PERSON.h / 2, `hộp ${BOX_A.y - BOX.h / 2}..${BOX_A.y + BOX.h / 2}`);
add("hộp ở hai vị trí không tràn mép", BOX_A.x - BOX.w / 2 > 20 && BOX_B.x + BOX.w / 2 < CW - 20, `A ${BOX_A.x} → B ${BOX_B.x}`);

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(48)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

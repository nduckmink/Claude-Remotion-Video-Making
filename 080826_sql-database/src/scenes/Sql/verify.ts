import { BLOBS, CUSTOMERS, CUTOFF, EXEC_ORDER, HEAD_H, LOOP, ORDERS, RESET, RESULT, ROW_H, SQL, SQL_LINES, T, W as CW } from "./constants";
import { EVENTS, GROUPS, OUTCOME, STATES, tableH } from "./sim";

const checks: [string, boolean, string][] = [];
const add = (n: string, ok: boolean, note: string) => checks.push([n, ok, note]);

// ─── 1. Schema: cột có KIỂU, sai kiểu thì bị TỪ CHỐI ──────────────────
add("mọi cột đều khai KIỂU", [...CUSTOMERS.cols, ...ORDERS.cols].every((c) => c.type.length > 0), `${[...new Set([...CUSTOMERS.cols, ...ORDERS.cols].map((c) => c.type))].join(" · ")}`);
add("bản ghi SAI KIỂU bị hắt ra", OUTCOME.badRejected && OUTCOME.badNeverInTable, `id="xyz" không phải int ⇒ không bao giờ vào bảng`);
add("các bản ghi hợp lệ đều vào bảng", OUTCOME.custRowsOn, `${BLOBS.filter((b) => !b.bad).length} bản ghi tốt = ${CUSTOMERS.rows.length} dòng`);

// ─── 2. Kết quả TÍNH RA từ dữ liệu, không gõ tay ──────────────────────
add(
  "WHERE loại đúng dòng ngoài mốc thời gian",
  OUTCOME.droppedIdx.length === 1 && `2026-${ORDERS.rows[OUTCOME.droppedIdx[0]][3]}` < CUTOFF,
  `loại dòng ${ORDERS.rows[OUTCOME.droppedIdx[0]][0]} (${ORDERS.rows[OUTCOME.droppedIdx[0]][3]} < ${CUTOFF})`,
);
add(
  "GROUP BY + SUM ra đúng tổng",
  OUTCOME.sumOfGroups === OUTCOME.totalKept,
  OUTCOME.groups.map((g) => `${g.name}=${g.sum}`).join(" · ") + ` — tổng ${OUTCOME.sumOfGroups} = tổng dòng giữ lại`,
);
add("có nhóm gồm NHIỀU dòng (SUM làm việc thật)", OUTCOME.groups.some((g) => g.n > 1), OUTCOME.groups.map((g) => `${g.name}:${g.n} dòng`).join(" · "));

// ─── 3. Vào là bảng, RA CŨNG LÀ BẢNG ──────────────────────────────────
add("kết quả cũng là một BẢNG có cột", OUTCOME.resultIsTable, `${RESULT.cols.map((c) => `${c.name} ${c.type}`).join(" · ")} — ${GROUPS.length} dòng`);
add("kết quả NHỎ hơn dữ liệu gốc", GROUPS.length < ORDERS.rows.length, `${GROUPS.length} dòng ra từ ${ORDERS.rows.length} dòng orders`);

// ─── 4. SQL chạy theo thứ tự THỰC THI, không theo thứ tự chữ ──────────
add("thứ tự chạy khác thứ tự viết", OUTCOME.execOrderIsNotTextOrder, `FROM/JOIN → WHERE → GROUP BY → SELECT (dòng ${EXEC_ORDER.flat().join(",")})`);
add("mỗi mệnh đề đều được soi đúng một lần", EXEC_ORDER.flat().length === SQL_LINES.length && new Set(EXEC_ORDER.flat()).size === SQL_LINES.length, `${SQL_LINES.length} dòng SQL`);

// ─── 5. Seamless ──────────────────────────────────────────────────────
const norm = (f: number) => {
  const s = STATES[f];
  return JSON.stringify({
    blobs: s.blobs.map((b) => [Math.round(b.x), Math.round(b.y), +b.opacity.toFixed(2)]),
    cust: [+s.cust.on.toFixed(2), s.cust.rows.map((r) => +r.on.toFixed(2))],
    ord: [+s.ord.on.toFixed(2), s.ord.rows.map((r) => [+r.dim.toFixed(2), r.group])],
    link: [+s.link.on.toFixed(2), +s.link.pulse.toFixed(2)],
    sql: [+s.sql.on.toFixed(2), s.sql.active],
    res: [+s.result.on.toFixed(2), s.result.rows.map((r) => +r.on.toFixed(2))],
    phase: s.phase,
  });
};
add("f0 trùng khít fLOOP", norm(0) === norm(LOOP), norm(0) === norm(LOOP) ? "byte-identical" : "LỆCH");
add("sạch trơn ở hai đầu loop", OUTCOME.emptyAtEnds, "vòng mới lại bắt đầu từ chưa có bảng nào");

// ─── 6. Reset sạch + đuôi gọn ─────────────────────────────────────────
let dirty = -1;
for (let f = RESET; f < LOOP; f++) if (STATES[f].blobs.length || STATES[f].phase >= 0) { dirty = f; break; }
add("cửa sổ reset sạch", dirty < 0, dirty < 0 ? `từ f=${RESET} sạch` : `f=${dirty} còn sót`);
add("đuôi loop gọn (≤ 60 frame)", LOOP - RESET <= 60, `${LOOP - RESET} frame`);

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
add("cùng loại tiếng không dồn cục (≥6 frame)", worstSameKind >= 6, `khoảng nhỏ nhất: ${worstSameKind} frame`);

// ─── 8. Hình học / chữ ────────────────────────────────────────────────
const CH = 10.2; // JetBrains Mono 17px
add("dòng SQL dài nhất lọt thẻ", Math.max(...SQL_LINES.map((l) => l.length)) * CH < SQL.w - 44, `${Math.max(...SQL_LINES.map((l) => l.length))} ký tự ≈ ${Math.round(Math.max(...SQL_LINES.map((l) => l.length)) * CH)}px < ${SQL.w - 44}px`);
add("cột đủ rộng cho chữ", ORDERS.cols.every((c) => c.name.length * 9 < c.w - 16), ORDERS.cols.map((c) => `${c.name}:${c.w}`).join(" "));
const cH = tableH(CUSTOMERS.rows.length);
const oH = tableH(ORDERS.rows.length);
const rH = tableH(GROUPS.length);
const sH = SQL_LINES.length * 34 + 36;
add(
  "bốn khối xếp DỌC, không đè nhau",
  CUSTOMERS.y - cH / 2 > 320 && CUSTOMERS.y + cH / 2 < ORDERS.y - oH / 2 && ORDERS.y + oH / 2 < SQL.y - sH / 2 && SQL.y + sH / 2 < RESULT.y - rH / 2,
  `customers ${Math.round(CUSTOMERS.y - cH / 2)}..${Math.round(CUSTOMERS.y + cH / 2)} · orders → sql → result`,
);
add("không lấn caption", RESULT.y + rH / 2 < 1770, `result đáy y=${Math.round(RESULT.y + rH / 2)}`);
add("bảng trong khung ngang", ORDERS.x - ORDERS.w / 2 > 20 && SQL.x + SQL.w / 2 < CW - 20, `orders w=${ORDERS.w} · sql w=${SQL.w}`);
void HEAD_H;
void ROW_H;
void T;

// ─── Kết ──────────────────────────────────────────────────────────────
let bad = 0;
for (const [n, ok, note] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? " OK " : "FAIL"}  ${n.padEnd(46)} ${note}`);
}
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

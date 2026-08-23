import { clamp01, easeInOutCubic, easeOutCubic, lerp, ramp, spring01 } from "../../lib/anim";
import {
  BLOBS,
  BLOB_FROM,
  CUSTOMERS,
  CUTOFF,
  EXEC_ORDER,
  FPS,
  HEAD_H,
  KEPT,
  LOOP,
  ORDERS,
  RESET,
  RESULT,
  ROW_H,
  T,
  type Pt,
} from "./constants";

/**
 * Mô phỏng từng frame. Kết quả truy vấn được TÍNH RA từ chính dữ liệu trong hai
 * bảng (lọc theo WHERE, gom theo GROUP BY, cộng bằng SUM) — không gõ tay dòng
 * kết quả nào. Component chỉ đọc STATES[f]. Không import remotion.
 */

export type BlobS = { i: number; x: number; y: number; scale: number; opacity: number; bad: boolean; reject: number };
export type RowS = { i: number; on: number; dim: number; group: number; flash: number };
export type State = {
  blobs: BlobS[];
  cust: { on: number; rows: RowS[] };
  ord: { on: number; rows: RowS[] };
  link: { on: number; pulse: number };
  sql: { on: number; active: number[] };
  result: { on: number; rows: { on: number; grow: number }[] };
  phase: number;
};

export type EvKind = "emit" | "attach" | "arrive" | "fill" | "fail" | "drop" | "slow" | "travel";
export type Ev = { f: number; kind: EvKind; i?: number };

// ─── Tính KẾT QUẢ từ dữ liệu, không gõ tay ────────────────────────────
const nameOf = (custId: string) => CUSTOMERS.rows.find((r) => r[0] === custId)?.[1] ?? "?";
/** Dòng orders qua được WHERE created_at >= CUTOFF. */
export const keptIdx = ORDERS.rows.map((_, i) => i).filter((i) => `2026-${ORDERS.rows[i][3]}` >= CUTOFF);
/** Gom theo tên khách. */
export const GROUPS: { name: string; sum: number; rows: number[] }[] = [];
for (const i of keptIdx) {
  const n = nameOf(ORDERS.rows[i][1]);
  let g = GROUPS.find((x) => x.name === n);
  if (!g) {
    g = { name: n, sum: 0, rows: [] };
    GROUPS.push(g);
  }
  g.sum += Number(ORDERS.rows[i][2]);
  g.rows.push(i);
}
GROUPS.sort((a, b) => a.name.localeCompare(b.name));
export const groupOf = (i: number) => GROUPS.findIndex((g) => g.rows.includes(i));

// ─── Toạ độ ───────────────────────────────────────────────────────────
export const tableH = (nRows: number) => HEAD_H + nRows * ROW_H;
export const rowY = (tblY: number, nRows: number, i: number) => tblY - tableH(nRows) / 2 + HEAD_H + i * ROW_H + ROW_H / 2;
export const custRowY = (i: number) => rowY(CUSTOMERS.y, CUSTOMERS.rows.length, i);
export const ordRowY = (i: number) => rowY(ORDERS.y, ORDERS.rows.length, i);
export const resRowY = (i: number) => rowY(RESULT.y, GROUPS.length, i);

const events: Ev[] = [];
BLOBS.forEach((b, k) => {
  const land = T.blobFrom[k] + T.blobDur;
  if (b.bad) events.push({ f: land - 6, kind: "fail" });
  else events.push({ f: land, kind: "fill" });
});
events.push({ f: T.ordersIn, kind: "attach" });
events.push({ f: T.linkIn, kind: "emit" });
events.push({ f: T.sqlIn, kind: "attach" });
T.phase.forEach((f) => events.push({ f, kind: "emit" }));
GROUPS.forEach((_, g) => events.push({ f: T.resultIn + g * 16, kind: "arrive" }));
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET).sort((a, b) => a.f - b.f);

const seg = (f: number, t0: number, t1: number) => clamp01((f - t0) / Math.max(1, t1 - t0));
const at = (a: Pt, b: Pt, p: number): Pt => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

const simulate = (): State[] => {
  const out: State[] = [];
  for (let f = 0; f <= LOOP; f++) {
    const resetP = clamp01(seg(f, T.resetFrom, T.resetTo));
    const alive = 1 - resetP;

    // ── Pha đang chạy — theo THỨ TỰ THỰC THI, không theo thứ tự chữ ──
    let phase = -1;
    for (let p = T.phase.length - 1; p >= 0; p--)
      if (f >= T.phase[p]) {
        phase = p;
        break;
      }
    if (f >= T.resetFrom) phase = -1;

    // ── Bản ghi thô rơi vào bảng ──
    const blobs: BlobS[] = [];
    BLOBS.forEach((b, k) => {
      const t0 = T.blobFrom[k];
      const t1 = t0 + T.blobDur;
      const slot = BLOBS.slice(0, k).filter((x) => !x.bad).length;
      if (f < t0 || f > t1 + 18) return;
      if (!b.bad) {
        const p = easeInOutCubic(seg(f, t0, t1));
        const pt = at(BLOB_FROM, { x: CUSTOMERS.x, y: custRowY(slot) }, p);
        blobs.push({ i: k, x: pt.x, y: pt.y, scale: 1 - 0.35 * p, opacity: clamp01(ramp(f, t0, 5) - ramp(f, t1 - 4, 5)) * alive, bad: false, reject: 0 });
      } else {
        // Sai kiểu: tới sát bảng thì bị HẮT RA, không bao giờ vào được
        const hit = t0 + Math.round(T.blobDur * 0.55);
        const topY = CUSTOMERS.y - tableH(CUSTOMERS.rows.length) / 2 - 26;
        if (f < hit) {
          const p = easeInOutCubic(seg(f, t0, hit));
          const pt = at(BLOB_FROM, { x: CUSTOMERS.x, y: topY }, p);
          blobs.push({ i: k, x: pt.x, y: pt.y, scale: 1, opacity: clamp01(ramp(f, t0, 5)) * alive, bad: true, reject: 0 });
        } else {
          const p = easeOutCubic(seg(f, hit, t1 + 18));
          blobs.push({
            i: k,
            x: CUSTOMERS.x + 300 * p,
            y: topY - 60 * p + 120 * p * p,
            scale: 1 - 0.3 * p,
            opacity: (1 - p) * alive,
            bad: true,
            reject: clamp01(1 - seg(f, hit, hit + 14)),
          });
        }
      }
    });

    // ── Bảng customers ──
    const custOn = clamp01(ramp(f, T.blobFrom[0] - 10, 12)) * alive;
    const custRows: RowS[] = CUSTOMERS.rows.map((_, i) => {
      const k = BLOBS.findIndex((b, kk) => !b.bad && BLOBS.slice(0, kk).filter((x) => !x.bad).length === i);
      const land = T.blobFrom[k] + T.blobDur;
      return { i, on: clamp01(ramp(f, land - 2, 8)) * alive, dim: 0, group: -1, flash: clamp01(1 - seg(f, land, land + 14)) };
    });

    // ── Bảng orders ──
    const ordOn = clamp01(spring01((f - T.ordersIn) / FPS, { omega: 12, zeta: 0.6 })) * alive;
    const ordRows: RowS[] = ORDERS.rows.map((_, i) => {
      const kept = keptIdx.includes(i);
      const dim = phase >= 1 && !kept ? clamp01(ramp(f, T.phase[1], 14)) : 0;
      const group = phase >= 2 && kept ? groupOf(i) : -1;
      return { i, on: ordOn, dim, group, flash: 0 };
    });

    // ── Khoá nối hai bảng ──
    const link = {
      on: clamp01(ramp(f, T.linkIn, 16)) * alive,
      pulse: phase === 0 ? clamp01(1 - seg(f, T.phase[0], T.phase[0] + T.phaseDur)) : 0,
    };

    // ── Câu SQL ──
    const sqlOn = clamp01(ramp(f, T.sqlIn, 16)) * alive;
    const active = phase >= 0 ? EXEC_ORDER[phase] : [];

    // ── Bảng kết quả ──
    const resRows = GROUPS.map((_, g) => {
      const t0 = T.resultIn + g * 16;
      return { on: clamp01(ramp(f, t0, 10)) * alive, grow: clamp01(spring01((f - t0) / FPS, { omega: 13, zeta: 0.5 })) };
    });
    const resultOn = clamp01(ramp(f, T.resultIn - 6, 12)) * alive;

    out.push({
      blobs,
      cust: { on: custOn, rows: custRows },
      ord: { on: ordOn, rows: ordRows },
      link,
      sql: { on: sqlOn, active },
      result: { on: resultOn, rows: resRows },
      phase,
    });
  }
  return out;
};

export const STATES = simulate();

// ─── Kết cục cho verify ────────────────────────────────────────────────
export const OUTCOME = {
  keptIdx,
  droppedIdx: ORDERS.rows.map((_, i) => i).filter((i) => !keptIdx.includes(i)),
  groups: GROUPS.map((g) => ({ name: g.name, sum: g.sum, n: g.rows.length })),
  totalKept: keptIdx.reduce((s, i) => s + Number(ORDERS.rows[i][2]), 0),
  sumOfGroups: GROUPS.reduce((s, g) => s + g.sum, 0),
  badRejected: STATES.some((s) => s.blobs.some((b) => b.bad && b.reject > 0.5)),
  badNeverInTable: CUSTOMERS.rows.every((r) => r[0] !== "xyz"),
  custRowsOn: STATES[T.ordersIn].cust.rows.every((r) => r.on > 0.9),
  execOrderIsNotTextOrder: JSON.stringify(EXEC_ORDER.flat()) !== JSON.stringify([0, 1, 2, 3, 4]),
  resultIsTable: RESULT.cols.length >= 2 && GROUPS.length >= 2,
  emptyAtEnds: STATES[0].cust.on < 0.01 && STATES[LOOP].cust.on < 0.01 && STATES[LOOP].result.on < 0.01,
};
void KEPT;

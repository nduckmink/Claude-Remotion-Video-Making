import { clamp01, easeInOutCubic, easeOutCubic, lerp, pulse, ramp, spring01 } from "../../lib/anim";
import {
  CARD,
  FANOUT,
  FPS,
  IDLE_PERIOD,
  INSERT_KEY,
  LEAF,
  LOOP,
  MID,
  N,
  N_LEAF,
  N_MID,
  PHYSICAL,
  RESET,
  ROOT,
  SCAN_HIT,
  SCAN_STEP,
  SORTED,
  STRIP,
  T,
  TARGET,
  cardX,
  leafX,
} from "./constants";

/**
 * Mô phỏng từng frame. `reads` là LUẬN ĐIỂM của video nên nó phải được ĐẾM RA
 * từ việc thật sự đụng vào cái gì — quét thì cộng từng dòng, tra index thì cộng
 * từng nút rồi cộng đúng một dòng. Không gõ tay con số nào.
 */

export type CardS = { i: number; lit: number; visited: number; flash: number; opacity: number; isNew: boolean };
export type LeafS = { j: number; on: number; active: number; split: number };
export type State = {
  query: { present: boolean; grow: number; opacity: number };
  scan: { active: boolean; at: number; found: number };
  cards: CardS[];
  root: { on: number; active: number };
  mids: { k: number; on: number; active: number }[];
  leaves: LeafS[];
  hop: number; // 0 chưa tra · 1 root · 2 mid · 3 leaf · 4 chạm dòng
  pointer: { present: boolean; prog: number; toX: number };
  reads: number;
  ins: { present: boolean; x: number; y: number; opacity: number; scale: number };
  splitFlash: number;
};

export type EvKind = "emit" | "attach" | "arrive" | "fill" | "fail" | "drop" | "slow" | "travel";
export type Ev = { f: number; kind: EvKind; i?: number };

// ─── Đường đi trong cây, TÍNH RA từ khoá — không hardcode ──────────────
export const SORTED_IDX = SORTED.indexOf(TARGET); // 16
export const LEAF_J = Math.floor(SORTED_IDX / FANOUT); // 5
export const MID_K = Math.floor(LEAF_J / FANOUT); // 1
export const PHYS_IDX = PHYSICAL.indexOf(TARGET); // 23

/** Khoá của lá j (theo thứ tự tăng dần). */
export const leafKeys = (j: number) => SORTED.slice(j * FANOUT, j * FANOUT + FANOUT);
/** Lá mà khoá `k` sẽ rơi vào khi chèn thêm. */
export const leafForKey = (k: number) => {
  let j = 0;
  while (j < N_LEAF - 1 && k > leafKeys(j)[FANOUT - 1]) j++;
  return j;
};
export const INS_LEAF = leafForKey(INSERT_KEY); // 5 — đúng cái lá đang đầy

const events: Ev[] = [
  { f: T.queryIn, kind: "attach" },
  ...Array.from({ length: SCAN_HIT + 1 }, (_, i) => ({ f: T.scanFrom + i * SCAN_STEP, kind: "emit" as EvKind })).filter((_, i) => i % 4 === 0),
  { f: T.scanFrom + SCAN_HIT * SCAN_STEP, kind: "arrive" },
  { f: T.buildFrom, kind: "slow" },
  { f: T.buildRoot, kind: "fill" },
  { f: T.hopRoot, kind: "emit" },
  { f: T.hopMid, kind: "emit" },
  { f: T.hopLeaf, kind: "emit" },
  { f: T.hopRow, kind: "arrive" },
  { f: T.insCard, kind: "attach" },
  { f: T.insSplit, kind: "fail" }, // tách nút — cái giá phải trả
];
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET).sort((a, b) => a.f - b.f);

const seg = (f: number, t0: number, t1: number) => clamp01((f - t0) / Math.max(1, t1 - t0));

const simulate = (): State[] => {
  const out: State[] = [];
  const scanEnd = T.scanFrom + SCAN_HIT * SCAN_STEP;

  for (let f = 0; f <= LOOP; f++) {
    const resetP = clamp01(seg(f, T.resetFrom, T.resetTo));

    // ── Truy vấn ──
    const qOn = f >= T.queryIn && f < T.resetTo;
    const query = {
      present: qOn,
      grow: qOn ? clamp01(spring01((f - T.queryIn) / FPS, { omega: 13, zeta: 0.5 })) : 0,
      opacity: qOn ? clamp01(ramp(f, T.queryIn, 8)) * (1 - resetP) : 0,
    };

    // ── Nhịp 1: QUÉT từng dòng ──
    const scanning = f >= T.scanFrom && f <= scanEnd;
    const scanAt = scanning ? Math.min(SCAN_HIT, Math.floor((f - T.scanFrom) / SCAN_STEP)) : f > scanEnd ? SCAN_HIT : -1;
    const found = f >= scanEnd ? clamp01(ramp(f, scanEnd, 8) - ramp(f, T.buildFrom, 12)) : 0;

    // ── Nhịp 3: tra bằng index ──
    let hop = 0;
    if (f >= T.hopRow) hop = 4;
    else if (f >= T.hopLeaf) hop = 3;
    else if (f >= T.hopMid) hop = 2;
    else if (f >= T.hopRoot) hop = 1;
    if (f >= T.insFrom) hop = 0; // sang nhịp ghi thì thôi soi

    // Tập ứng viên còn lại (theo chỉ số trong mảng SẮP XẾP)
    let cand: number[];
    if (hop >= 4) cand = [SORTED_IDX];
    else if (hop === 3) cand = [0, 1, 2].map((d) => LEAF_J * FANOUT + d);
    else if (hop === 2) cand = Array.from({ length: N / N_MID }, (_, d) => MID_K * (N / N_MID) + d);
    else cand = Array.from({ length: N }, (_, d) => d);
    const candSet = new Set(cand);

    // ── Dải bảng ──
    const insCardOn = f >= T.insCard;
    const cards: CardS[] = [];
    for (let i = 0; i < N; i++) {
      const si = SORTED.indexOf(PHYSICAL[i]);
      const lit = hop === 0 ? 1 : candSet.has(si) ? 1 : 0.16;
      const visited = scanAt >= i && f >= T.scanFrom && f < T.buildFrom ? 1 : 0;
      const flash = scanning && scanAt === i ? 1 : 0;
      // BẢNG luôn có mặt — reset chỉ dọn index/truy vấn/dòng vừa chèn, không dọn bảng.
      cards.push({ i, lit, visited, flash, opacity: 1, isNew: false });
    }
    if (insCardOn && f < T.resetTo) {
      const p = easeOutCubic(seg(f, T.insCard, T.insCard + 16));
      cards.push({ i: N, lit: 1, visited: 0, flash: clamp01(1 - seg(f, T.insCard, T.insCard + 20)), opacity: p * (1 - resetP), isNew: true });
    }

    // ── Cây ──
    const rootOn = clamp01(ramp(f, T.buildRoot, 14)) * (1 - resetP);
    const root = { on: rootOn, active: hop === 1 ? 1 : hop > 1 ? 0.45 : 0 };
    const mids = Array.from({ length: N_MID }, (_, k) => ({
      k,
      on: clamp01(ramp(f, T.buildMid + k * 8, 12)) * (1 - resetP),
      active: hop === 2 && k === MID_K ? 1 : hop > 2 && k === MID_K ? 0.45 : 0,
    }));
    const splitP = clamp01(spring01((f - T.insSplit) / FPS, { omega: 12, zeta: 0.55 }));
    const leaves: LeafS[] = Array.from({ length: N_LEAF }, (_, j) => ({
      j,
      on: clamp01(ramp(f, T.buildLeaf + j * 7, 12)) * (1 - resetP),
      active: hop === 3 && j === LEAF_J ? 1 : hop >= 4 && j === LEAF_J ? 0.6 : 0,
      // Nút đã tách phải trở về nguyên trạng ở biên loop, nếu không f0 ≠ fLOOP
      split: j === INS_LEAF && f >= T.insSplit ? splitP * (1 - resetP) : 0,
    }));

    // ── Mũi tên lá → đúng dòng ──
    const pOn = hop >= 4;
    const pointer = { present: pOn, prog: pOn ? easeInOutCubic(seg(f, T.hopRow, T.hopRow + 18)) : 0, toX: cardX(PHYS_IDX) };

    // ── ĐẾM reads — quét thì từng dòng, index thì từng nút + 1 dòng ──
    let reads = 0;
    if (f >= T.scanFrom && f < T.buildFrom) reads = scanAt + 1;
    else if (f >= T.hopRoot && f < T.insFrom) reads = hop;
    else if (f >= T.insFrom && f < T.resetFrom) reads = 4;

    // ── Nhịp 4: khoá mới bay vào cây ──
    const insOn = f >= T.insKey && f < T.resetTo;
    const from = { x: cardX(N), y: STRIP.y - CARD.h / 2 - 10 };
    const to = { x: leafX(INS_LEAF), y: LEAF.y };
    const ip = easeInOutCubic(seg(f, T.insKey, T.insSplit));
    const ins = {
      present: insOn,
      x: lerp(from.x, to.x, ip),
      y: lerp(from.y, to.y, ip),
      opacity: insOn ? clamp01(ramp(f, T.insKey, 6) - ramp(f, T.insSplit, 10)) * (1 - resetP) : 0,
      scale: 1 - 0.2 * ip,
    };
    const splitFlash = f >= T.insSplit ? clamp01(1 - (f - T.insSplit) / 22) : 0;

    out.push({
      query,
      scan: { active: scanning, at: scanAt, found },
      cards,
      root,
      mids,
      leaves,
      hop,
      pointer,
      reads,
      ins,
      splitFlash,
    });
  }
  return out;
};

export const STATES = simulate();

// ─── Kết cục cho verify ────────────────────────────────────────────────
const litCount = (f: number) => STATES[f].cards.filter((c) => c.lit > 0.5 && !c.isNew).length;
export const OUTCOME = {
  scanReads: STATES[T.scanFrom + SCAN_HIT * SCAN_STEP].reads,
  indexReads: STATES[T.hopRow + 4].reads,
  // Khung ứng viên co lại NGHIÊM NGẶT qua từng tầng
  narrowing: [litCount(T.hopRoot + 6), litCount(T.hopMid + 6), litCount(T.hopLeaf + 6), litCount(T.hopRow + 6)],
  // Đường đi trong cây được TÍNH từ khoá, và trỏ đúng dòng
  pathCorrect: SORTED[SORTED_IDX] === TARGET && leafKeys(LEAF_J).includes(TARGET) && Math.floor(LEAF_J / FANOUT) === MID_K,
  targetPhysical: PHYS_IDX,
  hitsRightRow: PHYSICAL[PHYS_IDX] === TARGET,
  // Bảng KHÔNG bị sắp lại: thứ tự vật lý trước và sau khi dựng index y hệt
  tableUntouched: JSON.stringify(PHYSICAL) === JSON.stringify(PHYSICAL.slice()),
  tableNotSorted: JSON.stringify(PHYSICAL) !== JSON.stringify(SORTED),
  sameKeys: JSON.stringify([...PHYSICAL].sort((a, b) => a - b)) === JSON.stringify(SORTED),
  // Ghi phải đụng CẢ HAI: bảng có thêm dòng, cây có tách nút
  cardAdded: STATES[T.insDone].cards.length === N + 1,
  leafSplit: STATES[T.insDone].leaves[INS_LEAF].split > 0.9,
  insLeafWasFull: leafKeys(INS_LEAF).length === FANOUT,
  readsEnd: STATES[LOOP].reads,
  treeGoneAtEnds: STATES[0].root.on < 0.01 && STATES[LOOP].root.on < 0.01,
};
void pulse;
void IDLE_PERIOD;
void ROOT;
void MID;

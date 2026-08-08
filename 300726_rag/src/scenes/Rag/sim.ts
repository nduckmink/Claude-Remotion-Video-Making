import { clamp01, easeInOutCubic, easeOutCubic, lerp, pulse, ramp, spring01 } from "../../lib/anim";
import {
  ANSWER,
  CH,
  CHUNKS,
  DOC,
  EMB,
  FPS,
  IDLE_PERIOD,
  LLM,
  LOOP,
  MAP,
  QUERY_AT,
  RESET,
  RING_PAD,
  SLICE,
  T,
  TOP_K,
  mapPt,
  type Pt,
} from "./constants";

/**
 * Mô phỏng từng frame. Chỗ đứng của mỗi chunk trên bản đồ là NGHĨA của nó, nên
 * "3 đoạn liên quan nhất" phải được TÍNH RA từ khoảng cách — không gõ tay chỉ
 * số nào. Component chỉ đọc STATES[f]. Không import remotion.
 */

export type ChunkS = {
  i: number;
  x: number;
  y: number;
  asDot: number;
  scale: number;
  opacity: number;
  selected: number;
  present: boolean;
  /** Bản GỐC vẫn nằm trong DB khi đoạn được lấy ra — retrieval chỉ ĐỌC, không xoá. */
  gx: number;
  gy: number;
  ghost: number;
};
export type State = {
  doc: { opacity: number; gone: boolean[] };
  chunks: ChunkS[];
  query: { present: boolean; x: number; y: number; asDot: number; scale: number; opacity: number };
  emb: { active: number };
  search: { present: boolean; r: number; x: number; y: number };
  llm: { present: number; work: number; fed: number };
  answer: { present: boolean; grow: number; opacity: number };
  mapOn: number;
};

export type EvKind = "emit" | "attach" | "arrive" | "fill" | "fail" | "drop" | "slow" | "travel";
export type Ev = { f: number; kind: EvKind; i?: number };

// ─── Hình học của NGHĨA: khoảng cách quyết định ai được chọn ───────────
const QP = mapPt(QUERY_AT);
const CP: Pt[] = CHUNKS.map((c) => mapPt(c.at));
const DIST = CP.map((p) => Math.hypot(p.x - QP.x, p.y - QP.y));
const ORDER = DIST.map((d, i) => ({ d, i })).sort((a, b) => a.d - b.d);
/** Vòng tìm dừng NGAY SAU chấm thứ K — đó chính là "top-k", không hardcode. */
export const SEARCH_R = ORDER[TOP_K - 1].d + RING_PAD;
export const TOPK = ORDER.slice(0, TOP_K).map((o) => o.i);

// Vị trí trên đường ống
/** Chunk xuất phát ĐÚNG từ dòng của nó trong tài liệu (khớp layout DocPage). */
const docSlot = (k: number): Pt => ({ x: DOC.x, y: DOC.y - DOC.h / 2 + 56 + k * 21 });
const STAGE: Pt = { x: DOC.x, y: DOC.y + DOC.h / 2 + 24 };
const EMB_IN: Pt = { x: EMB.x, y: EMB.y - 12 };
const EMB_OUT: Pt = { x: EMB.x, y: EMB.y + 34 };
const LLM_P: Pt = { x: LLM.x, y: LLM.y };

const seg = (f: number, t0: number, t1: number) => clamp01((f - t0) / Math.max(1, t1 - t0));
const at = (a: Pt, b: Pt, p: number): Pt => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

const events: Ev[] = [];
SLICE.forEach((f) => events.push({ f, kind: "emit" }));
SLICE.forEach((f) => events.push({ f: f + CH.out + CH.toEmb + CH.thru + CH.toMap, kind: "fill" }));
events.push({ f: T.qShow, kind: "attach" });
events.push({ f: T.qLanded, kind: "fill" });
events.push({ f: T.searchFrom, kind: "slow" });
// Mỗi lần vòng tìm CHẠM một chấm — thứ tự tự nhiên là gần trước, xa sau
ORDER.slice(0, TOP_K).forEach((o) => {
  const p = clamp01(o.d / SEARCH_R);
  events.push({ f: Math.round(T.searchFrom + p * (T.searchTo - T.searchFrom)), kind: "arrive" });
});
TOPK.forEach((_, r) => events.push({ f: T.pullFrom + r * 14, kind: "emit" }));
events.push({ f: T.llmWork, kind: "slow" });
events.push({ f: T.answerIn, kind: "fill" });
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET).sort((a, b) => a.f - b.f);

const simulate = (): State[] => {
  const out: State[] = [];
  for (let f = 0; f <= LOOP; f++) {
    const resetP = clamp01(seg(f, T.resetFrom, T.resetTo));

    // ── Tài liệu: đầy đủ ở hai đầu loop, mất dần từng dòng khi bị xắt ──
    const docFade = clamp01(1 - ramp(f, T.qShow - 22, 22) + resetP);
    const gone = SLICE.map((s) => f >= s && f < T.resetFrom);

    // ── Chunk ──
    const chunks: ChunkS[] = [];
    let embActive = 0;
    let fed = 0;
    for (let k = 0; k < CHUNKS.length; k++) {
      const t0 = SLICE[k];
      const tA = t0 + CH.out;
      const tB = tA + CH.toEmb;
      const tC = tB + CH.thru;
      const tD = tC + CH.toMap;
      if (f < t0) {
        chunks.push({ i: k, x: 0, y: 0, asDot: 0, scale: 1, opacity: 0, selected: 0, present: false, gx: CP[k].x, gy: CP[k].y, ghost: 0 });
        continue;
      }

      let p: Pt;
      let asDot = 0;
      let scale = 1;
      if (f < tA) {
        p = at(docSlot(k), STAGE, easeOutCubic(seg(f, t0, tA)));
      } else if (f < tB) {
        p = at(STAGE, EMB_IN, easeInOutCubic(seg(f, tA, tB)));
      } else if (f < tC) {
        const u = seg(f, tB, tC);
        p = at(EMB_IN, EMB_OUT, u);
        asDot = easeInOutCubic(u); // thẻ chữ CO LẠI thành vector
        scale = 1 - 0.15 * u;
        embActive = Math.max(embActive, 1);
      } else if (f < tD) {
        p = at(EMB_OUT, CP[k], easeInOutCubic(seg(f, tC, tD)));
        asDot = 1;
      } else {
        p = CP[k];
        asDot = 1;
      }

      // Được chọn khi vòng tìm CHẠM tới
      const rNow = f >= T.searchFrom ? SEARCH_R * clamp01(seg(f, T.searchFrom, T.searchTo)) : 0;
      const selected = f >= tD && rNow >= DIST[k] ? clamp01((rNow - DIST[k]) / 14) : 0;

      // Được kéo ra khỏi bản đồ, bay xuống LLM (gần nhất đi trước)
      const rank = TOPK.indexOf(k);
      let opacity = 1;
      let ghost = 0;
      if (rank >= 0 && f >= T.pullFrom + rank * 14) {
        ghost = 1; // bản gốc Ở LẠI bản đồ — cái bay xuống LLM là BẢN SAO
        const pt0 = T.pullFrom + rank * 14;
        const pt1 = pt0 + 34;
        const u = clamp01(seg(f, pt0, pt1));
        p = at(CP[k], LLM_P, easeInOutCubic(u));
        asDot = 1 - easeInOutCubic(clamp01(u * 1.6)); // vector BUNG LẠI thành đoạn chữ
        scale = 1 - 0.55 * u;
        opacity = 1 - clamp01((u - 0.72) / 0.28);
        if (f >= pt1) fed++;
      }

      chunks.push({ i: k, x: p.x, y: p.y, asDot, scale, opacity: opacity * (1 - resetP), selected, present: true, gx: CP[k].x, gy: CP[k].y, ghost: ghost * (1 - resetP) });
    }

    // ── Câu hỏi: đi qua CHÍNH cái embedder đó ──
    let query = { present: false, x: 0, y: 0, asDot: 0, scale: 1, opacity: 0 };
    if (f >= T.qShow && f < T.resetTo) {
      let p: Pt;
      let asDot = 0;
      if (f < T.qToEmb) p = { x: DOC.x, y: DOC.y };
      else if (f < T.qThru) p = at({ x: DOC.x, y: DOC.y }, EMB_IN, easeInOutCubic(seg(f, T.qToEmb, T.qThru)));
      else if (f < T.qToMap) {
        const u = seg(f, T.qThru, T.qToMap);
        p = at(EMB_IN, EMB_OUT, u);
        asDot = easeInOutCubic(u);
        embActive = Math.max(embActive, 1);
      } else if (f < T.qLanded) {
        p = at(EMB_OUT, QP, easeInOutCubic(seg(f, T.qToMap, T.qLanded)));
        asDot = 1;
      } else {
        p = QP;
        asDot = 1;
      }
      query = { present: true, x: p.x, y: p.y, asDot, scale: 1, opacity: clamp01(ramp(f, T.qShow, 10)) * (1 - resetP) };
    }

    // ── Vòng tìm ──
    const sOn = f >= T.searchFrom && f < T.pullTo;
    const search = {
      present: sOn,
      r: sOn ? SEARCH_R * clamp01(seg(f, T.searchFrom, T.searchTo)) : 0,
      x: QP.x,
      y: QP.y,
    };

    // ── LLM + câu trả lời ──
    const llmPresent = clamp01(spring01((f - (T.pullFrom - 26)) / FPS, { omega: 12, zeta: 0.55 })) * (1 - resetP);
    const llm = {
      present: clamp01(llmPresent),
      work: f >= T.llmWork && f < T.llmDone ? 0.55 + 0.45 * pulse(f, 12) : 0,
      fed: fed / TOP_K,
    };
    const aOn = f >= T.answerIn && f < T.resetTo;
    const answer = {
      present: aOn,
      grow: aOn ? clamp01(spring01((f - T.answerIn) / FPS, { omega: 13, zeta: 0.5 })) : 0,
      opacity: aOn ? clamp01(ramp(f, T.answerIn, 10)) * (1 - resetP) : 0,
    };

    const mapOn = clamp01(ramp(f, 24, 20) - resetP) * (0.9 + 0.1 * pulse(f, IDLE_PERIOD));

    out.push({
      doc: { opacity: clamp01(docFade), gone },
      chunks,
      query,
      emb: { active: embActive },
      search,
      llm,
      answer,
      mapOn: clamp01(mapOn),
    });
  }
  return out;
};

export const STATES = simulate();

// ─── Kết cục cho verify ────────────────────────────────────────────────
export const OUTCOME = {
  topK: TOPK.slice().sort((a, b) => a - b),
  searchR: SEARCH_R,
  dK: ORDER[TOP_K - 1].d, // chấm thứ K
  dNext: ORDER[TOP_K].d, // chấm thứ K+1 — phải NGOÀI vòng
  // Cụm: khoảng cách trong cụm << khoảng cách sang cụm kia
  intra: Math.max(...[0, 1, 2].flatMap((a) => [0, 1, 2].filter((b) => b > a).map((b) => Math.hypot(CP[a].x - CP[b].x, CP[a].y - CP[b].y)))),
  inter: Math.min(...[0, 1, 2].flatMap((a) => [3, 4, 5].map((b) => Math.hypot(CP[a].x - CP[b].x, CP[a].y - CP[b].y)))),
  allIndexedBeforeQuery: SLICE[SLICE.length - 1] + CH.out + CH.toEmb + CH.thru + CH.toMap <= T.qShow,
  fedBeforeAnswer: STATES[T.answerIn].llm.fed >= 0.99,
  answerAfterPull: T.answerIn > T.pullTo - 1,
  docWholeAtEnds: STATES[0].doc.gone.every((g) => !g) && STATES[LOOP].doc.gone.every((g) => !g),
  mapEmptyAtEnds: STATES[0].chunks.every((c) => !c.present) && STATES[LOOP].chunks.every((c) => c.opacity < 0.01),
};
void ANSWER;
void MAP;

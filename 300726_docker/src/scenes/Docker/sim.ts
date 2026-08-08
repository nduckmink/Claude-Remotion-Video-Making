import { arc, clamp01, easeInOutCubic, easeOutCubic, lerp, pulse, ramp, spring01 } from "../../lib/anim";
import {
  BOX_A,
  BOX_B,
  CODE_BEND,
  CODE_FROM,
  CODE_TO,
  ERRORS,

  FPS,
  IDLE_PERIOD,
  ITEMS,
  ITEM_FROM,
  LOOP,
  RESET,
  T,
  type Pt,
} from "./constants";

/**
 * Mô phỏng từng frame. Câu chuyện có thứ tự nhân quả BẮT BUỘC: gửi code trần →
 * nổ lỗi → mới đóng hộp; hộp phải ĐỦ 4 thứ rồi mới niêm phong; niêm phong rồi
 * mới gửi; tới nơi rồi mới chạy được. verify canh đúng chuỗi đó.
 */

export type ItemS = { i: number; x: number; y: number; scale: number; opacity: number; landed: boolean };
export type State = {
  a: { live: number };
  b: { live: number; envDim: number; press: number };
  bubbleA: { present: boolean; grow: number; opacity: number };
  bubbleB: { present: boolean; grow: number; opacity: number };
  code: { present: boolean; x: number; y: number; rot: number; opacity: number; rejected: number };
  errors: { present: boolean; opacity: number; shake: number }[];
  box: { present: boolean; x: number; y: number; open: number; fill: number; sealed: number; running: number; scale: number; opacity: number };
  items: ItemS[];
};

export type EvKind = "emit" | "attach" | "arrive" | "fill" | "fail" | "drop" | "slow" | "travel";
export type Ev = { f: number; kind: EvKind; i?: number };

const events: Ev[] = [
  { f: T.bubbleA, kind: "attach" },
  { f: T.codeOut, kind: "emit" },
  ...T.err.map((f) => ({ f, kind: "fail" as EvKind })),
  { f: T.boxOpen, kind: "attach" },
  ...T.itemFly.map((f) => ({ f: f + T.itemDur, kind: "fill" as EvKind })),
  { f: T.seal, kind: "attach" },
  { f: T.shipOut, kind: "emit" },
  { f: T.run, kind: "arrive" },
  { f: T.running, kind: "fill" },
  { f: T.bubbleB, kind: "arrive" },
];
export const EVENTS: Ev[] = events.filter((e) => e.f >= 0 && e.f < RESET).sort((a, b) => a.f - b.f);

const seg = (f: number, t0: number, t1: number) => clamp01((f - t0) / Math.max(1, t1 - t0));
const at = (a: Pt, b: Pt, p: number): Pt => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });

/** Chỗ đậu của từng thứ BÊN TRONG hộp — xếp hai hàng cho gọn. */
export const slotIn = (box: Pt, i: number): Pt => ({ x: box.x + (i % 2 === 0 ? -62 : 62), y: box.y + 8 + Math.floor(i / 2) * 52 });

const simulate = (): State[] => {
  const out: State[] = [];
  for (let f = 0; f <= LOOP; f++) {
    const resetP = clamp01(seg(f, T.resetFrom, T.resetTo));

    // ── Bong bóng thoại ──
    const bAOn = f >= T.bubbleA && f < T.bubbleAOut + 14;
    const bubbleA = {
      present: bAOn,
      grow: bAOn ? clamp01(spring01((f - T.bubbleA) / FPS, { omega: 13, zeta: 0.5 })) : 0,
      opacity: bAOn ? clamp01(ramp(f, T.bubbleA, 8) - ramp(f, T.bubbleAOut, 14)) : 0,
    };
    const bBOn = f >= T.bubbleB && f < T.bubbleBOut + 16;
    const bubbleB = {
      present: bBOn,
      grow: bBOn ? clamp01(spring01((f - T.bubbleB) / FPS, { omega: 13, zeta: 0.5 })) : 0,
      opacity: bBOn ? clamp01(ramp(f, T.bubbleB, 8) - ramp(f, T.bubbleBOut, 16)) : 0,
    };

    // ── Code trần bay sang B rồi bị hắt lại ──
    const cOn = f >= T.codeOut && f < T.errOut;
    let code = { present: false, x: 0, y: 0, rot: 0, opacity: 0, rejected: 0 };
    if (cOn) {
      const p = easeInOutCubic(seg(f, T.codeOut, T.codeAt));
      const pt = arc(CODE_FROM, CODE_TO, p, CODE_BEND);
      const rejected = clamp01(ramp(f, T.err[0], 10));
      // Bị từ chối thì rung tại chỗ rồi mờ đi
      const shake = rejected > 0.05 ? Math.sin(f * 1.5) * 5 * rejected : 0;
      code = {
        present: true,
        x: pt.x + shake,
        y: pt.y,
        rot: (1 - p) * 8 - 4,
        opacity: clamp01(ramp(f, T.codeOut, 6) - ramp(f, T.errOut - 26, 26)),
        rejected,
      };
    }

    // ── Ba lỗi nổ ra ở máy B ──
    const errors = ERRORS.map((_, k) => {
      const t0 = T.err[k];
      const on = f >= t0 && f < T.errOut + 16;
      return {
        present: on,
        opacity: on ? clamp01(ramp(f, t0, 8) - ramp(f, T.errOut, 16)) : 0,
        shake: on ? clamp01(1 - (f - t0) / 12) : 0,
      };
    });

    // ── Cái hộp ──
    const boxOn = f >= T.boxOpen && f < T.resetTo;
    const shipP = easeInOutCubic(seg(f, T.shipOut, T.shipAt));
    const bp = f < T.shipOut ? BOX_A : at(BOX_A, BOX_B, shipP);
    const landed = T.itemFly.filter((t) => f >= t + T.itemDur).length;
    const box = {
      present: boxOn,
      x: bp.x,
      y: bp.y - (f >= T.shipOut && f < T.shipAt ? 70 * Math.sin(shipP * Math.PI) : 0), // nhấc lên khi bay
      open: clamp01(ramp(f, T.boxOpen, 14) - ramp(f, T.seal, 12)), // nắp mở rồi đóng
      fill: landed / ITEMS.length,
      sealed: clamp01(ramp(f, T.seal, 16)),
      running: clamp01(ramp(f, T.running, 14)),
      scale: boxOn ? 0.7 + 0.3 * clamp01(spring01((f - T.boxOpen) / FPS, { omega: 12, zeta: 0.55 })) : 0,
      opacity: boxOn ? clamp01(ramp(f, T.boxOpen, 10)) * (1 - resetP) : 0,
    };

    // ── Bốn thứ bay từ máy A vào hộp ──
    const items: ItemS[] = ITEMS.map((_, i) => {
      const t0 = T.itemFly[i];
      const t1 = t0 + T.itemDur;
      if (f < t0) return { i, x: ITEM_FROM.x, y: ITEM_FROM.y, scale: 0.6, opacity: 0, landed: false };
      const home = slotIn({ x: box.x, y: box.y }, i);
      if (f < t1) {
        const p = easeOutCubic(seg(f, t0, t1));
        const pt = arc(ITEM_FROM, home, p, -120);
        return { i, x: pt.x, y: pt.y, scale: 0.72 + 0.28 * (1 - p), opacity: clamp01(ramp(f, t0, 6)), landed: false };
      }
      // Đã nằm trong hộp — theo hộp đi luôn (kể cả lúc bay sang B)
      return { i, x: home.x, y: home.y, scale: 0.72, opacity: 1 - resetP, landed: true };
    });

    // ── Người ──
    const aLive = clamp01(0.3 + 0.7 * Math.max(bubbleA.opacity, f >= T.boxOpen && f < T.seal ? 1 : 0) * (0.8 + 0.2 * pulse(f, IDLE_PERIOD)));
    const bPress = clamp01(1 - Math.abs(f - T.run) / 10);
    const bLive = clamp01(0.3 + 0.7 * Math.max(bubbleB.opacity, bPress, errors.some((e) => e.opacity > 0.4) ? 1 : 0));
    // Môi trường của B hết quan trọng khi cái hộp tự mang môi trường của nó tới
    const envDim = clamp01(ramp(f, T.shipAt, 20) - resetP);

    out.push({
      a: { live: aLive },
      b: { live: bLive, envDim, press: bPress },
      bubbleA,
      bubbleB,
      code,
      errors,
      box,
      items,
    });
  }
  return out;
};

export const STATES = simulate();

// ─── Kết cục cho verify ────────────────────────────────────────────────
export const OUTCOME = {
  // Nhân quả: gửi code trần TRƯỚC, nổ lỗi TRƯỚC, rồi mới đóng hộp
  codeBeforeErrors: T.codeAt <= T.err[0],
  errorsBeforeBox: T.err[ERRORS.length - 1] < T.boxOpen,
  // Hộp phải ĐỦ 4 thứ rồi mới niêm phong
  allItemsBeforeSeal: Math.max(...T.itemFly) + T.itemDur <= T.seal,
  itemCount: ITEMS.length,
  // Niêm phong rồi mới gửi; tới nơi rồi mới chạy
  sealBeforeShip: T.seal < T.shipOut,
  arriveBeforeRun: T.shipAt <= T.run,
  sealedAtShip: STATES[T.shipOut].box.sealed > 0.9,
  fullAtSeal: STATES[T.seal].box.fill === 1,
  // Code trần KHÔNG bao giờ chạy được ở B
  codeNeverRan: STATES.every((s) => !(s.code.present && s.code.rejected < 0.5 && s.code.x > 700 && s.box.running > 0.5)),
  // Hộp chạy được ở B mà B không phải cài gì (env của B bị mờ đi)
  runsAtB: STATES[T.running + 20].box.running > 0.9 && Math.abs(STATES[T.running + 20].box.x - BOX_B.x) < 2,
  envDimmed: STATES[T.bubbleB].b.envDim > 0.9,
  boxAbsentAtEnds: STATES[0].box.opacity < 0.01 && STATES[LOOP].box.opacity < 0.01,
};

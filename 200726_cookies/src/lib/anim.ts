// Chuyển động — THUẦN NODE, không import remotion.
//
// Vì sao tách riêng: sim.ts và verify.ts chạy bằng Node (esbuild → node), mà
// remotion.Easing kéo theo cả runtime của remotion → chết trong Node. Đặt hết
// toán chuyển động ở đây, KHÔNG import gì từ "remotion", thì cả sim, verify lẫn
// component đều xài chung một nguồn — không bao giờ lệch nhau.
//
// Triết lý (Resource/motion_language.md, bản làm giàu riêng cho JWT): vật có
// KHỐI LƯỢNG. Nó không nhảy tức thời từ A tới B — nó tăng tốc, vọt hơi quá đà,
// dội lại, rồi lắng. Đứng yên cũng không chết cứng: nó THỞ. Đó là "sức nặng".

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

/** Ramp thẳng 0→1 trong [from, from+dur), giữ 1 sau đó. */
export const ramp = (frame: number, from: number, dur: number) =>
  clamp01((frame - from) / dur);

// ─── Easing thuần (không remotion) ────────────────────────────────────
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
/** Vọt quá đích rồi lùi về — dùng cho "đáp xuống có đà". */
export const easeOutBack = (t: number, s = 1.70158) =>
  1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
/** Nhún ngược trước khi đi — ANTICIPATION (lấy đà). */
export const easeInBack = (t: number, s = 1.70158) =>
  (s + 1) * t * t * t - s * t * t;

/**
 * Lò xo giảm chấn, đáp step 0→1. t tính bằng GIÂY.
 *   omega — tần số góc (rad/s): cao = phản ứng nhanh, gắt.
 *   zeta  — hệ số tắt dần: <1 underdamped (CÓ vọt quá đà = sức nặng),
 *           =1 tới hạn (không vọt), >1 ì.
 * Dạng đóng (closed-form) nên gọi ở frame nào cũng ra ngay — deterministic,
 * verify chạy được, không cần tích phân từng bước.
 */
export const spring01 = (
  t: number,
  { omega = 11, zeta = 0.42 }: { omega?: number; zeta?: number } = {},
) => {
  if (t <= 0) return 0;
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * omega * t) *
        (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t))
    );
  }
  // tới hạn / quá tắt
  return 1 - Math.exp(-omega * t) * (1 + omega * t);
};

/** Lò xo từ `from` tới `to` theo thời gian frame (đổi ra giây bằng fps). */
export const springTo = (
  from: number,
  to: number,
  frame: number,
  start: number,
  fps: number,
  cfg?: { omega?: number; zeta?: number },
) => from + (to - from) * spring01((frame - start) / fps, cfg);

// ─── Chuyển động THEO CUNG (không đi thẳng) ───────────────────────────
export type Pt = { x: number; y: number };
/**
 * Điểm trên cung bezier bậc 2 từ a→b, phình sang bên `bend` px (vuông góc dây
 * cung). Vật bay theo đường vòng có trọng lực, không phải nét kẻ ngang đơ.
 */
export const arc = (a: Pt, b: Pt, u: number, bend: number): Pt => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // pháp tuyến đơn vị
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bend;
  const cy = my + ny * bend;
  const v = 1 - u;
  return {
    x: v * v * a.x + 2 * v * u * cx + u * u * b.x,
    y: v * v * a.y + 2 * v * u * cy + u * u * b.y,
  };
};

// ─── Nhịp SỐNG lúc rỗi (seamless nếu period chia hết LOOP) ─────────────
/** Sine 0→1→0. period phải chia hết LOOP để f0 == f_LOOP. */
export const pulse = (frame: number, period: number) =>
  0.5 + 0.5 * Math.sin((2 * Math.PI * frame) / period - Math.PI / 2);
/** Dao động quanh 0, biên độ amp — cho breathe/drift. period chia hết LOOP. */
export const breathe = (frame: number, period: number, amp = 1, phase = 0) =>
  amp * Math.sin((2 * Math.PI * frame) / period + phase);
/** Pha tuyến tính 0→1 lặp, k chu kỳ / loop — cho xoay đều liền mạch. */
export const loopPhase = (frame: number, loop: number, k = 1) =>
  ((frame * k) % loop) / loop;

// ─── Chữ ký = MÃ VẠCH sinh từ nội dung ────────────────────────────────
// Chữ ký JWT là HMAC(header.payload, secret): nội dung đổi một ký tự thì hash
// đổi hoàn toàn. Vẽ nó thành một dãy vạch cao thấp băm ra từ chuỗi — hai payload
// khác nhau cho hai dãy vạch khác hẳn. Server "ký lại" = băm payload HIỆN TẠI;
// khớp dãy vạch gốc trên token thì hợp lệ, lệch thì bị sửa. Deterministic.
const hashStr = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
/** n vạch, cao 0.35..1.0, băm xác định từ seed. */
export const barcode = (seed: string, n: number) => {
  let x = hashStr(seed) || 1;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    out.push(0.35 + 0.65 * (((x >>> 8) & 0xffff) / 0xffff));
  }
  return out;
};
/** Hai chữ ký có khớp không — so nội dung đã băm. */
export const sigMatch = (a: string, b: string) => hashStr(a) === hashStr(b);

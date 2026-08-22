/**
 * Toán chuyển động THUẦN — module này KHÔNG BAO GIỜ import remotion.
 * sim.ts + verify.ts chạy bằng Node; kéo `Easing` của remotion vào là chết.
 * Một nguồn cho cả sim, verify lẫn component → không bao giờ lệch nhau.
 */

export type Pt = { x: number; y: number };

export const clamp = (v: number, lo = 0, hi = 1) =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const invLerp = (a: number, b: number, v: number) =>
  a === b ? 0 : clamp((v - a) / (b - a));

export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Lò xo giảm chấn, đáp step 0→1. t tính bằng GIÂY.
 * zeta<1 = underdamped, CÓ vọt quá đà = sức nặng. Dạng đóng → gọi frame nào cũng ra.
 */
export const spring01 = (t: number, { omega = 11, zeta = 0.42 } = {}) => {
  if (t <= 0) return 0;
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * omega * t) *
        (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t))
    );
  }
  return 1 - Math.exp(-omega * t) * (1 + omega * t);
};

export const easeOutBack = (t: number, s = 1.70158) =>
  1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;

export const easeInBack = (t: number, s = 1.70158) =>
  (s + 1) * t ** 3 - s * t ** 2;

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

/** Điểm trên cung bezier bậc 2 a→b, phình `bend` px vuông góc dây cung. */
export const arc = (a: Pt, b: Pt, u: number, bend: number): Pt => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  const v = 1 - u;
  return {
    x: v * v * a.x + 2 * v * u * cx + u * u * b.x,
    y: v * v * a.y + 2 * v * u * cy + u * u * b.y,
  };
};

/** Nhịp SỐNG idle — period PHẢI chia hết LOOP để f0 == fLOOP. */
export const breathe = (frame: number, period: number, amp = 1, phase = 0) =>
  amp * Math.sin((2 * Math.PI * frame) / period + phase);

/** Xung tắt dần từ một sự kiện tại `at` — dùng cho "độ sáng bám theo việc". */
export const decayPulse = (frame: number, at: number, tau = 8) =>
  frame < at ? 0 : Math.exp(-(frame - at) / tau);

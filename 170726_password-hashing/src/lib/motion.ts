// Helper chuyển động dùng chung — nguồn: Resource/motion_language.md
import { Easing } from "remotion";

export const ease = Easing.inOut(Easing.cubic);

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Pha tuần hoàn 0→1, k chu kỳ trong một loop — luôn seamless. */
export const loopPhase = (frame: number, loop: number, k = 1) =>
  ((frame * k) % loop) / loop;

/** Nhịp thở sine 0→1→0, k chu kỳ / loop. */
export const pulse = (frame: number, loop: number, k = 1) =>
  0.5 + 0.5 * Math.sin(2 * Math.PI * (frame / loop) * k - Math.PI / 2);

/** Ramp 0→1 trong [from, from+dur), giữ 1 sau đó. */
export const ramp = (frame: number, from: number, dur: number) =>
  clamp01((frame - from) / dur);

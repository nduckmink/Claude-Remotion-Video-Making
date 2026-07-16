// Helper chuyển động dùng chung — xem Resource/motion_language.md
import { Easing } from "remotion";

export const ease = Easing.inOut(Easing.cubic);

/** Pha tuần hoàn 0→1, k chu kỳ trong một loop — luôn seamless. */
export const loopPhase = (frame: number, loop: number, k = 1) =>
  ((frame * k) % loop) / loop;

/** Nhịp thở sine 0→1→0, k chu kỳ / loop. */
export const pulse = (frame: number, loop: number, k = 1) =>
  0.5 + 0.5 * Math.sin(2 * Math.PI * (frame / loop) * k - Math.PI / 2);

/**
 * Nhịp thở theo thời gian tuyệt đối (giây), không neo vào loop.
 * Chỉ seamless khi loop chia hết cho chu kỳ — dùng cho breathe của phần tử idle.
 */
export const breathe = (frame: number, periodInFrames: number) =>
  0.5 + 0.5 * Math.sin((2 * Math.PI * frame) / periodInFrames - Math.PI / 2);

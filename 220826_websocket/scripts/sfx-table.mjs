/**
 * Thư viện tiếng — copy từ Resource/sfx.md, xoá bớt tiếng scene này không dùng.
 * Mỗi tiếng đúng MỘT dòng dữ liệu. Đây là "assets", không phải code để hack.
 * Tên = ĐỘNG TỪ CƠ CHẾ (motion_language.md), dùng lại được ở video khác.
 */
export const SFX = {
  emit: { f: 880, ms: 40, decay: 5, gain: 0.5 }, // rời khỏi nguồn
  arrive: { f: [523.25, 659.25, 783.99, 987.77], ms: 60, decay: 4.5, gain: 0.34, harm: 0.3 }, // tới đích
  attach: { f: 1180, ms: 45, decay: 9, gain: 0.3, sub: 0.53 }, // cắm vào, khớp
  draw: { f: 1400, ms: 35, decay: 12, gain: 0.22, noise: 0.45 }, // một đường được nối
  drop: { f: 240, ms: 110, decay: 4, gain: 0.3, sweep: -0.5, sub: 0.3 }, // rơi ra khỏi hệ
};

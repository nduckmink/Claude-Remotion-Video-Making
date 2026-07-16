// Design tokens — xem Resource/style_guide.md
// Nền tối. Hoạ tiết sáng. Cái nào quan trọng thì cam đỏ.
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const C = {
  bg: "#0B0A0C", // near-black hơi ấm — KHÔNG navy

  // ── Hoạ tiết: ba bậc SÁNG, không bậc nào có màu ──
  // Ba bậc này làm việc mà glow từng làm: phân cấp thị giác.
  line: "rgba(255,255,255,0.20)", // khung hệ thống lúc rỗi
  lineLive: "rgba(255,255,255,0.50)", // khung đang tham gia
  data: "#E8EBF0", // dữ liệu đang bay — trắng đặc

  // ── Accent: MỘT, và chỉ một ──
  // Nghĩa là "NHÌN ĐÂY", không phải "xấu". Đừng để nó trượt.
  accent: "#FF4A1A",

  bgPanel: "rgba(255,255,255,0.03)",
  gridDim: "rgba(255,255,255,0.07)",
  ghost: "rgba(255,255,255,0.025)",

  text: "#ECEEF3",
  textDim: "#8A8F9C",
  textFaint: "#585D69",
} as const;

// Load ở module level — bắt buộc với Remotion.
const inter = loadInter();
const jetbrains = loadMono();

export const F = {
  title: inter.fontFamily,
  mono: jetbrains.fontFamily,
} as const;

export const BRAND = {
  handle: "@duckmink_nguyen",
} as const;

/** Glow — CHỈ thứ đang sống mới có. Không glow trang trí. */
export const nodeGlow = (color: string, strength = 1) =>
  `0 0 ${24 * strength}px ${color}66, 0 0 ${8 * strength}px ${color}99`;

export const textGlow = (color: string) => `0 0 20px ${color}55`;

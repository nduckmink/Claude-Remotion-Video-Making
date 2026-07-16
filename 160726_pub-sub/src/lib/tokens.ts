// Design tokens — nguồn: Resource/style_guide.md
// "Nền tối. Hoạ tiết sáng. Cái nào quan trọng thì cam đỏ."
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const C = {
  bg: "#0B0A0C", // near-black hơi ấm — KHÔNG navy

  // ── Hoạ tiết: ba bậc SÁNG, không bậc nào có màu ──
  // Ba bậc này gánh việc phân cấp thị giác, để accent chỉ còn lo chỉ đường.
  line: "rgba(255,255,255,0.20)", // khung hệ thống lúc rỗi
  lineLive: "rgba(255,255,255,0.50)", // khung đang tham gia
  data: "#E8EBF0", // dữ liệu đang bay — trắng đặc

  // ── Accent: MỘT, và chỉ một ──
  // Nghĩa là "NHÌN ĐÂY", không phải "xấu".
  accent: "#FF4A1A",

  // ĐỤC, không phải rgba: node nằm trên đường đi thì phải CHE được đường đi.
  // = rgba(255,255,255,0.03) trộn sẵn lên bg. Đổi bg thì phải trộn lại.
  bgPanel: "#121113",
  gridDim: "rgba(255,255,255,0.07)",

  text: "#ECEEF3",
  textDim: "#8A8F9C",
  textFaint: "#585D69",
} as const;

/**
 * Màu định danh từng service — CHỈ scene V2 dùng.
 *
 * Đây là chỗ V2 cố ý phá luật đèn rọi của style_guide.md ("accent: MỘT, và
 * chỉ một"). Quyết định của chủ kênh, không phải rule mới: V1 vẫn đơn sắc,
 * hai bản để cạnh nhau trong Studio mà so.
 *
 * Ràng buộc còn giữ: KHÔNG màu nào trong đây được lấn sang dải cam-đỏ của
 * `accent`. Cú nháy fail phải còn chỗ đứng riêng, nếu không thì mất nốt thứ
 * duy nhất mà màu còn chỉ được.
 */
export const SVC_COLORS = ["#22D3EE", "#4ADE80", "#A78BFA", "#F472B6"] as const;

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

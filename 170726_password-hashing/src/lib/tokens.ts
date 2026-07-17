// Design tokens — chép từ Resource/style_guide.md. Rule là nguồn, file này là bản sao.
// "Nền tối, tâm sáng. Mỗi thứ một danh tính. Cam là của kênh."
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const C = {
  bg: "#0B0A0C", // mép khung — near-black hơi ấm, KHÔNG navy
  bgLift: "#17151A", // tâm khung — sáng hơn MỘT bậc

  // ── Hoạ tiết trung tính: ba bậc SÁNG ──
  line: "rgba(255,255,255,0.20)", // khung hệ thống lúc rỗi
  lineLive: "rgba(255,255,255,0.50)", // khung đang tham gia
  data: "#E8EBF0", // dữ liệu CHƯA mang danh tính — trắng đặc

  // ── Cam: màu của KÊNH ──
  // Title (đứng yên, trên hairline) + trạng thái hỏng (động, dưới hairline).
  // Trong scene này, thứ động mang cam duy nhất là HACKER — nó chính là cú hỏng.
  brand: "#FF4A1A",

  bgPanel: "#1C1920", // nền card — ĐỤC, và sáng hơn bgLift
  gridDim: "rgba(255,255,255,0.07)",

  text: "#ECEEF3",
  textDim: "#8A8F9C",
  textFaint: "#585D69",
} as const;

// ─── Quy tắc chọn màu: SINH RA, đừng nhặt tay ─────────────────────────
// L khoá cứng (không màu nào tự hút mắt hơn); C thả tới trần của TỪNG hue
// (ép chung một C là dìm cả bảng xuống bằng hue yếu nhất → bảng màu nhợt).
const BRAND_H = 34.5; // hue của brand #FF4A1A — đo ra, đừng đoán
const GUARD = 30; // vùng cấm mỗi bên brand
const ID_L = 0.75;
const ID_CAP = 0.18; // phải nằm DƯỚI chroma của brand (0.224)

const oklchToRgb = (L: number, Ch: number, Hdeg: number) => {
  const h = (Hdeg * Math.PI) / 180;
  const a = Ch * Math.cos(h);
  const b = Ch * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const inSRGB = (L: number, Ch: number, H: number) =>
  oklchToRgb(L, Ch, H).every((v) => v >= -0.0005 && v <= 1.0005);

/** Chroma đậm nhất mà hue này còn nằm trong sRGB, chặn trên ở ID_CAP. */
const fitChroma = (H: number) => {
  if (inSRGB(ID_L, ID_CAP, H)) return ID_CAP;
  let lo = 0;
  let hi = ID_CAP;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (inSRGB(ID_L, m, H)) lo = m;
    else hi = m;
  }
  return lo * 0.98;
};

/** Màu định danh của phần tử thứ i trong n phần tử. */
export const idColor = (i: number, n: number) => {
  const H = (BRAND_H + GUARD + (360 - 2 * GUARD) * ((i + 0.5) / n)) % 360;
  return `oklch(${ID_L} ${fitChroma(H).toFixed(4)} ${H.toFixed(1)})`;
};

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

/**
 * oklch(...) không nối chuỗi alpha kiểu `${c}59` được như hex. Dùng cái này
 * cho trạng thái RỖI — màu định danh chỉ lên full khi đang có việc chạy qua.
 */
export const dim = (color: string, alpha: number) =>
  color.startsWith("oklch")
    ? color.replace(/\)$/, ` / ${alpha})`)
    : `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;

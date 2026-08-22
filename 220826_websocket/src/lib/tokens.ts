/**
 * Design tokens — copy của Resource/style_guide.md.
 * Màu SINH RA bằng công thức, không nhặt tay.
 */

export const C = {
  bg: "#0B0A0C",
  bgLift: "#17151A",

  line: "rgba(255,255,255,0.20)",
  lineLive: "rgba(255,255,255,0.50)",
  data: "#E8EBF0",

  brand: "#FF4A1A",
  pass: "oklch(0.76 0.17 150)",

  bgPanel: "#1C1920",
  gridDim: "rgba(255,255,255,0.07)",
  ghost: "rgba(255,255,255,0.025)",

  text: "#ECEEF3",
  textDim: "#8A8F9C",
  textFaint: "#585D69",
} as const;

export const F = {
  title: "Inter",
  mono: "JetBrains Mono",
} as const;

// ── Sinh màu định danh ────────────────────────────────────────────────
/**
 * ĐO ĐƯỢC, không đoán: ở GUARD=30, idColor(0,2) ra hue 184.5 = #15c8b8 — kênh
 * green trội (200) ĐÚNG như pass #4fce74 (206). Client khoác luôn màu 'thành
 * công'. Nêm tính bằng ĐỘ không đều về mặt thị giác: 34.5° quanh vùng lục-lam
 * là quá hẹp. GUARD=45 đẩy nó sang 214.5 = #15c2e0, blue trội — hết nhầm.
 */
const BRAND_H = 34.5;
const PASS_H = 150;
const GUARD = 45;
export const ID_L = 0.75;
const ID_CAP = 0.18;

/** oklch → linear sRGB. Để BIẾT màu có tràn không, thay vì đoán. */
export const oklchToRgb = (L: number, Ch: number, Hdeg: number) => {
  const h = (Hdeg * Math.PI) / 180;
  const a = Ch * Math.cos(h);
  const b = Ch * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const inSRGB = (L: number, Ch: number, H: number) =>
  oklchToRgb(L, Ch, H).every((v) => v >= -0.0005 && v <= 1.0005);

/** Chroma đậm nhất mà hue này còn nằm trong sRGB, chặn trên ở ID_CAP. */
export const fitChroma = (H: number) => {
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

/** Màu định danh của phần tử thứ i trong n. Né CẢ HAI hue trạng thái. */
export const idHue = (i: number, n: number) => {
  let H = BRAND_H + GUARD + ((i + 0.5) / n) * (360 - 4 * GUARD);
  if (H > PASS_H - GUARD) H += 2 * GUARD;
  return H % 360;
};

/** Màu định danh của phần tử thứ i trong n. Né CẢ HAI hue trạng thái. */
export const idColor = (i: number, n: number) => {
  const H = idHue(i, n);
  return `oklch(${ID_L} ${fitChroma(H).toFixed(4)} ${H})`;
};

const to2hex = (a: number) =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");

/**
 * Alpha cho cả oklch lẫn hex.
 * `${color}59` CHỈ chạy với hex — nối vào oklch() ra CSS vô nghĩa và trình
 * duyệt bỏ qua LẶNG LẼ (style_guide.md).
 */
export const dim = (c: string, a: number) =>
  c.startsWith("oklch") ? c.replace(/\)$/, ` / ${a})`) : `${c}${to2hex(a)}`;

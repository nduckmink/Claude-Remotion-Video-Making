import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * Load ở module level (remotion_conventions.md), và CHỈ nạp cân nặng/subset
 * thật sự dùng: mặc định nó bắn 96 request mỗi lần render.
 * Title là Inter 700; mọi nhãn và số liệu là mono 400.
 */
export const { fontFamily: INTER } = loadInter("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

export const { fontFamily: MONO } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

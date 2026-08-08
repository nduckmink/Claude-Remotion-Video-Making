// Docker — "Gửi cả cái hộp, đừng gửi mỗi code".
//
// Câu chuyện: A viết xong app, gửi CODE cho B → máy B khác môi trường nên nổ
// một tràng lỗi. A bèn nhét CẢ MÔI TRƯỜNG (runtime, thư viện hệ thống, cấu
// hình) vào một cái HỘP cùng với code, niêm phong, gửi sang. B KHÔNG mở hộp —
// bật thẳng cái hộp lên là chạy.
//
// Đúng kỹ thuật: hộp mang theo runtime + thư viện userland + app, KHÔNG mang
// kernel (dùng chung kernel của máy chủ). Vì vậy các nhãn là "node:20 / os libs
// / config / app code", không phải "cả hệ điều hành".

export const FPS = 30;
export const LOOP = 768; // 25.6s — bội 16 (×48)
export const W = 1080;
export const H = 1920;
export const TITLE = "Docker";

export type Pt = { x: number; y: number };

// ─── Hai người ────────────────────────────────────────────────────────────
export const A = { x: 250, y: 1462, name: "dev a", env: ["node 20", "ubuntu"] };
export const B = { x: 830, y: 1462, name: "dev b", env: ["node 18", "alpine"] };
export const PERSON = { w: 226, h: 200 };

export const BUBBLE_A = { x: 336, y: 1204, w: 336, h: 84 };
export const BUBBLE_B = { x: 754, y: 1186, w: 372, h: 118 };
export const SAY_A = ["i built this — check it out"];
export const SAY_B = ["your app is good —", "we're gonna be millionaires"];

// ─── Code gửi thẳng (cách sai) ────────────────────────────────────────────
export const CODE_FROM: Pt = { x: 300, y: 1372 };
export const CODE_TO: Pt = { x: 786, y: 1372 };
export const CODE_BEND = -110;
export const CODE_NAME = "app.js";

export const ERRORS = ["needs node >= 20", "libssl not found", "os mismatch"];
export const ERR_AT: Pt = { x: 830, y: 1252 };
export const ERR_GAP = 72;

// ─── Cái hộp ──────────────────────────────────────────────────────────────
export const BOX_A: Pt = { x: 344, y: 900 }; // A đóng gói ở đây
export const BOX_B: Pt = { x: 762, y: 900 }; // gửi sang bên B
export const BOX = { w: 300, h: 268 };
export const BOX_TAG = "myapp:1.0";

/** Thứ được nhét vào hộp — runtime + thư viện + cấu hình + chính app. */
export const ITEMS = ["node:20", "os libs", "config", "app code"];
export const ITEM_FROM: Pt = { x: 262, y: 1352 }; // bay lên từ máy của A

// ─── Nhịp ─────────────────────────────────────────────────────────────────
export const T = {
  bubbleA: 20,
  bubbleAOut: 96,
  codeOut: 70,
  codeAt: 116,
  err: [128, 150, 172],
  errOut: 248,
  boxOpen: 236,
  itemFly: [268, 306, 344, 382],
  itemDur: 36,
  seal: 436,
  shipOut: 486,
  shipAt: 542,
  run: 562,
  running: 586,
  bubbleB: 608,
  bubbleBOut: 698,
  resetFrom: 700,
  resetTo: 752,
};
export const RESET = 752;

export const IDLE_PERIOD = 96; // 768/8 — chu kỳ nền phải CHIA HẾT LOOP

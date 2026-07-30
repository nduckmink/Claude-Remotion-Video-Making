// CDN — "Độ trễ chính là KHOẢNG CÁCH".
//
// KHÔNG một con số nào trên màn hình. Mọi thứ nói bằng hình học:
//   · mỗi request để lại VỆT ĐI QUA → xa/gần đọc thẳng bằng độ dài vệt
//   · MỘT tốc độ cho mọi gói → đường dài thì mất nhiều thời gian hơn, thật sự
//   · tải của origin nói bằng ĐỘ NÓNG: bị đập liên tục thì rực, được CDN gánh
//     thì tắt ngóm
//
// Khác hẳn video caching-layers (tầng dọc, nông/sâu): ở đây là ĐỊA LÝ — bản sao
// nằm ở đâu so với người dùng.

export const FPS = 30;
export const LOOP = 512; // 17.07s — bội 16 (×32)
export const W = 1080;
export const H = 1920;
export const TITLE = "CDN";

export type Pt = { x: number; y: number };

// ─── Địa lý ───────────────────────────────────────────────────────────────
export const USERS: { p: Pt; city: string }[] = [
  { p: { x: 186, y: 442 }, city: "tokyo" },
  { p: { x: 540, y: 396 }, city: "berlin" },
  { p: { x: 894, y: 442 }, city: "lima" },
];
// Edge nằm SÁT user — đó là toàn bộ ý nghĩa của nó. Càng sát thì tương phản
// quãng đường (so với cung về origin) càng đọc ra ngay.
export const EDGES: Pt[] = [
  { x: 186, y: 636 },
  { x: 540, y: 590 },
  { x: 894, y: 636 },
];
export const ORIGIN: Pt = { x: 540, y: 1524 };
export const ORIGIN_BOX = { w: 372, h: 244, rows: 3 };
export const EDGE_BOX = { w: 152, h: 96 };
export const USER_R = 46;

/** Độ cong của từng cung — hai bên phình ra ngoài, giữa hơi cong. */
export const BEND_LONG = [150, 62, -150]; // user ↔ origin
export const BEND_EDGE = [126, 52, -126]; // edge ↔ origin
export const BEND_SHORT = [16, 0, -16]; // user ↔ edge (gần như thẳng)

// ─── MỘT tốc độ cho mọi gói — đường dài tự khắc lâu hơn ───────────────────
export const SPEED = 26; // px/frame

// ─── Nhịp ─────────────────────────────────────────────────────────────────
export const HOLD_ORIGIN = 10; // origin xử lý
export const HOLD_EDGE_MISS = 6; // edge tra thấy trống
export const HOLD_EDGE_FILL = 8; // edge ghi bản sao
export const HOLD_EDGE_HIT = 6; // edge trả ngay

export const T = {
  // Act 1 — KHÔNG CDN: đi thẳng tới origin, cung dài vắt cả khung
  farFire: [30, 42, 54],
  // Act 2 — bật CDN
  cdnOn: 170,
  cdnReady: 192,
  missFire: [196, 208, 220],
  // Act 3 — đã có bản sao ở gần: chỉ còn stub ngắn
  hitFire: [330, 338, 346, 358, 366, 374, 386, 394, 402, 414, 422, 430],
  edgeOut: 462,
  edgeGone: 486,
};
export const RESET = 486;

export const TRAIL_FADE = 18; // frame vệt tan sau khi gói tới nơi
export const HEAT_DECAY = 54; // origin nguội dần
export const BREATHE = 128; // 512/4 — chia hết LOOP ⇒ seamless
export const IDLE_PERIOD = 64; // 512/8 — mọi chu kỳ nền phải CHIA HẾT LOOP

// OAuth — "Khiên đồng tâm mở khe khi được cấp quyền".
//
// Drive ở TÂM, các lớp khiên cung quay đồng tâm bảo vệ. 3rd party app phóng tên
// lửa + bắn tia → khiên chặn → popup xin quyền → Allow → khiên xoay xếp một phía,
// lộ KHE THẲNG → phát vé (token) → tên lửa bay xuyên khe vào drive.
//
// Không có đường vào NẾU chưa đồng ý: khiên chỉ mở khe sau khi user bấm Allow.

export const FPS = 30;
export const LOOP = 672; // 22.4s — bội 16 (×42)
export const W = 1080;
export const H = 1920;
export const TITLE = "OAuth";

export const CENTER = { x: 540, y: 1000 };
export const DRIVE_R = 96;

// ─── Khiên DÀY: vòng gần kín, chừa KHE HẸP ─────────────────────────────
export const N_SHIELD = 5;
export const SHIELD_R = [168, 224, 280, 336, 392];
export const SHIELD_GAP = 28; // độ — khe HẸP (vừa đủ tàu chui)
export const SHIELD_PHASE = [10, 80, 155, 220, 300]; // góc KHE, scattered ⇒ bảo vệ dày
export const SHIELD_TURNS = [1, -1, 2, -2, 1]; // vòng/loop (nguyên ⇒ seamless)
export const CORRIDOR_ANG = -58; // độ, hướng tâm→tên lửa (khe mở ra phía này)

// ─── Tên lửa đi trên tia CORRIDOR, đo bằng khoảng cách tới tâm ──────────
const rad = (CORRIDOR_ANG * Math.PI) / 180;
export const U = { x: Math.cos(rad), y: Math.sin(rad) }; // đơn vị hướng corridor
export const onRay = (d: number) => ({ x: CENTER.x + d * U.x, y: CENTER.y + d * U.y });
export const D_HOME = 600; // tên lửa đậu (góc trên-phải)
export const D_FIRE = 520; // vị trí bắn (ngoài lớp khiên ngoài)
export const D_DOCK = 132; // vào tới drive
export const BLOCK_R = 392; // đạn chạm lớp khiên NGOÀI
export const SHOTS = [96, 114, 132]; // 3 phát bắn 8-bit
export const SHOT_DUR = 8; // frame đạn bay tới khiên

export const APP = { x: 900, y: 372, w: 250, h: 96 }; // 3rd party app (nhãn)

// Popup đặt DƯỚI vòng tròn (né orbit, orbit chạm y≈1396)
export const POPUP = { x: 540, y: 1580, w: 452 };

// ─── Timeline (frame) ─────────────────────────────────────────────────────
export const T = {
  approach: 40, // tên lửa home → fire
  atFire: 92,
  fire: 96, // phát bắn đầu
  blocked: 104, // đạn chạm khiên (loé đỏ)
  popup: 146, // popup hiện (sau loạt bắn)
  approve: 200, // bấm Allow
  alignStart: 214, // khiên bắt đầu xoay xếp
  aligned: 286, // khe mở xong
  ticket: 276, // phát vé → tên lửa
  ticketAt: 320,
  flyIn: 322, // tên lửa bay vào
  docked: 412, // tới drive
  grantHold: 460, // giữ "đã cấp"
  flyOut: 462, // bay ra
  home: 542, // về home, khiên resume
};
export const RESET = 542; // sau đây chỉ còn orbit → seamless

export const BREATHE = 168; // 672/4

export type Pt = { x: number; y: number };

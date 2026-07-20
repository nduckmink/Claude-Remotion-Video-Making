// Cookies — "Cookie chỉ là cái vé, server mới giữ đồ".
// Một mạch: đăng nhập → server cất phiên vào TỦ + phát cookie → mỗi request TỰ
// dán cookie → server tra tủ → phục vụ → XOÁ TỦ → cùng cookie nhưng bị từ chối
// (đối chiếu JWT: JWT tự mang, khỏi cần tủ).

export const FPS = 30;
export const LOOP = 672; // 22.4s — bội 16 (×42)
export const W = 1080;
export const H = 1920;
export const TITLE = "Cookies";

export const BROWSER = { x: 252, y: 560, w: 320, h: 236, rows: 3 };
export const SERVER = { x: 828, y: 560, w: 320, h: 236, rows: 3 };
export const STORE = { x: 828, y: 1092, w: 430, h: 320, cols: 4, rows: 2 };
export const STORE_CELL = 5; // ngăn giữ phiên user

export const B_ANCHOR = { x: 300, y: 438 }; // mép browser (request đi/về)
export const S_ANCHOR = { x: 780, y: 438 }; // mép server
export const COOKIE_HOME = { x: 252, y: 820 }; // hũ cookie dưới browser
export const LANE_BEND = -120; // request bay CUNG lên trên

export const SID = "sid=a3f9";

// ─── Timeline ─────────────────────────────────────────────────────────────
export const T = {
  loginOut: 30, // browser gửi mật khẩu
  loginAt: 72,
  sessionMake: 80, // server cất "áo" vào tủ
  setCookie: 102, // phát cookie → browser
  cookieHome: 148, // cookie nằm trong hũ
  wipe: 476, // XOÁ TỦ
  badOut: 496, // request kế (vẫn kèm cookie)
  badAt: 538,
  reject: 546, // 401
  cookieDead: 540,
  badBack: 552,
  badEnd: 588,
  ghost: 548, // ghost JWT đối chiếu hiện
  ghostEnd: 616,
  discard: 600, // cookie bị bỏ
  discardEnd: 628,
};
export const RESET = 600;

// 3 request "đã đăng nhập" — mỗi cái round trip mang cookie
export const REQ_STARTS = [168, 270, 372];
export const REQ_OUT = 42; // browser → server
export const REQ_LOOK = 20; // server tra tủ
export const REQ_BACK = 34; // server → browser
export const reqEnd = (start: number) => start + REQ_OUT + REQ_LOOK + REQ_BACK;

export const BREATHE = 168; // 672/4

export type Pt = { x: number; y: number };

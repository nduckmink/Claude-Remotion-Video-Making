// CORS — "Server chỉ nhận origin được phép".
//
// Client (app.com) ↔ server nối bằng ỐNG trong suốt: dòng 2 chiều chảy liên tục
// — xanh lá (server→client) và xanh dương (client→server). Một client độc hại
// (evil.com) bắn vỡ ống, chọc vòi bơm dữ liệu CAM vào; server TỪ CHỐI (không
// đúng origin cho phép) → cam tràn hết ra ngoài, rồi evil + cam biến mất.

export const FPS = 30;
// 448 = 16×28 (14.9s). Mọi thứ xong ở f=404 nên đuôi chỉ còn 44 frame để dòng
// chảy lắng lại rồi vào vòng mới — không để thừa mấy giây trống như trước.
export const LOOP = 448;
export const W = 1080;
export const H = 1920;
export const TITLE = "CORS";

export const CLIENT = { x: 520, y: 468, w: 280, h: 168 };
export const SERVER = { x: 520, y: 1444, w: 340, h: 236, rows: 3 };
export const EVIL = { x: 892, y: 940, w: 184, h: 150 };

// Ống HỞ hai đầu, mép chạm sát client/server để dòng chảy vào/ra thật sự.
export const TUBE = { x: 520, topY: 556, botY: 1322, w: 66 };
export const LANE = 15; // xanh lá lệch trái, xanh dương lệch phải
export const CRACK_Y = 940; // chỗ evil bắn vỡ

export const ALLOW_ORIGIN = "app.com"; // danh sách cho phép
export const EVIL_ORIGIN = "evil.com";

// Dòng chảy hợp lệ
export const N_FLOW = 9; // chấm mỗi chiều
export const FLOW_K = 4; // số vòng/loop (NGUYÊN ⇒ seamless)
export const GREEN = "oklch(0.76 0.17 150)"; // = pass
export const BLUE = "#3E8EF7";

/** Chấm nào kêu khi tới miệng ống — chỉ vài chấm, không phải tất cả (9 chấm ×
 *  4 vòng = 36 lần/chiều thì thành tiếng ồn). Lấy 3 chấm mỗi chiều → nhịp đều
 *  ~19 frame một tiếng, nghe ra "dòng đang chảy" mà không lấn tiếng cơ chế. */
export const TICK_GREEN = [0, 3, 6];
export const TICK_BLUE = [1, 4, 7];
export const TICK_QUIET = 40; // dừng kêu trước biên loop (biên phải LẶNG)

// ─── Ống của evil: CÙNG loại ống, cắm ngang vào vết nứt ─────────────────
export const HOSE_W = 34;
export const HOSE_FROM = { x: EVIL.x - EVIL.w / 2, y: CRACK_Y }; // mép trái evil
export const HOSE_TO = { x: 520 + 33, y: CRACK_Y }; // mép phải ống chính
export const HOSE_TRAVEL = 18; // frame cam chạy trong ống evil trước khi vào ống chính

// Cam độc hại — bơm vào rồi bị chặn
export const ORANGE_SPAWN = [182, 196, 210, 224, 238, 252, 266, 280];
export const ORANGE_IN = 46; // frame chảy từ vết nứt xuống server
export const ORANGE_SPILL = 24; // frame tràn ra ngoài rồi tan

// ─── Timeline ─────────────────────────────────────────────────────────────
export const T = {
  evilIn: 84, // evil hiện
  shot: 130, // BẮN MỘT VIÊN ĐẠN
  hit: 148, // đạn trúng ống
  crackAt: 150, // ống vỡ
  hoseIn: 164, // cắm ống vào vết nứt
  injectEnd: 300, // ngừng bơm
  attackEnd: 344, // evil rút
  heal: 356, // ống lành
  healEnd: 404,
};
export const BULLET_FROM = { x: EVIL.x - EVIL.w / 2, y: CRACK_Y - 16 };
export const BULLET_TO = { x: 520 + 33, y: CRACK_Y - 16 };
export const RESET = 404;

export const BREATHE = 112; // 448/4 — chia hết LOOP ⇒ seamless

export type Pt = { x: number; y: number };

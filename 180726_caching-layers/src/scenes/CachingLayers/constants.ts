// Caching Layers — hằng số scene.
//
// Ý DUY NHẤT của loop:
//
//   Request thả từ trên xuống. Tầng cache nào HỨNG được thì đáp bật về từ đó —
//   tầng càng GẦN client, đáp càng NHANH. Cache lạnh thì rơi xuyên hết xuống
//   database (xa nhất, chậm nhất).
//
// Latency = QUÃNG RƠI + độ trễ tầng đáy, KHÔNG phải con số viết ra. Cache lạnh
// rơi cả cột (chậm); cache nóng bật ngay ở đỉnh (tức thì). Người xem CẢM được
// độ trễ qua thời lượng cú nảy, không phải đọc nó.
//
// Ba read, cache ẤM DẦN: read 1 rơi tới DB (200ms) rồi đổ đầy redis trên đường
// về; read 2 bật ở redis (50ms) rồi đổ đầy client-cache; read 3+ bật ngay ở
// client-cache (0ms). Reset = cache hết hạn (TTL) → rách lại → về lạnh → loop.

export const FPS = 30;
export const LOOP = 432; // 14.4s — bội của 16 (×27)

export const SPEED = 15; // px/frame — MỘT tốc độ rơi/bật cho mọi read

// ─── Layout: cột TRAMPOLINE dọc ───────────────────────────────────────
// 9:16 hợp trục dọc. Cột hẹp, né action rail (x 950+) dễ dàng.
export const W = 1080;
export const H = 1920;
export const AXIS = 540;
export const STROKE = 3;

export const COL = { x0: 320, x1: 760 }; // bề ngang màng trampoline

export const CLIENT = { x: 410, y: 356, w: 260, h: 104 };
export const SPAWN = { x: AXIS, y: 486 }; // chỗ read rơi ra từ client

/** Ba tầng, từ GẦN client (nhanh) xuống XA (chậm). DB là sàn cứng luôn hứng. */
export const N_LAYER = 3;
export const CLIENT_CACHE = 0;
export const REDIS = 1;
export const DB = 2;
export const LAYER_Y = [686, 1026, 1360]; // client-cache · redis · database
export const LAYER_LABEL = ["client cache", "redis", "database"];
export const LAYER_SUB = ["on device", "server cache", "origin"];
export const LAYER_MS = [0, 50, 200]; // round-trip hiển thị

/** DB là node (sàn), hai tầng cache là màng. Node DB rộng, đáy cột. */
export const DB_BOX = { x: 360, y: 1360, w: 360, h: 150 };

// ─── Vật lý cú nảy ────────────────────────────────────────────────────
export const fallFrames = (layer: number) => Math.max(1, Math.round((LAYER_Y[layer] - SPAWN.y) / SPEED));
/** Độ trễ xử lý tại tầng — DB lâu (query), cache nhanh. Đây là phần "ms" mà
 *  quãng rơi chưa gánh hết: DB không chỉ xa mà còn CHẬM khi tới nơi. */
export const PROC = [6, 9, 28]; // client-cache · redis · database
/** Màng võng xuống bao nhiêu khi hứng. DB cứng (võng ít); màng mềm (võng nhiều). */
export const DIP = [15, 22, 10];

// ─── DÒNG CHẢY read liên tục ──────────────────────────────────────────
// Không phải một chấm mỗi lượt: một DÒNG read thả xuống đều đặn. Mỗi read rơi
// tới tầng taut cao nhất rồi bật về. Tầng nào PHỤC VỤ thì read mang màu đó khi
// đi lên — cả dòng đổi từ CAM (sâu, chậm) sang TÍM sang XANH (nông, nhanh) khi
// cache ấm dần. Màu = "tầng nào trả lời", và nó nói luôn độ nhanh.
export const EMIT_START = 24;
export const EMIT_GAP = 13; // frame giữa hai read — đủ dày để thành dòng
export const EMIT_COUNT = 20;

/** Màu read khi BẬT VỀ, theo tầng đã hứng. Rơi xuống thì luôn TRẮNG. */
export const CATCH_COLOR = [
  "GREEN", // client-cache — sẽ map sang idColor(0,2) ở scene
  "PURPLE", // redis — idColor(1,2)
  "ORANGE", // database — brand (cam)
] as const;

export const READ_HOLD = 2; // ball ở client một nhịp trước khi thả
export const BOUNCE_FLASH = 12; // tầng loé khi hứng
export const RESET = 384;
export const RESET_DUR = 48; // 384 + 48 = 432 = LOOP → f432 trùng khít f0
export const INTRO = 24; // cột + màng vẽ vào lúc mở màn

// ─── Nội dung ──────────────────────────────────────────────────────────
export const TITLE = "Caching Layers";
export const CLIENT_LABEL = "client";
export const READ_KEY = "GET user:42";
export const LABEL_SIZE = 26;
export const SUB_SIZE = 17;

export type Pt = { x: number; y: number };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

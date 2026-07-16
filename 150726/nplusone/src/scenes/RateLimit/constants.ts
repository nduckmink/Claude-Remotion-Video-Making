// Rate Limit — hằng số scene. Chỉnh nội dung ở đây, không mò trong JSX.

export const FPS = 30;
export const LOOP = 600; // 20s

// ─── Chốt chặn kỹ thuật ────────────────────────────────────────────────
// Server xử lý đúng 1 request / 8 frame — Y HỆT NHAU ở cả ba act.
// Nó KHÔNG BAO GIỜ chậm đi. Thứ dài ra là HÀNG ĐỢI.
export const SERVICE = 8; // frames / request
export const MS_PER_SERVICE = 25; // ms → 1 frame = 3.125ms

// Nhịp gửi. Quy ra đời thật (1f = 3.125ms):
//   app   1/40f = 125ms →  8 req/s   — dưới ngưỡng, một mình thì hàng đợi LUÔN rỗng
//   batch 1/8f  =  25ms → 40 req/s   — bằng ĐÚNG dung lượng server, một mình nó
//   server      =  25ms → 40 req/s
//   limit 1/32f = 100ms → 10 req/s mỗi client
// app (8/s) chậm hơn limit (10/s) → KHÔNG BAO GIỜ dính 429.
// batch (40/s) → chỉ 1 trong 4 lọt → 75% ăn 429.
export const APP_PERIOD = 40;
export const BATCH_PERIOD = 8;
export const LIMIT_PERIOD = 32;

// Act 2: tổng 48/s vs 40/s = 1.2× quá tải → hàng đợi phình 1 gói / 40f.
// Act 3: tổng 18/s vs 40/s = 45% → hàng đợi cạn.

// MỘT tốc độ duy nhất cho mọi packet — tốc độ mang nghĩa, không được tuỳ tiện.
// 22 chứ không phải 18: ở 18, request cuối của app (bắn f560) xong ở f597 và
// tiếng "đáp" (75ms) còn ngân tới f599 — loop cắt ngang giữa tiếng ở −19dB,
// nghe thành cú click. Nhanh hơn thì nó xong sớm, biên loop im hẳn.
export const SPEED = 22; // px / frame
export const SHIFT = 6; // frames — hàng đợi nhích xuống một chỗ
export const REJ_WINDOW = 96; // frames — cửa sổ trượt tính tỷ lệ 429

// ─── Timeline ──────────────────────────────────────────────────────────
export const BATCH_IN = 170; // batch xuất hiện
export const LIMIT_IN = 430; // limiter sập xuống
// Batch phải bắn tới sát RESET: ngừng sớm là cửa sổ trượt cạn dần và tỷ lệ
// 429 drift lung tung ở khung cuối. Packet cuối (gate ~f565) bật ngược xong
// ~f574 — vẫn kịp sạch trước f600.
export const BATCH_OUT = 556;
export const RESET = 570; // → khớp frame 0

// ─── Layout 1080×1920 ─────────────────────────────────────────────────
// Header 3 dòng chiếm y 100–330. Stage y 370–1820 = 1450px.
export const W = 1080;
export const H = 1920;
export const AXIS = 540;

export const CLIENT = { y: 380, h: 110, w: 340 };
export const CLIENT_BOTTOM = CLIENT.y + CLIENT.h; // 490
export const APP_X = 150; // 150..490, tâm 320
export const BATCH_X = 590; // 590..930, tâm 760
export const APP_CX = 320;
export const BATCH_CX = 760;

// Gate trải ngang, cắt qua CẢ HAI nhánh — limiter đếm riêng từng client.
export const GATE = { x: 180, y: 620, w: 720, h: 52 }; // tâm 540
export const GATE_CY = GATE.y + GATE.h / 2; // 646
export const MERGE_DIST = 80; // px sau gate: hai nhánh hội tụ về trục

// Hàng đợi neo ĐÁY (cửa server), phình LÊN. Đống càng cao, packet càng
// dừng sớm — chạm đuôi hàng ngay lập tức. Đó là congestion nhìn thấy được.
//
// NGÂN SÁCH: đỉnh thật (đo bằng verify.ts) là ~9 gói. Đống chỉ được cao tới
// đáy gate (y=672) — tức tối đa (1010-672)/28 = 12 chỗ. Còn 3 chỗ dự phòng.
// Đổi BATCH_IN / BATCH_PERIOD là phải chạy lại verify.ts.
export const QUEUE_BOTTOM = 1030;
export const QUEUE_PITCH = 32;
export const PACKET = 28;

export const SERVER = { x: 300, y: 1080, w: 480, h: 170 }; // tâm 540
export const SERVER_CY = SERVER.y + SERVER.h / 2; // 1165

// Mọi thứ dừng trước x=900 → né action rail TikTok/Reels (x 950–1080).
export const BAR = {
  x: 190,
  track: 700,
  h: 24,
  latY: 1330,
  appY: 1450,
  batchY: 1570,
};
export const MAX_MS = 300; // thang thanh latency — đỉnh thật 225ms (verify.ts)
export const INSIGHT_Y = 1710;

// ─── Nội dung ──────────────────────────────────────────────────────────
export const EYEBROW_L = "queue · app pays";
export const EYEBROW_R = "limit · batch pays";
export const TITLE = "Rate Limit";

// INSIGHT không nằm ở đây — nó được TÍNH RA từ sim (xem index.tsx).
// Con số chốt mà gõ tay thì sớm muộn cũng lệch khỏi thứ đang chạy trên màn hình.

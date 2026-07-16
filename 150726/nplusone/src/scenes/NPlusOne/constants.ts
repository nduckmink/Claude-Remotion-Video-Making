// N+1 Query — hằng số scene. Chỉnh nội dung ở đây, không mò trong JSX.

export const FPS = 30;
export const LOOP = 360; // 12s

// ─── Chốt chặn kỹ thuật ────────────────────────────────────────────────
// MỘT round trip = 21 frame = 3ms. Đúng như thế ở CẢ HAI act.
// Act 1 dài hơn Act 2 KHÔNG phải vì packet bay chậm hơn, mà chỉ vì
// nó phải đi 9 vòng thay vì 2. Thời gian animation = thời gian thật.
export const TRIP = 21; // frames / round trip
export const MS_PER_TRIP = 3; // ms / round trip (DB cùng vùng)

export const TRIP_DOWN = 9; // packet đi xuống
export const TRIP_DWELL = 3; // bounce tại DB
export const TRIP_UP = 9; // packet trả về  (9+3+9 = 21)
// Ripple bắt đầu khi packet chạm DB và tắt đúng lúc round trip kết thúc
// → không có mối nối khi trip kế tiếp bắt đầu.
export const RIPPLE_LEN = TRIP - TRIP_DOWN; // = 12

export const ROWS = 8;

// Act 1 render row NGAY khi có list (lazy → row rỗng trước, query sau).
// Act 2 chỉ render SAU KHI cả 2 query xong (eager → row đã đầy sẵn).
export const ROW_STAGGER_A1 = 4; // dựng vào tuần tự
export const ROW_STAGGER_A2 = 2; // burst: cả 8 về từ MỘT response

// ─── Timeline ──────────────────────────────────────────────────────────
export const A1_START = 12;
export const A1_TRIPS = 1 + ROWS; // 9
export const A1_END = A1_START + A1_TRIPS * TRIP; // 201
export const A1_MS = A1_TRIPS * MS_PER_TRIP; // 27ms

export const FLIP_START = 225; // sau 24f hold khoe kết quả Act 1
export const A2_START = 243; // 18f state flip

export const A2_TRIPS = 2; // 1 list + 1 batched
export const A2_END = A2_START + A2_TRIPS * TRIP; // 285
export const A2_MS = A2_TRIPS * MS_PER_TRIP; // 6ms

export const PAYOFF_START = A2_END; // 285
export const RESET_START = 342; // 18f → khớp frame 0

// ─── Layout 1080×1920 ─────────────────────────────────────────────────
// Header 3 dòng chiếm y 100–330 (Resource/scene_composition.md).
// Stage có y 370–1820 = 1450px. Đã cộng trước, không nhét bừa.
export const W = 1080;
export const H = 1920;

// MỘT trục dọc duy nhất: x=540. APP, DB, connector, header đều nằm trên nó.
export const AXIS = 540;

export const APP = { x: 160, y: 370, w: 760, h: 560 }; // 160..920, 370..930
export const ROW = { x: 200, y0: 440, w: 680, h: 47, gap: 6 }; // 200..880, 440..858

// SQL readout nằm TRONG APP — chính APP phát ra query đó, nên đó là chỗ đúng
// về nghĩa. Và nhờ vậy connector không phải né chữ để rồi lệch khỏi trục.
export const SQL = { y: 882, size: 20 };

// 285px là quãng đường dài — quãng đó CHÍNH LÀ latency người xem phải chờ.
export const LINE_Y0 = APP.y + APP.h; // 930
export const LINE_Y1 = 1215;

export const DB = { x: 320, y: 1215, w: 440, h: 255 }; // 320..760, 1215..1470

// Thanh phải căn TRÁI trong khối để so được độ dài — nhưng cả khối thì
// căn giữa trên trục. Khối 190..890, tâm 540. Né action rail (x≥950).
export const BAR = { x: 190, track: 700, h: 26, row1Y: 1550, row2Y: 1666 };
export const PX_PER_MS = BAR.track / A1_MS; // 25.93px / ms

export const INSIGHT_Y = 1785;

// ─── Nội dung ──────────────────────────────────────────────────────────
export const EYEBROW_L = "N+1 · lazy";
export const EYEBROW_R = "eager · batched";
export const TITLE = "N+1 Query";

export const AUTHORS = [
  "@ada",
  "@linus",
  "@grace",
  "@alan",
  "@edsger",
  "@barbara",
  "@ken",
  "@donald",
] as const;

export const SQL_LIST = "SELECT * FROM posts";
export const sqlAuthor = (id: number) =>
  `SELECT * FROM authors WHERE id = ${id}`;
export const SQL_BATCH = "SELECT * FROM authors WHERE id IN (…)";

export const INSIGHT = "@ 50 rows → 51 queries · 153ms";

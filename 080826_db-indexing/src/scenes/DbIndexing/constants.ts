// Database Indexing — "Mỗi tầng vứt bỏ phần lớn dữ liệu".
//
// Bố cục DỌC: cây index ở trên (mọc xuống, đúng chiều tự nhiên của B+ tree),
// bảng là dải card nằm ngang ở dưới, HUD `reads` dưới cùng.
//
// Ba sự thật phải giữ, không được vẽ cho đẹp rồi nói dối:
//   1. Index KHÔNG sắp lại bảng. Bảng vẫn nằm theo thứ tự chèn → các dòng ứng
//      viên nằm RẢI RÁC, không thành khối liền.
//   2. Lá của B+ tree mới trỏ về dòng thật; nút trong chỉ chứa khoá + hướng đi.
//   3. Ghi phải sửa CẢ HAI: thêm dòng vào bảng và luồn khoá vào cây; lá đầy
//      thì TÁCH NÚT. Đọc nhanh lên thì ghi đắt lên.

export const FPS = 30;
export const LOOP = 768; // 25.6s — bội 16 (×48)
export const W = 1080;
export const H = 1920;
export const TITLE = "DB Index";

export type Pt = { x: number; y: number };

// ─── Dữ liệu ──────────────────────────────────────────────────────────────
/** Khoá theo THỨ TỰ TĂNG DẦN — đây là thứ tự của INDEX, không phải của bảng. */
export const SORTED = [11, 14, 19, 23, 26, 31, 34, 38, 42, 45, 49, 53, 57, 60, 64, 67, 71, 75, 79, 82, 86, 89, 92, 94, 96, 97, 98];
/** Thứ tự VẬT LÝ trong bảng — xáo trộn, vì bảng lưu theo thứ tự chèn. */
export const PHYSICAL = [45, 92, 19, 67, 31, 86, 11, 57, 96, 26, 79, 42, 98, 64, 14, 89, 34, 75, 53, 23, 94, 60, 38, 71, 49, 97, 82];

export const TARGET = 71; // câu truy vấn: WHERE id = 71
export const QUERY = "where id = 71";
export const INSERT_KEY = 73; // khoá chèn thêm ở nhịp "cái giá"

export const FANOUT = 3; // mỗi nút 3 nhánh (thật thì hàng trăm — vẽ 3 cho đọc được)
export const N = SORTED.length; // 27
export const N_LEAF = N / FANOUT; // 9
export const N_MID = N_LEAF / FANOUT; // 3

// ─── Dải bảng (card nằm ngang, dưới) ──────────────────────────────────────
export const CARD = { w: 26, h: 150 };
export const PITCH = 32;
export const STRIP = { x0: 108, y: 1300 }; // tâm card i: x0 + 16 + i*PITCH
export const cardX = (i: number) => STRIP.x0 + 16 + i * PITCH;

// ─── Cây index (trên) ─────────────────────────────────────────────────────
export const ROOT = { x: 540, y: 520, w: 290, h: 60 };
export const MID = { y: 726, w: 220, h: 54 };
export const LEAF = { y: 906, w: 86, h: 44 };
export const midX = (k: number) => 228 + 312 * k; // 228 · 540 · 852
export const leafX = (j: number) => 124 + 104 * j; // 124 … 956

export const QUERY_CARD = { x: 540, y: 392, w: 350, h: 68 };
export const HUD = { x: 540, y: 1540, w: 300 };

// ─── Nhịp ─────────────────────────────────────────────────────────────────
export const SCAN_STEP = 5; // frame mỗi dòng khi quét — lê thê là có chủ ý

export const T = {
  queryIn: 24,
  scanFrom: 48, // quét từng dòng cho tới khi gặp
  foundHold: 40, // đứng lại ở dòng tìm được
  buildFrom: 214, // khoá bay ra khỏi bảng, tự xếp thứ tự
  buildLeaf: 236,
  buildMid: 316,
  buildRoot: 348,
  lookFrom: 386, // tra bằng index
  hopRoot: 386,
  hopMid: 424,
  hopLeaf: 462,
  hopRow: 500,
  lookHold: 556,
  insFrom: 576, // cái giá: ghi phải sửa cả hai
  insCard: 600,
  insKey: 618,
  insSplit: 646,
  insDone: 690,
  resetFrom: 700,
  resetTo: 752,
};
export const RESET = 752;

/** Số frame quét: dò tuần tự tới đúng vị trí VẬT LÝ của khoá cần tìm. */
export const SCAN_HIT = PHYSICAL.indexOf(TARGET); // 23 ⇒ đụng 24 dòng
export const IDLE_PERIOD = 96; // 768/8 — chu kỳ nền phải CHIA HẾT LOOP

// SQL Database — "Vào là bảng, ra cũng là bảng. Bạn mô tả CÁI GÌ, máy lo LÀM SAO."
//
// Video tiền đề: dữ liệu thô có cấu trúc thành BẢNG (cột có kiểu, sai kiểu thì
// bị từ chối) → nhiều bảng nối nhau bằng KHOÁ → một câu hỏi viết thành SQL →
// kết quả trả về CŨNG LÀ MỘT BẢNG.
//
// Một sự thật nữa được cài vào nhịp: SQL chạy theo thứ tự FROM/JOIN → WHERE →
// GROUP BY → SELECT, không phải theo thứ tự chữ viết ra.

export const FPS = 30;
export const LOOP = 736; // 24.5s — bội 16 (×46)
export const W = 1080;
export const H = 1920;
export const TITLE = "SQL";

export type Pt = { x: number; y: number };

// ─── Bảng ─────────────────────────────────────────────────────────────────
export const ROW_H = 40;
export const HEAD_H = 44;

export const CUSTOMERS = {
  x: 540,
  y: 470,
  w: 560,
  name: "customers",
  cols: [
    { name: "id", type: "int", w: 130 },
    { name: "name", type: "text", w: 430 },
  ],
  rows: [
    ["1", "alice"],
    ["2", "bob"],
    ["3", "cara"],
  ],
};

export const ORDERS = {
  x: 540,
  y: 800,
  w: 760,
  name: "orders",
  cols: [
    { name: "id", type: "int", w: 120 },
    { name: "customer_id", type: "int", w: 240 },
    { name: "amount", type: "money", w: 180 },
    { name: "created_at", type: "date", w: 220 },
  ],
  // customer_id · amount · created_at — dòng 07-28 sẽ bị WHERE loại
  rows: [
    ["91", "1", "120", "08-02"],
    ["92", "3", "80", "08-05"],
    ["93", "1", "40", "07-28"],
    ["94", "2", "200", "08-06"],
    ["95", "1", "60", "08-09"],
  ],
};

export const RESULT = { x: 540, y: 1486, w: 520, name: "result", cols: [{ name: "name", type: "text", w: 280 }, { name: "sum", type: "money", w: 240 }] };

/** Bản ghi thô rơi vào bảng customers. Cái thứ 3 SAI KIỂU ⇒ bị hắt ra. */
export const BLOBS = [
  { cells: ["1", "alice"], bad: false },
  { cells: ["2", "bob"], bad: false },
  { cells: ["xyz", "?"], bad: true }, // id phải là int
  { cells: ["3", "cara"], bad: false },
];
export const BLOB_FROM: Pt = { x: 540, y: 350 };

// ─── Câu truy vấn ─────────────────────────────────────────────────────────
export const SQL = { x: 540, y: 1150, w: 930 };
export const SQL_LINES = [
  "SELECT c.name, SUM(o.amount)",
  "FROM orders o",
  "JOIN customers c ON c.id = o.customer_id",
  "WHERE o.created_at >= '2026-08-01'",
  "GROUP BY c.name",
];
/** SQL chạy theo thứ tự NÀY, không theo thứ tự chữ: FROM/JOIN → WHERE → GROUP BY → SELECT. */
export const EXEC_ORDER = [[1, 2], [3], [4], [0]];

export const CUTOFF = "2026-08-01";
export const KEPT = [0, 1, 3, 4]; // chỉ số dòng orders qua được WHERE (loại 07-28)

// ─── Nhịp ─────────────────────────────────────────────────────────────────
export const T = {
  blobFrom: [30, 62, 94, 126],
  blobDur: 28,
  ordersIn: 210,
  linkIn: 258,
  sqlIn: 312,
  phase: [354, 418, 484, 552], // FROM/JOIN · WHERE · GROUP BY · SELECT
  phaseDur: 58,
  resultIn: 574,
  hold: 680,
  resetFrom: 682,
  resetTo: 728,
};
export const RESET = 728;
export const IDLE_PERIOD = 92; // 736/8 — chu kỳ nền phải CHIA HẾT LOOP

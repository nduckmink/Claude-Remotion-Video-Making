// Message Queue — "Hàng đợi hấp thụ cú tăng tải; chữa bằng cách thêm worker".
//
// Dây chuyền dọc: MÁY DẬP (producer) dập ra task → task rơi vào MÁNG (queue) và
// XẾP CHỒNG → WORKER lấy từ đáy ra xử lý. Producer tăng tần suất → worker một
// mình không kịp → máng ĐẦY DẦN (đó chính là "độ sâu hàng đợi"). Thêm worker
// thứ hai → thông lượng gấp đôi → rút cạn. Tải về bình thường → worker phụ rời.
//
// Con số kể chuyện: ĐỘ SÂU HÀNG ĐỢI — và nó được MÔ PHỎNG, không gõ tay.

export const FPS = 30;
export const LOOP = 480; // 16s — bội 16 (×30)
export const W = 1080;
export const H = 1920;
export const TITLE = "Message Queue";

// ─── Bố cục ───────────────────────────────────────────────────────────────
export const PRESS = { x: 540, y: 424, w: 300, h: 150 }; // máy dập
export const PRESS_MOUTH = { x: 540, y: 540 }; // chỗ task rơi ra

export const CHUTE = { x: 540, topY: 566, botY: 1206, w: 208 }; // máng xếp hàng
export const BLOCK = { w: 152, h: 62 };
export const SLOT_PITCH = 70; // khoảng cách tâm hai task xếp chồng
export const SLOT0_Y = CHUTE.botY - 36; // tâm task ở ĐÁY máng (ra trước — FIFO)
export const CAP_VISIBLE = Math.floor((CHUTE.botY - CHUTE.topY) / SLOT_PITCH); // 9
export const slotY = (i: number) => SLOT0_Y - i * SLOT_PITCH;

export const WORKERS = [
  { x: 316, y: 1454 }, // worker 1 — luôn có
  { x: 764, y: 1454 }, // worker 2 — chỉ đến khi dồn việc
];
export const WORKER_R = 96;

export const DEPTH_HUD = { x: 872, y: 700 }; // bảng độ sâu hàng đợi

// ─── Nhịp sản xuất & xử lý (frame) ────────────────────────────────────────
export const SERVICE = 24; // worker xử lý một task hết bao lâu
export const MOVE = 10; // task rời máng bay tới worker (nằm TRONG SERVICE)
export const RATE_CALM = 30; // bình thường: 1 task / 30f  (chậm hơn SERVICE ⇒ kịp)
export const RATE_BURST = 10; // cao điểm: 1 task / 10f  (một worker KHÔNG kịp)

/** Lịch dập: bình thường → cao điểm → bình thường rồi ngưng để máng kịp cạn. */
const stamps: number[] = [];
for (let f = 30; f <= 90; f += RATE_CALM) stamps.push(f); // 3 task êm
for (let f = 110; f <= 270; f += RATE_BURST) stamps.push(f); // cao điểm
for (let f = 300; f <= 360; f += RATE_CALM) stamps.push(f); // về bình thường
export const STAMPS = stamps;
export const BURST_FROM = 110;
export const BURST_TO = 270;

export const PUNCH = 12; // số frame một cú dập

// Worker phụ: đến khi việc dồn, rời khi đã cạn
export const W2_IN = 206;
export const W2_READY = 220; // bắt đầu nhận việc
export const W2_OUT = 400;
export const W2_GONE = 424;

export const DEEP = 4; // ngưỡng "đang dồn việc" — HUD chuyển cảnh báo
export const RESET = 424; // sau đây mọi thứ đã xong, chỉ còn nhịp nền

export const BREATHE = 120; // 480/4 — chia hết LOOP ⇒ seamless
export const TREAD_K = 8; // số vòng tread/loop (nguyên ⇒ seamless)

export type Pt = { x: number; y: number };

// Rate Limit V2 — bỏ hết scoreboard. Cơ chế tự kể, không có số nào đọc hộ.
//
// Khác V1:
//   1. Không stat bar, không latency. Đống hàng đợi CHÍNH LÀ latency.
//   2. Server có vòng chạy quanh viền — MỘT vòng = MỘT request xử lý xong.
//      Vòng luôn dài đúng SERVICE frame → "server không bao giờ đổi nhịp"
//      từ chỗ phải đọc thành chỗ nhìn thấy.
//   3. 429 quay về bằng ĐƯỜNG RIÊNG, tách hẳn khỏi đường đi tới.
//   4. Header chỉ còn handle + title.

export const FPS = 30;
export const LOOP = 600; // 20s

// ─── Chốt chặn kỹ thuật ────────────────────────────────────────────────
// Server xử lý đúng 1 request / 8 frame — Y HỆT ở cả ba act, không bao giờ đổi.
export const SERVICE = 8;
export const MS_PER_SERVICE = 25; // chỉ dùng cho nhãn: 1 frame = 3.125ms

// Hai client KHÔNG được đặt tên theo vai trò ("app" hiền / "batch" phá) —
// tên như thế là nói hộ người xem ai có lỗi. Chúng chỉ là client 1 và
// client 2; khác nhau duy nhất ở NHỊP GỬI, và nhịp thì nhìn là thấy.
// Sự thật nằm ở ba con số này, không nằm ở cái tên:
//   c1  1/40f =  8 req/s — dưới ngưỡng limit, không bao giờ dính 429
//   c2  1/8f  = 40 req/s — bằng ĐÚNG dung lượng server một mình nó → rớt 75%
//   limit 1/32f = 10 req/s mỗi client
export const C1_PERIOD = 40;
export const C2_PERIOD = 8;
export const LIMIT_PERIOD = 32;

export const SPEED = 22; // px/frame — MỘT tốc độ cho mọi packet
export const SHIFT = 6; // frames — hàng đợi nhích xuống một chỗ
export const REJ_WINDOW = 96; // frames — cửa sổ trượt (chỉ để verify)

// ─── Timeline ──────────────────────────────────────────────────────────
export const C2_IN = 170;
export const LIMIT_IN = 430;
export const C2_OUT = 556;
export const RESET = 570;

// ─── Layout 1080×1920 ─────────────────────────────────────────────────
// Header 2 dòng: y 100–270. Stage: y 310–1820 = 1510px.
export const W = 1080;
export const H = 1920;
export const AXIS = 540;

// w=380 chứ không phải 340: nhãn "CLIENT 2" (mono 30px) rộng ~178px, số
// "40 req/s" căn phải rộng ~106px — ở 340 thì hai cái đâm vào nhau.
// Đổi nhãn là phải đo lại chỗ, không chỉ gõ chữ mới vào.
export const CLIENT = { y: 380, h: 110, w: 380 };
export const CLIENT_BOTTOM = CLIENT.y + CLIENT.h; // 490
export const C1_X = 110; // 110..490, tâm 300
export const C2_X = 590; // 590..970, tâm 780
export const C1_CX = 300;
export const C2_CX = 780; // đối xứng quanh trục 540

export const GATE = { x: 140, y: 580, w: 800, h: 52 }; // 140..940, tâm 540
export const GATE_CY = GATE.y + GATE.h / 2; // 606

// 429 bật RA NGOÀI theo đường riêng, về góc ngoài của chính client nó.
// Tách hẳn khỏi đường đi tới → nhìn là biết ngay "cái này bị trả về".
//
// Bezier bậc 2, điểm điều khiển đặt ở GÓC (rx, GATE_CY): packet chạm gate rồi
// văng NGANG ra, cong dần lên rồi chui thẳng đứng vào client. Tiếp tuyến đầu
// nằm ngang, tiếp tuyến cuối thẳng đứng — đúng cảm giác nảy khỏi vật cản.
export const REJECT_TO: Record<"c1" | "c2", { x: number; y: number }> = {
  c1: { x: 150, y: CLIENT_BOTTOM }, // mép ngoài của client 1
  c2: { x: 940, y: CLIENT_BOTTOM }, // mép ngoài của client 2
};

/** Điểm trên đường bật 429, t = 0→1. Sim và SVG dùng CHUNG hàm này. */
export const rejectAt = (owner: "c1" | "c2", t: number) => {
  const cx = owner === "c1" ? C1_CX : C2_CX;
  const to = REJECT_TO[owner];
  return {
    x: cx * (1 - t) * (1 - t) + to.x * (2 * t - t * t),
    y: GATE_CY * (1 - t * t) + to.y * t * t,
  };
};

// Độ dài cung đo bằng cách lấy mẫu — để cú bật giữ ĐÚNG tốc độ SPEED như mọi
// packet khác, không phải một con số đoán bừa.
const arcLen = (() => {
  let len = 0;
  let p = rejectAt("c1", 0);
  for (let i = 1; i <= 48; i++) {
    const q = rejectAt("c1", i / 48);
    len += Math.hypot(q.x - p.x, q.y - p.y);
    p = q;
  }
  return len;
})();
export const BOUNCE_FRAMES = Math.round(arcLen / SPEED);

// Hai nhánh hội tụ về trục bằng đường cong S, không phải gấp khúc.
// 120px để đường cong có chỗ thở — 60px thì nó bẹt như cái gạch ngang.
export const MERGE_DIST = 120;
export const MERGE_Y = GATE_CY + MERGE_DIST; // 726
// Điểm điều khiển ở 1/3 và 2/3 chiều dọc → y TUYẾN TÍNH theo tham số bezier,
// và x rơi đúng vào smoothstep. Nhờ vậy sim chỉ cần đổi lerp → smoothstep là
// đường bay khớp TUYỆT ĐỐI với đường vẽ. Vẽ một đằng bay một nẻo là nói dối.
export const MERGE_CP = MERGE_DIST / 3;
export const smoothstep = (t: number) => t * t * (3 - 2 * t);

// Hàng đợi neo ĐÁY (cửa server), phình LÊN. Đống càng cao packet càng dừng
// sớm — chạm đuôi hàng ngay. Đống CHÍNH LÀ latency, không cần con số nào.
// Đỉnh thật ~8 gói (verify.ts). Trần: (1040-632)/34 = 12 chỗ.
export const QUEUE_BOTTOM = 1040;
export const QUEUE_PITCH = 34;
export const PACKET = 28;

// To và góc cạnh — vòng chạy quanh viền phải đọc được.
export const SERVER = { x: 290, y: 1100, w: 500, h: 340 };

// ─── Nội dung ──────────────────────────────────────────────────────────
export const TITLE = "Rate Limit";
export const LABEL: Record<"c1" | "c2", string> = {
  c1: "client 1",
  c2: "client 2",
};

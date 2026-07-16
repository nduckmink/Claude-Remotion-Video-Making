// Pub / Sub — hằng số scene.
//
// Ý DUY NHẤT của loop: publisher phải biết TỪNG service. Thêm một service là
// phải sửa publisher; chưa sửa thì nó không nhận được gì. Broker làm cái giá
// đó bằng 0.
//
// Con số kể chuyện: SỐ LẦN GỬI của publisher mỗi lần publish — 3 rồi 1.
// Không viết nó ra ở đâu cả; đếm packet rời publisher là ra.

export const FPS = 30;

// 672 = 16 × 42. Scene CÓ audio nên LOOP phải là bội của 16 frame:
// 25 AAC frame = 16 video frame @30fps/48kHz — chỉ ở đó container mới cắt khít.
export const LOOP = 672; // 22.4s

// ─── Chốt chặn kỹ thuật ────────────────────────────────────────────────

/** px/frame — MỘT tốc độ cho mọi packet, ở mọi act. */
export const SPEED = 22;

/**
 * Frame giữa hai lần gửi liên tiếp của MỘT thành phần đang fan-out.
 *
 * Đây là hằng số quan trọng nhất file này. Gửi trực tiếp là TUẦN TỰ —
 * publisher chạy `for (s of subs) send(s)`, không bắn một phát ra ba nơi.
 * Cho ba packet rời publisher cùng frame là vẽ sai cơ chế.
 *
 * Luật áp cho BẤT KỲ thành phần nào fan-out: direct thì publisher so le,
 * pub/sub thì broker so le. Nhờ vậy "ai đang gánh việc phát tán" nhìn là
 * thấy — nó nằm ở chỗ nào có nhịp so le.
 */
export const SEND_STAGGER = 5;

/**
 * Broker nhận rồi mới phát — một hop có giá của nó.
 *
 * 12 chứ không phải 6, và đây KHÔNG phải con số thẩm mỹ. Đường chéo tới svc 1
 * dài 861px, còn đường qua broker chỉ 380 + 300 = 680px — hình học của layout
 * tự nó làm broker tới nơi SỚM HƠN direct 2 frame. Để nguyên là video tuyên bố
 * "thêm một hop thì nhanh hơn", một lời nói dối sinh ra từ chỗ ngồi của các
 * node chứ không phải từ cơ chế.
 *
 * 12 frame đẩy broker chậm hơn direct 4–6 frame ở MỌI service — đúng chiều
 * thực tế. verify.ts canh, vì đổi toạ độ một node là con số này hỏng.
 */
export const BROKER_HOLD = 12;

/** Nhịp publish. GIỮ NGUYÊN ở cả direct lẫn pub/sub — xem verify.ts. */
export const PERIOD = 58;

// ─── Layout 1080×1920 ─────────────────────────────────────────────────
// Header 2 dòng: y 100–270. Stage: y 310–1820 = 1510px.
export const W = 1080;
export const H = 1920;
export const AXIS = 540;

export const PUB = { x: 360, y: 380, w: 360, h: 120 };
export const PUB_OUT = { x: AXIS, y: PUB.y + PUB.h }; // (540, 500)

// radius 4: nền móng thì góc cạnh (trục "bo góc" — style_guide.md).
// Rộng đúng bằng hàng service để 4 đường dọc rơi thẳng từ đáy nó xuống.
export const BROKER = { x: 130, y: 880, w: 820, h: 120, radius: 4 };
export const BROKER_IN_PT = { x: AXIS, y: BROKER.y }; // (540, 880)
export const BROKER_OUT_Y = BROKER.y + BROKER.h; // 1000

// 4×184 + 3×28 = 820 → hàng nằm gọn x 130–950, đối xứng quanh trục 540.
// Không tràn sang action rail của TikTok/Reels (x 950–1080 ở dải y 1000–1750).
export const SVC = { y: 1300, h: 140, w: 184, gap: 28, x0: 130 };
export const N_TOTAL = 4;
export const N_INITIAL = 3; // svc 4 mọc ra giữa loop

export const svcX = (i: number) => SVC.x0 + i * (SVC.w + SVC.gap);
export const svcCX = (i: number) => svcX(i) + SVC.w / 2; // 222, 434, 646, 858

// ─── Đường đi ─────────────────────────────────────────────────────────
// SVG gọi segAt() để vẽ, sim gọi segAt() để bay. Không thể lệch nhau.

export type Seg = { x0: number; y0: number; x1: number; y1: number };

/** Điểm trên đoạn, t = 0→1. HÀM DÙNG CHUNG giữa bản vẽ và mô phỏng. */
export const segAt = (s: Seg, t: number) => ({
  x: s.x0 + (s.x1 - s.x0) * t,
  y: s.y0 + (s.y1 - s.y0) * t,
});

/**
 * Mọi đường trong scene này là đoạn THẲNG, nên hypot chính là độ dài cung —
 * chính xác tuyệt đối, không phải một con số đoán. (Đường cong thì phải đo
 * bằng lấy mẫu; ở đây không có đường cong nào.)
 */
export const segLen = (s: Seg) => Math.hypot(s.x1 - s.x0, s.y1 - s.y0);

/** Số frame để đi hết đoạn ở đúng SPEED — tính ra, không gõ. */
export const segFrames = (s: Seg) => Math.round(segLen(s) / SPEED);

/** Direct: publisher tự nối tới TỪNG service. Mỗi kết nối một nan quạt riêng. */
export const DIAG: Seg[] = Array.from({ length: N_TOTAL }, (_, i) => ({
  x0: PUB_OUT.x,
  y0: PUB_OUT.y,
  x1: svcCX(i),
  y1: SVC.y,
}));

/** Pub/sub: publisher chỉ còn MỘT cọng. */
export const STEM: Seg = {
  x0: PUB_OUT.x,
  y0: PUB_OUT.y,
  x1: BROKER_IN_PT.x,
  y1: BROKER_IN_PT.y,
};

/** Broker phát ra — 4 đường dọc song song, dài bằng nhau. */
export const VERT: Seg[] = Array.from({ length: N_TOTAL }, (_, i) => ({
  x0: svcCX(i),
  y0: BROKER_OUT_Y,
  x1: svcCX(i),
  y1: SVC.y,
}));

export const DIAG_FRAMES = DIAG.map(segFrames); // [39, 37, 37, 39]
export const STEM_FRAMES = segFrames(STEM); // 17
export const VERT_FRAMES = VERT.map(segFrames); // [14, 14, 14, 14]

// ─── Timeline ──────────────────────────────────────────────────────────
// Direct và pub/sub dùng CHUNG một nhịp publish. Cho pub/sub publish dày hơn
// là vô tình tuyên bố "broker làm publish nhanh hơn" — một lời nói dối.
export const PUBLISH_DIRECT = [0, 58, 116, 174, 232, 290];
export const PUBLISH_BROKER = [464, 522, 580];

export const SVC4_IN = 100;
export const SVC4_IN_DUR = 20;

/** Đường đứt tới svc 4: kết nối đáng lẽ phải có, nhưng chưa ai nối. */
export const DASH_IN = 140;
export const DASH_IN_DUR = 16;
export const DASH_BLINK = 24; // frame/chu kỳ nhấp nháy

// Nan quạt và đường đứt cùng tan TRƯỚC khi broker draw-in: hai vệt accent
// chồng nhau là đèn rọi chiếu hai chỗ — vỡ luật.
export const DIAG_OUT = 360;
export const DIAG_OUT_DUR = 16;
export const DASH_OUT = 360;
export const DASH_OUT_DUR = 16;

export const BROKER_DRAW = 384;
export const BROKER_DRAW_DUR = 24;
/** Xong việc thì nhả accent — nếu không, accent tích tụ tới khi cả khung có màu. */
export const BROKER_CALM = 410;
export const BROKER_CALM_DUR = 24;

export const STEM_DRAW = 408;
export const STEM_DRAW_DUR = 14;
export const VERT_DRAW = 414;
export const VERT_DRAW_STAGGER = 6;
export const VERT_DRAW_DUR = 14; // đường cuối xong ở 414 + 18 + 14 = 446
// → publish đầu tiên của pub/sub ở 464: 18 frame để đọc bộ dây mới trước khi
//   có gì chạy trên nó. Trạng thái quan trọng hold tối thiểu 15 frame.

export const RESET = 650;
export const RESET_DUR = 22; // 650 + 22 = 672 = LOOP → f672 trùng khít f0

// ─── Hiệu ứng ──────────────────────────────────────────────────────────
export const RECV_FLASH = 10; // service loé TRẮNG khi nhận — xong thì im
export const MISS_FLASH = 14; // svc 4 nháy ACCENT khi cả đám nhận mà nó không
export const RIPPLE_DUR = 14;

// ─── Nội dung ──────────────────────────────────────────────────────────
export const TITLE = "Pub / Sub";
export const PUB_LABEL = "publisher";
export const BROKER_LABEL = "broker";
/**
 * Nhãn GỌI TÊN, không PHÁN XÉT. Bốn service giống hệt nhau — khác biệt duy
 * nhất là svc 4 tới sau, và cái đó nhìn là thấy chứ không cần đọc.
 *
 * Đổi nhãn là phải ĐO LẠI CHỖ: mono 30px, advance 0.6em → "SVC 1" ≈ 5×18px
 * + letterSpacing 0.14em × 5 ≈ 111px, lọt trong 184px. Dài hơn là đâm mép.
 */
export const SVC_LABEL = (i: number) => `svc ${i + 1}`;
export const LABEL_SIZE = 30;

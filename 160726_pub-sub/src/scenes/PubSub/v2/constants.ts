// Pub / Sub V2 — hằng số scene.
//
// Khác V1:
//   1. Nét dày gấp đôi (1.5 → 3px). Đổi lại trục "độ dày viền" phải nới theo:
//      accent giờ là 6px, nếu không thì hết phân biệt được "đang được nhấn".
//   2. Mỗi service một MÀU, path cùng màu. Cố ý phá luật đèn rọi của
//      style_guide.md — xem ghi chú ở SVC_COLORS trong lib/tokens.ts.
//   3. Packet → phong bì. Màu phong bì CHÍNH LÀ địa chỉ người nhận.
//   4. Nhãn theo tình huống thật (tiếng Việt), có subtitle.
//   5. Broker là hình TRÒN, và subscriber tự BAY LÊN cắm vào nó.
//
// Ý vẫn y nguyên V1: publisher phải biết TỪNG service. Con số kể chuyện vẫn là
// SỐ LẦN GỬI của publisher — 3 rồi 1.

export const FPS = 30;
export const LOOP = 672; // 22.4s — bội của 16 vì có audio (25 AAC = 16 video frame)

// ─── Chốt chặn kỹ thuật ────────────────────────────────────────────────
export const SPEED = 22; // px/frame — MỘT tốc độ cho mọi thứ đang bay

/**
 * Gửi trực tiếp là TUẦN TỰ: publisher chạy `for (s of subs) send(s)`.
 * Luật áp cho bất kỳ thành phần nào fan-out — nhìn chỗ nào có nhịp so le là
 * biết ai đang gánh việc phát tán.
 */
export const SEND_STAGGER = 5;
export const PERIOD = 58; // nhịp publish — GIỮ NGUYÊN ở cả hai act

// ─── Layout 1080×1920 ─────────────────────────────────────────────────
export const W = 1080;
export const H = 1920;
export const AXIS = 540;

export const STROKE = 3; // gấp đôi V1
export const STROKE_ACCENT = 6;

export const PUB = { x: 330, y: 380, w: 420, h: 140 };
export const PUB_OUT = { x: AXIS, y: PUB.y + PUB.h }; // (540, 520)

/**
 * Broker tròn. Trục "bo góc" trong style_guide.md bảo càng góc cạnh càng là
 * nền móng — hình tròn là đi ngược. Chấp nhận: một topic là chỗ mọi thứ TỤ VỀ
 * rồi TOẢ RA, và cái chốt cắm quanh vành thì chỉ hình tròn mới đỡ được.
 */
export const BROKER_C = { cx: AXIS, cy: 950, r: 165 };
export const BROKER_TOP = { x: AXIS, y: BROKER_C.cy - BROKER_C.r }; // (540, 785)

// 4×190 + 3×20 = 820 → x 130–950, đối xứng quanh 540, né action rail TikTok.
export const SVC = { y: 1300, h: 175, w: 190, gap: 20, x0: 130 };
export const N_TOTAL = 4;
export const N_INITIAL = 3;

export const svcX = (i: number) => SVC.x0 + i * (SVC.w + SVC.gap);
export const svcCX = (i: number) => svcX(i) + SVC.w / 2; // 225, 435, 645, 855

/** Điểm dữ liệu vào/ra của một service: đỉnh node, trên trục dọc của nó. */
export const svcAnchor = (i: number) => ({ x: svcCX(i), y: SVC.y });

// ─── Đường đi ─────────────────────────────────────────────────────────
export type Seg = { x0: number; y0: number; x1: number; y1: number };

/** Điểm trên đoạn, t = 0→1. HÀM DÙNG CHUNG giữa bản vẽ và mô phỏng. */
export const segAt = (s: Seg, t: number) => ({
  x: s.x0 + (s.x1 - s.x0) * t,
  y: s.y0 + (s.y1 - s.y0) * t,
});

/** Đoạn thẳng ⇒ hypot CHÍNH LÀ độ dài cung, chính xác tuyệt đối. */
export const segLen = (s: Seg) => Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
export const segFrames = (s: Seg) => Math.max(1, Math.round(segLen(s) / SPEED));

/**
 * Chốt cắm của service i trên VÀNH broker — nằm đúng trên hướng từ tâm broker
 * tới service đó. Nhờ vậy spoke là nan hoa xuyên tâm, và cái chốt rơi chính
 * xác lên đường tròn chứ không "gần gần" (verify.ts đo lại).
 */
export const attachPt = (i: number) => {
  const a = svcAnchor(i);
  const dx = a.x - BROKER_C.cx;
  const dy = a.y - BROKER_C.cy;
  const d = Math.hypot(dx, dy);
  return {
    x: BROKER_C.cx + (dx / d) * BROKER_C.r,
    y: BROKER_C.cy + (dy / d) * BROKER_C.r,
  };
};

/** Direct: publisher tự nối tới TỪNG service. Mỗi kết nối một nan quạt riêng. */
export const DIAG: Seg[] = Array.from({ length: N_TOTAL }, (_, i) => ({
  x0: PUB_OUT.x,
  y0: PUB_OUT.y,
  x1: svcAnchor(i).x,
  y1: svcAnchor(i).y,
}));

/** Pub/sub: publisher chỉ còn MỘT cọng, và nó KHÔNG mang màu của ai cả. */
export const STEM: Seg = {
  x0: PUB_OUT.x,
  y0: PUB_OUT.y,
  x1: BROKER_TOP.x,
  y1: BROKER_TOP.y,
};

/** Nan hoa: từ chốt cắm trên vành broker xuống service. */
export const SPOKE: Seg[] = Array.from({ length: N_TOTAL }, (_, i) => {
  const p = attachPt(i);
  const a = svcAnchor(i);
  return { x0: p.x, y0: p.y, x1: a.x, y1: a.y };
});

/**
 * Cú đăng ký: service tự mang chốt BAY LÊN cắm vào topic — đúng chiều thực tế
 * (subscriber chủ động đăng ký, broker không đi tìm ai). Chính là SPOKE đảo
 * đầu: bay lên đường nào thì lát nữa dây mọc ra đúng đường đó.
 */
export const SUB_FLY: Seg[] = SPOKE.map((s) => ({
  x0: s.x1,
  y0: s.y1,
  x1: s.x0,
  y1: s.y0,
}));

export const DIAG_FRAMES = DIAG.map(segFrames);
export const STEM_FRAMES = segFrames(STEM);
export const SPOKE_FRAMES = SPOKE.map(segFrames);
export const SUB_FLY_FRAMES = SUB_FLY.map(segFrames);

/**
 * Broker giữ phong bì bao lâu trước khi nhân bản ra 4.
 *
 * KHÔNG phải con số thẩm mỹ: đường chéo trực tiếp dài hơn đường qua broker,
 * nên hình học của layout tự nó làm thêm-một-hop hoá ra NHANH HƠN. Để nguyên
 * là video nói dối. 18 đẩy broker chậm hơn direct ở MỌI service.
 *
 * V1 dùng 12 là đủ; V2 phải lên 18 vì broker tròn kéo nan hoa ngắn lại. Đổi
 * bán kính broker là con số này phải tính lại — verify.ts canh.
 */
export const BROKER_HOLD = 18;

// ─── Timeline ──────────────────────────────────────────────────────────
export const PUBLISH_DIRECT = [0, 58, 116, 174, 232];
export const PUBLISH_BROKER = [464, 522, 580];

export const SVC4_IN = 100;
export const SVC4_IN_DUR = 20;

export const DASH_IN = 140;
export const DASH_IN_DUR = 16;
export const DASH_BLINK = 24;

// Nan quạt + đường đứt tan TRƯỚC khi broker sáng: hai vệt accent chồng nhau
// là đèn rọi chiếu hai chỗ.
export const DIAG_OUT = 300;
export const DIAG_OUT_DUR = 16;
export const DASH_OUT = 300;
export const DASH_OUT_DUR = 16;

export const BROKER_DRAW = 324;
export const BROKER_DRAW_DUR = 24;
export const BROKER_CALM = 350; // xong việc thì nhả accent
export const BROKER_CALM_DUR = 24;

export const STEM_DRAW = 352;
export const STEM_DRAW_DUR = 14;

/** Bốn cú đăng ký, lần lượt — không đồng loạt. Mỗi service tự đi đăng ký. */
export const SUB_IN = 370;
export const SUB_STAGGER = 12;
export const SNAP_DUR = 12; // ring loé lúc cắm vào
export const SPOKE_DRAW_DUR = 14;

export const subFlyStart = (i: number) => SUB_IN + i * SUB_STAGGER;
export const attachAt = (i: number) => subFlyStart(i) + SUB_FLY_FRAMES[i];
export const spokeReady = (i: number) => attachAt(i) + SPOKE_DRAW_DUR;

export const RESET = 652;
export const RESET_DUR = 20; // 652 + 20 = 672 = LOOP → f672 trùng khít f0

// ─── Hiệu ứng ──────────────────────────────────────────────────────────
export const RECV_FLASH = 10;
export const MISS_FLASH = 14;
export const RIPPLE_DUR = 14;

// ─── Nội dung ──────────────────────────────────────────────────────────
export const TITLE = "Pub / Sub";

export const PUB_LABEL = "Đơn hàng";
export const PUB_SUB = "publisher";
export const BROKER_LABEL = "broker";
export const BROKER_SUB = "topic: đơn hàng mới";

/**
 * Nhãn GỌI TÊN, không PHÁN XÉT — bốn cái tên chỉ nói mỗi việc "tôi là gì".
 * Không cái nào hé lộ cái nào sẽ trượt; "Báo cáo doanh thu" nghe cũng bình
 * thường như ba cái kia. Khác biệt duy nhất là nó tới sau, và cái đó thì nhìn
 * là thấy chứ không cần đọc.
 *
 * Đổi nhãn là phải ĐO LẠI CHỖ: nhãn xuống dòng theo dấu cách, nên cái đáng lo
 * là TỪ DÀI NHẤT ("doanh"/"thu" → "DOANH THU" 9 ký tự), không phải cả câu.
 * verify.ts đo lại mỗi lần build.
 */
export const SVC_LABEL = ["Hoá đơn", "Tồn kho", "Email", "Báo cáo doanh thu"];

export const LABEL_SIZE = 30;
export const SVC_LABEL_SIZE = 26;
export const SVC_LABEL_SPACING = "0.04em"; // 0.14em thì "DOANH THU" đâm mép
export const SUB_SIZE = 21;

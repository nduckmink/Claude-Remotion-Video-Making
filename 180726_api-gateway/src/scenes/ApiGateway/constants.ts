// API Gateway — hằng số scene.
//
// Ý DUY NHẤT của loop:
//
//   Không gateway: client phải tự biết service Ở ĐÂU và tự chứng minh MÌNH
//   LÀ AI với TỪNG cái. Có gateway: cả hai thứ đó dời vào MỘT chỗ. Đổi cái
//   nào — chỉ gateway đổi, client không đụng gì.
//
// Địa chỉ và auth không phải hai ý — chúng là HAI VÍ DỤ của cùng một thứ: mối
// bận tâm xuyên suốt. Cột sống của video: "có một thay đổi xảy ra, xem nó rơi
// vào ĐÂU."
//
// Hai mặt, hai kênh, không chồng nhau:
//   A (auth)    = sự thật TĨNH. Đếm ổ khoá: 3 → 1. Nhìn still cũng thấy.
//   B (địa chỉ) = sự thật ĐỘNG. Cú thay đổi: svc B rung, port đổi, kết nối
//                 ĐỨT (dashed accent nhấp nháy). Act 1 đứt phía CLIENT; act 2
//                 chỉ đứt spoke NỘI BỘ của gateway, client không hề nhúc nhích.

export const FPS = 30;
export const LOOP = 720; // 24s — bội của 16 (×45). Act 2 cần chỗ cho chuỗi update.

export const SPEED = 22; // px/frame — MỘT tốc độ cho mọi packet
export const W = 1080;
export const H = 1920;
export const AXIS = 540;
export const STROKE = 3;

// ─── Layout RADIAL, out-of-grid ───────────────────────────────────────
// Không hàng lối: service tán ra góc lệch tự nhiên ở nửa dưới. Client trên
// đỉnh; act 2 gateway CHEN vào giữa client và đám tán.
//
// Né action rail (x 950–1080, y 1000–1750): mọi node giữ mép phải < 950.
export const CLIENT = { x: 410, y: 366, w: 260, h: 108 };
export const CLIENT_C = { x: CLIENT.x + CLIENT.w / 2, y: CLIENT.y + CLIENT.h / 2 };

export const GATEWAY = { x: 410, y: 712, w: 260, h: 120 };
export const GATEWAY_C = { x: GATEWAY.x + GATEWAY.w / 2, y: GATEWAY.y + GATEWAY.h / 2 };

/** Ba service, TÁN — mỗi cái một khoảng cách và góc riêng so với tâm. Không
 *  đều nhau là cố ý: hàng lối đều tăm tắp là cái đang muốn bỏ. */
export const SVC = { w: 200, h: 104 };
export type SvcDef = { id: string; label: string; port: string; portNew: string };
export const SERVICES: SvcDef[] = [
  { id: "orders", label: "orders", port: ":8080", portNew: ":8080" },
  { id: "users", label: "users", port: ":8080", portNew: ":9090" }, // CÁI NÀY đổi port
  { id: "cart", label: "cart", port: ":8080", portNew: ":8080" },
];
/** Tâm mỗi service. svc[1] (users) là cái sẽ rung + đổi port + đứt kết nối. */
export const SVC_C = [
  { x: 250, y: 1130 },
  { x: 830, y: 940 },
  { x: 600, y: 1320 },
];
export const CHANGED = 1; // index của service đổi port

export const svcBox = (i: number) => ({
  x: SVC_C[i].x - SVC.w / 2,
  y: SVC_C[i].y - SVC.h / 2,
});

// ─── Đường đi ─────────────────────────────────────────────────────────
export type Pt = { x: number; y: number };
export const at = (a: Pt, b: Pt, t: number) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
export const frames = (a: Pt, b: Pt) => Math.max(1, Math.round(dist(a, b) / SPEED));

/** Act 1: client nối THẲNG tới từng service. Ba đường dài, khác độ dài. */
export const directFrames = SVC_C.map((s) => frames(CLIENT_C, s));
/** Act 2: client → gateway, rồi gateway → từng service (spoke ngắn). */
export const stemFrames = frames(CLIENT_C, GATEWAY_C);
export const spokeFrames = SVC_C.map((s) => frames(GATEWAY_C, s));

/** Ổ khoá đặt ở giữa kết nối client-side: 52% từ client tới đích. */
export const LOCK_T = 0.52;
export const lockDirect = (i: number) => at(CLIENT_C, SVC_C[i], LOCK_T);
export const lockStem = at(CLIENT_C, GATEWAY_C, LOCK_T);

// ─── Nhịp & timeline ──────────────────────────────────────────────────
export const N_SVC = 3;
export const FANOUT_STAGGER = 9; // packet rời client so le — easeInOut chậm đầu
                                 // nên phải giãn đủ để hai packet không dính chùm
export const WORK = 10; // service xử lý
export const LOCK_CHECK = 8; // ổ khoá kiểm
export const INTRO = 22; // đường + khoá vẽ vào lúc act mở màn

// Act 1: không gateway. fire(ok) → change(B đứt + 404) → refire(B rớt lại) →
// GIỮ NGUYÊN ĐỨT tới hết act. Client kẹt, không tự vá được — đó là nỗi đau.
export const A1 = {
  start: 0,
  fire: 38,
  change: 156, // svc B rung, port đổi, 404 bay lên, kết nối đứt
  refire: 210, // client thử lại — B rớt (404 lần nữa), A/C ok
  reset: 320,
};
// Act 2: có gateway. Cú thay đổi đứt spoke NỘI BỘ. Không tự nối: một khối
// UPDATE xanh lá bay vào gateway rồi spoke mới lành — "chỉ sửa MỘT chỗ". Rồi
// nhiều update khác nữa (role, quyền): MỌI thay đổi xuyên suốt đều vào gateway.
export const GW_IN = 336;
export const GW_IN_DUR = 24;
export const A2 = {
  start: 336,
  fire: 380,
  change: 510, // cùng cú đổi port — spoke gateway→users đứt
  updateStart: 528, // khối update đầu bay vào
  updateGap: 52, // giãn giữa các update
  reset: 696,
};

/** Chuỗi update bay vào gateway. Cái ĐẦU (đổi địa chỉ) làm spoke lành lại;
 *  mấy cái sau chỉ để cho thấy gateway nuốt MỌI loại thay đổi xuyên suốt. */
export const UPDATES: { label: string; heals: boolean; strengthens: boolean }[] = [
  { label: "addr → :9090", heals: true, strengthens: false }, // routing → vá spoke
  { label: "+ admin role", heals: false, strengthens: true }, // auth → khoá to ra
  { label: "edit scopes", heals: false, strengthens: true }, // auth → khoá to ra
];
/** Mỗi update AUTH chạm gateway thì ổ khoá to thêm bấy nhiêu — "tăng cường". */
export const LOCK_GROW = 0.28;
/** Update trượt vào từ mép TRÁI (chỗ trống) tới gateway. */
export const UPDATE_FROM = { x: 150, y: 772 };
export const UPDATE = { w: 176, h: 44 };
export const UPDATE_FLY = 20;
export const UPDATE_ABSORB = 10; // gateway nuốt: khối tan, gateway loé

/** 404 bay lên tan dần — chỉ ở ACT 1. Act 2 gateway hấp thụ nên client KHÔNG
 *  bao giờ thấy 404; đó chính là điểm. */
export const ERR_RISE = 34;
export const ERR_TEXT = "404 not found";

export const SHAKE_DUR = 18;
export const SHAKE_AMP = 11;
export const BREAK_IN = 12; // kết nối chuyển sang trạng thái đứt
export const BLINK = 22; // chu kỳ nhấp nháy của đường đứt
export const DRAW_DUR = 16; // vẽ lại đường sau khi vá
export const PORT_FLIP = 10; // port đổi số

export const RESET = 696;
export const RESET_DUR = 24; // 696 + 24 = 720 = LOOP → f720 trùng khít f0

// ─── Hiệu ứng ──────────────────────────────────────────────────────────
export const RECV_FLASH = 10;
export const FAIL_FLASH = 16;
export const RIPPLE_DUR = 14;

// ─── Nội dung ──────────────────────────────────────────────────────────
export const TITLE = "API Gateway";
export const CLIENT_LABEL = "client";
export const GATEWAY_LABEL = "gateway";
export const LABEL_SIZE = 26;
export const SUB_SIZE = 18;

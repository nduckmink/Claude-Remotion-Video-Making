// Password Hashing V3 — hacker MANG ĐỒ TRỘM ĐI THỬ ĐĂNG NHẬP.
//
// Khác V2, và đây là khác biệt lớn nhất của cả dự án:
//   V2 so "mang đồ đi" (act 1) với "ném đồ đi" (act 2) — HAI hành động khác
//   nhau, nên người xem phải tự suy ra vì sao. V3 cho hacker làm ĐÚNG MỘT
//   việc y hệt ở cả hai act: cầm thứ vừa trộm đi gõ vào ô đăng nhập. Chỉ
//   KẾT QUẢ khác.
//
// Đó mới là thí nghiệm có đối chứng thật (creative_rule.md), và nó nói thẳng
// cái mà cả video muốn nói:
//
//   HASH KHÔNG PHẢI MẬT KHẨU, NÊN NÓ KHÔNG MỞ ĐƯỢC CỬA.
//
// Hacker vẫn LẤY ĐƯỢC ở cả hai act. Cái nó cầm về mới là chỗ khác nhau, và
// giờ chỗ khác nhau ấy được ĐEM ĐI THỬ chứ không để người xem đoán.

export const FPS = 30;
export const LOOP = 1088; // 36.3s — bội của 16 vì có audio (25 AAC = 16 video frame)

// ─── Chốt chặn kỹ thuật ────────────────────────────────────────────────
export const SPEED = 11; // px/frame — MỘT tốc độ trung bình cho mọi thứ bay

// ─── Layout 1080×1920 ─────────────────────────────────────────────────
export const W = 1080;
export const H = 1920;
export const AXIS = 540;
export const STROKE = 3;

export const FLOW_Y = 740;

/**
 * Ba trạm trong x 130–950, đối xứng quanh trục 540. bcrypt nằm ĐÚNG giữa.
 *
 * auth rộng 270 chứ không 200: nhãn `authentication` dài 14 ký tự = 222px ở
 * mono 24px, không lọt ô 200. Nới ô KHÔNG làm cú bay ngắn đi — quãng bay tính
 * từ TÂM tới TÂM, không phải từ mép tới mép.
 */
export const AUTH = { x: 130, y: 640, w: 270, h: 220 };
export const BCRYPT = { x: 440, y: 520, w: 200, h: 380 };
export const DATABASE = { x: 680, y: 640, w: 270, h: 320 };

export const AUTH_C = { x: AUTH.x + AUTH.w / 2, y: FLOW_Y }; // (265, 740)
export const ANVIL = { x: 540, y: FLOW_Y };
export const DB_ENTRY = { x: DATABASE.x, y: FLOW_Y }; // (680, 740)
export const BCRYPT_CX = BCRYPT.x + BCRYPT.w / 2;

// ─── Người dùng ────────────────────────────────────────────────────────
export const N_USERS = 3;
export const PASSWORD = ["hunter2", "123456", "123456"];
export const SALT = ["a3f2", "9c1d", "b58a"];
export const HASH = ["Kx9mQ2vRt8Lp", "Zp4nB7wLc1Ha", "Jb5tX3fWe9Zu"];

export const BLOCK = { w: 172, h: 36 };

export const HAMMER_ARM = 64;
export const HAMMER_HEAD = { x: 540, y: FLOW_Y - BLOCK.h / 2 - 13 };

/**
 * Cột mà mọi bản ghi nằm trong database. Sim VÀ verify phải cùng đọc hằng số
 * này — đừng ai tự gõ lại một biểu thức "tương đương".
 *
 * Đã trả giá: sim từng viết `x: HACKER_HIT.x` cho chỗ nằm trong database. Ở
 * bản húc THẲNG ĐỨNG, tâm hacker lúc va TÌNH CỜ trùng tâm database nên không
 * ai thấy. Sang bản húc CHÉO, tâm ấy lùi lại một bán kính dọc hướng bay —
 * lệch 36.7px. Còn verify thì kiểm slot(), tức kiểm một hàm mà sim KHÔNG DÙNG:
 * chốt chặn xanh trong khi màn hình lệch.
 */
export const SLOT_PITCH = 56;
export const DB_CX = DATABASE.x + DATABASE.w / 2; // 815
export const slotY = (p: number) => FLOW_Y + 50 + p * SLOT_PITCH;
export const slot = (p: number) => ({ x: DB_CX, y: slotY(p) });
export const SHIFT_DUR = 10;
export const SHIFT_LEAD = 16;

// ─── Đường đi ─────────────────────────────────────────────────────────
export type Pt = { x: number; y: number };
export const at = (a: Pt, b: Pt, t: number) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
export const frames = (a: Pt, b: Pt) => Math.max(1, Math.round(dist(a, b) / SPEED));

export const A_TO_DB = frames(AUTH_C, DB_ENTRY); // 38 — act 1, đi thẳng
export const A_TO_ANVIL = frames(AUTH_C, ANVIL); // 25
export const ANVIL_TO_DB = frames(ANVIL, DB_ENTRY); // 13
export const DB_TO_SLOT = frames(DB_ENTRY, slot(0));

// ─── Hacker ────────────────────────────────────────────────────────────
export const HACKER_R = 88;
export const HACKER_REST = { x: AXIS, y: 1560 };
export const HACKER_FADE = 12;

/** Đỉnh nhọn phải chạm: đáy database, ngay giữa. */
export const SPIKE = { x: DATABASE.x + DATABASE.w / 2, y: DATABASE.y + DATABASE.h };

export const DIR = (() => {
  const dx = SPIKE.x - HACKER_REST.x;
  const dy = SPIKE.y - HACKER_REST.y;
  const d = Math.hypot(dx, dy);
  return { x: dx / d, y: dy / d, d };
})();

/** Tâm lùi lại đúng một bán kính DỌC HƯỚNG BAY, để ĐỈNH NHỌN chạm đáy db. */
export const HACKER_HIT = {
  x: SPIKE.x - DIR.x * HACKER_R,
  y: SPIKE.y - DIR.y * HACKER_R,
};
export const HACKER_ROT = (Math.atan2(DIR.y, DIR.x) * 180) / Math.PI + 90;
export const HACKER_OUT = { x: AXIS, y: 1900 };
export const HACKER_RISE = frames(HACKER_REST, HACKER_HIT);

/**
 * Hiện ra rồi ĐỨNG IM một nhịp mới lao vào.
 *
 * Đây không phải chỗ nghỉ cho đẹp — nó là ANTICIPATION. Một cú lao không có
 * nhịp lấy đà thì không ai kịp thấy nó lấy đà, và cú va mất hết sức nặng.
 * 22 frame cũng vừa đủ để mắt kịp đăng ký "có thứ gì đó vừa xuất hiện" trước
 * khi thứ đó chuyển động.
 */
export const HACKER_BEAT = 22;

/**
 * Đồ ăn trộm treo dưới hacker.
 *
 * Giãn 56 chứ không 44, đúng bằng nhịp chồng trong database. Lý do không phải
 * đối xứng: cú ném dùng ease-in-out nên khối KHỞI ĐỘNG RẤT CHẬM — mấy frame
 * đầu nó nhích được ~13px, đủ để bóp khoảng cách 44 xuống 31 và đè vào khối
 * kế bên. Khối cao 36px thì 44 là chật; 56 mới đủ chỗ cho cú nhích ấy.
 */
export const LOOT_PITCH = 56;
export const loot = (p: number, hackerY: number) => ({
  x: HACKER_HIT.x,
  y: hackerY + 132 + p * LOOT_PITCH,
});

// ─── Cú thử đăng nhập — trái tim của V3 ───────────────────────────────
/**
 * Chỗ khối CHẠM ô auth: mép DƯỚI, ngay giữa. Cả hai act ném tới ĐÚNG điểm này
 * — giống nhau tới từng pixel, tới từng frame. Chỉ chuyện xảy ra SAU đó là
 * khác. Đổi điểm chạm giữa hai act là hỏng đối chứng.
 *
 * Mép DƯỚI chứ không mép phải: khe giữa auth (hết ở x=400) và bcrypt (bắt đầu
 * ở x=440) chỉ rộng 40px, mà khối rộng 172px — gõ ở mép phải thì khối LUÔN đè
 * lên bcrypt, và mảnh nảy ra cũng thế. Không hướng nảy nào cứu được; phải dời
 * chỗ gõ. Mà dời xuống dưới lại đúng hơn: hacker ở dưới khung, gõ từ dưới lên.
 */
export const KNOCK = { x: AUTH_C.x, y: AUTH.y + AUTH.h + BLOCK.h / 2 }; // (265, 878)

/**
 * 30 chứ không 24. Không phải nhịp cho đẹp: cú thử TIẾP THEO bay lên qua đúng
 * hành lang mà mảnh vừa bị hất đang rơi xuống. Ở 26 thì hai khối cách nhau
 * 166×1px — chồng nhau giữa không trung, đúng một frame. Mắt không thấy;
 * chốt chặn thấy.
 */
export const THROW_STAGGER = 30;
/** Act 1: xuyên tiếp vào tâm ô auth rồi tan — vào được. */
export const PASS_IN = 16;
/**
 * Act 2: nảy ra, xoay tít, tan.
 *
 * Hướng nảy CỐ ĐỊNH xuống-trái, không phải phản xạ gương. Phản xạ đúng vật lý
 * (lật dấu x, giữ y) hất khối lên-phải — tức ném thẳng vào ô bcrypt và che mất
 * nhãn của nó. Cửa sập thì hất sang chỗ TRỐNG; đúng vật lý mà đâm vào một
 * thành phần khác thì sơ đồ đọc ra là hai thứ va nhau, không phải một cú từ chối.
 *
 * Và nảy NGẮN (100px/18f), không phải văng xa: cú thử tiếp theo đang bay lên
 * qua đúng hành lang ấy. Văng 210px là mảnh vừa bị hất cắt ngang mặt khối đang
 * tới. Bị từ chối thì biến ngay, đừng nán lại giữa đường.
 */
export const BOUNCE_OUT = 14;
export const BOUNCE_DIST = 100;
export const BOUNCE_DIR = { x: -0.62, y: 0.78 }; // xuống-TRÁI: hành lang khối đang tới nằm bên PHẢI
export const BOUNCE_SPIN = 150; // độ

export const AUTH_FLASH = 14; // loé trắng: cửa mở
export const AUTH_ALARM = 18; // nháy cam: cửa đóng sập
export const AUTH_SHAKE = 20; // rung
export const SHAKE_AMP = 9;

// ─── Timeline ──────────────────────────────────────────────────────────
export const TYPE_DUR = 16;
export const TYPE_HOLD = 4;
export const GRAB = 18; // rút ruột database
/** Rút xong PHẢI cầm chắc trong tay rồi mới ném — 10f là lúc khối bay từ chồng
 *  vào tay. Ném trước khi rút xong thì khối vừa đang bay vào tay vừa đang bay
 *  đi, và `carrying` không bao giờ đủ ba. */
export const GRAB_SETTLE = 14;

// ── Act 1: lưu thẳng plaintext ──
export const A1_TYPE = [0, 36, 72];
export const A1_HACKER_IN = 165;
export const A1_LUNGE = A1_HACKER_IN + HACKER_BEAT + 12; // hiện xong, đứng một nhịp
export const A1_HIT = A1_LUNGE + HACKER_RISE;
export const A1_THROW = A1_HIT + GRAB + GRAB_SETTLE;
/** Sau cú thử CUỐI CÙNG. Cú thứ ba xong ở f≈403 (ném 331 + bay 56 + xuyên
 *  16); bỏ đi trước đó là hacker rời hiện trường giữa lúc còn đang gõ cửa. */
export const A1_LEAVE = 428;
export const A1_EXIT = 50;
export const A1_RESET = 490;

// ── Act 2: có bcrypt ──
export const BCRYPT_IN = 505;
export const BCRYPT_IN_DUR = 20;
export const A2_TYPE = [532, 586, 640];
export const SALT_FALL = 10;
export const HAMMER_SWING = 12;
export const HAMMER_UP = 10;
export const ANVIL_HOLD = SALT_FALL + HAMMER_SWING + HAMMER_UP;

export const A2_HACKER_IN = 760;
export const A2_LUNGE = A2_HACKER_IN + HACKER_BEAT + 12;
export const A2_HIT = A2_LUNGE + HACKER_RISE;
export const A2_THROW = A2_HIT + GRAB + GRAB_SETTLE;
/** Sau cú thử CUỐI: ném 918 + bay 56 + nảy 26 ≈ 996. */
export const A2_LEAVE = 1020;
export const A2_EXIT = 50;

export const RESET = 1076;
export const RESET_DUR = 12; // 1076 + 12 = 1088 = LOOP → f1088 trùng khít f0

// ─── Hiệu ứng ──────────────────────────────────────────────────────────
export const ALARM_FLASH = 18; // database nháy cam lúc bị húc
export const STORE_FLASH = 10;
export const RIPPLE_DUR = 16;

// ─── Nội dung ──────────────────────────────────────────────────────────
export const TITLE = "Password Hashing";
export const AUTH_LABEL = "authentication";
export const BCRYPT_LABEL = "bcrypt";
export const BCRYPT_SUB = "+ salt";
export const DB_LABEL = "database";
export const HACKER_LABEL = "hacker";

export const LABEL_SIZE = 24;
export const SUB_SIZE = 17;

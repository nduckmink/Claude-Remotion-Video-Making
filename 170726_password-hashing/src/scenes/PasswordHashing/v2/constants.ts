// Password Hashing V2 — hacker đứng CHÍNH GIỮA dưới khung, húc CHÉO vào database.
//
// Khác V1: V1 cho hacker trồi thẳng lên trong cột x=850 của database. Đổi lại
// được hai thứ:
//   1. Nó đứng trên trục 540 — chỗ trống giữa-dưới khung có người ngồi. Trục
//      NGANG trong khung DỌC bỏ không cả nửa dưới; đây là thứ lấp được.
//   2. Đường húc CẮT CHÉO cả khung thay vì trôi lên một cột. Cú tấn công không
//      còn song song với bất cứ thứ gì — nó đâm ngang qua mọi thứ.
//
// Bản chép ĐẦY ĐỦ, không `export *` rồi đè vài hằng: HACKER_RISE đổi (39 → 53f
// vì đường chéo dài hơn), mà A1_HIT / A1_LEAVE / A2_THROW… đều dẫn xuất từ nó.
// Đè một nửa thì mấy mốc kia vẫn tính theo HACKER_RISE CŨ — sai lặng lẽ.

// Hằng số scene.
//
// Ý DUY NHẤT của loop:
//   Hashing KHÔNG ngăn được trộm. Nó làm cho đồ ăn trộm thành vô dụng.
//
// Hacker lấy được ở CẢ HAI act — đó là mấu chốt, và là chỗ đa số hiểu sai
// (tưởng hash là để chống bị hack). Khác biệt duy nhất: thứ nó cầm về.
//
// Vì thế cú tấn công đâm TỪ DƯỚI LÊN thẳng vào database, vuông góc với dòng
// chảy ngang: hacker không đi qua frontend, không đi qua bcrypt. Nó vào thẳng
// kho. Đúng thực tế, và nói hộ: hash bảo vệ NỘI DUNG, không bảo vệ hàng rào.

export const FPS = 30;
export const LOOP = 880; // 29.3s — bội của 16 vì có audio (25 AAC = 16 video frame)

// ─── Chốt chặn kỹ thuật ────────────────────────────────────────────────

/**
 * px/frame — MỘT tốc độ cho mọi thứ đang bay, ở mọi act.
 *
 * 11 chứ không phải 22 như hai video trước: trục NGANG trong khung 9:16 chỉ
 * còn 820px cho ba trạm, nên quãng giữa các trạm ngắn. Ở 22 thì cú nhảy
 * frontend→bcrypt chạy hết 9 frame — sát ngưỡng 8 frame của motion_language.
 */
export const SPEED = 11;

// ─── Layout 1080×1920 ─────────────────────────────────────────────────
// Header 2 dòng: y 100–270. Stage: y 310–1820.
export const W = 1080;
export const H = 1920;
export const AXIS = 540;
export const STROKE = 3;

/**
 * Trục dòng chảy: NGANG, ở đúng cao độ này — và MỌI trạm phải cắm vào nó.
 *
 * Nằm NGAY TRÊN chồng bản ghi, không trùng slot nào. Cho slot 0 ngồi đúng
 * trên đường ống là bản ghi đang bay đè lên bản ghi đã lưu — chồng dữ liệu
 * lên dữ liệu, và chữ bị che mất một khúc. Lệch 40px là đủ để không đụng.
 */
export const FLOW_Y = 740;

// Ba trạm trong x 130–950 (né action rail x 950–1080 ở dải y 1000–1750),
// đối xứng quanh trục 540. bcrypt nằm ĐÚNG giữa.
//
// Ba hộp cùng ĐỈNH y=560 (bcrypt cao hơn vì phải chứa cả cái búa). Lệch tầm
// nhau là mắt đọc ra "đặt bừa", dù toạ độ có lý do gì đi nữa.
// Dải nội dung đặt thấp hơn tâm hình học: trục NGANG trong khung DỌC chỉ cao
// ~340px, nên chỗ nó ngồi quyết định khung có cân hay không. Cao quá thì cả
// nửa dưới bỏ không; đây là chỗ hacker có đường lao lên mà không rơi vào vùng
// caption của nền tảng.
export const FRONTEND = { x: 130, y: 640, w: 200, h: 220 };
// Cao hơn hai hộp kia vì nó phải chứa CẢ CÁI BÚA: nhãn + sub ở trên, rồi
// còn chỗ cho búa giơ lên mà không đè lên chữ.
export const BCRYPT = { x: 440, y: 520, w: 200, h: 380 };
export const DATABASE = { x: 750, y: 640, w: 200, h: 320 };

export const FRONTEND_C = { x: 230, y: FLOW_Y }; // chỗ mật khẩu được gõ ra
export const ANVIL = { x: 540, y: FLOW_Y }; // đe — búa gõ xuống đây

export const DB_ENTRY = { x: 750, y: FLOW_Y };

/** Ô bcrypt ĐẶT CHỖ SẴN từ frame 0 — không vẽ gì, nhưng không ai được lấn vào.
 *  Nhờ vậy lúc nó hiện ra, frontend và database không phải xê dịch. Dịch node
 *  vì lý do bố cục là chuyển động không mang nghĩa. */
export const BCRYPT_CX = BCRYPT.x + BCRYPT.w / 2; // 540 = trục

// ─── Người dùng ────────────────────────────────────────────────────────
// BA người, và hai người GÕ ĐÚNG CÙNG MỘT MẬT KHẨU. Đó không phải chi tiết
// vui: nó là toàn bộ việc của salt.
//   Act 1 → database lưu hai dòng y hệt nhau, NẰM CẠNH NHAU. Hacker liếc là thấy.
//   Act 2 → hai hash KHÁC HẲN nhau, cũng nằm cạnh nhau. So được trong một cái liếc.
// Đặt hai đứa sinh đôi ở slot 1 và 2 (kề vai) là cố ý — cách nhau một slot thì
// người xem phải đảo mắt mới so được, và thế là mất luôn cái aha.
export const N_USERS = 3;

export const PASSWORD = ["hunter2", "123456", "123456"];

/** Salt của từng người — KHÁC NHAU, và đó là lý do hai hash dưới khác nhau. */
export const SALT = ["a3f2", "9c1d", "b58a"];

/** Hash hiển thị. Không có prefix `$2b$12$`: nó ăn mất 7 ký tự đầu và làm hai
 *  hash trông giống nhau ở đúng chỗ cần khác nhau. Nhãn node đã nói `bcrypt`. */
export const HASH = ["Kx9mQ2vRt8Lp", "Zp4nB7wLc1Ha", "Jb5tX3fWe9Zu"];

export const BLOCK = { w: 172, h: 36 };

/**
 * Chỗ TÂM ĐẦU BÚA phải nằm lúc gõ trúng: ngay trên ĐỈNH bản ghi, không phải
 * tâm nó. 13 = nửa chiều cao đầu búa (HEAD trong components/Hammer.tsx).
 *
 * Khai báo chỗ CHẠM và để trục xoay tự suy ra. Bản trước khai báo trục rồi
 * hy vọng đầu búa rơi đúng chỗ — nó rơi cách cái đe 110px, gõ vào không khí.
 * Phải nằm dưới BLOCK vì nó tính từ BLOCK.h.
 */
export const HAMMER_ARM = 64;
export const HAMMER_HEAD = { x: 540, y: FLOW_Y - BLOCK.h / 2 - 13 };

/**
 * Chỗ nằm thứ `p` trong database, tính từ trên xuống. `p` được phép lẻ — bản
 * ghi cũ trượt xuống liên tục khi có bản ghi mới chen vào trên đầu.
 *
 * Vì sao phải ĐẨY XUỐNG chứ không ai vào chỗ nấy: khối rộng 172px trong hộp
 * rộng 200px, nên mọi slot đều nằm trên cùng một cột x=850. Muốn tới slot 1
 * thì buộc phải ĐI XUYÊN slot 0 — không dời cửa vào kiểu gì tránh được. Cho
 * bản ghi mới luôn nằm vào slot trên cùng thì không cái nào phải xuyên cái nào.
 */
export const SLOT_PITCH = 56;
export const slotY = (p: number) => FLOW_Y + 50 + p * SLOT_PITCH;
export const slot = (i: number) => ({ x: 850, y: slotY(i) });
/** Bản ghi cũ trượt xuống trong bấy nhiêu frame. */
export const SHIFT_DUR = 10;
/**
 * Bắt đầu trượt TRƯỚC khi bản mới tới cửa bấy nhiêu frame.
 *
 * Không phải để đẹp: đợi tới lúc nó tới cửa mới dịch thì hai khối chồng nhau
 * ~2px trong mấy frame — mắt gần như không thấy, mà chốt chặn thì thấy. Dọn
 * chỗ trước khi khách tới là cách duy nhất không ai phải đi xuyên ai.
 */
export const SHIFT_LEAD = 16;

// ─── Đường đi ─────────────────────────────────────────────────────────
export type Pt = { x: number; y: number };

/** Điểm trên đoạn, t = 0→1. HÀM DÙNG CHUNG giữa bản vẽ và mô phỏng. */
export const at = (a: Pt, b: Pt, t: number) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
/** Số frame để đi hết đoạn ở đúng SPEED — tính ra, không gõ. */
export const frames = (a: Pt, b: Pt) => Math.max(1, Math.round(dist(a, b) / SPEED));

export const F_TO_DB = frames(FRONTEND_C, DB_ENTRY); // 47 — act 1, đi thẳng
export const F_TO_ANVIL = frames(FRONTEND_C, ANVIL); // 28
export const ANVIL_TO_DB = frames(ANVIL, DB_ENTRY); // 19
/** Mọi bản ghi đều vào ĐÚNG slot trên cùng, nên chỉ có một quãng này. */
export const DB_TO_SLOT = frames(DB_ENTRY, slot(0));

// ─── Hacker ────────────────────────────────────────────────────────────
export const HACKER_R = 88;
/** Nó đứng CHÍNH GIỮA dưới khung, trên trục 540. Hiện dần trong 10 frame đầu —
 *  bụp ra giữa khung là một cú nháy, không phải một cú xuất hiện. */
export const HACKER_REST = { x: AXIS, y: 1560 };
export const HACKER_FADE = 10;

/** Điểm đỉnh nhọn phải chạm: đáy database, ngay giữa. */
export const SPIKE = { x: 850, y: DATABASE.y + DATABASE.h };

/**
 * Húc CHÉO. Tâm hacker dừng lùi lại đúng một bán kính dọc theo hướng bay, để
 * ĐỈNH NHỌN — chứ không phải tâm — chạm đáy database. Đó là chỗ khác nhau giữa
 * "húc thủng" và "chồng lên".
 */
export const DIR = (() => {
  const dx = SPIKE.x - HACKER_REST.x;
  const dy = SPIKE.y - HACKER_REST.y;
  const d = Math.hypot(dx, dy);
  return { x: dx / d, y: dy / d, d };
})();

export const HACKER_HIT = {
  x: SPIKE.x - DIR.x * HACKER_R,
  y: SPIKE.y - DIR.y * HACKER_R,
};

/** Xoay lục giác cho đỉnh nhọn quay ĐÚNG hướng bay — nó là mũi tên, không phải
 *  hòn đá trôi. Lục giác vẽ sẵn đỉnh hướng lên (-90°), nên bù phần chênh. */
export const HACKER_ROT = (Math.atan2(DIR.y, DIR.x) * 180) / Math.PI + 90;

/** Rút lui theo hướng ngược lại, về đúng chỗ nó đứng rồi tụt khỏi khung. */
export const HACKER_OUT = { x: AXIS, y: 1900 };

/** Đường chéo dài hơn đường thẳng đứng — 53 frame thay vì 39. Mọi mốc dưới
 *  đây dẫn xuất từ nó, nên KHÔNG được gõ tay cái nào. */
export const HACKER_RISE = frames(HACKER_REST, HACKER_HIT);

/** Chỗ đồ ăn trộm bám theo hacker lúc nó rút lui — treo thẳng dưới nó. */
export const loot = (i: number, hackerY: number) => ({
  x: HACKER_HIT.x,
  y: hackerY + 132 + i * 44,
});

/** Chỗ mấy cái hash bị NÉM xuống sàn ở act 2 — rác, nằm lăn lóc.
 *  Cố định, không random: cùng frame → cùng hình (remotion_conventions.md). */
// Ném ra HAI BÊN, tránh hành lang giữa mà hacker rút lui qua — nó không được
// giẫm lên đống nó vừa vứt.
export const TRASH = [
  { x: 240, y: 1450, rot: -14 },
  { x: 840, y: 1430, rot: 9 },
  { x: 300, y: 1530, rot: -5 },
];

// ─── Timeline ──────────────────────────────────────────────────────────
export const TYPE_DUR = 16; // gõ xong một mật khẩu
export const TYPE_HOLD = 4; // gõ xong rồi mới rời đi
export const SLOT_MOVE = 12; // từ cửa database vào chỗ nằm

// ── Act 1: lưu thẳng plaintext ──
export const A1_TYPE = [0, 40, 80];
export const A1_ATTACK = 180; // hacker bắt đầu trồi lên
export const A1_HIT = A1_ATTACK + HACKER_RISE; // 223
export const A1_GRAB = 24; // rút ruột database
export const A1_LEAVE = A1_HIT + A1_GRAB + 6; // 253 — lấy xong ĐI NGAY
export const A1_EXIT = 58; // rơi xuống khỏi khung
/** +6: đợi hacker tan HẲN rồi mới chuyển act. Cắt ở đúng 311 thì frame cuối
 *  nó còn opacity 0.07 rồi biến mất một phát — một cú nháy nhỏ mà thật. */
export const A1_RESET = A1_LEAVE + A1_EXIT + 6; // 317

// ── Act 2: có bcrypt ──
export const BCRYPT_IN = 340;
export const BCRYPT_IN_DUR = 20;

/**
 * Nhịp 54 chứ không phải 44 như act 1. Bản ghi ĐỨNG LẠI 32 frame trên đe để
 * bị gõ, nên bản sau bắt kịp và đè vào đuôi nó — khối rộng 172px thì chỉ cần
 * cách 166px là đã chồng. Có một trạm dừng giữa đường thì hàng phải thưa hơn.
 */
export const A2_TYPE = [390, 444, 498];
export const SALT_FALL = 10; // hạt salt rơi vào bản ghi
export const HAMMER_SWING = 12; // búa bổ xuống
export const HAMMER_UP = 10; // nhấc lên
/** Bản ghi nằm trên đe bao lâu: salt rơi → búa bổ → nhấc lên. */
export const ANVIL_HOLD = SALT_FALL + HAMMER_SWING + HAMMER_UP; // 32

export const A2_ATTACK = 626;
export const A2_HIT = A2_ATTACK + HACKER_RISE;
export const A2_GRAB = 24;
/**
 * CHẦN CHỪ — beat quan trọng nhất video, và là chỗ duy nhất "nó không biết làm
 * gì với mấy cái này" được NÓI RA bằng thời lượng thay vì bằng chữ.
 * Act 1 hacker rời đi sau 30 frame. Act 2 mất 66 frame mới bỏ cuộc.
 */
export const A2_STARE = 66;
export const A2_THROW = A2_HIT + A2_GRAB + A2_STARE; // 753
export const A2_THROW_DUR = 22;
export const A2_LEAVE = A2_THROW + A2_THROW_DUR + 8; // 783 — đi TAY KHÔNG
export const A2_EXIT = 58;

export const RESET = 864;
export const RESET_DUR = 16; // 864 + 16 = 880 = LOOP → f880 trùng khít f0

// ─── Hiệu ứng ──────────────────────────────────────────────────────────
export const ALARM_FLASH = 18; // database nháy cam lúc bị húc
export const STORE_FLASH = 10; // loé trắng khi một bản ghi nằm xuống
export const RIPPLE_DUR = 16;

// ─── Nội dung ──────────────────────────────────────────────────────────
export const TITLE = "Password Hashing";
export const FRONTEND_LABEL = "frontend";
export const BCRYPT_LABEL = "bcrypt";
export const BCRYPT_SUB = "+ salt";
export const DB_LABEL = "database";
export const HACKER_LABEL = "hacker";

export const LABEL_SIZE = 24;
export const SUB_SIZE = 17;

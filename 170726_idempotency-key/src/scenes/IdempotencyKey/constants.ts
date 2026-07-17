// Idempotency Key — hằng số scene.
//
// Ý DUY NHẤT của loop:
//
//   SERVER KHÔNG THỂ BIẾT HAI REQUEST GIỐNG HỆT NHAU LÀ MỘT Ý ĐỊNH HAY HAI.
//   Chỉ client biết. Key là cách client NÓI RA điều đó.
//
// Nó trả lời thẳng câu ai cũng hỏi — "sao server không tự lọc trùng đi?" — và
// giải thích vì sao key phải do CLIENT cấp chứ không phải server tự nghĩ ra.
//
// Hai chỗ dễ dạy sai, và scene này cố ý chặn cả hai:
//   1. KEY THUỘC VỀ ĐƠN HÀNG, không thuộc cú click. Mỗi click đẻ một key mới
//      thì bốn click ra bốn key và key vô dụng — đó là lỗi ngoài đời hay gặp.
//      Nên key hiện sẵn trên card, mỗi click chỉ nhặt nó mang đi.
//   2. Request trùng KHÔNG bị bỏ qua, nó được TRẢ LỜI bằng đúng biên lai cũ.
//      Bỏ qua thì client vẫn treo — chẳng chữa được gì. Đó là chỗ khác nhau
//      giữa idempotency và chống-trùng-lặp.

export const FPS = 30;
export const LOOP = 640; // 21.3s — bội của 16 vì có audio

// ─── Chốt chặn kỹ thuật ────────────────────────────────────────────────
export const SPEED = 14; // px/frame — MỘT tốc độ trung bình cho mọi thứ bay

// ─── Layout 1080×1920 ─────────────────────────────────────────────────
// Header 2 dòng: y 100–270. Stage: y 310–1820.
export const W = 1080;
export const H = 1920;
export const AXIS = 540;
export const STROKE = 3;

/**
 * Hình của khái niệm này là MẠCH VÒNG DỌC, không phải ống một chiều: hỏi đi
 * xuống, đáp đi lên, hai làn riêng. Round trip có hình tròn, và 9:16 hợp trục
 * dọc (scene_composition.md). Video trước là ống ngang — mỗi khái niệm một hình.
 */
export const UI = { x: 300, y: 380, w: 480, h: 320 };
export const BUTTON = { x: 360, y: 600, w: 360, h: 70 };
export const BUTTON_C = { x: BUTTON.x + BUTTON.w / 2, y: BUTTON.y + BUTTON.h / 2 };

export const SERVER = { x: 300, y: 1100, w: 480, h: 480 };

/** Hai làn, đối xứng quanh trục 540. */
export const REQ_X = 450;
export const RES_X = 630;
export const UI_BOTTOM = UI.y + UI.h; // 700
export const SRV_TOP = SERVER.y; // 1120

/** Vé dừng TRÊN mép server 26px, không đúng mép: đúng mép thì nửa vé nằm
 *  trong hộp và cuống vừa xé ra đè lên nhãn SERVER. Xé vé thì phải xé ở CỬA,
 *  không phải xé bên trong. */
export const DOOR_GAP = 26;
export const REQ_FROM = { x: REQ_X, y: UI_BOTTOM };
export const REQ_TO = { x: REQ_X, y: SRV_TOP - DOOR_GAP };
export const RES_FROM = { x: RES_X, y: SRV_TOP };
export const RES_TO = { x: RES_X, y: UI_BOTTOM };

// ─── Đường đi ─────────────────────────────────────────────────────────
export type Pt = { x: number; y: number };
export const at = (a: Pt, b: Pt, t: number) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
export const frames = (a: Pt, b: Pt) => Math.max(1, Math.round(dist(a, b) / SPEED));

export const LANE_FRAMES = frames(REQ_FROM, REQ_TO); // 30

/** Hồi âm ĐẦU TIÊN chết ở đây — 55% đường về. Giống hệt nhau ở CẢ HAI act:
 *  đó là biến được giữ nguyên, để biến duy nhất thay đổi là cái key. */
export const DIE_AT = 0.55;

// ─── Tiền ──────────────────────────────────────────────────────────────
/**
 * SỐ DƯ là thứ người xem thấy đau, sổ cái chỉ là bằng chứng.
 *
 * Bản trước chỉ có bốn dòng `$50.00` xếp trong sổ — bắt người xem tự cộng, và
 * cộng thì không ai cộng. Số dư đếm lùi thì khỏi cộng: $200 → $0 là bay sạch
 * tài khoản, thấy ngay.
 *
 * 200 = 4 × 50: act 1 vét đúng đến 0. Con số ấy không phải trùng hợp cho đẹp —
 * nó là cái giá của bốn cú click mà lẽ ra chỉ được tính một.
 */
export const BALANCE_START = 200;
export const PRICE = 50;
export const AMOUNT = "$50.00";
export const N_CLICKS = 4; // 1 cú dứt khoát + 3 cú spam

/** Khối bay trên làn. */
export const MSG = { w: 210, h: 40 };
/** Cuống vé = KEY. Vé không cuống = request không key: chẳng có gì đối chiếu. */
export const STUB_W = 58;
/** Xé vé — CÚ KIỂM, nhìn thấy được. Phải chiếm frame thật, không thì act 2 chỉ
 *  là "request tự nhiên quay đầu". */
export const TEAR = 8;
export const TEAR_HOLD = 6; // giữ cho mắt kịp đọc màu cuống rồi mới tan

/** Chip trong sổ — NHỎ, vì nó là ghi chép, không phải tiêu điểm. */
export const CHARGE = { w: 132, h: 30 };
export const LEDGER_PITCH = 38;
export const LEDGER_CX = SERVER.x + SERVER.w / 2; // 540
/** Chỗ nằm thứ p trong sổ. Sim VÀ verify cùng đọc hàm này — đừng ai gõ lại
 *  một biểu thức "tương đương" (đã trả giá ở video trước). */
export const ledger = (p: number) => ({ x: LEDGER_CX, y: 1288 + p * LEDGER_PITCH });

/** Kho key: chỗ server NHỚ đã thấy key nào. Chỉ act 2 mới có — không key thì
 *  chẳng có gì để nhớ, và đó chính là lý do act 1 hỏng. */
export const KEY_STORE = { x: LEDGER_CX, y: 1214 };
/**
 * Số dư nằm DƯỚI sổ, và chỗ của nó phải SUY RA từ đáy sổ chứ không gõ cứng:
 * sổ dài tới đâu là do act quyết định (4 chip ở act 1, 1 chip ở act 2). Gõ
 * cứng thì chip cuối đè lên chữ BALANCE — mà chỉ hỏng ở act 1, nên dễ lọt.
 */
export const LEDGER_BOTTOM = ledger(N_CLICKS - 1).y + CHARGE.h / 2;
export const BALANCE_AT = { x: LEDGER_CX, y: LEDGER_BOTTOM + 96 };

// ─── Nhịp — thứ được THIẾT KẾ, không phải hệ quả ──────────────────────
/**
 * Video trước bị chê chậm, mà không phải vì dài: vì mọi thứ chạy MỘT cadence
 * đều tăm tắp. Metronome thì xem chán bất kể thời lượng.
 *
 * Ở đây nhịp có ba tầng, và tầng nào cũng mang nghĩa:
 *   CHẬM  — con trỏ bò vào, dừng lại (anticipation)
 *   CHẾT  — hồi âm tan, spinner quay, KHÔNG có gì xảy ra (căng)
 *   DỒN   — ba cú click trong 24 frame (SPAM_STAGGER = 8)
 *
 * Và cú dồn ấy đẻ ra tương phản mà tôi không tính trước: act 1 dồn vào rồi
 * NGHẼN (server phải làm việc thật, request xếp hàng), act 2 dồn vào thì dồn
 * ra (chỉ tra sổ). Chính cái nhịp tự kể chuyện.
 */
/**
 * 10 chứ không 8, và con số này do CHÍNH easing quyết định chứ không do khẩu vị:
 * inOut(cubic) khởi động rất chậm, nên hai request bấm cách nhau 8 frame mới
 * rời nhau 32px ở đoạn đầu làn — mà khối cao 40px. Chúng dính chùm.
 * Ở 10 frame, khoảng hở đầu làn là 61px. Vẫn là spam (3 cú trong 0.67s).
 */
export const SPAM_STAGGER = 10;
export const CLICK_FLASH = 10;

/** Server làm việc thật: trừ tiền. GHI thì phải xếp hàng — đây là chỗ nghẽn. */
export const WORK = 26;
/**
 * Request phải chờ thì DỒN ĐỐNG LÊN trước cửa server, mỗi cái một chỗ.
 *
 * Không phải trang trí: cái nghẽn CHÍNH LÀ tương phản nhịp của video này —
 * dồn vào rồi tắc lại. Cho chúng nằm chồng lên nhau ở cùng một điểm là cái
 * nghẽn thành vô hình, và mất luôn thứ mà cả act 1 muốn nói.
 * 48 > 40 (chiều cao khối) nên không cái nào đè cái nào.
 */
export const QUEUE_PITCH = 48;
/**
 * Tra kho key. 12 frame chứ không 6: phải ĐỦ LÂU để nhìn thấy hai cái key khớp
 * nhau — cú kiểm mà vô hình thì act 2 chỉ là "request tự nhiên quay đầu".
 *
 * Và tra sổ KHÔNG xếp hàng, khác hẳn trừ tiền: ĐỌC thì rẻ và chạy song song
 * được, GHI thì phải nối đuôi. Chính sự bất đối xứng ấy là lý do idempotency
 * rẻ — không phải tôi ưu ái act 2.
 */
export const LOOKUP = TEAR + TEAR_HOLD; // 14 — xé xong là biết, không cần làm gì thêm
export const MATCH_FLASH = 14; // hai key khớp — loé lên

export const CURSOR_IN = 30; // con trỏ bò vào
export const HOVER = 20; // dừng một nhịp trước khi bấm — anticipation

// ─── Timeline ──────────────────────────────────────────────────────────
// Hai act ĐỐI CHỨNG: cùng lịch click, cùng chỗ hồi âm chết. Khác đúng một
// biến — card có key hay không.
export const ACT2_AT = 340;

/** Cú click, tính từ đầu mỗi act. */
export const CLICK_AT = [50, 150, 160, 170];

export const A1_START = 0;
export const A1_RESET = 310;
/** Key hiện lên SAU khi act 1 dọn sạch, TRƯỚC khi act 2 bắt đầu — nó phải là
 *  một khoảnh khắc riêng ("giờ đơn hàng có key"), không lẫn vào cú click. */
export const KEY_IN = 322;
export const KEY_IN_DUR = 16;
export const A2_START = ACT2_AT;

export const RESET = 616;
export const RESET_DUR = 24; // 616 + 24 = 640 = LOOP → f640 trùng khít f0

// ─── Hiệu ứng ──────────────────────────────────────────────────────────
export const CHARGE_FLASH = 12;
export const SRV_WORK_PULSE = 1;
export const RIPPLE_DUR = 14;

// ─── Nội dung ──────────────────────────────────────────────────────────
export const TITLE = "Idempotency Key";
export const ORDER = "order #1042";
export const IDEM_KEY = "idem-7a3f";
export const KEY_SHORT = "7a3f";
/** Kẹp cuống vé lúc còn rỗng. NGẮN, và bề rộng kẹp phải đo theo nó — chuỗi
 *  dài hơn là chữ xuống dòng rồi đè lên chính nó trong cái pill cao 38px.
 *  "Đổi nhãn là phải đo lại chỗ" (style_guide.md); verify canh. */
export const STUB_EMPTY = "no stub";
export const STUB_RACK_W = 190;
export const SERVER_LABEL = "server";
export const LEDGER_LABEL = "ledger";

export const LABEL_SIZE = 24;
export const SUB_SIZE = 17;

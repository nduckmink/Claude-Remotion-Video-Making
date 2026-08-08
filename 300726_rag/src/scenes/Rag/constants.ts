// RAG — "Không gian nghĩa: gần nhau là liên quan".
//
// Hai pha trong MỘT mạch:
//   1. INDEX  — tài liệu bị xắt thành chunk → qua EMBEDDER → thành vector →
//               đậu vào BẢN ĐỒ theo nghĩa, chunk cùng chủ đề tự dồn thành cụm.
//   2. TRUY VẤN — câu hỏi qua CHÍNH embedder đó → thành chấm cùng loại → vòng
//               tìm loang ra → 3 chấm gần nhất → đưa cho LLM → ra câu trả lời.
//
// Aha: câu hỏi và tài liệu nằm CHUNG một không gian, nên "tra cứu" chỉ là AI GẦN
// NHẤT. LLM không phải nhớ gì — nó được đưa đúng mấy đoạn cần đọc.

export const FPS = 30;
export const LOOP = 768; // 25.6s — bội 16 (×48)
export const W = 1080;
export const H = 1920;
export const TITLE = "RAG";

export type Pt = { x: number; y: number };

// ─── Bố cục dọc ───────────────────────────────────────────────────────────
export const DOC = { x: 540, y: 420, w: 430, h: 200 }; // đủ cao cho 6 dòng, không cắt chữ
export const EMB = { x: 540, y: 602, w: 430, h: 104 };
export const MAP = { x: 260, y: 716, w: 560, h: 560 }; // VUÔNG ⇒ vòng tìm là đường tròn thật
export const LLM = { x: 540, y: 1390, w: 430, h: 150 };
export const ANSWER = { x: 540, y: 1580, w: 720, h: 140 };

export const CARD = { w: 244, h: 52 }; // thẻ chunk lúc đang bay
export const Q_CARD = { w: 330, h: 56 };

// ─── Nội dung: 6 chunk, HAI chủ đề ────────────────────────────────────────
// Vị trí trên bản đồ là NGHĨA: cùng chủ đề thì gần nhau. Toạ độ chuẩn hoá 0..1.
export const CHUNKS: { text: string; topic: number; at: Pt }[] = [
  { text: "refund within 30 days", topic: 0, at: { x: 0.24, y: 0.28 } },
  { text: "money-back guarantee", topic: 0, at: { x: 0.34, y: 0.36 } },
  // Đoạn này liên quan vừa phải (vừa refund vừa shipping) ⇒ nằm RÌA cụm: vòng
  // tìm chạm nó sau cùng, nghe ra được thứ tự gần→xa.
  { text: "free return shipping", topic: 0, at: { x: 0.26, y: 0.48 } },
  { text: "ships in 2 days", topic: 1, at: { x: 0.72, y: 0.7 } },
  { text: "tracking by email", topic: 1, at: { x: 0.82, y: 0.78 } },
  { text: "40 countries", topic: 1, at: { x: 0.7, y: 0.84 } },
];
export const QUERY = "how do i get my money back?";
export const QUERY_AT: Pt = { x: 0.29, y: 0.35 }; // câu hỏi rơi vào giữa cụm refund
export const TOP_K = 3;
export const ANSWER_TEXT = ["full refund within 30 days", "return shipping is free"];
export const DOC_NAME = "policy.md";

export const mapPt = (p: Pt): Pt => ({ x: MAP.x + p.x * MAP.w, y: MAP.y + p.y * MAP.h });

// ─── Nhịp ─────────────────────────────────────────────────────────────────
/** Một chunk: xắt ra → tới embedder → qua embedder (hoá vector) → bay vào bản đồ. */
export const SLICE = [40, 74, 108, 142, 176, 210];
export const CH = { out: 10, toEmb: 18, thru: 14, toMap: 20 }; // cộng dồn = 62

export const T = {
  indexDone: 274,
  qShow: 306, // câu hỏi thay chỗ tài liệu
  qToEmb: 330,
  qThru: 348,
  qToMap: 362,
  qLanded: 382,
  searchFrom: 392, // vòng tìm loang ra
  searchTo: 434,
  pullFrom: 452, // 3 đoạn bật ra khỏi bản đồ, bay xuống LLM
  pullTo: 504,
  llmWork: 504,
  llmDone: 548,
  answerIn: 548,
  answerHold: 648,
  resetFrom: 656,
  resetTo: 724,
};
export const RESET = 724;

export const RING_PAD = 16; // vòng tìm dừng ngay SAU chấm thứ K
export const IDLE_PERIOD = 96; // 768/8 — mọi chu kỳ nền phải CHIA HẾT LOOP

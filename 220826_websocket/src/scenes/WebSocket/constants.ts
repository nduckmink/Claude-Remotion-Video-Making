/**
 * Hằng số của scene WebSocket — hình học, lịch sự kiện, timing.
 * KHÔNG import remotion (verify.ts chạy bằng Node).
 *
 * Mọi toạ độ mà cả SVG lẫn sim cùng cần đều nằm ở ĐÂY và cả hai bên import —
 * đường VẼ không bao giờ lệch đường BAY (motion_language.md).
 */
import { lerp, type Pt } from "../../lib/anim";

// ── Khung ─────────────────────────────────────────────────────────────
export const W = 1080;
export const H = 1920;
export const FPS = 30;

/** 368 = 16 × 23 → nhát cắt AAC rơi đúng mẫu (sfx.md). 12.27s. */
export const LOOP = 368;

/** 368 / 46 = 8 chu kỳ chẵn → breathe seamless. 1.53s, trong dải 1.5–2.5s. */
export const BREATHE = 46;

// ── Header (scene_composition.md) ─────────────────────────────────────
export const HANDLE_Y = 132;
export const TITLE_Y = 172;
export const HAIRLINE_Y = 270;
export const STAGE_TOP = 310;

export const HANDLE = "@duckmink_nguyen";
export const TITLE = "WebSocket";
export const GHOST = "WS"; // ~600px chỉ chứa nổi ~3 ký tự

// ── Node ──────────────────────────────────────────────────────────────
export const NODE_X = 320;
export const NODE_W = 440;
export const NODE_H = 170;
export const CLIENT_Y = 450;
export const SERVER_Y = 1240;

export const CLIENT_BOTTOM = CLIENT_Y + NODE_H; // 620
export const SERVER_TOP = SERVER_Y; // 1240

// ── Hai làn — full-duplex là HAI đường, không phải một ────────────────
export type Dir = "down" | "up";

export const LANE: Record<Dir, { x: number; from: number; to: number }> = {
  down: { x: 450, from: CLIENT_BOTTOM, to: SERVER_TOP },
  up: { x: 630, from: SERVER_TOP, to: CLIENT_BOTTOM },
};

export const TRAVEL_PX = SERVER_TOP - CLIENT_BOTTOM; // 620
/** MỘT tốc độ cho mọi packet: 620px / 26f = 23.85 px/f. */
export const TRAVEL_F = 26;

/** Hàm dùng chung: sim gọi để bay, SVG gọi để vẽ. Không thể lệch nhau. */
export const lanePos = (dir: Dir, u: number): Pt => ({
  x: LANE[dir].x,
  y: lerp(LANE[dir].from, LANE[dir].to, u),
});

/** Đầu neo của làn trên mỗi node — chỗ ripple nở ra. */
export const anchor = (dir: Dir, end: "from" | "to"): Pt => ({
  x: LANE[dir].x,
  y: LANE[dir][end],
});

// ── Bốn nhịp ──────────────────────────────────────────────────────────
export const ACT = {
  http: [0, 132],
  upgrade: [132, 200],
  open: [200, 312],
  close: [312, LOOP],
} as const;

/** Client gửi close; nó chạm server ở đây. Mọi thứ tháo ra tính TỪ số này. */
export const CLOSE_AT = 312;
export const CLOSE_ARRIVE = CLOSE_AT + TRAVEL_F; // 338

/** Khoảnh khắc socket KHỚP — `101` chạm client. */
export const LOCK_AT = 190;
/** Sweep xanh `pass` chạy hết hai làn: upgrade lan ra toàn tuyến. */
export const LOCK_SWEEP_F = 24;

/** Readout byte/msg lật ở hai đầu vòng đời. */
export const READOUT_UP: [number, number] = [LOCK_AT, LOCK_AT + 12];
export const READOUT_DOWN: [number, number] = [CLOSE_ARRIVE, CLOSE_ARRIVE + 12];

/**
 * Xong việc thì TẮT SÁNG. Không có cổng này, `heat` của server còn ~0.03 tại
 * frame LOOP (đuôi decay của cú close) và biên loop lệch — mắt không thấy,
 * hash thì thấy.
 */
export const SETTLE: [number, number] = [CLOSE_ARRIVE, CLOSE_ARRIVE + 18];

export const READOUT_HTTP = "HEADERS ~700 B";
export const READOUT_WS = "FRAME 6 B";

/** Từ đây tới LOOP: không gì chuyển động, không tiếng nào. */
export const RESET_FROM = 358;

// ── Lịch gói tin ──────────────────────────────────────────────────────
export type Kind = "msg" | "upgrade" | "ok101" | "close";

export type Msg = { t: number; dir: Dir; kind: Kind };

export const MSGS: Msg[] = [
  // Nhịp 1 — HTTP chu kỳ A: hỏi rồi mới có đáp
  { t: 2, dir: "down", kind: "msg" },
  { t: 34, dir: "up", kind: "msg" },
  // Nhịp 1 — HTTP chu kỳ B (+66): y hệt, và sẽ y hệt mãi mãi
  { t: 68, dir: "down", kind: "msg" },
  { t: 100, dir: "up", kind: "msg" },
  // Nhịp 2 — bắt tay
  { t: 134, dir: "down", kind: "upgrade" },
  { t: 164, dir: "up", kind: "ok101" },
  // Nhịp 3 — hai lượt CHỒNG LẤN (full-duplex)
  { t: 204, dir: "down", kind: "msg" },
  { t: 216, dir: "up", kind: "msg" },
  { t: 236, dir: "down", kind: "msg" },
  { t: 244, dir: "up", kind: "msg" },
  // Nhịp 3 — BURST: server bắn 3 gói, làn xuống trống trơn
  { t: 264, dir: "up", kind: "msg" },
  { t: 275, dir: "up", kind: "msg" },
  { t: 284, dir: "up", kind: "msg" },
  // Nhịp 4 — đóng
  { t: CLOSE_AT, dir: "down", kind: "close" },
];

/** Cửa sổ mà lời hứa của scene phải đúng: 3 gói lên, 0 gói xuống. */
export const BURST: [number, number] = [263, CLOSE_AT];

// ── Lịch sợi dây ──────────────────────────────────────────────────────
export type Rail = {
  dir: Dir;
  birth: number;
  drawF: number;
  deathAt: number;
  deathF: number;
  /** Có thì đây là sợi dây SỐNG SÓT qua handshake. */
  lock?: number;
};

export const RAILS: Rail[] = [
  // Nhịp 1 — bốn lần dựng dây, bốn lần chết. Không lần nào hai làn cùng tồn tại.
  { dir: "down", birth: 0, drawF: 8, deathAt: 28, deathF: 4 },
  { dir: "up", birth: 32, drawF: 8, deathAt: 60, deathF: 4 },
  { dir: "down", birth: 66, drawF: 8, deathAt: 94, deathF: 4 },
  { dir: "up", birth: 98, drawF: 8, deathAt: 126, deathF: 4 },
  // Nhịp 2 → 4 — dựng MỘT lần, ở lại tới lúc đóng.
  { dir: "down", birth: 132, drawF: 8, deathAt: CLOSE_ARRIVE, deathF: 12, lock: LOCK_AT },
  { dir: "up", birth: 162, drawF: 8, deathAt: CLOSE_ARRIVE, deathF: 12, lock: LOCK_AT },
];

// ── Âm lượng ──────────────────────────────────────────────────────────
export const VOL: Record<string, number> = {
  draw: 0.5,
  emit: 0.62,
  arrive: 0.7,
  attach: 0.85,
  drop: 0.8,
};

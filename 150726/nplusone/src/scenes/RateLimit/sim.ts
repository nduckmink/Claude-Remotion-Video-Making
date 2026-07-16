import {
  APP_CX,
  APP_PERIOD,
  AXIS,
  BATCH_CX,
  BATCH_IN,
  BATCH_OUT,
  BATCH_PERIOD,
  CLIENT_BOTTOM,
  GATE_CY,
  LIMIT_IN,
  LIMIT_PERIOD,
  LOOP,
  MERGE_DIST,
  MS_PER_SERVICE,
  QUEUE_BOTTOM,
  QUEUE_PITCH,
  REJ_WINDOW,
  RESET,
  SERVER,
  SERVICE,
  SHIFT,
  SPEED,
} from "./constants";

// Vào tới cửa server là packet biến mất — nó đang Ở TRONG, không còn là
// chấm bay nữa. Việc "đang xử lý" do server sáng lên kể, suốt SERVICE frame.
// 50px / DOOR frame ≈ SPEED → không phá luật một-tốc-độ-duy-nhất.
const DOOR = 3;

/**
 * Mô phỏng thật, từng frame. Không hardcode một con số nào trên màn hình —
 * tất cả là hệ quả của: arrival → gate → hàng đợi FIFO → server.
 *
 * Deterministic tuyệt đối: chạy một lần ở module level, cùng frame → cùng hình.
 */

export type Owner = "app" | "batch";
export type Kind = "fall" | "bounce" | "queue" | "service";

export type Item = {
  id: number;
  owner: Owner;
  kind: Kind;
  x: number;
  y: number;
  fade: number;
};

export type State = {
  items: Item[];
  queueLen: number;
  latencyMs: number;
  appRej: number; // 0..1
  batchRej: number;
  serverLive: boolean;
  gateFlash: number; // 0..1 — gate loé khi vừa đá một request ra
};

type Sim = {
  id: number;
  owner: Owner;
  born: number;
  x: number;
  y: number;
  kind: Kind | "done";
  gateAt: number; // frame qua gate, -1 = chưa
  slot: number;
  prevSlot: number;
  slotAt: number;
  serveAt: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const cx = (o: Owner) => (o === "app" ? APP_CX : BATCH_CX);

const slotY = (slot: number) => QUEUE_BOTTOM - slot * QUEUE_PITCH;

// SFX — chỉ theo vòng đời request của APP. Frame lấy TỪ mô phỏng, không gõ tay.
//
// Tai bám app, không bám batch: batch là tiếng ồn, và tiếng ồn không có
// tiếng nói. Đây là luật đèn rọi áp cho tai — âm thanh theo nhân vật chính.
//
// Nghe ra: khoảng cách fire→done GIÃN RA khi hàng đợi dồn, rồi co lại khi
// limiter vào. Đó là latency của app, nghe được. Và app KHÔNG BAO GIỜ có
// tiếng 429 — chỗ trống đó chính là cú chốt.
export const appTrips: { fire: number; done: number }[] = [];

const simulate = (): State[] => {
  const all: Sim[] = [];
  const waiting: Sim[] = [];
  let serving: Sim | null = null;
  let serviceEnd = -1;
  let nextId = 0;
  let lastFlash = -99;

  // Limiter đếm liên tục, kể cả lúc chưa bật — đúng như một limiter thật.
  const lastOk: Record<Owner, number> = { app: -9999, batch: -9999 };
  const gateLog: { f: number; owner: Owner; rejected: boolean }[] = [];
  const out: State[] = [];

  appTrips.length = 0;

  const spawn = (owner: Owner, born: number) => {
    const s: Sim = {
      id: nextId++,
      owner,
      born,
      x: cx(owner),
      y: CLIENT_BOTTOM,
      kind: "fall",
      gateAt: -1,
      slot: 0,
      prevSlot: 0,
      slotAt: 0,
      serveAt: -1,
    };
    all.push(s);
    return s;
  };

  for (let f = 0; f < LOOP; f++) {
    // 1. Server xong việc
    if (serving && f >= serviceEnd) {
      serving.kind = "done";
      // Ghép ĐÚNG request với chính lần bắn của nó — không phải "lần xong
      // gần nhất sau đó". Ghép sai là đo ra số vô nghĩa.
      if (serving.owner === "app") {
        appTrips.push({ fire: serving.born, done: f });
      }
      serving = null;
    }

    // 2. Client bắn request
    if (f % APP_PERIOD === 0) spawn("app", f);
    if (
      f >= BATCH_IN &&
      f <= BATCH_OUT &&
      (f - BATCH_IN) % BATCH_PERIOD === 0
    ) {
      spawn("batch", f);
    }

    // 3. Packet rơi / bật ngược
    for (const s of all) {
      if (s.kind === "fall") {
        s.y += SPEED;

        // Qua gate → limiter phán
        if (s.gateAt < 0 && s.y >= GATE_CY) {
          s.gateAt = f;
          const limitOn = f >= LIMIT_IN && f < RESET;
          const rejected = limitOn && f - lastOk[s.owner] < LIMIT_PERIOD;
          gateLog.push({ f, owner: s.owner, rejected });
          if (rejected) {
            s.kind = "bounce";
            lastFlash = f;
            continue;
          }
          lastOk[s.owner] = f;
        }

        // Hai nhánh hội tụ về trục ngay sau gate
        if (s.gateAt >= 0) {
          s.x = lerp(
            cx(s.owner),
            AXIS,
            clamp01((s.y - GATE_CY) / MERGE_DIST),
          );
        }

        // Chạm đỉnh đống → vào hàng đợi
        const pileTop = slotY(waiting.length);
        if (s.gateAt >= 0 && s.y >= pileTop) {
          s.kind = "queue";
          s.x = AXIS;
          s.slot = waiting.length;
          s.prevSlot = s.slot;
          s.slotAt = f;
          s.y = slotY(s.slot);
          waiting.push(s);
        }
      } else if (s.kind === "bounce") {
        s.y -= SPEED;
        if (s.y <= CLIENT_BOTTOM) s.kind = "done";
      }
    }

    // 4. Server rút đầu hàng
    if (!serving && waiting.length > 0) {
      const s = waiting.shift()!;
      s.kind = "service";
      s.serveAt = f;
      serving = s;
      serviceEnd = f + SERVICE;
    }

    // 5. Cả hàng nhích xuống một chỗ
    waiting.forEach((s, i) => {
      if (s.slot !== i) {
        s.prevSlot = s.slot;
        s.slot = i;
        s.slotAt = f;
      }
    });
    for (const s of waiting) {
      s.y = lerp(
        slotY(s.prevSlot),
        slotY(s.slot),
        clamp01((f - s.slotAt) / SHIFT),
      );
    }

    // 6. Packet đang xử lý: trôi từ slot 0 tới cửa server rồi biến mất
    if (serving) {
      serving.y = lerp(
        QUEUE_BOTTOM,
        SERVER.y,
        clamp01((f - serving.serveAt) / DOOR),
      );
    }

    // 7. Tỷ lệ 429 — cửa sổ trượt, đúng như một dashboard thật đo
    const rate = (owner: Owner) => {
      let n = 0;
      let bad = 0;
      for (const e of gateLog) {
        if (e.owner === owner && e.f > f - REJ_WINDOW && e.f <= f) {
          n++;
          if (e.rejected) bad++;
        }
      }
      return n === 0 ? 0 : bad / n;
    };

    // 8. Chụp frame
    const items: Item[] = [];
    for (const s of all) {
      if (s.kind === "done") continue;
      items.push({
        id: s.id,
        owner: s.owner,
        kind: s.kind,
        x: s.x,
        y: s.y,
        // 429 tan dần khi về tới client; request được xử lý thì tan vào server
        fade:
          s.kind === "bounce"
            ? clamp01((s.y - CLIENT_BOTTOM) / 60)
            : s.kind === "service"
              ? 1 - clamp01((f - s.serveAt) / DOOR)
              : 1,
      });
    }

    out.push({
      items,
      queueLen: waiting.length,
      // "Đến bây giờ thì chờ bao lâu" = (số đang xếp hàng + chính mình) × nhịp server
      latencyMs: (waiting.length + 1) * MS_PER_SERVICE,
      appRej: rate("app"),
      batchRej: rate("batch"),
      serverLive: serving !== null,
      gateFlash: clamp01(1 - (f - lastFlash) / 6),
    });

    // Dọn xác để mảng không phình vô hạn
    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i].kind === "done") all.splice(i, 1);
    }
  }

  return out;
};

export const STATES = simulate();

// Số liệu chốt phải TÍNH RA TỪ MÔ PHỎNG, không được gõ tay.
// Gõ tay là sớm muộn cũng trôi khỏi sự thật — đã dính một lần rồi.
export const PEAK_MS = Math.max(...STATES.map((s) => s.latencyMs));
export const BASE_MS = MS_PER_SERVICE; // hàng đợi rỗng → chỉ còn nhịp server
export const PEAK_QUEUE = Math.max(...STATES.map((s) => s.queueLen));
export const PEAK_BATCH_REJ = Math.max(...STATES.map((s) => s.batchRej));

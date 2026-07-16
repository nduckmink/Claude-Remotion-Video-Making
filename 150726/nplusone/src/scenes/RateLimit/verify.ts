// Kiểm mô phỏng — chạy:
//   npx esbuild src/scenes/RateLimit/verify.ts --bundle --platform=node \
//     --outfile=<tmp>/v.cjs && node <tmp>/v.cjs
//
// Không phải test tự động, là kính lúp: soi xem số trên màn hình có đúng
// như thiết kế không, TRƯỚC khi tốn công vẽ.
import {
  BATCH_IN,
  FPS,
  GATE,
  LIMIT_IN,
  LOOP,
  MERGE_DIST,
  MS_PER_SERVICE,
  QUEUE_BOTTOM,
  QUEUE_PITCH,
  RESET,
} from "./constants";
import { appTrips, STATES } from "./sim";

const at = (f: number) => STATES[f];
const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

const row = (tag: string, f: number) => {
  const s = at(f);
  console.log(
    `${tag.padEnd(22)} f=${String(f).padStart(3)}  ` +
      `queue=${String(s.queueLen).padStart(2)}  ` +
      `lat=${String(s.latencyMs).padStart(3)}ms  ` +
      `app429=${pct(s.appRej).padStart(4)}  ` +
      `batch429=${pct(s.batchRej).padStart(4)}`,
  );
};

console.log(`\nLOOP=${LOOP}  states=${STATES.length}\n`);

console.log("=== ACT 1: app một mình ===");
row("giữa act 1", 100);
row("ngay trước batch", BATCH_IN - 1);

console.log("\n=== ACT 2: batch tới, hàng đợi phình ===");
row("batch +2s", BATCH_IN + 60);
row("batch +5s", BATCH_IN + 150);
row("ngay trước limiter", LIMIT_IN - 1);

console.log("\n=== ACT 3: limiter sập xuống ===");
row("limiter +1s", LIMIT_IN + 30);
row("limiter +3s", LIMIT_IN + 90);
row("đã ổn định", 545);
row("ngay trước reset", RESET - 1);

console.log("\n=== KIỂM LOOP: frame 599 phải sạch như frame 0 ===");
const a = at(0);
const z = at(LOOP - 1);
console.log(`f=0    queue=${a.queueLen} items=${a.items.length} serving=${a.serverLive}`);
console.log(`f=599  queue=${z.queueLen} items=${z.items.length} serving=${z.serverLive}`);

console.log("\n=== ĐỈNH & ĐÁY ===");
let maxQ = 0;
let maxQAt = 0;
for (let f = 0; f < LOOP; f++) {
  if (STATES[f].queueLen > maxQ) {
    maxQ = STATES[f].queueLen;
    maxQAt = f;
  }
}
console.log(`hàng đợi dài nhất: ${maxQ} gói tại f=${maxQAt} → lat=${(maxQ + 1) * MS_PER_SERVICE}ms`);

let drained = -1;
for (let f = LIMIT_IN; f < LOOP; f++) {
  if (STATES[f].queueLen === 0) {
    drained = f;
    break;
  }
}
console.log(
  `hàng đợi cạn tại f=${drained} (${((drained - LIMIT_IN) / 30).toFixed(1)}s sau limiter)`,
);

console.log("\n=== APP CÓ BAO GIỜ DÍNH 429 KHÔNG? ===");
const appEverRejected = STATES.some((s) => s.appRej > 0);
console.log(
  appEverRejected
    ? "!!! CÓ — hỏng cả câu chuyện"
    : "KHÔNG, một lần cũng không — đúng như thiết kế",
);

const maxBatch = Math.max(...STATES.map((s) => s.batchRej));
console.log(`batch 429 cao nhất: ${pct(maxBatch)}`);

// ─── Chốt chặn hình học ───────────────────────────────────────────────
// Đống hàng đợi KHÔNG được chạm gate. Toán tay không thấy đỉnh thật —
// chỉ mô phỏng mới thấy. Đổi BATCH_IN/BATCH_PERIOD/SERVICE là chạy lại.
console.log("\n=== CHỐT CHẶN HÌNH HỌC ===");
const pileTop = QUEUE_BOTTOM - maxQ * QUEUE_PITCH;
const gateBottom = GATE.y + GATE.h;
const mergeEnd = GATE.y + GATE.h / 2 + MERGE_DIST;
console.log(`đỉnh đống (${maxQ} gói) y=${pileTop}   đáy gate y=${gateBottom}`);
const okGate = pileTop > gateBottom;
const okMerge = pileTop > mergeEnd;
console.log(
  okGate
    ? `  OK — còn ${pileTop - gateBottom}px, đủ ${Math.floor((pileTop - gateBottom) / QUEUE_PITCH)} chỗ dự phòng`
    : `  !!! ĐỐNG ĐÂM XUYÊN GATE — thiếu ${gateBottom - pileTop}px`,
);
console.log(
  okMerge
    ? `  OK — packet đã về trục (y=${mergeEnd}) trước khi tiếp đất`
    : `  !!! packet tiếp đất khi CHƯA về trục — sẽ lệch khỏi cột`,
);

// ─── Chốt chặn ÂM THANH ───────────────────────────────────────────────
// Tiếng cuối phải TẮT HẲN trước frame cuối. Tai bắt mối nối giỏi hơn mắt —
// một tiếng bị loop cắt ngang ở −19dB là nghe thành cú click.
// Đã dính đúng lỗi này một lần (SPEED=18 → tiếng ngân tới f599).
console.log("\n=== CHỐT CHẶN ÂM THANH ===");
const HIT_MS = 75; // độ dài hit.wav — xem scripts/gen-sfx.mjs
const lastTrip = [...appTrips].sort((a, b) => a.done - b.done).pop()!;
const soundEnd = lastTrip.done + (HIT_MS / 1000) * FPS;
const okAudio = soundEnd < LOOP - 2;
console.log(
  `tiếng cuối: f=${lastTrip.done} + ${HIT_MS}ms → tắt ở f=${soundEnd.toFixed(1)}`,
);
console.log(
  okAudio
    ? `  OK — còn ${(LOOP - soundEnd).toFixed(1)} frame lặng trước khi lặp`
    : `  !!! CÒN NGÂN Ở BIÊN — loop sẽ cắt ngang tiếng thành click`,
);

// Khoảng hỏi→đáp của app phải GIÃN RA rồi CO VỀ — đó là cả câu chuyện,
// nghe bằng tai. Không giãn thì âm thanh vô nghĩa, nên cắt luôn.
const gap = (lo: number, hi: number) => {
  const t = appTrips.filter((x) => x.fire >= lo && x.fire < hi);
  return {
    min: Math.min(...t.map((x) => x.done - x.fire)),
    max: Math.max(...t.map((x) => x.done - x.fire)),
  };
};
const g1 = gap(0, BATCH_IN);
const g2 = gap(BATCH_IN, LIMIT_IN);
const g3 = gap(LIMIT_IN, LOOP);
console.log(
  `\nkhoảng hỏi→đáp của app: ${(g1.min / FPS).toFixed(2)}s → ${(g2.max / FPS).toFixed(2)}s → ${(g3.min / FPS).toFixed(2)}s`,
);
const okArc = g2.max > g1.min * 1.8 && g3.min <= g1.min * 1.1;
console.log(
  okArc
    ? `  OK — giãn ${(g2.max / g1.min).toFixed(1)}× rồi co về đúng mức cũ`
    : `  !!! cung không rõ — âm thanh không kể được gì`,
);

if (appEverRejected || !okGate || !okMerge || !okAudio || !okArc) {
  console.log("\n>>> CÓ LỖI, KHÔNG ĐƯỢC RENDER");
  process.exit(1);
}
console.log("\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");

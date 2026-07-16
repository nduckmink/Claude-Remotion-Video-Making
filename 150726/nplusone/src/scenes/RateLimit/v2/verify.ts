import { BOUNCE_FRAMES, FPS, GATE, LOOP, MERGE_Y, QUEUE_BOTTOM, QUEUE_PITCH } from "./constants";
import { c1Trips, PEAK_QUEUE, STATES } from "./sim";
const pileTop = QUEUE_BOTTOM - PEAK_QUEUE * QUEUE_PITCH;
const gateBottom = GATE.y + GATE.h;
const c1Rej = STATES.some((s) => s.c1Rej > 0);
const last = [...c1Trips].sort((a, b) => a.done - b.done).pop()!;
const soundEnd = last.done + (75 / 1000) * FPS;
const g = (lo: number, hi: number) => { const t = c1Trips.filter((x) => x.fire >= lo && x.fire < hi); return { min: Math.min(...t.map((x) => x.done - x.fire)), max: Math.max(...t.map((x) => x.done - x.fire)) }; };
const g1 = g(0, 170), g2 = g(170, 430), g3 = g(430, LOOP);
const checks: [string, boolean, string][] = [
  ["client 1 không bao giờ dính 429", !c1Rej, c1Rej ? "CÓ DÍNH — vỡ câu chuyện" : "một lần cũng không"],
  ["đống không chạm gate", pileTop > gateBottom, `đỉnh ${PEAK_QUEUE} gói y=${pileTop} vs đáy gate y=${gateBottom} → dư ${Math.floor((pileTop - gateBottom) / QUEUE_PITCH)} chỗ`],
  ["packet về trục trước khi tiếp đất", pileTop > MERGE_Y, `y=${pileTop} vs merge y=${MERGE_Y}`],
  ["cú bật 429 ≥ 8 frame", BOUNCE_FRAMES >= 8, `${BOUNCE_FRAMES} frame`],
  ["biên loop im", soundEnd < LOOP - 2, `tiếng cuối tắt f=${soundEnd.toFixed(1)}, dư ${(LOOP - soundEnd).toFixed(1)} frame lặng`],
  ["hàng đợi rỗng ở hai đầu loop", STATES[0].queueLen === 0 && STATES[LOOP - 1].queueLen === 0, `f0=${STATES[0].queueLen} f599=${STATES[LOOP - 1].queueLen}`],
  ["cung latency giãn rồi co", g2.max > g1.min * 1.8 && g3.min <= g1.min * 1.1, `${(g1.min / FPS).toFixed(2)}s → ${(g2.max / FPS).toFixed(2)}s → ${(g3.min / FPS).toFixed(2)}s`],
];
let bad = 0;
for (const [name, ok, note] of checks) { if (!ok) bad++; console.log(`${ok ? " OK " : "FAIL"}  ${name.padEnd(34)} ${note}`); }
console.log(bad ? `\n>>> ${bad} LỖI` : "\n>>> TẤT CẢ CHỐT CHẶN ĐỀU ĐẠT");
process.exit(bad ? 1 : 0);

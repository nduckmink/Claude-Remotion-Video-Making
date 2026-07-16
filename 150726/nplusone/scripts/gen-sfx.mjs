// Sinh SFX bằng toán thuần — không sample pack, không thư viện, không tải gì.
//
// Đây là phiên bản âm thanh của luật trong Resource/style_guide.md:
//   "không dùng ảnh bitmap, không icon pack — mọi thứ vẽ bằng SVG/div primitives"
// Lấy tiếng từ sample pack là phá đúng nguyên tắc đó, chỉ ở tầng khác.
// Blip tổng hợp còn nghe ra "máy móc, chính xác" — đúng tông bản vẽ kỹ thuật.
//
// Chạy: node scripts/gen-sfx.mjs

import fs from "node:fs";
import path from "node:path";

const SR = 48000;
const OUT = path.join(process.cwd(), "public");

/** Float32 [-1,1] → WAV mono 16-bit. */
const wav = (samples) => {
  const n = samples.length;
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); // PCM
  b.writeUInt16LE(1, 22); // mono
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    b.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return b;
};

/**
 * fn(t, p) → biên độ. Luôn fade 2ms cuối về 0 tuyệt đối:
 * cắt giữa chừng sóng là nghe thành tiếng "click" ký sinh.
 */
const render = (durMs, fn) => {
  const n = Math.floor((SR * durMs) / 1000);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i / n);
  const fade = Math.floor(SR * 0.002);
  for (let i = 0; i < fade; i++) out[n - 1 - i] *= i / fade;
  return out;
};

// ─── query: APP bắn một query đi. Cao, gọn, khô. ───────────────────────
const query = render(38, (t) => {
  const env = Math.exp(-t * 95);
  const body =
    Math.sin(2 * Math.PI * 1480 * t) * 0.75 +
    Math.sin(2 * Math.PI * 2960 * t) * 0.18;
  return body * env * 0.3;
});

// ─── hit: DB trả về. Thấp hơn, pitch trượt xuống → cảm giác "đáp xuống". ──
const hit = render(75, (t, p) => {
  const T = 0.075;
  const f0 = 520;
  const f1 = 355;
  // phase = 2π∫f dt, với f tuyến tính f0→f1
  const phase = 2 * Math.PI * (f0 * t + ((f1 - f0) * t * t) / (2 * T));
  const env = Math.exp(-t * 42);
  const body = Math.sin(phase) * 0.8 + Math.sin(phase * 2) * 0.12;
  return body * env * 0.26 * (1 - p * 0.2);
});

// Hai file này dùng cho CẢ HAI scene, vì chúng nói cùng một nghĩa:
//   query = một request rời client   ·   hit = nó được trả lời
// NPlusOne: nghe ra 9 vòng vs 2 vòng.
// RateLimit: nghe ra khoảng hỏi→đáp của app giãn ra rồi co lại.
//
// Từng thử thêm tick (server xử lý xong) + reject (429) cho RateLimit rồi bỏ:
// đo ra nhịp server act 2 và act 3 giống hệt nhau (3.3 vs 3.4 tiếng/s) vì act 3
// server vẫn chạy hết cỡ để RÚT CẠN hàng đợi. Tiếng không kể được gì → cắt.
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "query.wav"), wav(query));
fs.writeFileSync(path.join(OUT, "hit.wav"), wav(hit));

const ms = (a) => ((a.length / SR) * 1000).toFixed(1);
const peak = (a) => Math.max(...Array.from(a, Math.abs)).toFixed(3);
const show = (n, a) =>
  console.log(
    `${n.padEnd(11)} ${ms(a).padStart(5)}ms  peak ${peak(a)}  tail ${a[a.length - 1]}`,
  );
show("query.wav", query);
show("hit.wav", hit);

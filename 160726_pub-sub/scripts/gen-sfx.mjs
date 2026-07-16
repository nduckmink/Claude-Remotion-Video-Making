// Sinh SFX bằng toán — WAV chỉ là header + mảng PCM.
// Không sample pack, đúng tinh thần "không icon pack" của style_guide.md.
//
// LUẬT (motion_language.md): một tiếng = một sự kiện cơ chế, và không tiếng
// nào MANG THÔNG TIN. Feed autoplay tắt tiếng — video phải hiểu trọn khi câm.
// Âm thanh ở đây chỉ tô đậm thứ mắt đã thấy:
//   direct  → BA tiếng tick (publisher gửi ba lần)
//   pub/sub → MỘT tiếng tick (publisher gửi một lần)
// Chính là con số kể chuyện, chuyển sang kênh tai.
//
// Chạy: npm run sfx

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RATE = 48000;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");

/** LCG có seed — Math.random() vỡ determinism (motion_language.md cấm). */
const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296 - 0.5;
};

const wav = (samples) => {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buf;
};

/**
 * Bọc envelope: 1ms attack, 2ms fade cuối về 0 TUYỆT ĐỐI.
 * Cắt giữa chừng sóng là sinh tiếng click ký sinh — và biên loop thì tai bắt
 * giỏi hơn mắt nhiều.
 */
const render = (ms, fn) => {
  const n = Math.round((ms / 1000) * RATE);
  const atk = Math.round(0.001 * RATE);
  const rel = Math.round(0.002 * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let v = fn(t, i / n);
    if (i < atk) v *= i / atk;
    if (i > n - rel) v *= (n - i) / rel;
    out[i] = v;
  }
  out[n - 1] = 0; // chốt: mẫu cuối bằng 0, không tin vào làm tròn
  return out;
};

const sine = (t, f) => Math.sin(2 * Math.PI * f * t);
const decay = (p, k) => Math.exp(-k * p);

const files = {};

// publish — publisher GỬI một lần. Direct nghe ba tiếng, pub/sub nghe một.
files["publish.wav"] = render(40, (t, p) => 0.5 * sine(t, 880) * decay(p, 5));

// recv — service nhận. Bốn cao độ để bốn cú hạ cánh so le nghe ra là bốn cú,
// không phải một cục. Cao độ KHÔNG mang thông tin: mắt đã thấy cái nào sáng.
[523.25, 659.25, 783.99, 987.77].forEach((f, i) => {
  files[`recv-${i + 1}.wav`] = render(
    60,
    (t, p) => (0.34 * sine(t, f) + 0.1 * sine(t, f * 2)) * decay(p, 4.5),
  );
});

// miss — svc 4 không nhận được. Tiếng gõ đục, thấp: một cú hụt, không phải
// một cú va. Đây là chỗ duy nhất trong bản phối nghe "nặng".
files["miss.wav"] = render(
  90,
  (t, p) => (0.45 * sine(t, 140) + 0.18 * sine(t, 70)) * decay(p, 6),
);

// svc-in — service mới mọc ra. Sweep lên: một thứ vừa xuất hiện.
files["svc-in.wav"] = render(70, (t, p) => 0.34 * sine(t, 300 + 300 * p) * decay(p, 3.5));

// wire — một đường vừa được nối. Click khô, năm lần so le.
const noise = rng(7);
files["wire.wav"] = render(
  35,
  (t, p) => (0.22 * sine(t, 1400) + 0.1 * noise()) * decay(p, 12),
);

// broker-in — broker xuất hiện. Sweep trầm đi lên: một nền móng vừa đặt xuống.
files["broker-in.wav"] = render(
  250,
  (t, p) =>
    (0.4 * sine(t, 90 + 90 * p) + 0.14 * sine(t, 180 + 180 * p)) * decay(p, 2.2),
);

// broker-hit — packet vào tới broker. Thump ngắn, ứng với ring nở ra.
files["broker-hit.wav"] = render(70, (t, p) => 0.38 * sine(t, 180) * decay(p, 5.5));

// ── V2: cú đăng ký ────────────────────────────────────────────────────
// subscribe — service phóng chốt lên topic. Sweep lên: một thứ đang đi lên.
files["subscribe.wav"] = render(
  55,
  (t, p) => 0.26 * sine(t, 420 + 260 * p) * decay(p, 4),
);

// attach — chốt cắm vào vành. Tiếng khoá: hai thứ vừa khớp vào nhau.
files["attach.wav"] = render(
  45,
  (t, p) => (0.3 * sine(t, 1180) + 0.16 * sine(t, 590)) * decay(p, 9),
);

mkdirSync(OUT, { recursive: true });
for (const [name, samples] of Object.entries(files)) {
  writeFileSync(join(OUT, name), wav(samples));
  const last = samples[samples.length - 1];
  if (last !== 0) throw new Error(`${name}: mẫu cuối = ${last}, phải bằng 0`);
  console.log(`${name.padEnd(16)} ${((samples.length / RATE) * 1000).toFixed(0)}ms`);
}
console.log(`\n${Object.keys(files).length} file → ${OUT}`);

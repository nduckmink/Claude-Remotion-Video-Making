// Sinh SFX bằng toán — kernel + thư viện chép từ Resource/sfx.md.
// Chỉ giữ những tiếng scene này dùng; tên lấy nguyên từ thư viện chung,
// KHÔNG đặt tên theo miền (`hacker-hit`, `salt-drop`…) — tên khoá theo miền
// thì video sau lại phải làm âm thanh lại từ đầu.
//
// Chạy: npm run sfx

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RATE = 48000;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");

/** LCG có seed — Math.random() vỡ determinism. */
const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296 - 0.5;
};

const tone = ({ f, ms, decay = 5, gain = 0.4, sweep = 0, harm = 0, sub = 0, noise = 0 }) => {
  const n = Math.round((ms / 1000) * RATE);
  const atk = Math.round(0.001 * RATE);
  const rel = Math.round(0.002 * RATE);
  const noiz = rng(7);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    // Cộng dồn PHA — sin(2π·f(p)·t) là pha nhảy khi f đổi giữa chừng.
    phase += (2 * Math.PI * (f * (1 + sweep * p))) / RATE;
    let v =
      Math.sin(phase) +
      harm * Math.sin(2 * phase) +
      sub * Math.sin(0.5 * phase) +
      noise * noiz();
    v *= gain * Math.exp(-decay * p);
    if (i < atk) v *= i / atk;
    if (i > n - rel) v *= (n - i) / rel;
    out[i] = v;
  }
  out[n - 1] = 0; // mẫu cuối bằng 0, không tin vào làm tròn
  return out;
};

const wav = (samples) => {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  return buf;
};

// ─── Thư viện (Resource/sfx.md) — chỉ những tiếng scene này dùng ──────
// Tên lấy NGUYÊN từ thư viện chung (Resource/sfx.md) — không đặt theo miền.
// Video thứ ba dùng lại bộ tên này mà không phải bịa thêm cái nào.
const SFX = {
  click: { f: 1500, ms: 35, decay: 13, gain: 0.28, noise: 0.4 }, // chuột bấm
  emit: { f: 880, ms: 40, decay: 5, gain: 0.5 }, // request rời client
  absorb: { f: 180, ms: 70, decay: 5.5, gain: 0.42 }, // request vào tới server
  arrive: { f: [523.25], ms: 60, decay: 4.5, gain: 0.34, harm: 0.3 }, // hồi âm về · charge hợp lệ
  attach: { f: 1180, ms: 45, decay: 9, gain: 0.3, sub: 0.53 }, // tra sổ thấy key → trả biên lai cũ
  fail: { f: 140, ms: 90, decay: 6, gain: 0.5, sub: 0.4 }, // TIỀN BỊ TRỪ OAN
  drop: { f: 240, ms: 110, decay: 4, gain: 0.32, sweep: -0.5, sub: 0.3 }, // hồi âm chết
};

mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [name, spec] of Object.entries(SFX)) {
  const fs = Array.isArray(spec.f) ? spec.f : [spec.f];
  fs.forEach((f, i) => {
    const s = tone({ ...spec, f });
    const label = fs.length > 1 ? `${name}-${i + 1}` : name;
    const peak = Math.max(...Array.from(s, Math.abs));
    // Chốt ngay lúc sinh: mẫu cuối = 0, và không clip.
    if (s[s.length - 1] !== 0) throw new Error(`${label}: mẫu cuối ≠ 0`);
    if (peak > 1) throw new Error(`${label}: clip (peak ${peak.toFixed(2)}) — hạ gain`);
    writeFileSync(join(OUT, `${label}.wav`), wav(s));
    console.log(`${label.padEnd(10)} ${((s.length / RATE) * 1000).toFixed(0).padStart(3)}ms  peak=${peak.toFixed(3)}`);
    n++;
  });
}
console.log(`\n${n} file → ${OUT}`);

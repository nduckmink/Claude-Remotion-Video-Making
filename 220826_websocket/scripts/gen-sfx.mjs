/**
 * Sinh WAV bằng toán — kernel copy từ Resource/sfx.md.
 * File audio KHÔNG vào git: nó là thứ dẫn xuất, chạy lại là có.
 *   node scripts/gen-sfx.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SFX } from "./sfx-table.mjs";

const RATE = 48000;

/** LCG có seed — Math.random() vỡ determinism. */
const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296 - 0.5;
};

export const tone = ({ f, ms, decay = 5, gain = 0.4, sweep = 0, harm = 0, sub = 0, noise = 0 }) => {
  const n = Math.round((ms / 1000) * RATE);
  const atk = Math.round(0.001 * RATE);
  const rel = Math.round(0.002 * RATE);
  const noiz = rng(7);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    // Cộng dồn PHA, đừng viết sin(2π·f(p)·t): đổi f giữa chừng theo kiểu đó là
    // pha nhảy, và nghe ra ngay.
    phase += (2 * Math.PI * (f * (1 + sweep * p))) / RATE;
    let v =
      Math.sin(phase) + harm * Math.sin(2 * phase) + sub * Math.sin(0.5 * phase) + noise * noiz();
    v *= gain * Math.exp(-decay * p);
    if (i < atk) v *= i / atk; // 1ms attack — vào thẳng là click
    if (i > n - rel) v *= (n - i) / rel; // 2ms release
    out[i] = v;
  }
  out[n - 1] = 0; // chốt: mẫu cuối bằng 0, không tin vào làm tròn
  return out;
};

export const wav = (samples) => {
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

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");
mkdirSync(outDir, { recursive: true });

let count = 0;
let bytes = 0;
const t0 = process.hrtime.bigint();

for (const [name, spec] of Object.entries(SFX)) {
  const freqs = Array.isArray(spec.f) ? spec.f : [spec.f];
  freqs.forEach((f, i) => {
    const s = tone({ ...spec, f });

    // Chốt NGAY lúc sinh, đừng tin vào làm tròn.
    if (s[s.length - 1] !== 0) throw new Error(`${name}: mẫu cuối != 0`);
    const peak = Math.max(...Array.from(s, Math.abs));
    if (peak > 1) throw new Error(`${name}: peak ${peak.toFixed(3)} > 1 — hạ gain, đừng để tự xén`);

    const file = Array.isArray(spec.f) ? `${name}-${i + 1}.wav` : `${name}.wav`;
    const buf = wav(s);
    writeFileSync(join(outDir, file), buf);
    count++;
    bytes += buf.length;
  });
}

const ms = Number(process.hrtime.bigint() - t0) / 1e6;
console.log(`${count} tiếng · ${(bytes / 1024).toFixed(1)}KB · ${ms.toFixed(0)}ms`);

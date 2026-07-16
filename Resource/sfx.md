# SFX — Âm thanh

File này là **thư viện tiếng của kênh**, không phải hướng dẫn làm âm thanh cho một video.

Quan hệ với project: **`sfx.md` : `scripts/gen-sfx.mjs` = `style_guide.md` : `lib/tokens.ts`.** Rule giữ bản gốc, project copy vào rồi xoá bớt tiếng không dùng. Không có folder asset dùng chung, không commit file audio nào.

## Luật

**MỘT TIẾNG = MỘT SỰ KIỆN CƠ CHẾ.** Đây là luật "mỗi chuyển động là một mệnh đề" (`motion_language.md`) áp cho tai. Không tiếng nào được tồn tại mà không ứng với một sự kiện có thật trong `sim.ts`.

> **Âm thanh KHÔNG BAO GIỜ mang thông tin.**
> TikTok/Reels autoplay **tắt tiếng**. Video phải hiểu trọn vẹn khi câm — âm thanh chỉ là thưởng thêm cho ai bật loa. Không ngoại lệ.

- **Không nhạc, không ambience, không lời.** Chỉ SFX rời, mỗi cái neo vào một frame cụ thể.
- **Mọi tiếng fade 2ms cuối về 0 TUYỆT ĐỐI**, và mẫu cuối cùng gán thẳng `0` — đừng tin vào làm tròn. Cắt giữa chừng sóng là sinh tiếng click ký sinh.
- **Biên loop im tuyệt đối.** Không tiếng nào còn ngân tại frame cuối — **tai bắt mối nối giỏi hơn mắt nhiều**. Cửa sổ reset phải hoàn toàn lặng.
- **`LOOP` là bội của 16 frame** khi scene có audio: 25 AAC frame = 16 video frame @30fps/48kHz. Chỉ ở đó nhát cắt container mới rơi đúng mẫu (`remotion_conventions.md`).

Nhịp là **kênh đo thứ tư**, sau độ dài / số lượng / thời lượng: nghe ba tiếng rồi nghe một tiếng là *cảm* được tương phản mà không đọc con số nào. Nhưng nó chỉ được **nhắc lại** thứ mắt đã thấy, không được nói thêm.

### Sinh bằng oscillator, KHÔNG sample pack

Đúng tinh thần "không icon pack" của `style_guide.md`. Ba lý do, không phải vì cấm cho vui:

- **Kiếm về vẫn phải chế lại.** Luật đòi fade 2ms về 0, biên loop im, và `verify.ts` phải **tính được** độ dài từng tiếng để chốt "tiếng cuối tắt trước frame cuối". File tải về có đuôi lạ, level lạ, độ dài lạ — xử lý xong thì công sức đã bằng viết công thức, mà kết quả vẫn không sửa được.
- **Lệch tông với hình.** Hình vẽ 100% bằng SVG primitive, không một bitmap nào. Tiếng thu thật đứng cạnh đó nghe như dán ảnh chụp lên bản vẽ kỹ thuật.
- **Một file WAV không sửa được.** Cần ngắn hơn 20ms, trầm hơn một quãng, decay khô hơn? Với công thức là đổi một số. Với file là đi kiếm file khác.

Gặp kết cấu oscillator không làm nổi (giấy, cơ khí lạch cạch)? **Mở rộng kernel** — thêm noise shaping, thêm FM. Đừng import WAV. Vẫn một nguồn sự thật, vẫn sửa được bằng số.

### File audio KHÔNG vào git

`.gitignore` gạt `*.wav` không phải vì nó nặng, mà vì nó là **thứ dẫn xuất** — cùng loại với `out/`.

Đo thật: toàn bộ thư viện = **112KB nhị phân, sinh lại hết trong 88ms** từ ~130 dòng text. Commit 112KB để khỏi chạy 88ms là lỗ, và đổi lại là mất khả năng sửa.

## Tên = ĐỘNG TỪ CƠ CHẾ, không phải danh từ miền

Luật quan trọng nhất file này, vì nó quyết định thư viện có tích luỹ được hay không.

> **Phép thử: cái tên này có nghĩa gì ở một video về chủ đề khác không?**
> `broker-hit` → không. `absorb` → có.

Đã trả giá: video pub/sub đặt tên `broker-hit`, `svc-in`, `publish`, `subscribe`. Không cái nào dùng lại được ở video về caching. Đặt tên kiểu đó thì mỗi video vẫn phải làm âm thanh lại từ đầu — đúng cái mà thư viện sinh ra để tránh.

Tên lấy từ **bộ động từ chuyển động** trong `motion_language.md` — âm thanh và chuyển động dùng chung một bộ từ vựng, vì chúng là hai kênh của cùng một sự kiện.

Cái được lớn hơn chuyện đỡ làm lại: **`bounce` kêu giống nhau ở mọi video.** Người xem vài video của kênh sẽ *học* được ngôn ngữ đó mà không ai dạy — cái mà một bộ tên khoá-theo-miền không bao giờ làm được.

Biến thể cao độ: `arrive-1.wav` … `arrive-4.wav` (khai báo `f` là mảng).

## Thư viện

**Đây là "assets".** Mỗi tiếng đúng MỘT dòng dữ liệu, không phải một đoạn code để copy rồi hack — hack thì ba video sau là ba tông khác nhau.

```ts
export const SFX = {
  emit:    { f: 880, ms: 40, decay: 5, gain: 0.5 },                          // rời khỏi nguồn
  arrive:  { f: [523.25, 659.25, 783.99, 987.77], ms: 60, decay: 4.5, gain: 0.34, harm: 0.3 }, // tới đích
  absorb:  { f: 180, ms: 70, decay: 5.5, gain: 0.38 },                       // bị một thành phần nuốt vào
  fail:    { f: 140, ms: 90, decay: 6, gain: 0.45, sub: 0.4 },               // hỏng / không tới được
  bounce:  { f: 620, ms: 70, decay: 7, gain: 0.32, sweep: -0.45 },           // bị trả về
  drop:    { f: 240, ms: 110, decay: 4, gain: 0.3, sweep: -0.5, sub: 0.3 },  // rơi ra khỏi hệ
  spawn:   { f: 300, ms: 70, decay: 3.5, gain: 0.34, sweep: 1 },             // phần tử mới xuất hiện
  attach:  { f: 1180, ms: 45, decay: 9, gain: 0.3, sub: 0.53 },              // cắm vào, khớp
  draw:    { f: 1400, ms: 35, decay: 12, gain: 0.22, noise: 0.45 },          // một đường được nối
  install: { f: 90, ms: 250, decay: 2.2, gain: 0.4, sweep: 1, harm: 0.35 },  // hạ tầng đặt xuống
};
```

**Thư viện thì CÓ catalog — khác `style_guide.md`, và khác có lý do.** Bên hình, 8 trục đẻ ra sự nhất quán nên liệt kê thêm là vừa thừa vừa trói: một database vẽ hơi khác nhau giữa hai video thì vẫn đọc ra là database. Bên tiếng thì không: giá trị nằm ở chỗ **lặp lại y hệt**. `bounce` mà mỗi video một cao độ thì chẳng ai học được nó. Trục ở dưới là để **mở rộng** catalog, không phải để thay nó.

Thêm tiếng mới thì thêm vào đây, đừng đẻ ra bản riêng trong project.

## 8 trục âm — sinh bất cứ tiếng gì

Mỗi trục là một **câu hỏi**, không phải một ô tra. Trả lời xong 8 câu là ra một dòng khai báo.

| Trục | Thang | Hỏi |
|---|---|---|
| **Cao độ** `f` | 90 → 1400 Hz | Nó nặng và là hạ tầng, hay nhẹ và bé? |
| **Độ dài** `ms` | 35 → 250 | Một cú tức thời, hay một quá trình có bề dày? |
| **Sweep** `sweep` | −0.5 ↔ 0 ↔ +1 | Nó đang **biến mất**, chỉ **xảy ra một phát**, hay đang **xuất hiện**? |
| **Decay** `decay` | 12 → 2 | Gõ khô (va chạm) hay ngân (còn dư âm)? |
| **Hoạ âm** `harm` | 0 ↔ 0.4 | Nó mảnh và sạch, hay dày và có thân? |
| **Hạ quãng** `sub` | 0 ↔ 0.5 | Nó có sức nặng ở dưới không? Thứ nặng thì có đáy. |
| **Nhiễu** `noise` | 0 ↔ 0.5 | Cơ khí / ma sát, hay thuần số? |
| **Âm lượng** `gain` | — | Nó quan trọng cỡ nào **trong câu chuyện**? |

Không dòng nào bảo "tiếng hỏng phải trầm". Nhưng cứ trả lời 8 câu cho một cú hỏng, bạn **sẽ** ra một tiếng thấp, có hạ quãng, decay vừa, không sweep — và nó sẽ giống tiếng hỏng ở video sau, tự nó.

Đối chiếu với 8 trục hình trong `style_guide.md`: `f` ↔ Kích thước, `sweep` ↔ Trạng thái, `noise` ↔ Fill, `gain` ↔ Opacity. Cùng một cách nghĩ, hai giác quan.

## Kernel

Chép nguyên sang `scripts/gen-sfx.mjs`. WAV chỉ là header + mảng PCM.

```js
const RATE = 48000;

/** LCG có seed — Math.random() vỡ determinism (motion_language.md cấm). */
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
    // pha nhảy, và nghe ra ngay. Cộng dồn thì sweep mượt và đúng tần số tức thời.
    phase += (2 * Math.PI * (f * (1 + sweep * p))) / RATE;
    let v =
      Math.sin(phase) +
      harm * Math.sin(2 * phase) +
      sub * Math.sin(0.5 * phase) +
      noise * noiz();
    v *= gain * Math.exp(-decay * p);
    if (i < atk) v *= i / atk;          // 1ms attack — vào thẳng là click
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
  buf.writeUInt16LE(1, 20);  // PCM
  buf.writeUInt16LE(1, 22);  // mono
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
```

Writer: `f` là mảng thì xuất `<tên>-1.wav`, `<tên>-2.wav`…; là số thì xuất `<tên>.wav`. Chốt ngay lúc sinh: **mẫu cuối phải bằng 0, và peak phải ≤ 1** — clip thì đổi `gain`, đừng để nó tự xén.

## Ráp vào scene

Lịch tiếng do `sim.ts` chốt, component chỉ đọc — **đừng neo tiếng vào frame gõ tay**, nó sẽ lệch ngay khi đổi một hằng số.

```tsx
{EVENTS.map((e, k) => (
  <Sequence key={`sfx-${k}`} from={e.f} durationInFrames={30}>
    <Audio src={staticFile(`sfx/${file(e)}`)} volume={VOL[e.kind]} />
  </Sequence>
))}
```

`durationInFrames` phải dài hơn tiếng dài nhất (250ms = 7.5 frame); 30 là dư an toàn.

`verify.ts` bắt buộc canh hai điều:

- **Tiếng cuối tắt trước `LOOP − 2`** — tính từ `EVENTS` + độ dài khai báo trong `SFX`, đừng gõ tay.
- **Không sự kiện nào rơi vào cửa sổ reset.**

Kiểm ở tầng container nữa, vì loop khít ở tầng frame vẫn có thể khựng ở tầng file:

```bash
npx remotion ffmpeg -i out/<id>.mp4 -vn -af silencedetect=noise=-50dB:d=0.3 -f null /dev/null
# khoảng lặng cuối phải chạm đúng biên loop
```

`volumedetect` **không có** trong bản ffmpeg của Remotion; `silencedetect` thì có — và nó mới là thứ đo đúng câu cần hỏi.

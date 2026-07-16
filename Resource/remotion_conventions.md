# Remotion Conventions — Quy ước code

## Cấu hình chuẩn

```tsx
<Composition
  id="CachingLayers"            // PascalCase, trùng tên scene
  component={CachingLayers}
  width={1080} height={1920}    // 9:16 mặc định
  fps={30}
  durationInFrames={300}        // = LOOP, 6–12s
/>
```

Mỗi scene là **một Composition riêng** đăng ký trong `Root.tsx`. Không nhét nhiều scene vào một composition.

## Cấu trúc project

```
src/
  Root.tsx                  # đăng ký mọi composition
  lib/
    tokens.ts               # C (màu), F (font) — theo style_guide.md
    motion.ts               # ease, pulse(), loopPhase() dùng chung
  components/               # primitives tái sử dụng — đang có:
    Header.tsx              # handle + title, MỌI scene render
    GridBg.tsx  Node.tsx  Packet.tsx  Connector.tsx
    Cylinder.tsx  RowCard.tsx  StatBar.tsx
  scripts/
    gen-sfx.mjs             # sinh WAV bằng toán (xem motion_language.md)
  scenes/
    CachingLayers/
      index.tsx             # scene chính
      constants.ts          # LOOP, layout, số liệu của riêng scene
      sim.ts                # mô phỏng cơ chế, nếu scene có cơ chế chạy được
      verify.ts             # chốt chặn tự động — xem dưới
      v2/                   # bản revise (xem scene_revision.md)
```

Primitives dùng chung đặt ở `components/`; scene mới **ưu tiên tái sử dụng** primitives có sẵn trước khi viết mới. Viết mới cái gì đủ tổng quát thì đưa vào `components/`.

## Mô phỏng, đừng tính tay

Scene nào có **cơ chế chạy được** (hàng đợi, round trip, tranh chấp tài nguyên) thì viết `sim.ts`: chạy cơ chế đó từng frame một, xuất ra trạng thái mỗi frame. Component chỉ **đọc** `STATES[frame]` và vẽ.

```ts
const simulate = (): State[] => { /* vòng lặp f = 0..LOOP */ };
export const STATES = simulate();          // chạy MỘT lần ở module level
export const PEAK_MS = Math.max(...STATES.map((s) => s.latencyMs));
```

Lý do không phải sự thanh lịch — mà là **toán tay nói dối**:

- Tính tay: hàng đợi phình 7 gói. Mô phỏng: **10**. Chênh 3 vì khi đống dâng, đám packet đang bay bị "vạch tiếp đất" dâng lên đón sớm — cả pipeline đổ ập vào. Không mô phỏng thì đống **đâm xuyên** phần tử phía trên mà không ai biết.
- Số chốt gõ tay `200ms` trong khi đỉnh thật là **225ms**. Số nào hiện trên màn hình thì **tính ra từ `STATES`**, đừng gõ.

## `verify.ts` — chốt chặn tự động

Mỗi scene có cơ chế thì có một `verify.ts` liệt kê những điều **phải đúng**, và exit 1 nếu sai:

```bash
npx esbuild src/scenes/<Name>/verify.ts --bundle --platform=node \
  --outfile=<tmp>/v.cjs --log-level=error && node <tmp>/v.cjs
```

Kiểm những thứ mắt không thấy được:

- **Lời hứa của scene**: "client 1 không bao giờ dính 429" — quét cả 600 frame, không phải liếc vài cái.
- **Hình học**: đống hàng đợi có chạm phần tử phía trên không? Còn dư mấy chỗ?
- **Âm thanh**: tiếng cuối có tắt trước frame cuối không?
- **Loop**: trạng thái ở hai đầu có bằng nhau không?

Chạy verify **trước khi render**. Đổi một hằng số là chạy lại — nó tồn tại để bắt cái mà bạn quên cộng.

## Bẫy đã trả giá

- **`pathLength` trên `<rect>` không chạy trong Chrome headless.** Progress ring vẽ bằng `<rect pathLength={1}>` ra **trắng trơn**, không báo lỗi gì. Dùng `<path>` — chỗ đó thì chạy.
- **Đừng nuốt lỗi bằng `2>/dev/null` hay `| head`.** `head` luôn exit 0, nên `cmd | head && echo OK` in ra "OK" ngay cả khi `cmd` fail. Đọc **exit code**, đừng đọc chữ.
- **`npx remotion add <pkg>` fail trên Windows** (`spawn npm ENOENT`) — cài thẳng bằng `npm i --save-exact <pkg>@<version>`.
- **Đo bằng pixel, đừng đo bằng mắt.** Nghi ngờ gì thì render `--scale=1` rồi đọc pixel bằng Node: che có kín không, ring có chạy đúng chiều không, biên loop có im không. Mắt nhìn ảnh 0.5× thì cái gì cũng "trông ổn".

## Quy tắc code

- **Mọi giá trị animate xuất phát từ `useCurrentFrame()`**. Không `useState` + timer, không CSS transition/animation, không `requestAnimationFrame`.
- **Deterministic**: cùng frame → cùng hình. Random phải dùng `random(seed)` của Remotion với seed cố định.
- Hằng số scene (LOOP, toạ độ tầng, số liệu, timing) gom vào `constants.ts` — chỉnh nội dung không phải mò trong JSX.
- Layout bằng absolute positioning trong khung 1080×1920; vẽ đường/hình bằng SVG.
- Font: `@remotion/google-fonts/Inter` và `.../JetBrainsMono`, load ở module level.
- TypeScript, functional components, props có type đầy đủ.

## Helper loop chuẩn (`lib/motion.ts`)

```ts
import { Easing, interpolate } from 'remotion';

export const ease = Easing.inOut(Easing.cubic);

// pha tuần hoàn 0→1, k chu kỳ trong một loop — luôn seamless
export const loopPhase = (frame: number, loop: number, k = 1) =>
  ((frame * k) % loop) / loop;

// nhịp thở sine 0→1→0, k chu kỳ / loop
export const pulse = (frame: number, loop: number, k = 1) =>
  0.5 + 0.5 * Math.sin(2 * Math.PI * (frame / loop) * k - Math.PI / 2);
```

## Kiểm tra trước khi giao

1. `npx remotion still <Id> --frame=0` và `--frame=<LOOP/2>` — soi bố cục, safe area, chính tả label.
2. **Seamless: so frame `0` với frame `LOOP`, KHÔNG phải `LOOP - 1`.**

   Frame `LOOP-1` **phải khác** frame 0 — đúng một bước chuyển động. So hai cái đó rồi kết luận "vỡ loop" là bài test sai, không phải code sai.

   `LOOP` nằm ngoài composition nên phải nới duration tạm rồi trả lại:

   ```bash
   sed -i 's/durationInFrames={LOOP}/durationInFrames={LOOP + 60}/' src/Root.tsx
   npx remotion still <Id> out/f0.png   --frame=0   --scale=0.5
   npx remotion still <Id> out/fL.png   --frame=<LOOP> --scale=0.5
   sed -i 's/durationInFrames={LOOP + 60}/durationInFrames={LOOP}/' src/Root.tsx
   # hash hai file: TRÙNG KHÍT thì mới là seamless
   ```

   So bằng **hash**, không bằng mắt: hai frame lệch một chút thì mắt không thấy, byte thì thấy.
3. Render: `npx remotion render <Id> out/<id>.mp4 --muted`.

   **`--muted` là bắt buộc với video câm.** Remotion mặc định chèn một audio track **câm** vào mọi render. Nó ăn ~35% dung lượng cho không gì cả, và tệ hơn: nó kéo container dài hơn video (12.05s vs 12.00s) → player **đứng hình ~1.6 frame** trước khi loop lại. Loop khít ở tầng frame vẫn có thể khựng ở tầng container — nhớ kiểm cả hai:

   ```bash
   npx remotion ffprobe out/<id>.mp4 -v error \
     -show_entries stream=codec_type,duration,nb_frames -of default=noprint_wrappers=1
   # video duration phải = durationInFrames / fps, chẵn.
   ```

   Scene **có** audio thì không dùng `--muted` được; cắt đuôi bằng
   `npx remotion ffmpeg -i in.mp4 -c copy -t <LOOP/fps> out.mp4`.
   AAC không chạm đúng giây chẵn được (1 frame = 1024 sample = 21.33ms), sai số còn ~10ms.
   Muốn khít tuyệt đối: chọn **LOOP là bội của 16 frame** (25 AAC frame = 16 video frame @30fps/48kHz).
4. GIF khi cần: `npx remotion render <Id> out/<id>.gif --codec=gif --every-nth-frame=2` (hoặc mp4 → ffmpeg palette để tối màu).

## Khi chưa có project

Nếu workspace chưa có project Remotion, khởi tạo trước: `npx create-video@latest --blank` (TypeScript), rồi dựng `lib/` + `components/` theo cấu trúc trên trước khi viết scene đầu tiên.

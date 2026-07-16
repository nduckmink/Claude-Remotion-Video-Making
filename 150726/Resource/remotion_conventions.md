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
  components/               # primitives tái sử dụng
    Header.tsx              # header block cố định — MỌI scene phải render
    Node.tsx  Pill.tsx  StatCard.tsx  Counter.tsx
    Connector.tsx  LayerRow.tsx  Tag.tsx  GridBg.tsx
  scenes/
    CachingLayers/
      index.tsx             # scene chính
      constants.ts          # LOOP, layout, số liệu của riêng scene
      v2/index.tsx          # bản revise (xem scene_revision.md)
```

Primitives dùng chung đặt ở `components/`; scene mới **ưu tiên tái sử dụng** primitives có sẵn trước khi viết mới. Viết mới cái gì đủ tổng quát thì đưa vào `components/`.

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
2. Seamless: so sánh still tại frame `0` và frame `LOOP - 1` (hoặc render thử 2 vòng) — không được khớp nối giật.
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

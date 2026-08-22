# Claude Remotion Video Making

Video diễn hoạ kỹ thuật làm bằng [Remotion](https://remotion.dev). Mỗi video là một **animation loop dạng diagram** — 9:16, 30fps, không lời thoại, không nhạc. Hình tự kể chuyện.

Chủ đề: cơ chế phần mềm và kiến trúc hệ thống — caching, message queue, JWT, OAuth, CDN, RAG, WebSocket…

---

## Ủng hộ

Nếu repo này giúp được bạn:

```
BIDV   8835353012   NGUYEN DUC MINH
```

---

## Repo này khác gì một đống project Remotion

Thứ được tích luỹ ở đây **không phải file, mà là công thức**.

- `Resource/` là nguồn sự thật duy nhất về cách làm video — tư duy, bố cục, màu, chuyển động, âm thanh, quy ước code. Rules áp cho mọi project, không project nào được đặt luật riêng đè lên.
- Mỗi project **tự sinh ra asset của nó**: bảng màu sinh từ `idColor()`, thư viện tiếng sinh từ `tone()`. Không có folder asset dùng chung, không commit một file `.wav` hay `.png` nào.
- Mỗi scene có `sim.ts` mô phỏng cơ chế từng frame và `verify.ts` chốt chặn tự động. Số nào hiện trên màn hình cũng **tính ra từ sim**, không gõ tay.

## Cấu trúc

```
CLAUDE.md            # hướng dẫn cho AI agent làm việc trong repo
README.md            # file này
Resource/            # rules — dùng chung, không thuộc project nào
docs/                # ghi chú vận hành kênh
<DDMMYY>_<chủ đề>/   # MỘT project = MỘT video, độc lập hoàn toàn
```

Tên folder: **`ngày_chủ đề`** — `220826_websocket` = bắt đầu 22/08/2026, chủ đề websocket. Ngày `DDMMYY`, chủ đề kebab-case tiếng Anh, ngăn cách bằng **một** gạch dưới.

Mỗi project có `package.json`, `remotion.config.ts`, `src/` riêng. Không workspace chung, không chia sẻ `node_modules`, **không import xuyên project**. Cần code từ project cũ thì copy sang rồi sửa — project cũ đã đóng băng cùng video đã render.

---

## Chuẩn bị máy

### 1. Yêu cầu

| | |
|---|---|
| Node.js | 18+ (repo đang chạy v22) |
| Git | cần cho `create-video` |
| FFmpeg | **không cần cài riêng** — Remotion mang sẵn, gọi qua `npx remotion ffmpeg` |
| Chrome | không cần — Remotion tự tải Chrome Headless Shell ở lần render đầu |

### 2. Cài bộ skill Remotion cho AI agent

Nếu bạn làm việc với Claude Code / Cursor / Copilot, cài bộ skill chính chủ của Remotion trước — nó dạy agent cách dùng Remotion đúng thay vì đoán:

```bash
npx -y skills@latest add remotion-dev/skills -g -y
```

Kết quả: **12 skill** vào `~/.agents/skills/`, symlink sang `~/.claude/skills/` và các agent khác.

| Skill | Dùng cho |
|---|---|
| `remotion-create` | tạo project + composition mới |
| `remotion-best-practices` | router sang các skill còn lại |
| `remotion-docs` | tra cứu tài liệu API |
| `remotion-studio` | preview trong Studio |
| `remotion-render` | export video, CLI, Lambda |
| `remotion-markup` | content, animation, effects |
| `remotion-multimedia` | video/audio/ảnh trong composition |
| `remotion-captions` | phụ đề, transcript, TTS |
| `remotion-interactivity` | Player, tương tác |
| `remotion-maps` | bản đồ động |
| `remotion-saas` | dựng SaaS render video |
| `remotion-upgrade` | nâng version |

Hai điều cần biết:

- Output có dòng **`Failed to install 12 → PromptScript`** — đây **không phải lỗi**. Trình cài cố cài cho mọi agent cùng lúc, riêng target PromptScript không hỗ trợ cài global. Claude Code, Gemini CLI, Copilot… đều thành công.
- Agent quét skill lúc khởi động, nên phải **mở session mới** thì 12 skill mới xuất hiện.

---

## Chạy một video có sẵn

```bash
cd 220826_websocket
npm i
npm run sfx        # sinh WAV vào public/sfx/ — không có sẵn trong git
npm run verify     # chốt chặn: loop, hình học, âm thanh, lời hứa của scene
npm run dev        # mở Remotion Studio
```

`npm run sfx` là **bắt buộc** trước khi preview hay render: file audio là thứ dẫn xuất, `.gitignore` gạt hết. Toàn bộ thư viện tiếng sinh lại trong ~30ms.

---

## Làm một video mới

### 1. Scaffold

```bash
npx create-video@latest --yes --blank --no-tailwind 230826_backpressure
cd 230826_backpressure
npm i
```

> ⚠️ `create-video --yes` **không tự cài dependency**. Không chạy `npm i` là `remotion` không tồn tại.

### 2. Dependency thêm

```bash
npm i --save-exact @remotion/google-fonts@4.0.515
npm i -D --save-exact esbuild@0.25.10
```

> ⚠️ `npx remotion add <pkg>` **fail trên Windows** (`spawn npm ENOENT`). Cài thẳng bằng `npm i` như trên. Giữ đúng version với `remotion` trong `package.json`.

`esbuild` để bundle `verify.ts` chạy bằng Node. Nếu `verify.ts` cần đọc bảng SFX từ `scripts/*.mjs`, bật `"allowJs": true` trong `tsconfig.json`.

### 3. Copy CÔNG THỨC, đừng copy file

| Từ | Sang | Sinh ra |
|---|---|---|
| `Resource/style_guide.md` → `C`, `F`, `idColor()` | `src/lib/tokens.ts` | bảng màu |
| `Resource/sfx.md` → `SFX`, `tone()`, `wav()` | `scripts/gen-sfx.mjs` | `public/sfx/*.wav` |
| `Resource/motion_language.md` → `spring01`, `arc`, `breathe` | `src/lib/anim.ts` | chuyển động |

`src/lib/anim.ts` **không được import remotion** — `sim.ts` và `verify.ts` chạy bằng Node, kéo `Easing` của remotion vào là chết.

### 4. Thêm script vào `package.json`

```json
{
  "sfx": "node scripts/gen-sfx.mjs",
  "verify": "esbuild src/scenes/<Name>/verify.ts --bundle --platform=node --outfile=.v.cjs --log-level=error && node .v.cjs"
}
```

### 5. Scene plan trước, code sau

Trả lời 5 câu trong `Resource/creative_rule.md` (aha moment · cái gì thay đổi · con số kể chuyện · tương phản · bỏ được gì), trình plan ngắn, **rồi mới code**.

### 6. Cấu trúc code

```
src/
  Root.tsx                  # đăng ký mọi composition
  lib/       tokens.ts  anim.ts  fonts.ts
  components/               # primitives tái sử dụng
  scenes/<Name>/
    constants.ts            # LOOP, hình học, lịch sự kiện
    sim.ts                  # mô phỏng cơ chế → STATES[frame]
    verify.ts               # chốt chặn tự động
    index.tsx               # component chỉ ĐỌC STATES và vẽ
scripts/     gen-sfx.mjs
public/sfx/                 # sinh ra, không vào git
```

---

## Quy trình kiểm trước khi giao

Chạy đủ 5 bước. Bước nào cũng từng bắt được lỗi thật.

### 1. `verify.ts` — chạy lại mỗi lần đổi một hằng số

```bash
npm run verify
```

### 2. Still — soi bố cục, safe area, chính tả nhãn

```bash
npx remotion still <Id> out/f0.png --frame=0
npx remotion still <Id> out/fmid.png --frame=<LOOP/2>
```

**Nhìn ảnh thật.** Lỗi màu, chữ chồng nhau, chữ tràn mép — `verify.ts` không thấy được.

### 3. Seamless — so bằng **hash**, không bằng mắt

So frame `0` với frame `LOOP`, **không phải `LOOP-1`** (`LOOP-1` phải khác frame 0, đúng một bước chuyển động). `LOOP` nằm ngoài composition nên phải nới duration tạm:

```bash
sed -i 's/durationInFrames={LOOP}/durationInFrames={LOOP + 60}/' src/Root.tsx
npx remotion still <Id> out/seam0.png --frame=0      --scale=0.5
npx remotion still <Id> out/seamL.png --frame=<LOOP> --scale=0.5
sed -i 's/durationInFrames={LOOP + 60}/durationInFrames={LOOP}/' src/Root.tsx
md5sum out/seam0.png out/seamL.png    # TRÙNG KHÍT mới là seamless
```

### 4. Render

**Video câm** — `--muted` bắt buộc, Remotion mặc định chèn một audio track câm ăn ~35% dung lượng và kéo container dài hơn video:

```bash
npx remotion render <Id> out/<id>.mp4 --muted
```

**Video có SFX** — không dùng `--muted` được, phải cắt đuôi:

```bash
npx remotion render <Id> out/raw.mp4
npx remotion ffmpeg -y -i out/raw.mp4 -c copy -t <LOOP/fps> out/<id>.mp4
```

> Chọn **`LOOP` là bội của 16 frame** khi scene có audio: 25 AAC frame = 16 video frame @30fps/48kHz, nhát cắt mới rơi đúng mẫu. `368 = 16×23` cắt ra đúng `575` AAC frame chẵn.

### 5. Kiểm tầng container — loop khít ở frame vẫn có thể khựng ở file

```bash
npx remotion ffprobe out/<id>.mp4 -v error \
  -show_entries stream=codec_type,duration,nb_frames -of default=noprint_wrappers=1
```

`duration` của **video và audio phải bằng nhau** và bằng `LOOP/fps`. Lệch 64ms là player đứng hình ~2 frame trước khi loop lại.

Scene có tiếng thì kiểm thêm khoảng lặng cuối chạm đúng biên loop:

```bash
npx remotion ffmpeg -i out/<id>.mp4 -vn -af silencedetect=noise=-50dB:d=0.25 -f null -
```

---

## Những cái bẫy đã trả giá

- **`pathLength` trên `<rect>` không chạy trong Chrome headless** — progress ring ra trắng trơn, không báo lỗi. Dùng `<path>`.
- **`transformBox: fill-box` trên `<text>` SVG làm chữ NHÁY khi xoay** — browser đo lại bbox glyph mỗi frame. Dùng `transform` attribute native. Sim mượt mà mắt thấy giật ⇒ nghi tầng render, đừng sửa sim.
- **Đừng nuốt lỗi bằng `2>/dev/null` hay `| head`** — `head` luôn exit 0. Đọc exit code, đừng đọc chữ.
- **Đo bằng pixel, đừng đo bằng mắt** — render `--scale=1` rồi đọc pixel bằng Node.
- **`Math.random()` không seed vỡ loop** — dùng `random(seed)` của Remotion hoặc băm theo index.
- **Toán tay nói dối** — hàng đợi tính tay 7 gói, mô phỏng ra 10. Viết `sim.ts`.
- **`verify.ts` phải soi cái được VẼ**, không soi cái mình tưởng tượng. Một hằng số, một nguồn; hai bên cùng import.

---

## Đọc rules trước khi làm bất cứ việc gì

`Resource/` là nguồn sự thật. **Đọc hết**, không đọc lướt một file rồi bắt tay vào.

| File | Vai trò |
|---|---|
| [`Resource/README.md`](Resource/README.md) | tổng quan + workflow chuẩn |
| [`Resource/creative_rule.md`](Resource/creative_rule.md) | **tư duy** — biến khái niệm thành câu chuyện hình ảnh |
| [`Resource/scene_composition.md`](Resource/scene_composition.md) | **bố cục** — phân cấp thị giác, safe area, vùng header |
| [`Resource/style_guide.md`](Resource/style_guide.md) | **look** — token màu/font, luật đèn rọi, 8 trục vẽ asset |
| [`Resource/motion_language.md`](Resource/motion_language.md) | **motion** — loop, easing, timing, chuyển động mang nghĩa |
| [`Resource/sfx.md`](Resource/sfx.md) | **tiếng** — thư viện tiếng của kênh, 8 trục âm, kernel tổng hợp |
| [`Resource/remotion_conventions.md`](Resource/remotion_conventions.md) | **code** — cấu trúc, determinism, verify, export |
| [`Resource/scene_revision.md`](Resource/scene_revision.md) | **version** — khi cần sửa scene đã có |

Nguyên tắc lõi, nếu chỉ nhớ được một câu:

> **Đừng minh hoạ định nghĩa. Hãy diễn hoạ cơ chế đang chạy.**
>
> Cần một dòng chữ để nói ra insight ⇒ animation chưa làm xong việc. Sửa animation, đừng thêm caption.

---

## Kênh

**`@duckmink_nguyen`**

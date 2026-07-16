# Claude Video

Repo chứa các video diễn hoạ kỹ thuật làm bằng Remotion. Mỗi video là một animation loop dạng diagram, 9:16, không lời thoại.

## Đọc rules TRƯỚC khi làm bất cứ việc gì

`Resource/` là nguồn sự thật duy nhất về cách làm video. **Đọc hết trước khi plan hay code**, không đọc lướt một file rồi bắt tay vào:

| File | Vai trò |
|---|---|
| `Resource/README.md` | Tổng quan + workflow chuẩn |
| `Resource/creative_rule.md` | **Tư duy**: biến khái niệm thành câu chuyện hình ảnh |
| `Resource/scene_composition.md` | **Bố cục**: phân cấp thị giác, safe area, vùng header |
| `Resource/style_guide.md` | **Look**: token màu/font, luật đèn rọi, 8 trục vẽ asset |
| `Resource/motion_language.md` | **Motion**: loop, easing, timing, chuyển động mang nghĩa |
| `Resource/sfx.md` | **Tiếng**: thư viện tiếng của kênh, 8 trục âm, kernel tổng hợp |
| `Resource/remotion_conventions.md` | **Code**: cấu trúc, determinism, verify, export |
| `Resource/scene_revision.md` | **Version**: khi user yêu cầu sửa scene |

Rules áp cho mọi project trong repo. Không project nào được tự đặt luật riêng đè lên `Resource/`.

## Cấu trúc repo

```
CLAUDE.md            # file này
Resource/            # rules — dùng chung, không thuộc project nào
docs/                # ghi chú vận hành kênh
<ngày>_<chủ đề>/     # MỘT project = MỘT video
```

### Quy ước đặt tên folder project

**`ngày_chủ đề`** — ví dụ: `160726_rate-limit`, `230726_cache-invalidation`.

- **`ngày`**: `DDMMYY`, ngày bắt đầu project (`150726` = 15/07/2026). Theo tiền lệ folder `150726`.
- **`chủ đề`**: kebab-case, tiếng Anh, gọi tên khái niệm — `n-plus-one`, `message-queue`. Không viết hoa, không dấu, không khoảng trắng.
- Ngăn cách bằng **một dấu gạch dưới**; trong phần chủ đề chỉ dùng gạch ngang.

### Một project = một video

Mỗi folder `ngày_chủ đề` là một project Remotion **độc lập, tự đủ**: `package.json`, `remotion.config.ts`, `src/` riêng. Không có workspace chung, không chia sẻ `node_modules`, không import xuyên project.

Bên trong project theo đúng cấu trúc trong `Resource/remotion_conventions.md` (`src/lib/`, `src/components/`, `src/scenes/<Name>/`).

Cần code từ project cũ (`Header.tsx`, `tokens.ts`, primitives…)? **Copy sang project mới rồi sửa**, đừng import qua folder khác — project cũ đã đóng băng cùng video đã render, sửa nó là làm hỏng thứ đã xong.

### Nhiều scene trong một project

Một project có thể chứa nhiều scene (mỗi scene một Composition trong `Root.tsx`) khi chúng cùng một chủ đề — ví dụ `150726/nplusone` có cả `NPlusOne` lẫn `RateLimit`. Nhưng **một loop vẫn chỉ kể một ý** (`Resource/creative_rule.md`). Chủ đề mới, không liên quan → project mới, ngày mới.

## Bắt đầu một video mới

1. Tạo folder `<DDMMYY>_<chủ đề>` ở root.
2. `npx create-video@latest --blank` (TypeScript) bên trong đó.
3. Dựng `src/lib/` + `src/components/` theo `Resource/remotion_conventions.md` trước khi viết scene đầu tiên.
4. **Scene plan trước, code sau** — trình bày plan ngắn cho user duyệt (xem workflow trong `Resource/README.md`).

## Lưu ý

- **Asset không vào git**: `.gitignore` ở root loại mọi ảnh/video/audio, kể cả `.svg` và `.wav`. Output render (`out/`) và SFX sinh ra không được commit — chúng phải tái tạo được từ code và `scripts/gen-sfx.mjs`.
- **Không có folder asset dùng chung.** Thứ được tích luỹ giữa các video là **công thức**, không phải file: bảng màu sinh từ `idColor()` trong `Resource/style_guide.md`, thư viện tiếng sinh từ `SFX` + `tone()` trong `Resource/sfx.md`. Project copy chúng vào `lib/tokens.ts` và `scripts/gen-sfx.mjs` rồi chạy ra file — file là thứ dẫn xuất, luôn luôn.
- **Chạy `verify.ts` trước khi render**, mỗi lần đổi hằng số (`Resource/remotion_conventions.md`).
- Ngôn ngữ trao đổi với user: **tiếng Việt**. Text trên video theo prompt từng video, mặc định tiếng Anh.

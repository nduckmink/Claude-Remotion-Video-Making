# Resource — Bộ rules cho video diễn hoạ kỹ thuật (Claude + Remotion)

Mục tiêu: từ một prompt (một khái niệm kiến trúc / công nghệ / cơ chế phần mềm), Claude tạo ra một **animation loop dạng diagram** — kiểu "Caching Layers", "Load Balancer", "Message Queue"... — dùng để dạy học và làm content.

## Thứ tự đọc rules

| File | Vai trò |
|---|---|
| `creative_rule.md` | **Tư duy**: biến khái niệm thành câu chuyện hình ảnh |
| `scene_composition.md` | **Bố cục**: phân cấp thị giác, safe area, vùng header |
| `style_guide.md` | **Look**: token màu/font, quy tắc sinh màu, 8 trục vẽ asset, glow, trạng thái |
| `motion_language.md` | **Motion**: loop, easing, timing, chuyển động mang nghĩa |
| `sfx.md` | **Tiếng**: thư viện tiếng của kênh, 8 trục âm, kernel tổng hợp |
| `remotion_conventions.md` | **Code**: cấu trúc, determinism, export |
| `scene_revision.md` | **Version**: khi user yêu cầu sửa scene |

`style_guide.md` nói **cách vẽ**, không nói **vẽ cái gì** — không có bảng tra "khái niệm A → hình B". Hình dạng sinh ra từ `creative_rule.md` + `scene_composition.md`; `style_guide.md` chỉ cấp vật liệu.

## Workflow chuẩn

1. **User prompt** — nêu khái niệm cần diễn hoạ. Có thể kèm: ngôn ngữ text, độ dài loop, số liệu cụ thể.
2. **Scene plan trước, code sau** — Claude trình bày plan ngắn (ý tưởng cốt lõi, khoảnh khắc "aha", layout, chuyển động chính, số liệu dùng trong scene) rồi mới viết code khi user đồng ý. Nếu prompt đã rất rõ, có thể code luôn.
3. **Code scene** — theo `remotion_conventions.md`.
4. **Review & revise** — theo `scene_revision.md`. Không bao giờ ghi đè bản cũ.

## Mặc định

- Khung hình: **1080×1920 (9:16 dọc)**, 30fps. User có thể yêu cầu 16:9 hoặc 1:1.
- **Header block cố định** trên mọi video: handle `@duckmink_nguyen` → title cam (`brand`). **Hai dòng**, tĩnh hoàn toàn — cái tĩnh là thứ tách chữ ký của kênh khỏi cơ chế đang chạy, đừng bỏ. Chiếm `y 100–270`, stage bắt đầu từ `y≥310`. Không hook, không eyebrow, không số tập — mọi thứ khác phải nhìn thấy được **trong cơ chế**, không viết ra. Xem `style_guide.md` + `scene_composition.md`.
- Video là **loop liền mạch** (seamless), không lời thoại, không nhạc, không ambience — hình ảnh tự kể chuyện.
- **SFX được phép**, theo `sfx.md`: một tiếng = một sự kiện cơ chế, tổng hợp từ oscillator, tên lấy từ bộ động từ chuyển động, và **không bao giờ mang thông tin** — feed autoplay tắt tiếng nên video phải hiểu trọn vẹn khi câm.
- Ngôn ngữ text trên video: **theo prompt từng video**. Prompt không nói gì → mặc định tiếng Anh (label kỹ thuật tự nhiên hơn).
- Mỗi loop = **một ý duy nhất**. Khái niệm lớn thì tách thành nhiều loop.

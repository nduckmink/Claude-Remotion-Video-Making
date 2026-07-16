# Motion Language — Ngôn ngữ chuyển động

Video là **loop liền mạch**: frame cuối nối frame đầu không khớp nối. Người xem nhìn 3–4 vòng không chán — chuyển động phải có nhịp, không phải một cú fade-in rồi đứng im.

## Cấu trúc loop

- Độ dài chuẩn: **6–12s** (180–360 frames @ 30fps). Cơ chế phức tạp → dài hơn.
- Hai kiểu loop:
  1. **Continuous** (mặc định): hệ thống vận hành vô hạn — mọi chuyển động tuần hoàn theo chu kỳ chia hết cho độ dài loop.
  2. **Intro + steady-state**: 1–2s đầu dựng phần tử vào (stagger), sau đó tuần hoàn. Chỉ dùng cho bản render xem một lần; GIF loop dùng continuous.
- **Kiểm tra seamless**: mọi giá trị animate tại `frame = 0` phải bằng tại `frame = durationInFrames`. Dùng `frame % LOOP` và pha sine với số chu kỳ nguyên.

## Chuyển động phải mang nghĩa

Quy tắc duy nhất quan trọng nhất: **mỗi chuyển động là một mệnh đề về cơ chế**, không phải trang trí.

- Nhiều phần tử so le pha đều nhau: particle thứ `i` offset `(i / N) · LOOP` — tự nhiên và loop hoàn hảo.
- **Tốc độ mang nghĩa**: đường nhanh thì lướt, đường chậm thì ì rõ rệt — người xem *cảm* được latency/throughput thay vì đọc nó.
- **Tương tác có phản hồi**: khi phần tử A chạm phần tử B, B phải phản ứng (pulse, loé sáng, counter nhảy, đổi trạng thái). Không có gì đi xuyên qua hệ thống mà hệ thống trơ ra.
- **Accent bám theo thứ đang xảy ra**, và di chuyển khi tiêu điểm di chuyển. Nó là đèn rọi chứ không phải sơn — không dính vĩnh viễn vào phần tử nào.
- **Xong việc thì nhả màu.** Thứ đã hoàn thành trả accent lại cho thứ đang chạy (trạng thái `done` trong `style_guide.md`). Accent là đèn rọi, không phải huy chương.
- **Tương phản mã hoá bằng hình học, không bằng hue**: độ dài, số lượng, thời lượng. Ba thứ đó không nói dối được.

## Bộ động từ chuyển động (chọn theo nghĩa cần diễn đạt)

- **travel** — di chuyển dọc connector: dữ liệu đang đi.
- **bounce / reflect** — đảo hướng kèm flash: được xử lý xong, trả về.
- **pass-through** — xuyên qua một thành phần: không được xử lý tại đây.
- **split / merge** — tách ra nhiều nhánh hoặc gộp lại: phân phối, tổng hợp.
- **queue up** — xếp hàng dồn lại: buffering, nghẽn, chờ.
- **transform** — đổi hình/màu/nhãn khi đi qua một bước: dữ liệu bị biến đổi.
- **ripple** — vòng ring nở ra rồi tan: sự kiện, nhịp xử lý.
- **countUp / tick** — số tăng theo tiến độ loop: tích luỹ, đo đếm.
- **state flip** — phần tử đổi màu/nhãn tại chỗ: chuyển trạng thái.
- **draw-in** — đường vẽ ra bằng strokeDashoffset: kết nối hình thành (intro).
- **breathe** — pulse glow/scale sine biên độ nhỏ (scale ≤1.04, chu kỳ 1.5–2.5s): trạng thái sống của phần tử idle — scene không bao giờ chết đứng.
- **fade/dim** — mờ đi: bị bỏ qua, hết vai trò, chết (node failure).

## Âm thanh — cùng một luật, kênh khác

**MỘT TIẾNG = MỘT SỰ KIỆN CƠ CHẾ.** Đây chính là luật ngay trên ("mỗi chuyển động là một mệnh đề") áp cho tai. Không tiếng nào được tồn tại mà không ứng với một sự kiện có thật trong scene.

- **Không nhạc, không ambience, không lời.** Chỉ SFX rời, mỗi cái neo vào một frame cụ thể.
- **Không bao giờ mang thông tin.** TikTok/Reels autoplay **tắt tiếng** — video phải hiểu trọn vẹn khi câm. Âm thanh chỉ là thưởng thêm cho ai bật loa. Không có ngoại lệ.
- **Tổng hợp từ oscillator, không sample pack** — đúng tinh thần "không icon pack" của `style_guide.md`. Xem `scripts/gen-sfx.mjs`: WAV chỉ là header + mảng PCM.
- **Mọi file fade 2ms cuối về 0 tuyệt đối.** Cắt giữa chừng sóng là sinh tiếng click ký sinh.
- **Biên loop phải im lặng tuyệt đối.** Không tiếng nào còn đang ngân tại frame cuối — **tai bắt mối nối giỏi hơn mắt nhiều**. Kiểm bằng ffprobe (xem `remotion_conventions.md`), vì loop khít ở tầng frame vẫn có thể khựng ở tầng container.

Nhịp là kênh đo thứ tư, sau độ dài / số lượng / thời lượng: nghe 9 tiếng rồi nghe 2 tiếng là **cảm** được tương phản mà không cần đọc con số nào.

## Đường VẼ phải trùng khít đường BAY

Vẽ connector một đằng rồi cho packet bay một nẻo là **nói dối người xem** — sơ đồ nói "đi lối này", mắt thấy "đi lối kia".

Cách rẻ nhất để không bao giờ lệch: **cho cả hai dùng chung một hàm**.

```ts
// constants.ts — sim gọi để bay, SVG gọi để vẽ. Không thể lệch nhau.
export const rejectAt = (owner, t) => ({ x: ..., y: ... });
```

Với đường cong hội tụ, có một mẹo vừa vặn đáng nhớ: **đặt điểm điều khiển bezier ở 1/3 và 2/3 chiều dọc** thì `y` trở thành **tuyến tính** theo tham số bezier, còn `x` rơi đúng vào **smoothstep**:

```ts
// SVG:  C ${x0} ${y0 + h/3}, ${x1} ${y1 - h/3}, ${x1} ${y1}
// Sim:  x = lerp(x0, x1, smoothstep((y - y0) / h))     // y vẫn += SPEED đều
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
```

Packet rơi đều như mọi packet khác mà bám đường cong **chính xác tới từng pixel** — không phải đo lại độ dài cung.

Đường không thẳng thì **đo độ dài cung bằng lấy mẫu** rồi chia cho `SPEED` để ra số frame, đừng đoán:

```ts
let len = 0, p = curveAt(0);
for (let i = 1; i <= 48; i++) { const q = curveAt(i / 48); len += Math.hypot(q.x - p.x, q.y - p.y); p = q; }
export const FRAMES = Math.round(len / SPEED);   // giữ ĐÚNG một tốc độ cho mọi thứ
```

## Easing & timing

```ts
import { Easing, spring } from 'remotion';
const ease = Easing.inOut(Easing.cubic);                    // mặc định
const pop  = spring({ frame, fps, config: { damping: 200 } }); // UI dựng vào
```

- Không chuyển động nào nhanh hơn **8 frames**; trạng thái quan trọng hold tối thiểu **15 frames**.
- Stagger cùng nhóm: **4–6 frames**.
- Tối đa ~3 loại chuyển động đồng thời — mắt chỉ theo được 1 tiêu điểm.

## Cấm

- `Math.random()` không seed (vỡ loop, vỡ render) — dùng `random(seed)` của Remotion.
- CSS animation/transition — mọi chuyển động theo `useCurrentFrame()`.
- Chuyển động trang trí không mang nghĩa (particle bay lung tung, glitch, shake vô cớ).

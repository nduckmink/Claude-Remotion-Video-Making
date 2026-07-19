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
- **ĐỘ SÁNG bám theo thứ đang xảy ra** — không phải màu. Màu dính vĩnh viễn vào phần tử vì nó là *danh tính*; thứ di chuyển khi tiêu điểm di chuyển là độ sáng + glow. Đèn rọi vẫn còn đó, chỉ là nó không đổi hue của ai cả.
- **Xong việc thì tắt sáng.** Thứ đã hoàn thành nhả độ sáng lại cho thứ đang chạy (trạng thái `done` trong `style_guide.md`). Thiếu nó thì cả khung sáng trưng và hết còn chỗ nào để nhìn.
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

> **Âm thanh không bao giờ mang thông tin.** Feed autoplay tắt tiếng — video phải hiểu trọn vẹn khi câm.

Nhịp là kênh đo thứ tư, sau độ dài / số lượng / thời lượng: nghe 9 tiếng rồi nghe 2 tiếng là **cảm** được tương phản mà không cần đọc con số nào. Nhưng nó chỉ **nhắc lại** thứ mắt đã thấy.

**Tên tiếng lấy từ bộ động từ ngay trên** — âm thanh và chuyển động là hai kênh của cùng một sự kiện, nên dùng chung một bộ từ vựng. `bounce` kêu giống nhau ở mọi video.

Thư viện tiếng, 8 trục âm, kernel tổng hợp, luật fade/biên loop: **`sfx.md`**.

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

## Sức nặng — vật có khối lượng

Chuyển động "có hồn" không đến từ thêm hiệu ứng, mà từ **vật lý đúng**. Vật có khối lượng không nhảy tức thời A→B: nó tăng tốc, vọt hơi quá đích, dội lại, rồi lắng. Đi thẳng đơ, tốc độ đều, dừng khựng — đó là "thô kệch, cứng nhắc".

Bốn thứ tạo sức nặng, tất cả **deterministic từ `frame`** nên seamless không đổi:

1. **Spring có overshoot + settle** — thay `lerp`/`ease` thẳng bằng lò xo giảm chấn (`zeta < 1`): phần tử lao tới, vọt quá một chút, dội lại rồi yên. Đó chính là cảm giác khối lượng.
2. **Anticipation + follow-through** — trước khi bật đi thì **nhún ngược lấy đà** (`easeInBack`); tới nơi thì **rung dư một nhịp** (`easeOutBack`/spring) rồi mới đứng. Vật nặng không khởi động/dừng tức thì.
3. **Bay theo CUNG, nghiêng theo hướng** — vật bay theo đường vòng có trọng lực (`arc`, bezier phình sang bên) và **lean** theo hướng đi. Đường kẻ ngang đơ đọc ra là "máy móc". (Cung vẽ và cung bay vẫn phải chung một hàm — mục "Đường VẼ phải trùng khít đường BAY".)
4. **Idle vẫn SỐNG** — lúc rỗi mọi thứ vẫn `breathe` (scale/opacity biên độ nhỏ), không frame nào chết cứng.

**Cái giá phải canh:** đừng để "sức nặng" thành rung vô cớ. Rung/lắc chỉ khi CÓ NGHĨA (bị giằng, lỗi) — `shake` trang trí nằm trong mục Cấm. Và xoay một element mang **chữ** thì coi chừng jitter render (`remotion_conventions.md`: `transformBox` đo lại bbox mỗi frame → chữ nháy; dùng `transform` attribute native).

### Công thức: `lib/anim.ts` thuần Node

Sim và verify chạy bằng Node — **không import được `Easing`/`spring` của remotion** (kéo cả runtime remotion vào → chết trong Node). Đặt toán chuyển động thuần vào một module KHÔNG import remotion, cho cả sim, verify lẫn component xài chung → không bao giờ lệch nhau.

```ts
// Lò xo giảm chấn, đáp step 0→1. t tính bằng GIÂY (đổi frame: (f-start)/fps).
// zeta<1 = underdamped, CÓ vọt quá đà = sức nặng. Dạng đóng → gọi frame nào cũng ra.
export const spring01 = (t: number, { omega = 11, zeta = 0.42 } = {}) => {
  if (t <= 0) return 0;
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-omega * t) * (1 + omega * t); // tới hạn / quá tắt
};

// Vọt quá đích rồi lùi (đáp có đà) · nhún ngược trước khi đi (lấy đà).
export const easeOutBack = (t: number, s = 1.70158) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
export const easeInBack = (t: number, s = 1.70158) => (s + 1) * t ** 3 - s * t ** 2;

// Điểm trên cung bezier bậc 2 a→b, phình `bend` px vuông góc dây cung (bay có trọng lực).
export const arc = (a: Pt, b: Pt, u: number, bend: number): Pt => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend; // điểm điều khiển
  const v = 1 - u;
  return { x: v * v * a.x + 2 * v * u * cx + u * u * b.x, y: v * v * a.y + 2 * v * u * cy + u * u * b.y };
};

// Nhịp SỐNG idle — period PHẢI chia hết LOOP để f0==fLOOP.
export const breathe = (frame: number, period: number, amp = 1, phase = 0) =>
  amp * Math.sin((2 * Math.PI * frame) / period + phase);
```

Chuyển động chỉ ở component (UI dựng vào một lần, verify không canh) vẫn dùng `spring()` của remotion được. Nhưng thứ **sim tính trước** (vị trí, verify soi) thì phải là spring thuần này — một nguồn cho cả ba.

## Cấm

- `Math.random()` không seed (vỡ loop, vỡ render) — dùng `random(seed)` của Remotion, hoặc băm theo index (`(i * 2654435761) >>> 0`).
- CSS animation/transition — mọi chuyển động theo `useCurrentFrame()`.
- Chuyển động trang trí không mang nghĩa (particle bay lung tung, glitch, shake vô cớ).

# Style Guide — Look & Feel

File này nói **cách vẽ**, không nói **vẽ cái gì**.

Không có bảng tra "khái niệm A → hình B". Hình dạng là việc của `creative_rule.md` (nghĩ ra) và `scene_composition.md` (xếp chỗ). Ở đây chỉ có **vật liệu**: line, stroke, fill, màu, glow, shadow, trạng thái.

Cần một asset chưa từng vẽ bao giờ? Cho nó chạy qua **8 trục** bên dưới. Trả lời xong 8 câu là nó tự thuộc về hệ này — không cần ai cấp phép, không cần có tên trong danh sách nào cả.

## Không khí chung

Tối, tĩnh, chính xác. Khoảng thở rộng.

Không gradient sặc sỡ, không 3D nặng, không lens flare, không ảnh bitmap, không icon pack — mọi thứ vẽ bằng SVG/div primitives. Sự "đã mắt" đến từ chuyển động mượt và glow tiết chế, **không** đến từ hiệu ứng chồng chất.

## Màu

**Nền tối. Hoạ tiết sáng. Cái nào quan trọng thì cam đỏ.** Cả hệ nằm gọn trong một câu đó.

```ts
export const C = {
  bg:      '#0B0A0C',   // near-black hơi ấm — KHÔNG navy

  // ── Hoạ tiết: ba bậc SÁNG, không bậc nào có màu ──
  line:     'rgba(255,255,255,0.20)', // khung hệ thống lúc rỗi
  lineLive: 'rgba(255,255,255,0.50)', // khung đang tham gia
  data:     '#E8EBF0',                // dữ liệu đang bay — trắng đặc

  // ── Accent: MỘT, và chỉ một ──
  accent:   '#FF4A1A',   // cam đỏ — thứ quan trọng nhất frame này

  bgPanel:  'rgba(255,255,255,0.03)', // nền card/pill
  gridDim:  'rgba(255,255,255,0.07)', // grid chấm, vignette
  ghost:    'rgba(255,255,255,0.025)',// chữ khổng lồ chìm ở nền

  text:      '#ECEEF3',
  textDim:   '#8A8F9C',
  textFaint: '#585D69',   // handle, chú thích nhỏ nhất
};
```

**Đặt tên theo vai trò, không theo màu.** `accent` / `data` / `line` — không phải `coral` / `teal` / `blue`. Palette đổi bao nhiêu lần cũng được mà không ai phải sửa một dòng code hay một dòng rule.

## Luật màu — accent là ĐÈN RỌI

Luật quan trọng nhất file này.

> **Mỗi frame, accent chỉ đánh dấu MỘT việc: thứ quan trọng nhất lúc này.**
> Hệ thống, thứ đã xong, thứ đang chờ — **sáng, nhưng không màu**.
> **Ngân sách: accent ≤ ~5% diện tích khung.**

Màu trả lời câu *"nhìn đâu?"*, không trả lời câu *"cái này thuộc loại gì?"*.

`accent` **không mang nghĩa "xấu"**. Nó mang nghĩa **"nhìn đây"**. Đừng để nó trượt thành màu-của-cái-sai — trượt là vỡ ngôn ngữ, vì rồi sẽ có video mà thứ quan trọng nhất lại là thứ đúng.

Màu ở khắp nơi ⇒ màu **hết còn chỉ đường**, tụt xuống thành trang trí chỉ vì có mặt quá nhiều. Một chấm cam trên bản vẽ trắng-đen hút mắt mạnh hơn mười chấm cam trên nền đầy màu — sức mạnh nằm ở **khan hiếm**, không ở độ rực.

### Tương phản không cần màu thứ hai

Bỏ cặp hot/cool là bỏ một công cụ. Đổi lại được ba cái mạnh hơn, và cả ba đều **đo được**:

| Mã hoá bằng | Ví dụ |
|---|---|
| **Độ dài** | thanh 27ms dài gấp 4.5 lần thanh 6ms |
| **Số lượng** | 9 round trip vs 2 |
| **Thời lượng** | Act hỏng chiếm 189 frame, Act ổn chiếm 42 |

Ba thứ này **không nói dối được**. Màu thì nói dối rất dễ — tô teal lên một thứ chậm thì nó vẫn trông "ổn". Còn thanh dài gấp 4.5 lần thì không cãi được.

Cặp tương phản vẫn tồn tại, nhưng bằng **chữ** trong eyebrow, không bằng hue.

### Hoạ tiết phải TỰ GÁNH

Không còn màu đỡ lưng ⇒ line art phải tự đọc được: `line` là `0.20`, không phải `0.10`. Khung mà chỉ nhìn ra nhờ accent là khung **sống ký sinh** — bỏ accent đi là nó tàng hình.

Ba bậc sáng (`line` → `lineLive` → `data`) làm đúng việc mà glow từng làm: phân cấp thị giác. Accent chỉ còn lo mỗi việc chỉ đường.

## 8 trục — vẽ bất cứ thứ gì

Mỗi trục là một **câu hỏi**, không phải một ô tra.

| Trục | Thang | Hỏi |
|---|---|---|
| **Fill** | rỗng ↔ đặc | Nó *chứa* thứ khác, hay nó *bị chứa*? → **hệ thống thì rỗng, dữ liệu thì đặc** |
| **Bo góc** | 999 → 16 → 4 → 0 | Nó nhẹ và linh hoạt, hay nặng và nền tảng? Càng mềm càng nhẹ, càng góc cạnh càng là nền móng. |
| **Độ dày viền** | 1.5 → 2 → 3px | Nó là nền, là chuẩn, hay **đang được nhấn**? 3px đi kèm accent. |
| **Nét** | solid ↔ dashed | Nó có thật và chắc chắn, hay là ranh giới logic / async / tiềm năng / optional? |
| **Màu** | đơn sắc ↔ accent | Nó có **đang xảy ra lúc này** không? (xem luật đèn rọi) |
| **Glow** | không ↔ có | Nó có đang **sống** không? |
| **Opacity** | 100 → 60 → 30 | Nó còn vai trò không? |
| **Kích thước** | — | Nó quan trọng cỡ nào **trong câu chuyện** — không phải ngoài đời thật. |

Không dòng nào bảo "database phải là hình trụ". Nhưng cứ trả lời 8 câu này cho một database, bạn **sẽ** ra một khối rỗng, góc cạnh, viền dày, không glow khi rỗi — và nó sẽ giống database ở video sau, tự nó, không cần catalog.

Đó là lý do không có catalog: **mấy cái trục đã đẻ ra sự nhất quán rồi.** Liệt kê thêm chỉ vừa thừa vừa trói.

Pill (bo 999) dành cho **ngôn ngữ** — câu chữ trong hệ này sống trong pill, không để trần.

## Trạng thái

Mọi asset đều có vòng đời. Đổi trạng thái **đúng lúc logic xảy ra** — đây là cách chính để diễn hoạ cơ chế.

| Trạng thái | Thể hiện |
|---|---|
| **idle** | viền `line`, không glow, breathe rất nhẹ |
| **active** | viền `accent` + glow — *đang xảy ra lúc này* |
| **done** | viền `line`, chữ `text` trắng, không glow — đã xong thì **trả accent lại** |
| **success** (khoảnh khắc) | flash trắng `data` + ripple — xong việc thì im, không ăn mừng |
| **fail** (khoảnh khắc) | flash `accent` + ripple — hỏng thì đúng là thứ đáng nhìn nhất |
| **dead/disabled** | ~30% opacity, không breathe |

`done` là trạng thái giữ cho luật đèn rọi không vỡ: xong việc thì nhả màu ra cho thứ đang chạy. Thiếu nó thì accent cứ tích tụ tới khi cả khung có màu.

`success` = trắng còn `fail` = accent **không** phải vì accent nghĩa là "xấu" — mà vì một cú hỏng *đúng là* thứ quan trọng nhất frame đó. Vẫn là luật đèn rọi, không phải bảng phân loại.

## Glow & shadow

Chỉ thứ **đang sống** mới có glow. Không glow trang trí.

```ts
// node glow
boxShadow: `0 0 24px ${color}66, 0 0 8px ${color}99`
// text glow (dùng nhẹ)
textShadow: `0 0 20px ${color}55`
```

Nền: vignette radial rất nhẹ và/hoặc grid chấm mờ (`gridDim`, cell ~90px). Có thể thêm một chữ khổng lồ chìm (`ghost`, ~600px) mang tên khái niệm — nó là chủ đề, không phải trang trí. Cả ba **không bao giờ nổi hơn nội dung**.

## Typography

```ts
export const F = {
  title: 'Inter',            // 600–800, letterSpacing '-0.02em'
  mono:  'JetBrains Mono',   // label, số liệu, tag
};
```

- **Label thành phần**: mono 30–34px uppercase trắng + dòng mô tả 22–24px `textDim` lowercase bên dưới.
- **Số liệu lớn** (stat): mono 44–56px, màu theo ngữ nghĩa.
- **Tag/timing**: mono 22–26px, uppercase, letterSpacing `0.12em`.
- **Đánh số** (`001`, `002`…): mono 20–22px, accent, đặt trên phần tử nó đánh dấu. Bản vẽ kỹ thuật thì có số.

Load font qua `@remotion/google-fonts` (Inter, JetBrains Mono), ở module level.

## Header block — BẮT BUỘC, mọi video

**Ba dòng**, luôn có, luôn cùng thứ tự. Vị trí và vùng chiếm chỗ xem `scene_composition.md`.

> **Header ĐƠN SẮC. Accent không bao giờ lên header.**
> Header là chỗ để **đọc**, stage là chỗ để **nhìn**. Accent trả lời câu "nhìn đâu?" — mà câu trả lời không bao giờ là cái tên video.
> Header lại còn **tĩnh suốt loop**: cho nó accent là để một vệt cam đứng yên cạnh tranh với vệt cam đang chạy, suốt 12 giây. Đèn rọi mà không tắt thì hết là đèn rọi.
> Nhờ vậy thứ **màu cam đầu tiên** người xem thấy luôn là **cơ chế**. Phân cấp trong header do ba bậc sáng lo.

| Dòng | Spec |
|---|---|
| **Handle** | mono 22px, `textFaint`. Cố định `@duckmink_nguyen` — chỉ vậy. Không avatar, không logo, không khung, không đánh số tập. |
| **Eyebrow** | mono 28px, uppercase, letterSpacing `0.25em`. **Cặp tương phản của scene**, viết bằng chữ — vế **đang chạy** sáng `text` 100%, vế kia mờ 30%, chữ nối (`vs`, `→`) màu `textFaint`. |
| **Title** | Inter 700, 64–88px, letterSpacing `-0.02em`, màu `text`. |

### KHÔNG có dòng hook

Từng có. Đã bỏ, vì nó vi phạm luật gốc của `creative_rule.md`:

> **Hình trước, chữ sau.** Text chỉ để label và chốt insight, **không giải thích thay hình**.

Một câu hook kiểu *"The database isn't slow. The trips are."* **chính là** giải thích thay hình — nó nói toẹt cái aha ở giây 0, trong khi cả loop sinh ra để người xem **tự** rút ra điều đó. Viết ra là **spoil chính mình**.

Aha moment thuộc về **animation**, không thuộc về caption. Không có ngoại lệ.

### Eyebrow là đồng hồ SỐNG

Chỉ còn một accent nên eyebrow không còn là chú giải màu — nó thành thứ tốt hơn: **đồng hồ báo giai đoạn**. Vế đang chạy mặc `accent`, vế kia mờ xuống 30% (đúng trạng thái `dead` ở trên).

Người xem đọc một lần ở giây đầu là nắm được scene sẽ so **cái gì với cái gì**, rồi suốt phần còn lại chỉ cần liếc lên là biết đang ở vế nào.

→ Hệ quả: **không cần phase tag riêng.** Một phần tử làm hai việc.

Điền không nổi eyebrow bằng một cặp tương phản thật? **Scene chưa xong** — quay lại `creative_rule.md`.

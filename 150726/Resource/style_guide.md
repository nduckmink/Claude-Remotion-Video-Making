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

  bgPanel:  '#121113',                // nền card/pill — ĐỤC, xem dưới
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
| **Số lượng** | 9 round trip vs 2 · đống 8 gói vs không gói nào |
| **Thời lượng** | act hỏng chiếm 189 frame, act ổn chiếm 42 |
| **Nhịp** | client này bắn 1 gói/40f, client kia 1 gói/8f |
| **Đường đi** | 429 rẽ sang làn riêng, 200 đi thẳng tới server |

Năm thứ này **không nói dối được**. Màu thì nói dối rất dễ — tô xanh lên một thứ chậm thì nó vẫn trông "ổn". Còn đống cao gấp tám lần thì không cãi được.

Và tương phản **không được viết thành chữ** — không eyebrow, không caption. Viết ra là animation đã thua.

### Nền card phải ĐỤC

`bgPanel` là màu đặc, **không** phải `rgba(...)`. Card mà trong suốt thì connector chạy xuyên qua nó — nhìn ra ngay là "mấy hình vẽ chồng lên nhau", không phải một sơ đồ.

Giá trị hiện tại đúng bằng `rgba(255,255,255,0.03)` trộn sẵn lên `bg`: **trông y hệt**, nhưng che được. Đổi `bg` thì phải trộn lại `bgPanel`.

Luật chung: **thành phần nằm trên đường đi thì phải che được đường đi.**

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

### Nhãn GỌI TÊN, không PHÁN XÉT

Nhãn cũng lén nói hộ kết luận được, y như hook và eyebrow — chỉ kín đáo hơn.

Gọi hai client là `app` và `batch` là đã **chỉ mặt thủ phạm ngay từ giây 0**: ai cũng biết "batch job" là thằng phá. Người xem hết việc phải làm.

Gọi chúng là `client 1` / `client 2` thì khác biệt duy nhất nằm ở **hành vi** — một cái bắn `8 req/s`, cái kia `40 req/s`. Nhìn là thấy. Đó mới là diễn hoạ.

> **Nhãn nói phần tử LÀ GÌ. Animation nói nó LÀM GÌ. Đừng để nhãn giành việc.**

Kiểm nhanh: che hết animation đi, chỉ đọc nhãn — mà vẫn đoán ra kết luận, thì nhãn đang spoil.

Hệ quả kỹ thuật: **đổi nhãn là phải đo lại chỗ.** `"CLIENT 2"` rộng gấp đôi `"batch"`; giữ nguyên kích thước node là nó đâm vào số liệu bên cạnh. Gõ chữ mới xong phải render lại mà nhìn.

Load font qua `@remotion/google-fonts` (Inter, JetBrains Mono), ở module level.

## Header block — HAI dòng, hết

Vị trí và vùng chiếm chỗ xem `scene_composition.md`.

| Dòng | Spec |
|---|---|
| **Handle** | mono 22px, `textFaint`. Cố định `@duckmink_nguyen` — chỉ vậy. Không avatar, không logo, không khung, không đánh số tập. |
| **Title** | Inter 700, 64–88px, letterSpacing `-0.02em`, màu `text`. Tên khái niệm, không phải câu. |

> **Header ĐƠN SẮC. Accent không bao giờ lên header.**
> Header là chỗ để **đọc**, stage là chỗ để **nhìn**. Accent trả lời câu "nhìn đâu?" — mà câu trả lời không bao giờ là cái tên video.
> Header lại còn **tĩnh suốt loop**: cho nó accent là để một vệt cam đứng yên cạnh tranh với vệt cam đang chạy, suốt cả loop. Đèn rọi mà không tắt thì hết là đèn rọi.
> Nhờ vậy thứ **màu cam đầu tiên** người xem thấy luôn là **cơ chế**.

### Header KHÔNG chứa gì khác

Từng có hook pill (câu chốt aha). Từng có eyebrow (cặp tương phản). Từng có số tập. **Bỏ hết** — cả ba đều chết vì cùng một luật gốc trong `creative_rule.md`:

> **Hình trước, chữ sau.** Text chỉ để label và chốt insight, **không giải thích thay hình**.

- Hook `"The database isn't slow. The trips are."` → nói toẹt cái aha ở giây 0. **Spoil chính mình.**
- Eyebrow `"QUEUE · APP PAYS vs LIMIT · BATCH PAYS"` → viết ra kết luận, đúng cái tội đã giết hook. Nếu phải viết ra ai trả giá, thì **animation chưa làm xong việc**.
- Số tập → hứa hẹn một series đánh số mà chẳng ai cần.

**Mô hình cần nhớ**: mỗi lần thấy muốn thêm một dòng chữ vào header, đó là dấu hiệu **stage đang kể chưa đủ rõ**. Sửa stage, đừng thêm chữ. Text trong header chỉ để **gọi tên**, không bao giờ để **giải thích**.

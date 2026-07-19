# Style Guide — Look & Feel

File này nói **cách vẽ**, không nói **vẽ cái gì**.

Không có bảng tra "khái niệm A → hình B". Hình dạng là việc của `creative_rule.md` (nghĩ ra) và `scene_composition.md` (xếp chỗ). Ở đây chỉ có **vật liệu**: line, stroke, fill, màu, glow, shadow, trạng thái.

Cần một asset chưa từng vẽ bao giờ? Cho nó chạy qua **8 trục** bên dưới. Trả lời xong 8 câu là nó tự thuộc về hệ này — không cần ai cấp phép, không cần có tên trong danh sách nào cả.

## Không khí chung

Tối, tĩnh, chính xác. Khoảng thở rộng.

Không gradient sặc sỡ, không 3D nặng, không lens flare, không ảnh bitmap, không icon pack — mọi thứ vẽ bằng SVG/div primitives. Sự "đã mắt" đến từ chuyển động mượt và glow tiết chế, **không** đến từ hiệu ứng chồng chất.

## Màu

**Nền tối, tâm sáng. Mỗi thứ một danh tính. Cam là của kênh.** Cả hệ nằm gọn trong câu đó.

```ts
export const C = {
  bg:     '#0B0A0C',   // mép khung — near-black hơi ấm, KHÔNG navy
  bgLift: '#17151A',   // tâm khung — sáng hơn MỘT bậc (xem "Nền toả tròn")

  // ── Hoạ tiết trung tính: ba bậc SÁNG ──
  line:     'rgba(255,255,255,0.20)', // khung hệ thống lúc rỗi
  lineLive: 'rgba(255,255,255,0.50)', // khung đang tham gia
  data:     '#E8EBF0',                // dữ liệu CHƯA mang danh tính — trắng đặc

  // ── Hai màu TRẠNG THÁI: mỗi cái một hue khoá cứng, KHÔNG cấp cho phần tử nào ──
  brand:    '#FF4A1A',              // cam ~34.5° — "chú ý / đang xảy ra / hỏng". Cả title.
  pass:     'oklch(0.76 0.17 150)', // xanh ~150° — "hợp lệ / hit / xong".

  bgPanel:  '#1C1920',                // nền card — ĐỤC, và sáng hơn bgLift
  gridDim:  'rgba(255,255,255,0.07)', // grid chấm
  ghost:    'rgba(255,255,255,0.025)',// chữ khổng lồ chìm ở nền

  text:      '#ECEEF3',
  textDim:   '#8A8F9C',
  textFaint: '#585D69',   // handle, chú thích nhỏ nhất
};
```

**Đặt tên theo vai trò, không theo màu.** `brand` / `data` / `line` — không phải `coral` / `teal` / `blue`. Palette đổi bao nhiêu lần cũng được mà không ai phải sửa một dòng code hay một dòng rule.

## Quy tắc chọn màu — SINH RA, đừng nhặt tay

Nhặt màu bằng mắt hỏng hai đường: mỗi video một tông chẳng ăn nhập gì nhau, và trong cùng một video sẽ có một màu vô tình rực hơn mấy màu kia — thế là **màu giành mất việc chỉ đường của cơ chế**. Sinh bằng công thức thì hết cả hai.

```ts
// Vẽ trong oklch. Hai đại lượng, hai cách xử lý khác hẳn nhau:
//   L  — KHOÁ CỨNG, mọi màu bằng nhau. Đây là thứ chống việc một màu tự nhiên
//        hút mắt hơn màu khác. hsl không làm nổi: hsl(60,…) chói gấp mấy lần
//        hsl(240,…) ở cùng một L, thế là cái vàng giành mất tiêu điểm mà chẳng
//        vì lý do gì thuộc về cơ chế.
//   C  — THẢ tới trần của TỪNG hue. Ép chung một C là dìm cả bảng xuống bằng
//        hue yếu nhất, và ra một bảng màu nhợt.
// Chrome của Remotion là 149 — oklch() chạy thẳng (cần 111+).
const BRAND_H = 34.5;  // hue của brand #FF4A1A — ĐO ra, đừng đoán
const PASS_H  = 150;   // hue của pass (xanh) — màu trạng thái THỨ HAI
const GUARD   = 30;    // vùng cấm mỗi bên MỖI màu trạng thái
const ID_L    = 0.75;  // mọi màu định danh chung một L
const ID_CAP  = 0.18;  // trần chroma — phải nằm DƯỚI brand (0.224)

/** oklch → linear sRGB. Cần cái này để BIẾT màu có tràn không, thay vì đoán. */
const oklchToRgb = (L: number, C: number, Hdeg: number) => {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};
const inSRGB = (L: number, C: number, H: number) =>
  oklchToRgb(L, C, H).every((v) => v >= -0.0005 && v <= 1.0005);

/** Chroma đậm nhất mà hue này còn nằm trong sRGB, chặn trên ở ID_CAP. */
const fitChroma = (H: number) => {
  if (inSRGB(ID_L, ID_CAP, H)) return ID_CAP;
  let lo = 0, hi = ID_CAP;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (inSRGB(ID_L, m, H)) lo = m; else hi = m;
  }
  return lo * 0.98; // lùi khỏi biên một chút
};

/** Màu định danh của phần tử thứ i trong n phần tử. Né CẢ HAI hue trạng thái. */
export const idColor = (i: number, n: number) => {
  // Khoét hai nêm ±GUARD (quanh brand VÀ quanh pass) khỏi vòng tròn, rồi rải i
  // đều lên phần còn lại. Bắt đầu ngay sau nêm brand, đi lên; chạm nêm pass thì
  // nhảy qua. (Cố định thứ tự brand < pass vì hai hue đều khoá cứng.)
  let H = BRAND_H + GUARD + ((i + 0.5) / n) * (360 - 4 * GUARD);
  if (H > PASS_H - GUARD) H += 2 * GUARD; // nhảy qua nêm của pass
  H %= 360;
  return `oklch(${ID_L} ${fitChroma(H)} ${H})`;
};
```

**Vì sao phải dò gamut chứ không gõ đại một số.** Trần chroma của sRGB **không đều quanh vòng tròn**: ở `L=0.75`, hue tím-lam (~267) chỉ chịu được `0.128`, còn hue hồng-tím (~327) chịu tới `0.254` — **gấp đôi**. Ép chung một `C` thì phải lấy theo thằng yếu nhất, và cái hồng bị dìm xuống chưa tới một nửa khả năng của nó. Kết quả: bảng màu nhợt, đúng cái bệnh "trắng đen cam" mà bảng màu sinh ra để chữa.

Vượt trần thì **Chrome lặng lẽ kẹp về biên** — không lỗi, không cảnh báo, chỉ là màu bạn thấy không phải màu bạn viết. Đo bằng cách render một ô rồi đọc pixel: kênh nào chạm `0` hoặc `255` là đã bị kẹp.

Ra được (`n=4`): `#9b6801` `#028abf` `#4e63fc` `#df34b5` (hue 95·215·275·335) — cùng `L`, không màu nào gần cam **hay** gần xanh `pass`. Chú ý: cái teal `~168°` mà bảng cũ từng sinh ra nay bị loại — nó rơi vào nêm cấm của `pass`. Đó là cơ chế đang chạy: **một phần tử không bao giờ vô tình khoác đúng màu "thành công".**

Ba luật, không nới:

1. **Màu là DANH TÍNH, không phải trạng thái.** Nó trả lời *"cái này là ai"*, không trả lời *"cái này đang tốt hay xấu"*. Một phần tử giữ nguyên màu suốt loop. Thứ đổi theo trạng thái là **độ sáng, glow, opacity** — không phải hue.
2. **Lúc rỗi thì tối.** Viền và đường mang màu định danh chỉ lên full khi đang có việc chạy qua; rỗi thì hạ alpha còn ~35%. Màu sáng thường trực là màu đã tụt xuống thành trang trí.

   Mẹo `${color}59` **chỉ chạy với hex**. `idColor` trả về `oklch(…)`, nối thêm hai ký tự vào là ra CSS vô nghĩa — và trình duyệt **bỏ qua lặng lẽ**, không lỗi, không cảnh báo, chỉ là viền của bạn biến mất. Dùng cú pháp alpha của chính oklch:

   ```ts
   export const dim = (c: string, a: number) =>
     c.startsWith("oklch") ? c.replace(/\)$/, ` / ${a})`) : `${c}${to2hex(a)}`;
   ```
3. **Hai màu trạng thái, mỗi cái một vùng cấm.** Có ĐÚNG hai hue mang nghĩa cố định, không cấp cho phần tử nào: `brand` (cam ~34.5°) = "chú ý / đang xảy ra / hỏng", và `pass` (xanh ~150°) = "hợp lệ / hit / xong". `idColor` không bao giờ sinh hue trong ±30° quanh **cả hai** — nếu không, một phần tử ngẫu nhiên sẽ khoác đúng màu "hỏng" hoặc "thành công", và người xem đọc nhầm danh tính thành trạng thái. Hai màu này chỉ bật lên khi trạng thái đó CÓ THẬT; đứng yên thì tắt. (Cam có một chỗ tĩnh được phép: **title**, trên hairline — mà luật header cấm mọi chuyển động ở trên nên không bao giờ lẫn với cú flash hỏng bên dưới.)

Cú flash `brand` nổi hơn cả bảng màu **nhờ chroma, không nhờ độ sáng**: brand đo được là `oklch(0.666 0.224 34.5)` — nó *tối hơn* màu định danh (L 0.666 vs 0.75) nhưng đậm hơn mọi màu trong bảng. Đó chính là việc của `ID_CAP`: **nới trần chroma lên quá 0.224 là cú báo hỏng chìm nghỉm giữa đám màu.** Muốn bảng màu rực hơn nữa thì phải kéo `brand` rực lên trước, không phải nới trần.

Kiểm nhanh: **bỏ hết màu đi thì mất thông tin gì?** Mất → màu đang làm việc. Không mất → màu đang trang trí, bỏ.

Màu có việc thật thì mở ra thứ đơn sắc không nói nổi: khi màu mang một thuộc tính, **thiếu màu cũng thành một phát biểu** — một thứ trắng giữa đám có màu là thứ *chưa có* thuộc tính đó.

### Màu KHÔNG đo được — hình học thì có

Có bảng màu rồi vẫn cấm dùng nó để nói "nhanh/chậm", "nhiều/ít", "tốt/xấu". Tương phản mã hoá bằng **hình học**, và cả năm cách đều **đo được**:

| Mã hoá bằng | Ví dụ |
|---|---|
| **Độ dài** | thanh 27ms dài gấp 4.5 lần thanh 6ms |
| **Số lượng** | 9 round trip vs 2 · đống 8 gói vs không gói nào |
| **Thời lượng** | act hỏng chiếm 189 frame, act ổn chiếm 42 |
| **Nhịp** | client này bắn 1 gói/40f, client kia 1 gói/8f |
| **Đường đi** | 429 rẽ sang làn riêng, 200 đi thẳng tới server |

Năm thứ này **không nói dối được**. Màu thì nói dối rất dễ — tô xanh lên một thứ chậm thì nó vẫn trông "ổn". Còn đống cao gấp tám lần thì không cãi được.

Và tương phản **không được viết thành chữ** — không eyebrow, không caption. Viết ra là animation đã thua.

### Nền toả tròn

Nền không phẳng: **tâm khung sáng hơn mép**, để mắt tự rơi vào giữa — chỗ cơ chế đang chạy.

```ts
// MỘT gradient làm cả hai việc: nâng tâm VÀ tối mép.
background: `radial-gradient(ellipse 78% 52% at 50% 48%, ${C.bgLift} 0%, ${C.bg} 72%)`
```

Không chồng hai lớp: nâng tâm lên `bgLift` rồi tắt dần về `bg` ở mép **chính là** vignette, chỉ viết ngược lại. Grid chấm nằm trên nó.

Tâm đặt ở `48%` chứ không phải `50%` — stage bắt đầu từ `y=310`, nên tâm hình học của khung nằm thấp hơn tâm của bản vẽ.

Biên độ phải nhỏ: `bg` → `bgLift` là **một bậc**, không phải một cú loé. Nền mà nhìn thấy được là nền đang giành việc.

### Nền card phải ĐỤC — và phải sáng hơn TÂM

`bgPanel` là màu đặc, **không** phải `rgba(...)`. Card mà trong suốt thì connector chạy xuyên qua nó — nhìn ra ngay là "mấy hình vẽ chồng lên nhau", không phải một sơ đồ.

Từ khi nền có tâm sáng, thêm một ràng buộc: **`bgPanel` phải sáng hơn `bgLift`.** Card tối hơn chỗ sáng nhất của nền thì nó thành cái **lỗ** giữa khung — mà card thì thường nằm đúng chỗ đó. Đây là lý do `bgPanel` không còn là `rgba(255,255,255,0.03)` trộn lên `bg` như trước.

Đổi `bg` hay `bgLift` thì phải trộn lại `bgPanel`. Luật chung: **thành phần nằm trên đường đi thì phải che được đường đi.**

### Hoạ tiết phải TỰ GÁNH

Line art phải tự đọc được **khi bỏ hết màu đi**: `line` là `0.20`, không phải `0.10`. Khung mà chỉ nhìn ra nhờ màu là khung **sống ký sinh**.

Ba bậc sáng (`line` → `lineLive` → `data`) lo phân cấp thị giác; màu lo danh tính. Hai kênh, hai việc, không giẫm chân nhau — đó là lý do bảng màu không nuốt mất ba bậc này.

## 8 trục — vẽ bất cứ thứ gì

Mỗi trục là một **câu hỏi**, không phải một ô tra.

| Trục | Thang | Hỏi |
|---|---|---|
| **Fill** | rỗng ↔ đặc | Nó *chứa* thứ khác, hay nó *bị chứa*? → **hệ thống thì rỗng, dữ liệu thì đặc** |
| **Bo góc** | 999 → 16 → 4 → 0 | Nó nhẹ và linh hoạt, hay nặng và nền tảng? Càng mềm càng nhẹ, càng góc cạnh càng là nền móng. |
| **Độ dày viền** | 1.5 → 3 → 6px | Nó là nền, là chuẩn, hay **đang được nhấn**? Bậc dày nhất đi kèm `brand`. |
| **Nét** | solid ↔ dashed | Nó có thật và chắc chắn, hay là ranh giới logic / async / tiềm năng / optional? |
| **Màu** | trung tính ↔ danh tính | Nó là **một ai cụ thể**, hay chỉ là hạ tầng / dữ liệu chưa mang tên? (xem quy tắc chọn màu) |
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
| **idle** | viền màu định danh mờ (`${c}59`), không glow, breathe rất nhẹ |
| **active** | viền màu định danh **full** + glow — *đang xảy ra lúc này* |
| **done** | về idle, chữ `text` trắng, không glow — xong thì thôi sáng |
| **success** (khoảnh khắc) | flash trắng `data` + ripple — xong việc thì im, không ăn mừng |
| **fail** (khoảnh khắc) | flash `brand` + ripple — hỏng thì đúng là thứ đáng nhìn nhất |
| **dead/disabled** | ~30% opacity, không breathe |

Cả sáu dòng đổi **độ sáng**, không đổi **hue**. Đó là cách màu vừa làm danh tính vừa không giẫm lên trạng thái: một phần tử xanh thì lúc rỗi, lúc chạy, lúc chết đều xanh — chỉ khác nó sáng cỡ nào.

`fail` = `brand` là ngoại lệ duy nhất, và nó **không** có nghĩa cam là màu-của-cái-sai. Nó là chỗ cam được phép xuống dưới hairline: một cú hỏng đúng là thứ đáng nhìn nhất frame đó, và cam là màu duy nhất không thuộc về ai — nên nó không bị nhầm thành danh tính của phần tử đang hỏng.

## Glow & shadow

Chỉ thứ **đang sống** mới có glow. Không glow trang trí.

```ts
// node glow
boxShadow: `0 0 24px ${color}66, 0 0 8px ${color}99`
// text glow (dùng nhẹ)
textShadow: `0 0 20px ${color}55`
```

Nền: gradient toả tròn (xem "Nền toả tròn") + grid chấm mờ (`gridDim`, cell ~90px). Có thể thêm một chữ khổng lồ chìm (`ghost`, ~600px) mang tên khái niệm — nó là chủ đề, không phải trang trí. Cả ba **không bao giờ nổi hơn nội dung**.

Chữ ghost ở ~600px chỉ chứa nổi khoảng **3 ký tự** trong 1080 — tên dài hơn thì bỏ hẳn, đừng cắt cụt. Cắt cụt là hết còn là chủ đề.

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
- **Đánh số** (`001`, `002`…): mono 20–22px, màu định danh của chính phần tử nó đánh dấu, đặt ngay trên phần tử đó. Bản vẽ kỹ thuật thì có số.

Nhãn nhiều chữ **xuống dòng theo dấu cách**, nên cái phải đo là **từ dài nhất**, không phải cả câu. `"Báo cáo doanh thu"` trong node 190px không hỏng vì câu dài 17 ký tự — nó hỏng hay không là do `"DOANH"` có lọt không.

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
| **Title** | Inter 700, 64–88px, letterSpacing `-0.02em`, màu **`brand`**. Tên khái niệm, không phải câu. |

> **Title mang màu `brand`. Đó là chỗ duy nhất trên header có màu.**
> Handle vẫn `textFaint`, hairline vẫn `line`. Cam ở đây là **chữ ký của kênh**, không phải một lời chỉ đường: nó nằm đúng một chỗ, đúng một cỡ, ở đúng vị trí ấy trong mọi video — người xem đọc nó một lần rồi thôi.
>
> Cam trên header không tranh việc với cam dưới stage, vì hai thứ **khác nhau ở chuyển động chứ không ở màu**: header tĩnh tuyệt đối suốt loop (luật ngay dưới đây), nên **cam nào nhúc nhích thì cam đó là cơ chế**. Cam đứng yên ở đỉnh khung là tên kênh.
>
> Hệ quả: cấm mọi thứ cam **động** ở trên hairline. Không title nhấp nháy, không breathe, không sweep. Mất cái tĩnh là mất luôn thứ phân biệt hai vai — và lúc đó thì đúng là một vệt cam đứng yên cạnh tranh với vệt cam đang chạy, suốt cả loop.

### Header KHÔNG chứa gì khác

Từng có hook pill (câu chốt aha). Từng có eyebrow (cặp tương phản). Từng có số tập. **Bỏ hết** — cả ba đều chết vì cùng một luật gốc trong `creative_rule.md`:

> **Hình trước, chữ sau.** Text chỉ để label và chốt insight, **không giải thích thay hình**.

- Hook `"The database isn't slow. The trips are."` → nói toẹt cái aha ở giây 0. **Spoil chính mình.**
- Eyebrow `"QUEUE · APP PAYS vs LIMIT · BATCH PAYS"` → viết ra kết luận, đúng cái tội đã giết hook. Nếu phải viết ra ai trả giá, thì **animation chưa làm xong việc**.
- Số tập → hứa hẹn một series đánh số mà chẳng ai cần.

**Mô hình cần nhớ**: mỗi lần thấy muốn thêm một dòng chữ vào header, đó là dấu hiệu **stage đang kể chưa đủ rõ**. Sửa stage, đừng thêm chữ. Text trong header chỉ để **gọi tên**, không bao giờ để **giải thích**.

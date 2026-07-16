# Scene Composition — Nguyên tắc bố cục

Không có template cố định. Mỗi khái niệm có hình dạng tự nhiên riêng — nhiệm vụ là tìm ra hình dạng đó, rồi bố cục phục vụ nó.

## Nguyên tắc chung (mọi scene)

- **Cấu trúc phản ánh cơ chế.** Hỏi trước: khái niệm này có hình gì? Chuỗi tầng? Vòng lặp? Phân nhánh? Trạng thái chuyển đổi? Hai bên đối thoại? Bố cục sinh ra từ câu trả lời, không từ template.
- **Có trục dòng chảy rõ ràng.** Người xem phải thấy ngay "cái gì đi từ đâu tới đâu". Trục dọc (trên→dưới) hợp 9:16; trục ngang hợp 16:9; vòng tròn cho chu trình.
- **Phân cấp thị giác 3 lớp**: (1) thứ đang di chuyển/thay đổi — sáng nhất; (2) các thành phần hệ thống — rõ nhưng tĩnh hơn; (3) chú thích/số liệu — nhỏ, mờ hơn. Mắt phải biết nhìn đâu trước.
- **Text tối giản trong stage**: label 1–4 từ. Câu đầy đủ **chỉ sống trong header** (hook pill) — stage không chứa câu. Số liệu chốt trong stage thì viết như số liệu, không viết thành câu.
- **Mật độ**: đủ ít để hiểu trong 2 giây đầu. Quá 5–6 thành phần chính → tách loop hoặc gom nhóm.

## Safe area (9:16 — 1080×1920)

Lề trái/phải ~80px, trên/dưới ~100px (né UI của TikTok/Reels/Shorts). Text quan trọng không sát mép. Khung khác điều chỉnh tương ứng.

**Cảnh báo UI thật**: safe area trên chỉ là *khung hình*, không phải UI thật của app. Action rail (like/comment/share) của TikTok/Reels/Shorts nằm khoảng `x 950–1080, y 1000–1750` — số liệu và text quan trọng **không** căn phải tới `x=1000` trong dải y đó. Caption/username chiếm góc dưới trái. Kiểm bằng cách đè screenshot app thật lên still.

## Header block — vùng cố định, bất khả xâm phạm

Mọi video 9:16 có header **3 dòng** (typography xem `style_guide.md`). Căn **giữa** trên trục `x=540`.

Lý do không phải thẩm mỹ: 9:16 có **một sống lưng dọc duy nhất**, và trục dòng chảy của stage nằm trên đó. Header căn trái trong khi stage căn giữa là dựng hai trục đánh nhau — và thứ chịu trận là **connector**: nó bị đẩy lệch để né chữ, rồi packet chạy trên nó liền đọc ra "sai chỗ" dù toạ độ hoàn toàn đúng. Một trục thì mọi thứ tự khớp.

Hệ quả: chú thích ăn theo trục (SQL readout…) **không được** ngồi cạnh connector để đẩy nó lệch. Cho nó vào trong node đã sinh ra nó — đằng nào đó cũng mới là chỗ đúng về nghĩa.

| Vùng | y | Nội dung |
|---|---|---|
| Header | `100 – 300` | handle → eyebrow → title |
| Hairline | `330` | nét `line` 1px, tràn mép `x 0 → 1080` |
| **Stage** | **`370 – 1820`** | toàn bộ diễn hoạ |

Hairline tách title block khỏi bản vẽ — đúng cách một tài liệu kỹ thuật được trình bày.

**Ngân sách**: stage có **~1450px**, không phải 1570px. Đây là ràng buộc cứng cho mọi scene — thiết kế bố cục phải cộng trước, đừng dựng xong rồi mới nhét header vào.

Khung 16:9 / 1:1: giữ nguyên thứ tự 3 dòng, tự điều chỉnh chiều cao vùng header tương ứng.

## Assets

Bố cục quyết định **hình dạng tổng thể** của scene (chuỗi, vòng, phân nhánh, so sánh song song, trục thời gian...) và asset nào nằm ở đâu.

Còn **cách vẽ** từng asset — line, stroke, fill, màu, glow, trạng thái — theo **`style_guide.md`**. Không có bảng tra "khái niệm này phải vẽ bằng hình kia": cho asset chạy qua 8 trục trong đó, nó tự ra đúng tông.

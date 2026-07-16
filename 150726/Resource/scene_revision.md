# Scene Revision — Versioning khi sửa scene

## Quy tắc lõi

**Không bao giờ ghi đè. Luôn tạo version mới.**

Khi user yêu cầu sửa/thêm/thử hướng khác cho một scene đã có ("sửa scene caching", "làm particle nhanh hơn", "thử màu khác"...):

1. Giữ nguyên bản hiện tại, không edit in place, không xoá.
2. Tạo version mới **dựa trên version mới nhất** (không quay về bản gốc).
3. Chỉ áp thay đổi vào version mới.

## Quy ước trong Remotion

- Code: `scenes/CachingLayers/v2/index.tsx`, `v3/...` — bản gốc nằm ở `scenes/CachingLayers/index.tsx`.
- Composition ID: `CachingLayers` → `CachingLayersV2` → `CachingLayersV3`. **Đăng ký tất cả** trong `Root.tsx` để so sánh cạnh nhau trong Remotion Studio.
- Tên gốc giữ nguyên, chỉ tăng số version. Không đổi tên scene khi revise.
- Phần không đổi giữa các version: import lại từ bản trước hoặc từ `components/` — không copy-paste cả file nếu chỉ sửa một phần.

## Ví dụ

- User: "Sửa scene CachingLayers, cho DB đỏ hơn" → tạo `CachingLayersV2` với thay đổi đó.
- User tiếp: "Thêm counter vào" → build từ V2 → tạo `CachingLayersV3`.

## Dọn dẹp

Khi user chốt một version ("lấy V3 làm bản chính"), hỏi user có muốn dọn các version cũ không — chỉ xoá khi được đồng ý.

## Mục đích

Giữ lịch sử ý tưởng, so sánh A/B các hướng trực tiếp trong Studio, không bao giờ mất bản đang tốt vì một lần thử.

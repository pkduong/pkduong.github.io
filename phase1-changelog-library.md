# PKD v0.3 — Library changelog specification

> Trạng thái: Draft, chỉ phân tích — chưa implement  
> Phiên bản mục tiêu: v0.3  
> Traceability: BR-LIBLOG-001 → UC-LIBLOG-001–003 → LibraryChange → AC-LIBLOG-001–009

## 1. Business Requirement

### BR-LIBLOG-001 — Công khai lịch sử phát triển kho tri thức

Độc giả cần biết kho tri thức vừa thêm, cập nhật hay lưu trữ tài liệu nào. Maintainer cần một ledger review được, không phụ thuộc Git UI và không biến mọi commit kỹ thuật thành “cập nhật tri thức”.

Library changelog khác site changelog:

- Site changelog: code, UI, route, tính năng.
- Library changelog: thay đổi nội dung published.
- Data version: mốc release bao trùm một hoặc nhiều library change entries.

## 2. Use Cases

- **UC-LIBLOG-001:** Độc giả mở `/library/updates/` và xem các batch mới nhất.
- **UC-LIBLOG-002:** Độc giả lọc lịch sử theo domain và change type rồi mở bài liên quan.
- **UC-LIBLOG-003:** Maintainer publish bài chi tiết từ index UFO và ghi ledger trong cùng change.

## 3. Entity model

```ts
type LibraryChange = {
  id: string; // LIB-2026-09-18-001
  dataVersion: string; // v0.2
  date: string; // owner-supplied YYYY-MM-DD
  type: 'added' | 'updated' | 'archived' | 'corrected';
  domain: Domain;
  itemIds: string[]; // stable article/record IDs
  summary: string;
  notes?: string;
};
```

MUST dùng stable ID, không dùng title/slug làm khóa. `updated` phải mô tả thay đổi có ý nghĩa; sửa format/typo nhỏ có thể gom vào batch `corrected`.

## 4. Authoring flow cho bài chi tiết UFO

Các prompt cho `01`–`04` chỉ là công cụ soạn thảo, không phải nguồn dữ liệu tự động:

```text
index/source hiện có
  → Agent tạo draft có trích nguồn và unknown để trống
  → human review parity/source/metadata
  → publish article/record có stable ID
  → thêm LibraryChange tham chiếu ID
  → validate + test + build
```

Không cho Agent tự điền date, tier, relation, coordinate hoặc kết luận claim. Bài chi tiết không thay thế/xóa index gốc trong cùng batch trước khi parity được duyệt.

## 5. Storage và projection

Khuyến nghị lưu entry dạng Markdown/YAML trong `src/content/library-updates/`. Build tạo projection tối thiểu, deterministic để filter phía client. Không đọc `git log` ở production vì shallow clone, rename và squash làm lịch sử không ổn định.

Route đề xuất:

- `/library/updates/`: timeline/list server-rendered.
- `/library/updates/<id>/`: chi tiết batch nếu notes dài.
- Domain page MAY hiển thị 3 update gần nhất với link tới ledger đầy đủ.

## 6. UI và accessibility

- Mặc định sort `date desc`, tie-break `id desc`.
- Mỗi entry hiển thị date, data version, type bằng text + icon/shape, domain và link item.
- Filter phản ánh URL; invalid value bị bỏ qua.
- No-JS vẫn đọc toàn bộ timeline và mở bài được.
- Archived item vẫn có entry; link tới tombstone/redirect, không thành link chết.

## 7. Acceptance Criteria

- **AC-LIBLOG-001:** Published content mới/đổi/archived có ledger entry hợp lệ trong cùng data release.
- **AC-LIBLOG-002:** Entry tham chiếu ID không tồn tại làm validation fail actionable.
- **AC-LIBLOG-003:** Timeline sort deterministic theo date và ID.
- **AC-LIBLOG-004:** Filter domain/type khôi phục qua URL và không crash với param sai.
- **AC-LIBLOG-005:** JavaScript tắt vẫn xem được lịch sử và link nội dung.
- **AC-LIBLOG-006:** Rename title/slug không làm mất lịch sử vì ledger dùng stable ID.
- **AC-LIBLOG-007:** Draft không xuất hiện trong public changelog; published entry không trỏ draft.
- **AC-LIBLOG-008:** Mobile 375px không overflow; type không chỉ biểu thị bằng màu.
- **AC-LIBLOG-009:** Hai clean builds tạo projection byte-for-byte giống nhau.

## 8. Phản biện và rủi ro

- Tự động coi mọi thay đổi checksum là update sẽ tạo nhiễu từ format/migration. Validator nên yêu cầu ledger khi semantic fields/body published đổi, nhưng cho phép allowlist thay đổi kỹ thuật có review.
- Một bài có thể xuất hiện trong nhiều batch; ledger là event append-only, không overwrite lịch sử.
- Xóa entry cũ làm mất audit trail. Correction phải thêm event mới hoặc trường supersedes, không sửa im lặng.
- “Có bao nhiêu trang cập nhật” phải đếm unique item IDs trong batch; không đếm số commit hay số file filesystem.

## 9. Tasks

- T-LIBLOG-001: chốt schema, change types, route và retention policy.
- T-LIBLOG-002: collection + semantic validator + fixtures.
- T-LIBLOG-003: deterministic projection và pure filter query.
- T-LIBLOG-004: timeline/list/detail UI + no-JS fallback.
- T-LIBLOG-005: authoring prompt riêng cho UFO 01–04 và checklist human review.
- T-LIBLOG-006: CI contract liên kết data version, published content diff và ledger.

## 10. Quyết định cần owner duyệt trước implement

1. Article legacy có stable ID đã đủ dùng hay v0.3 chỉ theo dõi normalized records?
2. Correction typo có bắt buộc thành public event không?
3. Giữ update detail vĩnh viễn hay chỉ giữ summary sau một khoảng thời gian?
4. Data version tăng theo batch curated hay theo từng article published? Khuyến nghị theo batch curated.

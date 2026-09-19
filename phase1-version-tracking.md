# PKD v0.1 — Version tracking specification

> Trạng thái: Draft, chỉ phân tích — chưa implement  
> Phạm vi dự kiến: PKD v0.1  
> Phụ thuộc: BR-004, UC-007, AC-050–052

## 1. Business Requirement

### BR-VERSION-001 — Phân biệt phiên bản website và phiên bản dữ liệu

Người duy trì cần biết một release thay đổi code/tính năng hay thay đổi kho tri thức. Hai dòng lịch sử MUST độc lập để một thay đổi CSS không bị hiểu là dữ liệu nghiên cứu mới.

## 2. Use Cases

- **UC-VERSION-001:** Độc giả xem version website hiện hành từ footer và mở changelog.
- **UC-VERSION-002:** Maintainer phát hành version code mới và cập nhật changelog trong cùng change.
- **UC-VERSION-003:** Maintainer thêm/cập nhật Markdown và tăng data version có chủ đích.

## 3. Mô hình đề xuất

```text
SiteVersion  = version của code, UI, route và tính năng
DataVersion  = version của tập nội dung Markdown đã publish
ChangeEntry  = version + date + scope + summary + references
```

Nguồn sự thật đề xuất:

- `package.json.version`: site version hiện hành.
- `CHANGELOG.md`: lịch sử site version.
- `DATA_CHANGELOG.md`: lịch sử data version.
- Footer chỉ đọc site version khi build, không hard-code bản sao thứ hai.

Không nên gộp hai lịch sử vào một số version: deploy sửa CSS và publish một nghiên cứu mới có vòng đời, reviewer và rủi ro khác nhau.

## 4. Nội dung khởi tạo dự kiến

### Site version

- `v0.0` — Initial project created — `2026-09-18`.
- `v0.1` — Update UI, text/menu, font size, theme, changelog — `2026-09-19`.

### Data version

- `v0.1` — Initial UFO index and L.I.N.G draft — `2026-09-18`.

Ngày trên do owner cung cấp; implementation không được suy diễn thêm ngày từ Git history.

## 5. UI dự kiến

Footer server-rendered:

```text
PKD · Project Knowledge Disclosure — v0.1 — Changelog
```

`Changelog` MUST là link base-path-safe. Trang changelog MUST đọc được khi JavaScript tắt và tách rõ hai section “Website” và “Dữ liệu”.

## 6. Quy tắc release đề xuất cho AGENTS.md

Chỉ thêm khi feature được owner duyệt để implement:

1. Mọi thay đổi làm tăng site version MUST cập nhật `package.json` và `CHANGELOG.md` trong cùng change.
2. Mọi Markdown published mới MUST cập nhật `DATA_CHANGELOG.md` và tăng data version.
3. Sửa typo không làm đổi nghĩa MAY không tăng data version, nhưng phải được ghi trong batch hiện hành.
4. Không tự tăng major/minor dựa trên số file; maintainer chọn version theo impact.

## 7. Acceptance Criteria dự kiến

- **AC-VERSION-001:** Footer hiển thị đúng version từ source of truth và link changelog đúng dưới `/ufo-data/`.
- **AC-VERSION-002:** Changelog hiển thị riêng site version và data version khi JavaScript tắt.
- **AC-VERSION-003:** CI fail nếu `package.json.version` không có entry tương ứng trong `CHANGELOG.md`.
- **AC-VERSION-004:** CI fail khi thêm published Markdown nhưng data version/ledger không đổi.
- **AC-VERSION-005:** Hai clean builds của cùng commit tạo nội dung changelog giống byte-for-byte.

## 8. Phản biện và quyết định cần owner duyệt

- “Mỗi lần thêm `.md` tăng version” quá rộng: fixture, draft hoặc tài liệu kỹ thuật không phải dữ liệu publish. Rule nên áp dụng cho Markdown published trong content roots.
- Không dùng commit time làm ngày công bố vì shallow clone, timezone và lịch sử rebase làm kết quả không ổn định.
- Việc thêm validator cho release contract là thay đổi CI; cần implement cùng test, không chỉ thêm câu chữ vào AGENTS.md.

## 9. Task dự kiến

- T-VERSION-001: chốt source of truth và format changelog.
- T-VERSION-002: tạo route/footer base-path-safe.
- T-VERSION-003: validator + fixtures + test AC-VERSION-001–005.
- T-VERSION-004: cập nhật AGENTS.md và release guideline sau khi behavior đã tồn tại.

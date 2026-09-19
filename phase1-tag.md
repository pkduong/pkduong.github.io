# PKD v0.2 — Tag discovery specification

> Trạng thái: Draft, chỉ phân tích — chưa implement  
> Phiên bản mục tiêu: v0.2  
> Traceability: BR-002 → UC-003 → Tag rules → AC-TAG-001–010

## 1. Business Requirement

### BR-TAG-001 — Khám phá nội dung theo chủ đề ngang domain

Độc giả cần tìm các bài liên quan theo chủ đề mà không phụ thuộc cấu trúc thư mục. Tag là metadata điều hướng, không phải claim, tier, entity hay relation.

## 2. Use Cases

- **UC-TAG-001:** Từ trang chủ, độc giả xem tối đa 10 tag phổ biến của từng domain.
- **UC-TAG-002:** Từ trang domain, độc giả tìm theo từ khóa và chọn tag phổ biến.
- **UC-TAG-003:** Từ card bài viết, độc giả xem/chọn tag của chính bài đó.
- **UC-TAG-004:** Maintainer thêm/sửa bài với tag hợp lệ và nhận lỗi actionable nếu sai.

## 3. Entity và quy tắc

### Tag

```ts
type Tag = {
  id: string; // ASCII kebab-case, immutable
  label: string; // nhãn UI tiếng Việt hoặc thuật ngữ chuẩn
  aliases: string[];
  description: string;
  domains?: Domain[];
};
```

Quy tắc bắt buộc:

- Registry tag trung tâm là source of truth; article chỉ lưu `tag.id`.
- Không tự sinh tag từ heading, prose hoặc filename.
- Alias dùng để tìm kiếm, không tạo tag thứ hai.
- Tag không biểu thị độ đúng/sai, độ tin cậy hay quan hệ nhân quả.
- ID dùng lowercase ASCII kebab-case; label giữ Unicode.
- Mỗi bài SHOULD có 2–7 tag; 0 tag vẫn hợp lệ trong giai đoạn migration.
- Không cho tag đồng nghĩa cạnh tranh như `uap`, `ufo-uap`, `unidentified-aerial` nếu chưa có canonical/alias rõ.

## 4. Top tag và cách tính

Khuyến nghị tính tại build-time từ published articles đã validate:

1. Đếm số article unique chứa tag, không đếm số lần tag xuất hiện trong body.
2. Homepage: top 10 trong từng domain.
3. Domain page: hiển thị 8 tag đầu trên desktop, 5 trên mobile; phần còn lại nằm trong “Xem tất cả”.
4. Sort theo `articleCount desc`, tie-break bằng `label` theo locale `vi` để output deterministic.
5. Draft/archived không tham gia count.

Không nên cố nhét cố định 10 tag vào khu vực số 2: khi tên tag dài, layout sẽ vỡ. Dùng wrapping chips và giới hạn theo không gian; HTML vẫn render toàn bộ trong vùng mở rộng.

## 5. UI dự kiến

### Homepage

- Dưới mỗi domain card có nhóm “Tag nổi bật”.
- Chip phải có text, count và trạng thái focus; không chỉ khác màu.
- Click đi tới domain page với URL `/<domain>/?tag=<id>`.

### Domain page

- Khu vực 2: tag phổ biến + count, có “Xem tất cả”.
- Khu vực 3: input có label thật, nút Search, submit bằng Enter.
- URL canonical: `q=<text>&tag=<id>`; refresh/back khôi phục state.
- Không JS: form GET và danh sách bài vẫn dùng được; enhancement có thể lọc tức thời.

### Article card

- Khu vực 5 hiển thị toàn bộ tag của bài, giới hạn thị giác bằng wrap chứ không cắt dữ liệu.
- Tag link có hit target tối thiểu và hover/focus nền trắng chữ đen theo theme PKD.

## 6. Migration nội dung cũ

Không gán tag hàng loạt bằng suy đoán. Quy trình đề xuất:

1. Inventory tag hiện có trong frontmatter non-legacy.
2. Owner duyệt registry canonical + alias.
3. Migrate từng domain theo batch; legacy chưa review giữ `tags: []` hoặc thiếu field theo schema migration.
4. Mỗi batch có report: file, tag trước/sau, reviewer, checksum prose không đổi.
5. Validator chặn unknown tag, duplicate tag, alias dùng thay canonical ID và tag vượt policy.

Các file `ufo.md`, `soul.md`, `meta.md` là dữ liệu nghiên cứu, không nên nhét “prompt runtime” vào prose. Nếu cần hướng dẫn Agent, tạo template/prompt riêng trong `prompts/` hoặc `docs/authoring/`, yêu cầu Agent đề xuất tag kèm evidence và bắt buộc human review trước khi ghi frontmatter.

## 7. Data pipeline đề xuất

```text
tag registry + validated article frontmatter
  → build-tag-projection
  → deterministic tags.json (id, label, count, domainCounts)
  → homepage/domain/article UI
```

Projection không chứa body. Search text vẫn do Pagefind xử lý; tag filter dùng metadata projection để tránh parse HTML.

## 8. Acceptance Criteria

- **AC-TAG-001:** Unknown/duplicate/non-canonical tag làm validation fail với file và field.
- **AC-TAG-002:** Top tag chỉ đếm published article unique và sort deterministic.
- **AC-TAG-003:** Homepage hiển thị tối đa 10 tag/domain, count đúng.
- **AC-TAG-004:** Domain search + tag dùng AND giữa nhóm, nhiều tag dùng OR trong cùng nhóm.
- **AC-TAG-005:** URL refresh/back khôi phục query, tag và result set.
- **AC-TAG-006:** Card bài viết hiển thị đúng tag từ frontmatter, không suy từ prose.
- **AC-TAG-007:** Không JavaScript vẫn search bằng GET và điều hướng tag được.
- **AC-TAG-008:** Unknown query param bị bỏ qua, không crash.
- **AC-TAG-009:** View 375px không overflow; chip keyboard-focusable và contrast AA.
- **AC-TAG-010:** Hai clean builds tạo `tags.json` byte-for-byte giống nhau.

## 9. Phản biện và rủi ro

- Top tag dễ tạo vòng lặp phổ biến: tag đã nổi càng được click. Nên có thêm “tag mới/có chủ đích” sau khi có đủ dữ liệu, không dùng ở v0.2.
- Tag quá chi tiết làm taxonomy vỡ; tag quá rộng không giúp tìm. Registry phải có description và tiêu chí include/exclude.
- Legacy chỉ có tag do AI đề xuất không được publish tự động; AI hỗ trợ candidate, owner quyết định metadata.
- Tag xuyên domain cần định nghĩa canonical chung; tag chuyên biệt có thể giới hạn `domains`.

## 10. Tasks

- T-TAG-001: registry + schema + validator + fixtures.
- T-TAG-002: migration report theo domain, không đổi prose.
- T-TAG-003: deterministic projection và pure filter functions.
- T-TAG-004: homepage/domain/article UI + URL state + no-JS fallback.
- T-TAG-005: cập nhật authoring guide/prompt riêng và test AC-TAG-001–010.

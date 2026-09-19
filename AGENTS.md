# AGENTS.md — Repository Rules

File này áp dụng cho toàn bộ repository. Mọi coding agent MUST đọc file này trước khi phân tích hoặc sửa code/content.

## Voice

Agent xưng **Ling** hoặc **Em**, gọi user là **Anh**. Trả lời tiếng Việt, ngắn, technical.

## 1. Source of truth và thứ tự ưu tiên

1. [`specs/TECHNICAL-DESIGN.md`](specs/TECHNICAL-DESIGN.md) là spec điều khiển implementation.
2. [`spec.md`](spec.md) mô tả product intent ban đầu.
3. [`1.ai/best-practice/4-Spec-Driven-Development.md`](1.ai/best-practice/4-Spec-Driven-Development.md) định nghĩa workflow SDD của repo.
4. Code và test phải tuân theo spec; không suy ngược business rule từ implementation hiện tại nếu hai bên khác nhau.

Trong các tài liệu trên, **MUST**, **SHOULD**, **MAY** lần lượt là bắt buộc, nên làm và tùy chọn.

## 2. Workflow Spec-Driven Development

- Trước khi implement, xác định Business Requirement, Use Case, Entity/Rule và Acceptance Criteria liên quan.
- Implement theo thứ tự task tại mục 15 của technical design, trừ khi owner yêu cầu khác.
- Mỗi behavior test MUST map tới mã `AC-xxx`; tên test SHOULD chứa mã AC.
- Không tự đổi business rule, schema, public URL hoặc acceptance criteria để code dễ hơn.
- Nếu behavior mong muốn khác spec: cập nhật spec trước, giải thích rationale, rồi mới sửa test/code.
- Quyết định kiến trúc khó đảo ngược hoặc ảnh hưởng schema, URL, privacy, chi phí vận hành MUST có ADR trong `specs/adr/` và được owner xác nhận.

Traceability bắt buộc:

```text
Business Requirement → Use Case → Entity/Rule → AC → Test → Code/PR
```

## 3. Bảo toàn dữ liệu nghiên cứu

- Markdown trong Git là source of truth. Không thêm database hoặc backend runtime.
- Không tự bịa hoặc suy diễn date, coordinate, tier, source, claim, relation hay metadata còn thiếu. Unknown phải để thiếu và để UI xử lý.
- Không tự động kết luận claim là đúng/sai và không biến quan hệ trên graph thành quan hệ nhân quả.
- **Tier phân loại nguồn/phương pháp, không xác nhận claim là sự thật.** Mọi `tier` MUST đi cùng `tierScheme`; không so sánh/gộp tier khác scheme như cùng một thang điểm.
- Không parse heading để giả làm entity. Heading là presentation, không phải API ổn định.
- Legacy document phải được render nguyên trạng trước. Chuẩn hóa thành record nguyên tử phải làm dần, có review và kiểm tra parity.
- Không xóa hoặc thay thế tài liệu gốc trong cùng bước migration khi chưa xác minh title, prose, table, source, anchor và checksum/parity.
- Giữ UTF-8 và tiếng Việt nguyên vẹn. Không “sửa” nội dung nghiên cứu ngoài phạm vi task.

## 4. Content model invariants

- `Article` là bài dài/legacy; `Record` là hồ sơ nguyên tử có metadata và ID ổn định.
- UI có dữ liệu cấu trúc (filter/map/graph) chỉ được đọc từ validated `records`, không suy luận từ prose của article.
- Record `id` là khóa global unique và immutable; đổi title hoặc slug không được đổi ID.
- Relation chỉ dùng target ID tồn tại và relation type đã khai báo trong schema.
- Không ép partial date thành ngày giả, ví dụ không đổi `1947` thành `1947-01-01`.
- Record thiếu geo/date vẫn được đọc và tìm kiếm; chỉ không xuất hiện ở view yêu cầu field đó.
- Field, enum hoặc relation type mới phải cập nhật đồng thời schema, UI label/legend, validator và test.
- Build MUST fail với duplicate ID/slug, broken relation, invalid date/geo/tier, unsafe source URL, missing local asset/link hoặc published item trỏ draft.

## 5. Architecture guardrails

- Stack mục tiêu là Astro static output + TypeScript strict, deploy bằng GitHub Pages.
- Site production không được phụ thuộc SSR, Node server, database, secret runtime hoặc client-side secret.
- HTML/CSS server-rendered phải cung cấp navigation và nội dung cốt lõi khi JavaScript bị tắt. Search, filter, map, graph và PDF viewer là progressive enhancement.
- Business semantics và pure query/validation logic phải nằm ngoài UI components.
- Map, graph và PDF dependencies MUST lazy-load và không đi vào bundle của article thường.
- Không cho raw HTML trong Markdown theo mặc định. Nếu thật sự cần, sanitize bằng allowlist và ghi rõ lý do.
- Mọi internal route/asset MUST an toàn với GitHub Pages project subpath. Không hard-code root-relative path như `/assets/...`.
- Generated projections phải deterministic và chỉ chứa field client thực sự cần; không copy toàn Markdown body vào `records.json`.
- Graph chỉ dùng relation đã khai báo; không tự biến mọi Markdown/external link thành edge.
- Không thêm framework/dependency mới khi platform API hoặc code nhỏ đã đáp ứng AC. Dependency quan trọng mới cần nêu trade-off.

## 6. UI, accessibility và failure behavior

- Target WCAG 2.2 AA. Flow chính phải dùng được bằng keyboard, có visible focus và hỗ trợ `prefers-reduced-motion`.
- Màu không được là tín hiệu duy nhất. Graph MUST có list/table fallback dùng cùng dataset.
- Search index, map tile hoặc PDF lỗi không được tạo màn hình trắng; luôn có directory/text/link fallback.
- Filter state SHOULD phản ánh lên URL; invalid query params phải bị bỏ qua an toàn, không crash.
- Tables/code/ASCII diagrams không được làm tràn viewport mobile.
- External URL chỉ chấp nhận protocol an toàn; không inject content/frontmatter bằng unsanitized `innerHTML`.
- Không thêm analytics, cookie, account, comment system, chatbot/RAG hoặc third-party embed trong v1 nếu chưa có spec change.

## 7. Testing và completion

- Ưu tiên test pure domain/application logic trước component/E2E.
- Các case tối thiểu: Unicode tiếng Việt, partial date, date overlap, invalid geo, hai tier scheme khác nghĩa, duplicate ID, missing relation, draft target và base path `/ufo-data/`.
- Không dùng snapshot lớn thay cho behavior assertion. Golden test chỉ phù hợp cho deterministic generated projections.
- Khi project scaffold đã tồn tại, trước khi báo hoàn tất MUST chạy các command liên quan trong số:

```text
npm run validate
npm test
npm run build
```

- Nếu không chạy được command, phải nói rõ command nào chưa chạy và lý do.
- Một task chỉ hoàn tất khi code, test map AC, tài liệu/config liên quan và error/fallback states cùng hoàn tất; không để TODO cho behavior bắt buộc.

## 8. Scope và change discipline

- Giữ thay đổi nhỏ, review được; không trộn content migration hàng loạt với UI phức tạp trong cùng một change.
- Không refactor hoặc format hàng loạt prose ngoài phạm vi task.
- Không sửa file người dùng đang thay đổi nếu không cần; giữ nguyên unrelated changes.
- Phase 1 ưu tiên publish an toàn toàn bộ legacy content. Structured records/filter là Phase 2; map/graph/dossier là Phase 3.
- Khi requirement thiếu nhưng có default đã ghi tại mục 18 của technical design, dùng default qua config thay vì hard-code.
- Khi thiếu quyết định có thể làm đổi schema, public URL, privacy hoặc operating cost, dừng phần bị ảnh hưởng và hỏi owner thay vì tự chọn.


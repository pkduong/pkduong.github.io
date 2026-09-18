# Technical Design — Static Knowledge Atlas

> Trạng thái: Proposed  
> Phiên bản: 1.0  
> Nguồn yêu cầu: [`/spec.md`](../spec.md)  
> Chuẩn thực hiện: [`/1.ai/best-practice/4-Spec-Driven-Development.md`](../1.ai/best-practice/4-Spec-Driven-Development.md)

## 0. Cách dùng tài liệu này

Đây là **spec điều khiển implementation**, không phải tài liệu giới thiệu công nghệ. Coding agent phải:

1. đọc toàn bộ tài liệu này trước khi sửa code;
2. implement theo thứ tự task ở mục 15;
3. map test với mã Acceptance Criteria (AC);
4. không tự thay đổi business rule hoặc schema để làm code dễ hơn;
5. nếu phát hiện requirement sai hoặc thiếu, cập nhật spec và ghi ADR trước khi đổi code.

Từ khóa **MUST**, **SHOULD**, **MAY** lần lượt có nghĩa là bắt buộc, nên làm và tùy chọn.

---

## 1. Business intent và phạm vi

### BR-001 — Một nguồn nội dung Markdown, nhiều cách khám phá

Người sở hữu repo cần xuất bản 5 nhóm tri thức đang lưu bằng Markdown thành website công khai, dễ đọc và dễ duy trì. Markdown trong Git phải là source of truth; không vận hành database hoặc backend riêng.

Năm domain hiện tại:

| Mã | Thư mục nguồn hiện tại | Tên hiển thị mặc định | Slug |
|---|---|---|---|
| `ai` | `1.ai/` | AI & Software Engineering | `ai` |
| `ufo` | `2.ufo/` | UFO / UAP | `ufo` |
| `meta` | `3.meta/` | Vật lý & Siêu hình học | `meta` |
| `psychic` | `4.psychic/` | Tâm linh & Cận tâm lý | `psychic` |
| `misc` | `5.ling-tinh/` | Linh tinh | `misc` |

### BR-002 — Nội dung phải truy vấn được

Ngoài điều hướng và đọc bài, độc giả cần tìm kiếm, lọc theo domain/loại/tier/tag, xem quan hệ giữa các hồ sơ, và với record phù hợp thì khám phá theo bản đồ và thời gian.

### BR-003 — Giữ kỷ luật nhận thức

Website không được trình bày tier nguồn như “độ đúng của claim”. Mỗi tier phải đi cùng `tierScheme` và mô tả của chính domain. UI không được gộp các thang tier khác nghĩa vào một thang điểm toàn cục.

### BR-004 — Deploy chi phí thấp, tái lập được

Mỗi lần push nhánh mặc định, CI phải validate nội dung, test, build static artifacts và deploy GitHub Pages. Website sau deploy không phụ thuộc Node server, secret runtime hoặc database.

### Chỉ số thành công

- 100% Markdown hợp lệ được build thành trang đọc được.
- Link nội bộ, ID và relation hỏng làm CI fail trước deploy.
- Thêm một bài Markdown hợp lệ không cần sửa component hoặc route.
- Trang nội dung cơ bản hoạt động khi JavaScript bị tắt; tính năng tương tác nâng cao được progressive enhancement.
- Lighthouse CI trên các route mẫu: Accessibility >= 95, Best Practices >= 90, SEO >= 90; Performance target >= 85 trên mobile simulated.

### Ngoài phạm vi phiên bản 1

- CMS có giao diện soạn thảo, đăng nhập hoặc phân quyền.
- Bình luận, tài khoản độc giả, đồng bộ thời gian thực.
- AI chatbot/RAG, vector database hoặc semantic search server-side.
- Tự động kết luận claim đúng/sai từ nội dung.
- Scrape nguồn bên ngoài hoặc tự động sửa nội dung nghiên cứu.
- Offline-first PWA và native mobile app.

---

## 2. Hiện trạng và ràng buộc migration

Tại thời điểm viết spec:

- repo có 22 file Markdown nội dung trong 5 domain;
- chỉ 4 file dataset thuộc `2.ufo/` có YAML frontmatter;
- nhiều file là bài tổng hợp dài chứa nhiều thực thể dưới heading, chưa phải một-record-một-file;
- nội dung có bảng, blockquote, fenced code/diagram và nhiều external links;
- không có application scaffold, package manager lockfile hay pipeline deploy;
- đường dẫn asset tuyệt đối kiểu `/assets/...` có thể xuất hiện và sẽ sai khi GitHub Pages chạy dưới project subpath.

Hệ quả thiết kế:

1. **Không parse heading để giả làm entity.** Heading là presentation, không phải API ổn định.
2. Phase đầu phải render nguyên trạng các legacy document.
3. Các UI cần dữ liệu có cấu trúc chỉ đọc collection `records`; legacy article chưa chuẩn hóa vẫn đọc/tìm kiếm được nhưng không tự xuất hiện trên map/graph nâng cao.
4. Migration sang record nguyên tử làm dần, có ID ổn định và không xóa tài liệu gốc trước khi kiểm tra parity nội dung.

---

## 3. Use cases

### UC-001 — Duyệt 5 domain

**Actor:** độc giả.  
**Precondition:** site build thành công.  
**Main flow:** mở trang chủ → chọn domain → xem danh sách bài/record → mở trang chi tiết.  
**Exception:** domain chưa có record chuẩn hóa vẫn hiển thị legacy article.

### UC-002 — Đọc và truy vết nội dung

**Actor:** độc giả.  
**Main flow:** đọc mục lục → nhảy tới heading → mở nguồn tham khảo → đi theo related record.  
**Exception:** relation hoặc local link không tồn tại phải bị chặn ở build-time, không để thành link chết production.

### UC-003 — Tìm kiếm và lọc

**Actor:** độc giả.  
**Main flow:** nhập từ khóa → nhận kết quả theo title/summary/body → lọc domain, kind, tag và tier scheme/tier → mở kết quả.  
**Rule:** query và filter state SHOULD phản ánh lên URL để copy/share và dùng nút Back.

### UC-004 — Khám phá incident trên map và timeline

**Actor:** độc giả nghiên cứu.  
**Precondition:** record có `kind: incident`, tọa độ hợp lệ và date range.  
**Main flow:** mở Explore → thay date range/filter → marker tương ứng cập nhật → chọn marker → mở record.  
**Exception:** record thiếu geo/date không bị bỏ khỏi site; chỉ không xuất hiện trong view đòi hỏi trường đó.

### UC-005 — Khám phá knowledge graph

**Actor:** độc giả nghiên cứu.  
**Precondition:** records có relation hợp lệ.  
**Main flow:** mở graph → filter domain/relation type → chọn node → xem neighbor và đi tới detail.  
**Rule:** graph là một cách điều hướng, không phải bằng chứng về quan hệ nhân quả.

### UC-006 — Xem dossier và tài liệu gốc

**Actor:** độc giả nghiên cứu.  
**Main flow:** mở record có sources/assets → desktop hiển thị timeline, document viewer/link và related records → mobile xếp tuần tự.  
**Exception:** PDF cross-origin không render được thì hiển thị metadata và link mở/tải an toàn.

### UC-007 — Người viết thêm/sửa nội dung

**Actor:** maintainer.  
**Main flow:** tạo Markdown theo template → chạy validation local → preview → commit → CI validate/build/deploy.  
**Exception:** duplicate ID, invalid date/geo/tier, unknown relation hoặc broken local link làm validation fail với file và field rõ ràng.

---

## 4. Kiến trúc được chọn

### 4.1 Quyết định

Chọn **Astro + TypeScript strict + static output** thay cho Quartz.

Lý do:

- requirement có UI chuyên biệt (map, timeline, dossier, filter), Astro cho phép tạo islands tương tác mà phần lớn site vẫn là HTML tĩnh;
- content schema và build validation có thể kiểm soát rõ bằng TypeScript/Zod;
- deploy GitHub Pages trực tiếp, không cần runtime server;
- không ép nội dung hiện tại sang Obsidian wikilink;
- graph được tạo từ relation có kiểu, ổn định hơn suy luận mọi Markdown link là quan hệ nghiệp vụ.

Quartz chỉ nên được xem lại nếu mục tiêu đổi thành digital garden kiểu Obsidian và custom UX không còn là trọng tâm.

### 4.2 Component view

```text
Markdown source
  ├─ articles (legacy/long-form)
  └─ records  (normalized entities)
          │
          ▼
Content schema + semantic validators
          │ fail fast
          ▼
Astro build
  ├─ static routes and HTML
  ├─ records.json (filter/map)
  ├─ graph.json (nodes/edges)
  └─ search index (post-build)
          │
          ▼
GitHub Pages CDN
          │
          ├─ HTML/CSS: reading works without JS
          └─ hydrated islands: Search / Filter / Map / Timeline / Graph / PDF
```

### 4.3 Dependency boundaries

```text
UI adapters (Astro pages + interactive components)
                  │
                  ▼
Application queries (search/filter/map/graph projection)
                  │
                  ▼
Domain model (ContentItem, Record, Relation, Source, TierScheme)
                  ▲
                  │
Driven adapters (Markdown loader, generated JSON, Pagefind, browser URL)
```

Business semantics và validators MUST nằm ngoài UI component. Component không được tự diễn giải tier, date hoặc relation.

### 4.4 Công nghệ

| Concern | Lựa chọn | Rule |
|---|---|---|
| Runtime/build | Node LTS + npm | Pin `engines`, commit `package-lock.json`, CI dùng `npm ci` |
| Site generator | Astro, static output | Không dùng SSR adapter |
| Language | TypeScript strict | Không dùng `any` trừ adapter được ghi lý do |
| Styling | CSS variables + component-scoped CSS | Không cần framework CSS ở v1 |
| Schema | Zod/content schema | Structural + semantic validation khi build |
| Search | Pagefind post-build | Static index; không gửi dữ liệu tới dịch vụ search |
| Map | Leaflet | Chỉ hydrate tại route Explore; attribution bắt buộc |
| Timeline/range | Native range controls hoặc component nhỏ tự viết | Không thêm noUiSlider nếu native đáp ứng AC/accessibility |
| Graph | Cytoscape.js | Lazy-load; deterministic layout option cho test |
| PDF | PDF.js lazy-loaded | Có fallback link; không bundle/load trên trang không có PDF |
| Unit/component test | Vitest + Testing Library | Test business query trước UI |
| E2E | Playwright | Chromium tối thiểu; desktop + mobile critical flows |
| Quality | ESLint, Prettier, markdownlint, Lighthouse CI | Cùng command local và CI |

Không pin version bằng suy đoán trong spec. Khi bootstrap, agent MUST chọn latest stable tương thích Node LTS tại thời điểm implement, lưu version chính xác trong lockfile và ghi vào ADR nếu phải chọn version cũ.

---

## 5. Cấu trúc repo đích

```text
/
├─ specs/
│  ├─ TECHNICAL-DESIGN.md
│  └─ adr/
│     └─ ADR-xxxx-*.md
├─ src/
│  ├─ content/
│  │  ├─ articles/<domain>/*.md
│  │  └─ records/<domain>/<kind>/*.md
│  ├─ domain/
│  │  ├─ content.ts
│  │  ├─ date-range.ts
│  │  ├─ tier.ts
│  │  └─ relation.ts
│  ├─ application/
│  │  ├─ filter-records.ts
│  │  ├─ build-map-projection.ts
│  │  └─ build-graph-projection.ts
│  ├─ components/
│  ├─ layouts/
│  ├─ pages/
│  ├─ styles/
│  ├─ content.config.ts
│  └─ site.config.ts
├─ scripts/
│  ├─ migrate-content.*
│  ├─ validate-content.*
│  └─ generate-projections.*
├─ public/
│  └─ assets/
├─ tests/
│  ├─ unit/
│  ├─ content/
│  └─ e2e/
├─ .github/workflows/pages.yml
├─ astro.config.*
├─ package.json
└─ package-lock.json
```

Migration SHOULD dùng thao tác giữ history nếu repo đã được Git init. Nếu chưa có Git metadata như hiện trạng quan sát được, script phải copy có checksum, xác minh parity rồi mới đề xuất xóa nguồn; không tự động xóa trong cùng bước.

---

## 6. Entity model và content schema

### 6.1 Ubiquitous language

| Entity/value object | Ý nghĩa |
|---|---|
| `Domain` | Một trong 5 vùng tri thức cấp cao |
| `Article` | Bài dài/legacy; đơn vị xuất bản nhưng không nhất thiết là một thực thể nghiên cứu |
| `Record` | Hồ sơ nguyên tử có ID ổn định, kind, metadata và relations |
| `Claim` | Phát biểu trong record; v1 lưu trong prose, không tự chấm đúng/sai |
| `SourceRef` | Nguồn hỗ trợ/truy vết cho record |
| `TierScheme` | Hệ quy chiếu định nghĩa ý nghĩa các tier trong một domain |
| `Relation` | Cạnh có kiểu từ một record tới một record khác |
| `GeoPoint` | Vị trí có tọa độ, nhãn và precision tùy chọn |
| `DateRange` | Khoảng thời gian có thể không chính xác đến ngày |
| `AssetRef` | PDF/image/local artifact hoặc URL ngoài |

### 6.2 Schema chung

Mỗi file trong `articles` MUST có:

```yaml
---
id: "ART-AI-SDD"
title: "Spec Driven Development"
slug: "spec-driven-development"
domain: "ai"
kind: "article"
summary: "Mô tả ngắn dùng cho card và search result."
language: "vi"
status: "published"
order: 40
tags: ["software-engineering", "sdd"]
updatedAt: "2026-09-19"
---
```

Mỗi file trong `records` MUST/SHOULD theo schema:

```yaml
---
id: "INC-UFO-VARGINHA-1996"       # MUST, unique, immutable
title: "Sự kiện Varginha"
slug: "varginha-1996"             # MUST, unique trong domain/kind
domain: "ufo"                      # MUST
kind: "incident"                   # MUST
summary: "..."                     # MUST, 40–240 ký tự
language: "vi"                     # MUST
status: "published"                # draft | published | archived
tags: ["radar", "witness"]
tierScheme: "ufo-source-v1"        # MUST nếu có tier
tier: 2                             # integer 1..5, meaning depends on scheme
date:
  from: "1996-01-20"               # YYYY | YYYY-MM | YYYY-MM-DD
  to: "1996-01-20"                 # optional; from <= to
  display: "20/01/1996"            # optional human wording
geo:
  - lat: -21.55
    lng: -45.43
    label: "Varginha, Brazil"
    precision: "city"              # exact | site | city | region | unknown
relations:
  - targetId: "PER-JAMES-FOX"
    type: "documented-by"
sources:
  - id: "SRC-EXAMPLE-001"
    title: "Tên tài liệu"
    url: "https://example.org/document"
    sourceType: "official-record"
    accessedAt: "2026-09-19"
assets: []
updatedAt: "2026-09-19"
---
```

### 6.3 Enum chuẩn

`kind` v1:

- `article`
- `program`
- `incident`
- `person`
- `concept`
- `institution`
- `experiment`
- `tradition`
- `case-file`

`relation.type` v1:

- `related-to`
- `part-of`
- `precedes`
- `involves`
- `member-of`
- `investigated-by`
- `documented-by`
- `supports`
- `challenges`
- `uses-concept`

Thêm enum cần sửa schema, label UI, legend và test trong cùng PR. Không dùng chuỗi tùy ý để né validation.

### 6.4 ID và slug

- `id` dùng ASCII uppercase với dấu gạch ngang, regex `^[A-Z][A-Z0-9-]{2,79}$`.
- `id` là khóa quan hệ và MUST không đổi khi đổi title/slug.
- `slug` dùng lowercase ASCII kebab-case.
- Route canonical của record: `/<domain>/<kind>/<slug>/`.
- Redirect map phải được thêm nếu đổi slug đã publish.

### 6.5 Date semantics

- Không ép ngày thiếu chính xác thành `01-01` giả.
- Parser chấp nhận `YYYY`, `YYYY-MM`, `YYYY-MM-DD` và tạo lower/upper bound riêng cho filter.
- Date không chắc chắn được diễn đạt bằng `display` và nội dung; v1 không thêm xác suất.
- Record không có date vẫn hợp lệ trừ `kind: incident`; incident published MUST có `date.from`.

### 6.6 Tier semantics

Config trung tâm định nghĩa từng scheme:

```ts
type TierScheme = {
  id: string;
  domain: Domain;
  title: string;
  disclaimer: string;
  levels: Record<number, { label: string; description: string }>;
};
```

Filter MUST bắt người dùng chọn scheme/domain trước khi chọn tier. UI MUST hiển thị disclaimer: **“Tier phân loại nguồn/phương pháp, không xác nhận claim là sự thật.”**

### 6.7 Semantic validation

Ngoài Zod structural validation, build MUST kiểm tra:

- ID global unique;
- slug unique trong route namespace;
- mọi `targetId` tồn tại và không tự trỏ, trừ relation type được whitelist;
- `date.from <= date.to` theo normalized bounds;
- latitude `[-90, 90]`, longitude `[-180, 180]`;
- tier tồn tại trong đúng scheme và scheme thuộc đúng domain;
- source URL chỉ dùng `https`, trừ allowlist rõ ràng;
- local asset/path tồn tại và không thoát repo root;
- published item không link tới draft item;
- internal Markdown link và heading anchor tồn tại;
- file encoding UTF-8.

Lỗi phải in: error code, file, field, bad value và cách sửa ngắn.

---

## 7. Routes và information architecture

| Route | Chức năng |
|---|---|
| `/` | Giới thiệu, 5 domain, featured/recent content |
| `/<domain>/` | Landing và facet summary của domain |
| `/<domain>/articles/<slug>/` | Legacy/long-form article |
| `/<domain>/<kind>/<slug>/` | Normalized record detail |
| `/search/` | Full-text search + facets |
| `/explore/map/` | Map + date/filter panel |
| `/explore/graph/` | Knowledge graph |
| `/about/methodology/` | Tier schemes, source policy, limitations |
| `/404.html` | Static not-found page |

Header MUST có Home, 5 domain, Explore, Search. Mobile dùng menu có keyboard/focus behavior chuẩn. Breadcrumb được render server-side.

GitHub Pages subpath:

- `site` lấy từ biến môi trường production đã document;
- `base` lấy từ repo name hoặc config explicit;
- mọi internal URL và asset URL MUST đi qua helper dựa trên `import.meta.env.BASE_URL`/Astro URL API;
- cấm hard-code root-relative `/assets/...` trong component hoặc content mới.

---

## 8. Build-time data pipeline

### 8.1 Pipeline

```text
load Markdown
  → parse frontmatter/body
  → validate schema
  → validate cross-record semantics
  → render static pages
  → emit records projection
  → emit graph projection
  → build Pagefind index
  → verify links and bundle budgets
```

### 8.2 Public projection

`records.json` chỉ chứa field cần cho client filter/map, không copy toàn body:

```ts
type PublicRecord = {
  id: string;
  title: string;
  href: string;
  domain: Domain;
  kind: RecordKind;
  summary: string;
  tags: string[];
  tier?: { scheme: string; level: number };
  date?: { from: string; to?: string; lower: number; upper: number };
  geo?: GeoPoint[];
};
```

Output MUST deterministic: sort by `id`, stable object field order where generator controls được, không ghi timestamp build vào JSON.

### 8.3 Graph projection

```ts
type GraphProjection = {
  nodes: Array<{ id: string; label: string; href: string; domain: Domain; kind: RecordKind }>;
  edges: Array<{ id: string; source: string; target: string; type: RelationType }>;
};
```

Edge ID deterministic từ `source + type + target`. Không tự tạo edge từ external link. Có thể tạo reverse traversal trong application layer nhưng không ghi relation ngược giả vào content.

### 8.4 Search

- Index title, summary, headings và body của published page.
- Không index nav/footer, draft, generated JSON hoặc duplicate legacy page sau migration.
- Vietnamese text phải giữ Unicode nguyên vẹn.
- Kết quả hiển thị title, excerpt, domain/kind và URL.
- Nếu JavaScript/search index load lỗi, trang Search hiển thị danh mục link theo domain thay vì màn hình trắng.

---

## 9. UI behavior

### 9.1 Reading experience

- Content width tối ưu cho đọc dài; bảng rộng có horizontal scroll.
- Heading có anchor link và visible focus.
- Mục lục desktop sticky, mobile collapsible.
- Code fence/ASCII diagram dùng font monospace và không làm tràn layout.
- External link có chỉ báo, dùng `rel="noopener noreferrer"` khi mở tab mới.
- Theme sáng/tối MAY có, nhưng không được chặn MVP.

### 9.2 Filter state

Canonical query params:

```text
q=<text>&domain=ufo&kind=incident&tierScheme=ufo-source-v1&tier=2&tag=radar&from=1990&to=2000
```

- Multi-select value lặp param, ví dụ `tag=radar&tag=foia`.
- Unknown/invalid param bị bỏ qua an toàn và không crash.
- “Clear filters” xóa facet nhưng giữ `q` chỉ khi người dùng chọn clear facets; “Reset all” xóa toàn bộ.
- Result count và active filters được thông báo qua accessible live region.

### 9.3 Map/timeline

- Chỉ render marker cho GeoPoint hợp lệ trong filtered set.
- Nhiều point của một record có thể tạo nhiều marker nhưng result count tính theo record unique.
- Marker cluster khi dữ liệu đủ lớn; cluster lib chỉ thêm sau khi đo nhu cầu.
- Không khẳng định exact location khi precision là city/region; popup hiển thị precision.
- Tile provider và attribution đặt trong config; không commit secret token.
- Timeline filter dùng normalized date bounds; record giao với selected range thì được giữ.

### 9.4 Graph

- Default giới hạn node hoặc theo domain để tránh “hairball”.
- Có list/table fallback biểu diễn cùng relations cho accessibility và mobile yếu.
- Node focus/selection hiển thị neighbors, relation label và link detail.
- Màu không phải tín hiệu duy nhất; dùng shape/label/legend.
- Reduced-motion tắt animation layout.

### 9.5 Dossier

Desktop >= 1024 px:

```text
┌──────────────────┬────────────────────────────┬──────────────────┐
│ timeline/sources │ document/body              │ relations/tags   │
└──────────────────┴────────────────────────────┴──────────────────┘
```

Mobile: body → sources/assets → related records. PDF viewer chỉ khởi tạo khi asset đi vào viewport hoặc người dùng bấm mở. Fallback link luôn có mặt trong HTML.

---

## 10. Accessibility, security, privacy và performance

### Accessibility

- WCAG 2.2 AA là target.
- Toàn bộ chức năng filter, menu, dialog, graph fallback dùng được bằng keyboard.
- Focus không bị mất sau filter/navigation.
- Form control có label thật; không dùng placeholder thay label.
- Contrast và touch target đạt chuẩn; hỗ trợ `prefers-reduced-motion`.

### Security

- Không cho raw HTML trong Markdown theo mặc định. Nếu legacy content cần HTML, phải sanitize bằng allowlist.
- Không inject frontmatter/body qua `innerHTML` ở client.
- External URLs được parse và allow protocol; `javascript:` bị reject.
- GitHub Actions dùng permission tối thiểu; dependency action pin theo major hoặc commit theo policy repo.
- Không có secret trong client bundle; map provider requiring secret không phù hợp v1.
- Thiết lập CSP khả thi với static site; nếu inline script của framework cản CSP nghiêm, ghi ADR và tối thiểu hóa `unsafe-*`.

### Privacy

- Không analytics/cookie ở v1.
- Nếu thêm analytics sau này, ưu tiên privacy-preserving, cập nhật privacy notice và spec.
- Không tải third-party iframe/PDF/tile trước khi route hoặc hành động người dùng cần đến.

### Performance budgets

- Content page initial JS target <= 50 KB gzip, không tính browser extension.
- Map/graph/PDF code không xuất hiện trong bundle của article thường.
- `records.json` target <= 500 KB gzip; vượt ngưỡng phải split theo domain hoặc route.
- Hình ảnh local dùng kích thước khai báo, lazy loading và format tối ưu.

---

## 11. Acceptance Criteria

### Nội dung và navigation

- **AC-001:** Given một legacy Markdown hợp lệ thuộc một trong 5 domain, when build hoàn tất, then có một route HTML đọc được với title, body, breadcrumb và canonical URL.
- **AC-002:** Given JavaScript bị tắt, when mở homepage/domain/article, then người dùng vẫn điều hướng và đọc toàn bộ nội dung cốt lõi.
- **AC-003:** Given content có bảng, blockquote, fenced code và Unicode tiếng Việt, when render, then không mất dữ liệu, không vỡ chiều ngang viewport 375 px.
- **AC-004:** Given repo deploy ở project subpath, when click internal link hoặc load local asset, then URL giữ đúng base path và không 404 vì root-relative path.

### Schema và validation

- **AC-010:** Duplicate `id` hoặc route slug làm command validate fail non-zero và báo cả hai file xung đột.
- **AC-011:** Unknown `targetId`, invalid geo/date/tier/source protocol làm validation fail với error code, file và field.
- **AC-012:** Published content trỏ draft hoặc local file/anchor không tồn tại làm CI fail.
- **AC-013:** Given cùng một commit content, two clean builds tạo projections giống byte-for-byte.

### Search và filter

- **AC-020:** Search một cụm tiếng Việt xuất hiện trong title/body trả về đúng published page và excerpt liên quan.
- **AC-021:** Kết hợp domain + kind + tag chỉ trả record thỏa tất cả nhóm facet; nhiều value trong cùng facet dùng OR.
- **AC-022:** Refresh hoặc copy URL search/filter khôi phục cùng query, facets và result set.
- **AC-023:** Invalid query params không crash, bị bỏ qua và UI phản ánh state hợp lệ.
- **AC-024:** Search index lỗi tải vẫn hiển thị fallback directory và thông báo có thể hành động.

### Map và timeline

- **AC-030:** Incident có geo/date hợp lệ xuất hiện trên map; record thiếu geo không tạo marker nhưng vẫn tồn tại trong directory/search.
- **AC-031:** Chọn date range giữ record có date range giao nhau và ẩn record không giao nhau.
- **AC-032:** Chọn marker hiển thị title, date, location precision và link canonical.
- **AC-033:** Tile attribution luôn hiển thị; map load failure không làm mất danh sách kết quả dạng text.

### Graph và dossier

- **AC-040:** Mỗi relation hợp lệ tạo đúng một edge deterministic giữa hai node tồn tại.
- **AC-041:** Filter graph theo domain/type cập nhật graph và accessible relation list cùng một tập dữ liệu.
- **AC-042:** Chọn node cho biết neighbor và relation type, có link tới record.
- **AC-043:** Dossier desktop có ba vùng theo thiết kế; ở mobile không horizontal overflow và thứ tự đọc đúng.
- **AC-044:** PDF same-origin hợp lệ mở lazy; PDF cross-origin/bị lỗi vẫn có metadata và link fallback.

### CI/CD và quality

- **AC-050:** Pull request chạy format/lint/typecheck/content validation/unit/build/E2E smoke; một bước fail thì không deploy.
- **AC-051:** Push nhánh mặc định sau khi checks pass deploy artifact tĩnh lên GitHub Pages bằng permissions tối thiểu.
- **AC-052:** Build không cần database, server runtime hoặc secret client-side.
- **AC-053:** Route mẫu đạt các Lighthouse threshold ở mục 1 và không có automated critical accessibility violation.

---

## 12. Test strategy và traceability

Tên test SHOULD chứa AC ID, ví dụ `AC-031-date-range-overlap.test.ts`.

| Test layer | Phạm vi | AC chính |
|---|---|---|
| Unit | date bounds, filter algebra, URL state, relation projection, tier rules | 011, 013, 021, 023, 031, 040 |
| Content contract | fixtures valid/invalid, duplicate ID, broken relation/link/asset | 010–012 |
| Component | filters, marker popup, graph list, PDF fallback, keyboard | 022–024, 032–044 |
| E2E | home → domain → article; search; map; graph; responsive dossier | 001–004, 020, 030–044 |
| Build/deploy | clean build, base path preview, projection snapshot | 004, 013, 050–052 |
| Lighthouse/a11y | representative home/article/explore route | 053 |

Required test fixtures:

- Unicode Vietnamese title/body;
- partial dates (`1947`, `1947-07`, full date);
- date range crossing selected window;
- coordinates at valid boundaries and out of bounds;
- two tier schemes with same numeric level but different meaning;
- missing relation target, duplicate ID, draft target;
- same-origin PDF, unreachable external PDF;
- base path `/ufo-data/`.

Không dùng snapshot lớn thay cho behavior assertions. Projections có thể golden-test vì determinism là contract.

---

## 13. CI/CD design

### Pull request job

```text
npm ci
→ format:check
→ lint
→ typecheck
→ content:validate
→ test:unit
→ build
→ test:e2e:smoke against built preview
→ lighthouse (representative routes)
```

### Deploy job

- Trigger push nhánh mặc định hoặc manual dispatch.
- Chỉ chạy sau quality job pass.
- Build một lần thành artifact Pages; upload/deploy bằng official GitHub Pages actions.
- Set `contents: read`, `pages: write`, `id-token: write` đúng job cần deploy.
- Dùng concurrency group để cancel deploy cũ, không để hai deploy ghi đè cạnh tranh.
- Không chạy Jekyll; artifact chứa site đã build.

### Local commands contract

```text
npm run dev
npm run validate
npm run test
npm run build
npm run preview
```

`npm run validate` MUST gom format check, lint, typecheck và content validation để maintainer có một entry point trước commit.

---

## 14. Migration và rollout

### Phase 0 — Baseline an toàn

- Ghi checksum/danh sách 22 Markdown hiện có.
- Chọn canonical title/slug/domain cho từng file.
- Tạo fixture kiểm tra Unicode, bảng, code fence và link.
- Không chỉnh prose nghiên cứu trong phase bootstrap.

### Phase 1 — Read-only publishing MVP

- Scaffold Astro static, design tokens, layout, navigation, routes.
- Migrate/wrap mọi legacy Markdown thành `articles` với minimal frontmatter.
- Render 5 domain, article detail, TOC, responsive table/code.
- Pagefind search, 404, base-path-safe links.
- GitHub Pages workflow và quality gates.

**Exit:** AC-001–004, AC-020, AC-024, AC-050–053 pass.

### Phase 2 — Structured records và filters

- Thêm record schema, tier scheme registry, semantic validators.
- Chuẩn hóa một vertical slice UFO: ít nhất một program, incident, person và concept; không split hàng loạt bằng heuristic.
- Tạo records projection, facets và URL state.
- Giữ legacy source page cho đến khi kiểm tra parity; dùng canonical/noindex hoặc redirect để tránh duplicate sau cutover.

**Exit:** AC-010–013, AC-021–023 pass.

### Phase 3 — Explore views

- Map + timeline từ projection.
- Knowledge graph + accessible list fallback.
- Dossier + PDF lazy/fallback.
- Performance profiling và split dataset nếu vượt budget.

**Exit:** AC-030–044, AC-053 pass trên route Explore.

### Phase 4 — Content normalization mở rộng

- Chuyển từng section đủ dữ kiện thành record nguyên tử có source và relations.
- Mỗi batch có checklist parity: heading/prose/source/table/anchor/redirect.
- Không dùng LLM để tự sinh date, coordinates, tier hoặc relation nếu nguồn không ghi rõ; giá trị chưa biết phải để thiếu và được UI xử lý.

---

## 15. Implementation tasks cho coding agent

Mỗi task phải kết thúc bằng code + test + cập nhật tài liệu liên quan. Không làm đồng thời migration nội dung hàng loạt và component phức tạp trong một PR.

### T-001 — Bootstrap và configuration

- Khởi tạo Astro static TypeScript strict, npm lockfile và scripts contract.
- Tạo `site.config` cho 5 domain và base URL.
- Thêm formatter/linter/typecheck/test skeleton.
- Verify clean install/build.

**Maps:** AC-004, AC-050, AC-052.

### T-002 — Content collections và migration tối thiểu

- Định nghĩa `articles` schema.
- Viết migration có dry-run, collision report và checksum.
- Đưa 22 file vào collection hoặc adapter rõ ràng; thêm minimal metadata không đổi prose.
- Test các Markdown construct đang có.

**Maps:** AC-001–003, AC-010.

### T-003 — Shell, routes và reading layout

- Homepage, domain page, article route, breadcrumb, TOC, 404.
- Responsive CSS, focus style, table/code overflow.
- Base-path helper và link validation.

**Maps:** AC-001–004.

### T-004 — Search

- Tích hợp Pagefind sau build.
- Search page, result card, URL `q`, no-JS/load-error fallback.
- Test tiếng Việt và exclusion rules.

**Maps:** AC-020, AC-022, AC-024.

### T-005 — Record domain model và validators

- Implement schema ở mục 6, partial-date parser, tier registry, relation validation.
- Tạo valid/invalid fixtures và actionable errors.
- Chuẩn hóa một vertical slice mẫu bằng dữ kiện có sẵn; không bịa metadata.

**Maps:** AC-010–013.

### T-006 — Projections và filter UI

- Generate deterministic `records.json` và `graph.json`.
- Implement pure filter/query functions trước, sau đó UI + URL state.
- Enforce tier scheme semantics và disclaimer.

**Maps:** AC-013, AC-021–023, AC-040.

### T-007 — Map và timeline

- Lazy Leaflet island, tile config/attribution, text result fallback.
- Date overlap filtering, marker popup và precision label.
- Test network failure và mobile layout.

**Maps:** AC-030–033.

### T-008 — Graph

- Lazy Cytoscape island, filter, legend, node detail.
- Accessible relations list dùng cùng application query.
- Reduced-motion và node cap.

**Maps:** AC-040–042.

### T-009 — Dossier/PDF

- Responsive three-column layout và mobile order.
- Lazy PDF.js cho local/same-origin assets; robust external fallback.
- Không proxy PDF qua backend.

**Maps:** AC-043–044.

### T-010 — CI, Pages và release verification

- PR quality workflow, Pages workflow, concurrency và permissions.
- Playwright base-path smoke, Lighthouse/a11y thresholds.
- Document repository Settings cần bật GitHub Pages Actions.

**Maps:** AC-050–053.

---

## 16. Definition of Done

Một task chỉ Done khi:

- requirement/AC liên quan không đổi hoặc spec đã được duyệt cập nhật trước;
- implementation không phá dependency boundaries;
- test mới map AC và pass local;
- `npm run validate`, `npm test`, `npm run build` pass;
- behavior keyboard/mobile/error state đã kiểm tra khi liên quan;
- không có metadata nghiên cứu do agent tự suy diễn;
- tài liệu command/config/migration được cập nhật;
- không còn TODO ẩn cho behavior bắt buộc của task.

Một release phase chỉ Done khi toàn bộ exit AC của phase pass trên artifact tĩnh, không chỉ dev server.

---

## 17. Risks và biện pháp

| Risk | Tác động | Mitigation |
|---|---|---|
| Monolithic docs không đủ metadata | Map/graph sai hoặc rỗng | Publish legacy trước; normalize thủ công theo vertical slice |
| Tier khác nghĩa giữa domain | Gây hiểu sai nhận thức | `tierScheme` bắt buộc, filter theo scheme, disclaimer cố định |
| Graph quá nhiều node | UI rối/chậm | Default filter, node cap, lazy load, list fallback |
| PDF/CORS bên ngoài | Viewer lỗi | Ưu tiên local legal asset; luôn có external link fallback |
| GitHub Pages subpath | Link/asset 404 | URL helper + E2E với `/ufo-data/` |
| Client JSON lớn dần | Tải chậm | Projection tối thiểu, gzip budget, split theo domain |
| Agent bịa metadata khi migration | Sai dữ liệu nghiên cứu | Unknown stays absent; review sources; validation không ép field không cần thiết |
| Dependency drift | Build không tái lập | lockfile, `npm ci`, Renovate/Dependabot tùy chọn |

---

## 18. Decisions còn mở và default được phép dùng

Các câu hỏi này không chặn Phase 1; nếu owner chưa quyết định, coding agent dùng default dưới đây và ghi config thay vì hard-code:

| Decision | Default |
|---|---|
| GitHub owner/repository URL | Lấy từ CI environment; local dùng `http://localhost` |
| Tên thương hiệu | `Knowledge Atlas` |
| Ngôn ngữ UI | Tiếng Việt; metadata sẵn đường mở rộng i18n nhưng chưa làm locale routes |
| Default theme | Theo system preference |
| Tile provider | OpenStreetMap public tiles cho dữ liệu nhỏ, đúng usage policy và attribution; đổi provider qua config |
| Analytics | Không có |
| Comment system | Không có |
| Raw HTML Markdown | Tắt |

Nếu một quyết định mở làm thay đổi schema, URL public, privacy hoặc chi phí vận hành, agent phải tạo ADR và yêu cầu owner xác nhận trước implementation tương ứng.

---

## 19. Quy tắc thay đổi spec

1. Bug implementation nhưng spec đúng: sửa code/test.
2. Test không phản ánh AC: sửa test, giữ AC.
3. Behavior mong muốn khác AC: sửa spec trước, ghi rationale, rồi sửa test/code.
4. Quyết định kiến trúc khó đảo ngược: thêm ADR trong `specs/adr/` và link từ đây.
5. Mọi AC mới phải có owner, test layer và task/PR triển khai.

Traceability tối thiểu:

```text
Business Requirement → Use Case → Entity/Rule → AC → Test → Code/PR
```

Nếu không lần ngược được chuỗi này, feature chưa đạt chuẩn SDD của repo.

# PHASE 1 implement plan

Hãy implement Phase 1 — Read-only Publishing MVP cho repository này.

## Trước khi bắt đầu:

Trước khi code, bắt buộc đọc đầy đủ:

1. AGENTS.md
2. specs/TECHNICAL-DESIGN.md
3. spec.md
4. 1.ai/best-practice/4-Spec-Driven-Development.md

## Task

Phạm vi lần này chỉ gồm các task:

- T-001 — Bootstrap và configuration
- T-002 — Content collections và migration tối thiểu
- T-003 — Shell, routes và reading layout
- T-004 — Search
- T-010 — Phần CI/GitHub Pages cần thiết để deploy Phase 1

## Mục tiêu cuối cùng:

- Website Astro static chạy được trên GitHub Pages.
- Hiển thị đầy đủ nội dung Markdown hiện có trong 5 domain.
- Homepage, domain pages, article pages, breadcrumb, TOC và trang 404 hoạt động.
- Có tìm kiếm Pagefind hỗ trợ tiếng Việt.
- Thêm file Markdown hợp lệ rồi push lên main sẽ tự động validate, build và deploy.
- Không cần chạy generate\_mkdocs\_nav.py hoặc generate menu thủ công.
- Tất cả internal link và asset phải hoạt động khi site nằm dưới GitHub Pages project subpath `/ufo-data/`.
- Nội dung chính vẫn đọc và điều hướng được khi JavaScript bị tắt.

## Các nguyên tắc bắt buộc:

- Không thay đổi hoặc viết lại prose nghiên cứu nếu không cần thiết.
- Không tự bịa frontmatter, date, tier, coordinate, relation hoặc nguồn.
- Không parse heading để tạo entity.
- Bảo toàn Unicode tiếng Việt, bảng, blockquote, code fence và ASCII diagram.
- Migration phải an toàn, có dry-run/checksum hoặc cơ chế kiểm tra parity.
- Không implement record normalization, filters nâng cao, map, graph hoặc PDF viewer trong lần này.
- Không thêm backend, database hoặc SSR.
- Test phải map tới Acceptance Criteria tương ứng trong technical design.
- Giữ nguyên mọi thay đổi không liên quan đang có trong workspace.

## Cách thực hiện:

1. Kiểm tra hiện trạng repository và lập implementation plan ngắn theo từng task/AC.
2. Implement lần lượt từng lát nhỏ, không dừng lại chỉ để trình bày plan.
3. Sau mỗi phần quan trọng, chạy verification phù hợp.
4. Cuối cùng chạy tối thiểu:
   - npm run validate
   - npm test
   - npm run build
5. Nếu có E2E/smoke test, chạy trên built preview với base path `/ufo-data/`.
6. Kiểm tra GitHub Actions workflow có thể tự build và deploy khi push lên main.

## Chỉ báo hoàn tất khi Phase 1 thực sự chạy được. Trong báo cáo cuối, liệt kê:

- Những gì đã implement
- File quan trọng đã tạo hoặc sửa
- Acceptance Criteria đã đáp ứng
- Các command/test đã chạy và kết quả
- Những phần cố ý để lại cho Phase 2/3
- Bất kỳ thông tin GitHub repository nào còn cần owner cấu hình thủ công

---

# Kết quả Agent chạy xong trả về:

Phase 1 đã chạy được trên artifact tĩnh, base path `/ufo-data/`. Agent trước đã scaffold gần xong rồi dừng ở bước Pagefind/preview; phần còn lại chủ yếu là plugin Markdown không rewrite link, thiếu ADR, và cổng Lighthouse/CI.

## Hiện trạng đã implement

**T-001 Bootstrap** — Astro 7 static, TypeScript strict, lockfile, `site.config` cho 5 domain, scripts `validate` / `test` / `build` / `preview`.

**T-002 Collections + migration** — 22 file Markdown được copy vào `src/content/articles/` qua `content-manifest.json`, checksum SHA-256, dry-run/`--write`/`--check`. Prose gốc không bị sửa.

**T-003 Shell + reading** — Homepage, 5 domain, article, breadcrumb, TOC, 404. Bảng/code cuộn ngang. Heading có id + permalink. HTML/CSS đọc được khi tắt JavaScript.

**T-004 Search** — Pagefind `--force-language vi`, URL `?q=`, result có title/excerpt/domain/kind/URL, fallback directory khi JS tắt hoặc index lỗi.

**T-010 CI/Pages** — `.github/workflows/pages.yml` chạy validate → unit → build → smoke `/ufo-data/` → Lighthouse → deploy Pages. `public/.nojekyll` có trong artifact. Git đã `init -b main` (chưa có remote/commit).

## File quan trọng

Tạo/sửa chính trong lượt này:

| File                                                  | Việc                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| `scripts/remark-content.mjs`                          | Đổi sang Sätteri visitor; rewrite `/assets` và legacy route; heading anchors |
| `astro.config.mjs`                                    | Gắn plugin Sätteri đúng API; bỏ highlight ASCII `txt`/`plaintext`            |
| `scripts/lighthouse-check.mjs`                        | AC-053: đo category scores, calibrate CPU chậm                               |
| `specs/adr/ADR-0001-astro-7-satteri-windows-build.md` | Astro 7 + loader filesystem + Sätteri + esbuild-wasm                         |
| `.github/workflows/pages.yml`                         | `pages: write` lúc upload artifact; Chrome cho Lighthouse                    |
| `src/pages/search.astro`                              | Card kết quả + không double-prefix base path                                 |
| `tests/unit/AC-004-base-path.test.ts`                 | Link PDF/legacy dưới `/ufo-data/`                                            |
| `tests/unit/AC-010-duplicate-id.test.ts`              | Fail-path duplicate id/route                                                 |
| `public/.nojekyll`                                    | Không chạy Jekyll                                                            |

Giữ nguyên prose trong `1.ai/`–`5.ling-tinh/` và bản migrate.

## Acceptance Criteria đã đáp ứng

| AC             | Kết quả                                                                            |
| -------------- | ---------------------------------------------------------------------------------- |
| **AC-001**     | 22 article HTML, title/body/breadcrumb/canonical                                   |
| **AC-002**     | E2E no-JS: home → UFO → Government Programs                                        |
| **AC-003**     | Unicode/table/blockquote/code; viewport 375px không tràn                           |
| **AC-004**     | Mọi `href`/`src` nội bộ dưới `/ufo-data/`; PDF = `/ufo-data/assets/...`            |
| **AC-010**     | Duplicate id/route fail và nêu cả hai file (article; schema record để Phase 2)     |
| **AC-020**     | Search tiếng Việt `"Spec đứng ở giữa"` ra đúng bài SDD                             |
| **AC-022**     | `?q=` restore query + results (facet filter là Phase 2)                            |
| **AC-024**     | Index lỗi → thông báo + directory link                                             |
| **AC-050–052** | Workflow quality-gate; static, không DB/SSR/secret                                 |
| **AC-053**     | Axe không serious/critical; Lighthouse a11y 1.00, BP ≥ 0.96, SEO 1.00, perf ≥ 0.88 |

## Commands đã chạy

```text
npm run validate     # format, lint, typecheck, content:validate — pass
npm test             # 10/10 unit — pass
npm run build        # 30 pages + Pagefind 22 documents + verify-build — pass
npm run test:e2e:smoke   # 10/10 desktop+mobile @ /ufo-data/ — pass
npm run test:lighthouse  # 3 route đại diện — pass
```

Typecheck còn 2 hint không chặn: `tseslint.config` deprecated, và `createRequire` trong script Lighthouse.

## Cố ý để lại Phase 2/3

- Record schema, semantic validators, `records.json` / `graph.json`
- Filter domain/kind/tag/tier + URL facets (AC-021, phần còn lại của AC-022)
- Map, timeline, graph, dossier, PDF.js
- Explore routes; header hiện “Khám phá · Phase 3”
- Chuẩn hóa UFO thành record nguyên tử

Không bịa frontmatter nghiên cứu, không parse heading thành entity, không thêm backend/SSR.

## Owner cần cấu hình thủ công trên GitHub

1. Tạo remote và push `main` (workspace vừa `git init`, chưa có commit/remote).
2. **Settings → Pages → Source: GitHub Actions**.
3. Default branch là `main`.
4. Không cần secret, Jekyll, hay `generate_mkdocs_nav.py`.

Sau đó: thêm Markdown hợp lệ (legacy: cập nhật `content-manifest.json` rồi `npm run content:migrate -- --write`; bài mới: file trong `src/content/articles/<domain>/` với `legacy: false`) → push `main` → CI validate/build/deploy. Preview local: `npm run preview` tại `http://localhost:4321/ufo-data/`.

# v0.1:

## Prompt Version: 0.1 (Grok)

Em làm những yêu cầu sau:

1. Update text sau:
khi vào trang này: https://pkduong.github.io/misc/

Ling
Tâm lý học, Tư duy phản biện, và các ghi chép khác.

thay bằng:

L.I.N.G — Life, Insights, Notes & Growth
Những lát cắt đời sống, tư duy con người và điều đọng lại sau từng trang sách, thước phim

làm tương tự:
https://pkduong.github.io/ai/
A.I — Artificial Intelligence & Future Cognition
Ranh giới ý thức máy, bước tiến AGI và tương lai của nhận thức nhân tạo.

https://pkduong.github.io/ufo/
U.F.O / UAP — Unidentified Anomalous Phenomena
Hồ sơ giải mật, hiện tượng dị thường trên bầu trời và những dấu vết vượt khỏi giới hạn khoa học thông thường.

https://pkduong.github.io/meta/
META — Metaphysics, Existence & Alternative Realities
Bản chất của tồn tại, giả thuyết mô phỏng và các chiều không gian vượt ngoài vật lý học thuần túy.

https://pkduong.github.io/psychic/
PSYCHIC — Parapsychology & Latent Mind
Khảo cứu cận tâm lý học, tri giác ngoại cảm và những chiều sâu chưa khai phá của tâm trí con người.

2. a mới đổi tên folder 5.linh-tinh -> 5.ling
và link hiện tại đang là /misc/ a muốn đổi thành /ling/
https://pkduong.github.io/misc/ -> https://pkduong.github.io/ling/

3. Em update tàil iệu README.md mô tả cấu trúc repo, toàn bộ tech stack của repo này, và including development guideline, vd hướng dẫn anh update những text ở mục 1 trang nào, và những thay đổi quan trọng khác thì phải sửa ở đâu

ngoài ra, e add thêm 1 bảng version tracking, hiện tại đang v0.1 mới khởi tạo, v0.2 a đang muốn update UI, và sửa text trang chính, cấu trúc menu, slogan,..

## Result v0.1

Tôi sẽ cập nhật text các trang chuyên mục, đổi /misc/ thành /ling/, rồi viết lại README kèm bảng version. Trước hết mình kiểm tra cấu hình site và cấu trúc hiện tại.
Tôi sẽ đổi misc → ling trên toàn bộ cấu hình/content, cập nhật slogan từng domain, rồi viết lại README.
Tiếp theo mình chạy validate/build và kiểm tra các route domain trong trình duyệt.

Đã xong cả 3 yêu cầu. Tóm tắt:

1. Copy tiêu đề / mô tả lĩnh vực\
   
Cập nhật trong src/site.config.ts (một nguồn cho trang chủ + /ai/, /ufo/, /meta/, /psychic/, /ling/):
| URL       | Tiêu đề mới                                           |
| :-------- | :---------------------------------------------------- |
| /ling/    | L.I.N.G — Life, Insights, Notes & Growth              |
| /ai/      | A.I — Artificial Intelligence & Future Cognition      |
| /ufo/     | U.F.O / UAP — Unidentified Anomalous Phenomena        |
| /meta/    | META — Metaphysics, Existence & Alternative Realities |
| /psychic/ | PSYCHIC — Parapsychology & Latent Mind                |

Menu Header dùng shortName: A.I, U.F.O, META, PSYCHIC, L.I.N.G.

2. /misc/ → /ling/
   
- Domain key: misc → ling
- Nguồn: 5.ling/ (đã rename)
- Articles: src/content/articles/ling/
- Đồng bộ: content.config.ts, content-manifest.json, migrate checksums, validate-content.mjs, e2e
- /misc/ giờ 404 (không có redirect)

3. README
   
README.md gồm: cấu trúc repo, tech stack, guideline “sửa text/UI ở đâu”, bảng version:

| Version | Nội dung                                           |
| :------ | :------------------------------------------------- |
| v0.1    | Khởi tạo                                           |
| v0.2    | Đang làm — UI, slogan, menu, /ling/, copy lĩnh vực |

Kiểm tra

- validate + unit tests + build: pass
- Playwright smoke (desktop + mobile): 10/10 pass
- Live preview: 5 domain pages + home đúng copy/nav; /misc/ = 404
  
Lưu ý: Chưa có browser MCP nên verify bằng Playwright smoke + fetch preview (không screenshot tay). Muốn lên production thì commit + push main để chạy workflow Validate and deploy GitHub Pages.

Preview cũ (t-7) đã tắt (exit 1 vì bị thay/stop sau đó). Không ảnh hưởng kết quả: build, smoke test và verify domain vẫn ổn.Preview t-13 cũng đã dừng sau bước verify — không còn việc gì cần xử lý.

# v0.11:

## Prompt v0.11 (Codex)

Em update code theo những yêuc cầu sau:

1. thay đổi slogan

thay vì là KA | Knowledge Atlas

PKD | Project Knowledge Disclosure
Đọc sâu. Tỉnh thức. Chạm vào vô định..


2. nâng cấp giao diện:

- tông màu xám/đen giữ nguyên đang như vậy ổn rùi
- font chữ tiêu đề và các font chữ chính như menu, nên dùng font chữ kiểu như trong các tài liệu mật của CIA, hình 4 đính kèm
- đồ hoạ, phong cách chung của trang web, em thiết kế làm sao người đọc cảm giác đang tham gia truy xuất vào việc giải mật kho dữ liệu cổ, dữ liệu bí truyền, nhìn cũ cũ cổ cổ, bị bôi đen này kia.. như hình 3 đính kèm

## Result v0.11

Đã cập nhật giao diện theo phong cách kho tài liệu giải mật:

- Đổi thương hiệu thành `PKD | Project Knowledge Disclosure`.
- Đổi slogan thành “Đọc sâu. Tỉnh thức. Chạm vào vô định..”.
- Áp dụng font máy chữ cho tiêu đề, menu và nhãn.
- Thêm khung tài liệu, mã lưu trữ, dấu “Declassified”, vệt bôi đen và texture scan nhẹ.
- Chuyển toàn bộ màu nhấn sang thang xám/đen.
- Giữ nội dung dài dễ đọc, responsive và hỗ trợ reduced motion.
- Đồng bộ metadata, header, footer, package và technical design.
- Không thêm font, hình ảnh hay dependency bên ngoài.

Các phần chính nằm tại [index.astro](D:\workspace\ufo-data\src\pages\index.astro:13), [global.css](D:\workspace\ufo-data\src\styles\global.css:240) và [site.config.ts](D:\workspace\ufo-data\src\site.config.ts:19).

Kiểm tra:

- Format, lint, typecheck: đạt.
- Unit test: 10/10 đạt.
- `npm run validate` bị chặn vì thư mục `5.ling-tinh` đang được đổi thành `5.ling` trong worktree nhưng validator vẫn tìm tên cũ.
- Build đi đến bước tạo static entrypoints rồi dừng do lỗi Windows `spawn EPERM` từ esbuild; vì vậy E2E chưa chạy được.
- Em không thay đổi các file đang được di chuyển giữa hai thư mục trên.

# v0.12:

## Prompt v0.12: (Codex, 4.6 Sol Light)

Yêu cầu: update code cho mục 1,2,3, còn mục 4 và 5 chỉ phân tích và làm tài liệu

1/ sắp xếp menu lại thứ tự (hình 1)

- UFO - META - PSYCHIC - AI - LING
- Link hover đổi màu ngược lại: nền trắng chữ đen
  - khi menu select cũng vậy, nền trắng chữ đen
- tương tự card bên dưới cũng sắp theo thứ tự trên
  - 3 card UFO - META - PSYCHIC, nằm trên
  - 2 card: AI - LING, nằm dưới

2/ Trang chủ, sửa tên danh mục lại (hình 1)

01 - A.I     : DANH MỤC NGUY HIỂM   
02 - UFO     : DANH MỤC ĐÃ GIẢI MẬT
03 - META    : DANH MỤC BẤT KHẢ TRI
04 - PSYCHIC : DANH MỤC DỊ BIỆT
05 - L.I.N.G : DANH MỤC NGOẠI BIÊN

3/ ở trang danh mục:

- 1/ thay chữ Lĩnh vực bằng với tên Danh mục.. ở trang chủ
- 4/ giống mục 1 Link hover, khi hover mouse lên link thì ô chữ nhật tô hết chiều dài chữ tô trắng, còn màu chữ thành màu đen

4/ version tracking log:

- **PKD · Project Knowledge Disclosure** — Markdown trong Git là nguồn dữ liệu gốc. &#x20;
  - dòng cuối cùng của trang web sẽ hiển thị current version&#x20;
  - **PKD · Project Knowledge Disclosure** — v0.1 — Changelog (link)
  - thêm 1 trang changelog.md để tracking 2 thứ:
    - version của trang web PDK (nó về code và tính năng)
      - hiện tại sẽ có 2 dòng:&#x20;
        - v0.0, initial project created | 18/9/2026
        - v0.1, update ui, text/menu, font size, theme, changelog | 19/9/2026
    - version của dữ liệu
      - v0.1: initial created ufo index, and LING draft | 18/9/2026
  - em thêm vào AGENT điều luật mới,&#x20;
    - khi implement version mới thì phải update file changelog này luôn
    - mỗi lần có thêm .md thì cũng sẽ tăng vesrion trong file changelog này

5/ giới thiệu khái niệm TAG (hình 2)

đây là tài liệu làm version 0.2, không implement, em phân tích và phản biện trước nhé
ý tưởng là có thêm 1 layer phân loại các bài viết theo Tags

- ở trang chủ:
  - dưới mỗi card, list ra top 10 tag có nhiều bài viết nhất
- ở trang danh mục: item 2, 3, 5 (hình 2)
  - 3/ sẽ có 1 ô tìm kiếm ở đây và 1 nút search,
  - 2/ kế đó sẽ là 1 list danh sách tag có nhiều bài nhất, tuỳ theo giao diên UI/UX mà tính ra list bào nhieu cái chỗ này, và list như nào, e phân tích và tư vấn thêm
  - 5/ dưới mỗi bài viết thì list out danh sách tag của bài viết đó.
  - tất nhiên phải làm tài liệu implement thiết kế quy chuẩn sinh ra tag và cập nhật lại tag vào các bài viết cũ, tổ chức tag ra sao.. cập nhật prompt cho các file như ufo.md, psychic.md, meta.md, để Agent viết bài tag cho mỗi mục index.

kết quả sẽ output ra 1 file: phase1-tag.md, viết theo chuẩn SDD như trong AGENT

6/ changelog-library feature:

ở tương lai, vd dụ 4 trang 01 -> 04 dưới folder ufo sẽ có thêm prompt để viết những bài những bài viết chi tiết cho từng mục index trong 4 file này, rồi public 1 tính năng changelog cho kho tàng thức có cập nhật bao nhiêu trang á, có 1 trang cập nhật lịch sử "kho tàng thức" này, em phân tích kỹ để làm tài liệu SDD cho version 0.3, phase1-changelog-library.md

## Result v0.12:

Đã hoàn tất đúng phạm vi Anh yêu cầu.

Phần code 1–3:

- Menu/card: `UFO → META → PSYCHIC → AI → LING`.
- Card trên: UFO, META, PSYCHIC; card dưới: AI, LING.
- Giữ mã danh mục cố định `01–05`, không đánh lại theo vị trí.
- Hover/selected menu và card: nền trắng, chữ đen.
- Nhãn danh mục mới được cấu hình tập trung tại [site.config.ts](D:\workspace\ufo-data\src\site.config.ts:27).
- Trang domain thay “Lĩnh vực” bằng đúng nhãn danh mục.
- Link bài viết hover/focus phủ nền trắng theo từng dòng chữ.
- Thêm test AC-002 bảo vệ thứ tự và mã danh mục.

Tài liệu tương lai, chưa implement:

- [phase1-version-tracking.md](D:\workspace\ufo-data\phase1-version-tracking.md:1): tách site version và data version; thiết kế footer, changelog, CI rule và điều luật AGENTS tương lai.
- [phase1-tag.md](D:\workspace\ufo-data\phase1-tag.md:1): schema/tag registry, top tag, search/filter, migration, prompt authoring, AC và phản biện.
- [phase1-changelog-library.md](D:\workspace\ufo-data\phase1-changelog-library.md:1): ledger cập nhật kho tri thức, data version, flow tạo bài chi tiết, route và validation.

Ling chưa sửa footer, chưa thêm `CHANGELOG.md`, chưa sửa AGENTS và chưa implement tag/library changelog.

Kiểm tra:

- `npm run validate`: pass.
- `npm test`: 11/11 pass.
- `npm run build`: vẫn bị chặn bởi lỗi môi trường Windows `spawn EPERM` của esbuild.

# v0.13:

## Prompt v0.13: (Codex, 4.6 Sol Light)

1. xử lý tiêu đề, cần thống nhất format của .md, nếu trong file .md có tiêu đề là # thì dùng là tựa đề còn khi hiển thị trong body thì ko cần nữa, e xem update code và cập nhật prompt nếu có nhé

2. 1 bug tại cột # trong bảng đính kèm, cần update code lúc gen ra html phải cho nó linh động thu hẹp vào, như vậy lúc xem trên đt, responsive sẽ dễ đọc hơn

## Result v0.13: (Codex, 4.6 Sol Light)

1. Ling đã cập nhật trang article cấp 3:

- Thu nhỏ tiêu đề còn cùng scale với trang cấp 1–2.
- Giảm padding header, khoảng cách tới nội dung và khoảng cách TOC/body.
- H1 đầu Markdown nếu trùng title canonical sẽ:
  - Được dùng làm tiêu đề trang.
  - Không render lặp lại trong body.
- 14 bài phù hợp đã được chuẩn hóa; 8 tài liệu legacy có H1 khác title được giữ nguyên để tránh mất nội dung.
- Cập nhật quy chuẩn viết bài trong [README.md](D:\workspace\ufo-data\README.md:145) và [TECHNICAL-DESIGN.md](D:\workspace\ufo-data\specs\TECHNICAL-DESIGN.md:104).
- Thêm test chống lặp tiêu đề tại [AC-001-content-manifest.test.ts](D:\workspace\ufo-data\tests\unit\AC-001-content-manifest.test.ts:49).

Các phần chính:

- [migrate-content.mjs](D:\workspace\ufo-data\scripts\migrate-content.mjs:32)
- [global.css](D:\workspace\ufo-data\src\styles\global.css:643)

Kiểm tra:

- `npm run validate`: pass.
- `npm test`: 12/12 pass.

Bản generated của bài `dont-believe-in-yourself` hiện bắt đầu trực tiếp bằng nội dung, không còn H1 bị lặp. Anh reload lại dev server; nếu Astro còn cache cũ thì dừng và chạy lại `npm run dev`.

2. Đã sửa bug cột `#`, Anh.

- Khi generate HTML, bảng có header đầu tiên là `#` sẽ tự nhận class chuyên biệt.
- Cột `#` co theo nội dung, tối thiểu khoảng `2.75rem`, thay vì `8rem`.
- Các bảng không có cột `#` không bị ảnh hưởng.
- Trên mobile bảng vẫn hỗ trợ cuộn ngang an toàn.

File chính:

- [remark-content.mjs](D:\workspace\ufo-data\scripts\remark-content.mjs:131)
- [global.css](D:\workspace\ufo-data\src\styles\global.css:817)
- [AC-003 test](D:\workspace\ufo-data\tests\unit\AC-003-markdown-constructs.test.ts:56)

Kiểm tra:

- `npm run validate`: pass.
- `npm test`: 13/13 pass.

# v0.14:

## Prompt v0.14:

1/ menu: PSYCHIC -> SOUL
2/ a cũng đã đổi tên thư mục 4.psychic thành 4.soul
đừng link e cũng update cho anh từ
[http://localhost:4321/ufo-data/psychic/](http://localhost:4321/ufo-data/psychic/)
thành
[http://localhost:4321/ufo-data/soul](http://localhost:4321/ufo-data/soul)

3/ câu slogan trang soul này thành như bên dưới nhé:

SOUL — Studies Of the [Unseen Life]
Khảo cứu cổ thư huyền học, cận tâm lý học thực nghiệm và những giới hạn chưa được giải mã của siêu thức con người. 

nhớ tô xám 2 từ [Unseen Life] nhé

## Result v0.14:

Đã đổi toàn bộ domain `PSYCHIC` thành `SOUL`, Anh:

- Menu và card: `SOUL`.
- Route mới: `/ufo-data/soul/`.
- Article mới: `/ufo-data/soul/articles/soul/`.
- Nguồn: `4.soul/soul.md`.
- Tiêu đề: `SOUL — Studies Of the Unseen Life`.
- Tô xám đúng cụm `Unseen Life`.
- Cập nhật mô tả mới theo yêu cầu.
- Đồng bộ schema, manifest, migration, validation, README, technical design và test.
- Giữ redirect:
  - `/psychic/` → `/soul/`
  - `/psychic/articles/psychic/` → `/soul/articles/soul/`

Các file chính:

- [site.config.ts](D:\workspace\ufo-data\src\site.config.ts:51)
- [domain page](D:\workspace\ufo-data\src\pages\[domain]\index.astro:30)
- [content-manifest.json](D:\workspace\ufo-data\content-manifest.json:155)
- [astro.config.mjs](D:\workspace\ufo-data\astro.config.mjs:22)

ID `ART-PSYCHIC-OVERVIEW` được giữ nguyên vì ID nội dung là khóa bất biến; nó không xuất hiện trên giao diện.

Kiểm tra:

- `npm run validate`: pass.
- `npm test`: 14/14 pass.
- `npm run build`: vẫn bị lỗi môi trường Windows `spawn EPERM` tại esbuild.
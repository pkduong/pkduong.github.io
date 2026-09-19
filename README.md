# PKD · Project Knowledge Disclosure

Website tĩnh (Astro) xuất bản kho Markdown nghiên cứu theo năm lĩnh vực. File nguồn trong `1.ufo/` … `5.ling/` là **source of truth**; bản trong `src/content/articles/` được migration có checksum, không đổi prose.

Site production: [https://pkduong.github.io/](https://pkduong.github.io/)

## Version tracking

| Version  | Trạng thái   | Nội dung chính                                                                                                                                                       |
| -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v0.1** | Đã phát hành | Khởi tạo repo Astro + GitHub Pages, migrate 22 tài liệu Markdown, search Pagefind, CI validate/test/deploy                                                           |
| **v0.2** | Đang làm     | Cập nhật UI trang chính, slogan/tagline, cấu trúc menu, đổi `/misc/` → `/ling/`, đổi tên thư mục `5.ling-tinh` → `5.ling`, viết lại copy tiêu đề/mô tả từng lĩnh vực |

## Tech stack

| Lớp              | Công nghệ                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Framework        | [Astro](https://astro.build/) 7 (static output)                                                         |
| Ngôn ngữ         | TypeScript (strict)                                                                                     |
| Markdown         | `@astrojs/markdown-satteri` + remark/rehype plugins trong `scripts/remark-content.mjs`                  |
| Content          | Astro Content Collections (`src/content.config.ts`)                                                     |
| Search           | [Pagefind](https://pagefind.app/) (index lúc build, `force-language vi`)                                |
| Style            | CSS thuần + biến CSS (`src/styles/global.css`), không Tailwind/UI kit                                   |
| Test             | Vitest (unit), Playwright (e2e/smoke), axe-core (a11y), Lighthouse CI                                   |
| Lint/format      | ESLint + Prettier (+ `prettier-plugin-astro`)                                                           |
| Runtime CI/local | Node `>=24 <25`, npm `>=11 <12`                                                                         |
| Hosting          | GitHub Pages qua Actions (`.github/workflows/pages.yml`) — **không** dùng Jekyll / Deploy from a branch |

Không có backend, database, SSR runtime, hay secret phía client.

## Cấu trúc repo

```text
ufo-data/
├── 1.ufo/ … 5.ling/         # Markdown nguồn (chỉnh sửa nội dung bài ở đây nếu legacy)
├── content-manifest.json    # Metadata kỹ thuật cho 22 bài legacy (id, slug, domain, order)
├── public/                  # Asset tĩnh (PDF, …)
├── scripts/
│   ├── migrate-content.mjs  # Sync nguồn → src/content/articles + checksum
│   ├── validate-content.mjs # Kiểm tra parity / link / manifest
│   ├── remark-content.mjs   # Plugin Markdown (base path, anchors, external links)
│   ├── verify-build.mjs     # Kiểm tra artifact sau build
│   └── lighthouse-check.mjs
├── specs/                   # TECHNICAL-DESIGN, ADR
├── src/
│   ├── site.config.ts       # ★ Tên site, tagline, menu domain, mô tả lĩnh vực
│   ├── content.config.ts    # Schema frontmatter bài viết (enum domain, …)
│   ├── content/articles/    # Bản đã migrate (theo domain key: ai|ufo|meta|soul|ling)
│   ├── components/          # Header, Footer, ArticleCard, Breadcrumbs, TOC
│   ├── layouts/BaseLayout.astro
│   ├── lib/                 # articles.ts, url.ts (withBase), loaders
│   ├── pages/
│   │   ├── index.astro      # Trang chủ (hero đọc từ siteConfig)
│   │   ├── search.astro
│   │   ├── 404.astro
│   │   └── [domain]/       # /ai/, /ufo/, /meta/, /soul/, /ling/
│   └── styles/global.css
├── tests/                   # unit + e2e
├── astro.config.mjs         # base path, site URL, markdown pipeline
└── package.json
```

### Domain → URL → thư mục nguồn

| Key (URL) | Thư mục nguồn | Tiêu đề hiển thị (tóm tắt)                            |
| --------- | ------------- | ----------------------------------------------------- |
| `/ufo/`   | `1.ufo/`      | U.F.O / UAP — Unidentified Anomalous Phenomena        |
| `/meta/`  | `2.meta/`     | META — Metaphysics, Existence & Alternative Realities |
| `/ai/`    | `3.ai/`       | A.I — Artificial Intelligence & Future Cognition      |
| `/soul/`  | `4.soul/`     | SOUL — Studies Of the Unseen Life                     |
| `/ling/`  | `5.ling/`     | L.I.N.G — Life, Insights, Notes & Growth              |

> Trước v0.2: domain này là `/misc/` + thư mục `5.ling-tinh/`. Redirect cũ không có — URL `/misc/` sẽ 404 sau khi deploy.

## Chạy local

```bash
npm ci
npm run dev
```

Build local mặc định dùng `BASE_PATH=/ufo-data` (xem `.env` / `astro.config.mjs`). Repo dạng `username.github.io` trên CI set `BASE_PATH=/`.

Cổng chất lượng (cùng contract với CI):

```bash
npm run validate
npm test
npm run build
npm run test:e2e:smoke
```

| Script                               | Việc                                                     |
| ------------------------------------ | -------------------------------------------------------- |
| `npm run content:migrate`            | Xem trước migration                                      |
| `npm run content:migrate -- --write` | Ghi `src/content/articles/` + `migration-checksums.json` |
| `npm run content:validate`           | Validate nội dung / parity                               |
| `npm run build`                      | Astro build + Pagefind + `verify-build.mjs`              |
| `npm run preview`                    | Xem bản build                                            |

## Development guidelines — sửa gì ở đâu

### 1) Đổi tiêu đề / mô tả lĩnh vực trên trang chủ và trang domain (`/ai/`, `/ling/`, …)

**Sửa một chỗ:** [`src/site.config.ts`](src/site.config.ts)

- `domains[].name` → tiêu đề lớn (H1 trên `/ai/`, card trên trang chủ)
- `domains[].description` → đoạn mô tả dưới tiêu đề
- `domains[].shortName` → nhãn trên menu Header
- `domains[].key` → đoạn URL (`ling` → `/ling/`) — đổi key phải đồng bộ schema + manifest + thư mục articles (xem mục 3)
- `siteConfig.tagline` → H1 trang chủ
- `siteConfig.name` / `shortName` / `description` → brand Header/Footer và meta mặc định

Trang [`src/pages/index.astro`](src/pages/index.astro) và [`src/pages/[domain]/index.astro`](src/pages/[domain]/index.astro) **đọc từ `siteConfig`** — không hard-code slogan domain trong các file trang.

### 2) Đổi UI / layout / CSS

| Muốn đổi                      | File                                             |
| ----------------------------- | ------------------------------------------------ |
| Header / nav                  | `src/components/Header.astro`                    |
| Footer                        | `src/components/Footer.astro`                    |
| Card bài viết                 | `src/components/ArticleCard.astro`               |
| Layout chung, `<title>`, meta | `src/layouts/BaseLayout.astro`                   |
| Màu, typography, spacing      | `src/styles/global.css`                          |
| Hero / khối domain trang chủ  | `src/pages/index.astro` (+ CSS global liên quan) |

### 3) Đổi tên domain / URL (ví dụ `misc` → `ling`)

Phải sửa đồng bộ:

1. `src/site.config.ts` — `domainKeys` + `key` + `sourceDirectory`
2. `src/content.config.ts` — enum `domain` trong schema
3. `content-manifest.json` — `domain` + `sourcePath` của bài liên quan
4. Thư mục nguồn `5.…` và `src/content/articles/<key>/`
5. `scripts/validate-content.mjs` — danh sách thư mục domain
6. Chạy `npm run content:migrate -- --write`
7. Cập nhật test e2e nếu assert text/URL cũ (`tests/e2e/`)

### 4) Thêm / sửa bài Markdown

**Bài legacy** (đang nằm trong `1.ufo/` … `5.ling/`):

1. Sửa file nguồn trong thư mục domain gốc
2. Nếu bài mới: thêm dòng vào `content-manifest.json` (`id`, `slug`, `domain`, `order`, `sourcePath`, `title`)
3. File nguồn SHOULD bắt đầu bằng đúng một H1 (`# Tựa đề`) trùng tuyệt đối với `title` trong manifest. Migration dùng H1 này làm tựa đề trang và loại bản lặp khỏi body; H1 legacy khác title được giữ nguyên để không mất dữ liệu.
4. `npm run content:migrate -- --write`
5. `npm run validate && npm test && npm run build`

**Bài mới không legacy:** thêm file vào `src/content/articles/<domain>/` với frontmatter hợp lệ (`legacy: false`, `summary`, `tags`, `updatedAt`). Route tự sinh từ collection.

### 5) Base path & deploy

- Local/project mặc định: `BASE_PATH=/ufo-data`
- User site `pkduong.github.io`: CI set `BASE_PATH=/`
- Mọi link nội bộ phải qua `withBase()` (`src/lib/url.ts`) — không hard-code `/ufo-data/` hay `/misc/`

GitHub Pages:

1. **Settings → Pages → Source: GitHub Actions** (không Deploy from a branch)
2. Theo dõi workflow **Validate and deploy GitHub Pages** (`.github/workflows/pages.yml`)
3. Bỏ qua workflow Jekyll mặc định **pages build and deployment** nếu còn sót trong lịch sử Environments

Chi tiết kiến trúc: [`specs/TECHNICAL-DESIGN.md`](specs/TECHNICAL-DESIGN.md). ADR Windows/Astro 7: [`specs/adr/ADR-0001-astro-7-satteri-windows-build.md`](specs/adr/ADR-0001-astro-7-satteri-windows-build.md). Quy tắc cho agent: [`AGENTS.md`](AGENTS.md).

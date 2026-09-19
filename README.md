# Knowledge Atlas — Phase 1

Website Astro tĩnh xuất bản 22 tài liệu Markdown trong năm domain. File nguồn trong `1.ai/` đến `5.ling-tinh/` vẫn là source of truth; bản trong `src/content/articles/` được tạo bằng migration có checksum và không thay đổi prose.

## Chạy local

Yêu cầu Node 24 và npm 11.

```bash
npm ci
npm run dev
```

Các cổng chất lượng dùng cùng contract với CI:

```bash
npm run validate
npm test
npm run build
npm run test:e2e:smoke
```

Build local mặc định dùng base path `/ufo-data/`. Có thể đổi bằng `BASE_PATH`; `SITE_URL` phải là origin public, không kèm base path.

## Thêm hoặc cập nhật Markdown

Với bài mới, thêm file có frontmatter hợp lệ trực tiếp vào `src/content/articles/<domain>/` với `legacy: false`, `summary`, `tags` và `updatedAt`. Route và menu được tạo tự động từ content collection; không chạy script generate menu.

Với 22 tài liệu legacy còn được duy trì ở năm thư mục gốc:

1. Giữ file nguồn trong một trong năm thư mục domain.
2. Nếu là file legacy mới, thêm metadata kỹ thuật tường minh vào `content-manifest.json`; không suy diễn metadata nghiên cứu.
3. Xem trước migration: `npm run content:migrate`.
4. Ghi bản collection: `npm run content:migrate -- --write`.
5. Chạy `npm run validate`, `npm test`, `npm run build`.

Migration báo collision ID/route, tạo `src/content/migration-checksums.json`, và validation sẽ fail nếu body bản migrate khác nguồn.

## GitHub Pages

Quyết định Windows/Astro 7 nằm ở [`specs/adr/ADR-0001-astro-7-satteri-windows-build.md`](specs/adr/ADR-0001-astro-7-satteri-windows-build.md).

Workflow `.github/workflows/pages.yml` validate, test, build, smoke-test dưới project subpath, chạy Lighthouse rồi mới deploy khi push `main`.

Owner cần cấu hình một lần trong repository:

1. Vào **Settings → Pages → Build and deployment**.
2. Chọn **Source: GitHub Actions** (không dùng Deploy from a branch / Jekyll).
3. Bảo đảm default branch là `main` (hoặc cập nhật trigger workflow nếu dùng branch khác).
4. Trong tab **Actions**, theo dõi workflow **Validate and deploy GitHub Pages** — bỏ qua workflow **pages build and deployment** (Jekyll mặc định của GitHub).

Repo dạng `username.github.io` được deploy ở domain root (`BASE_PATH=/`). Repo project khác dùng base `/<tên-repo>/`.

Không cần secret, backend, database, Jekyll hay script generate menu thủ công.

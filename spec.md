## Overview

Tôi muốn tạo ra một trang web tĩnh file .md tận dụng Github Page, chứa 5 đề mục thông tin như 5 folder đánh số 1 -> 5

## Tổ chức trên GitHub Pages và phát triển UI/UX động

**Hoàn toàn CÓ THỂ** xây dựng các tính năng tương tác sâu (Bản đồ, Graph, Lọc) trên một trang web tĩnh (Static Site) lưu bằng file `.md` trên GitHub Pages. Đây gọi là kiến trúc **Jamstack** (JavaScript, APIs, Markup).

Khuyến nghị bạn KHÔNG dùng Jekyll (mặc định của GitHub) vì nó cũ và khó tùy biến UI phức tạp. Hãy dùng **Astro** hoặc **Quartz (Obsidian)** – các Static Site Generator cực kỳ mạnh mẽ hiện nay.

### 1. Cách tổ chức Cấu trúc thư mục (Markdown Structure)

Dữ liệu database của bạn bây giờ chính là các file `.md`. Mọi thông tin phân loại sẽ nằm ở phần **YAML Frontmatter** (phần trên cùng của file markdown).

Ví dụ file `content/incidents/varginha-1996.md`:

```yaml
---
id: "INC-1996-01"
title: "Sự kiện Varginha"
date: "1996-01-20"
location: [-21.55, -45.43] # Tọa độ để đưa lên bản đồ
tier: 2 # Multi-Witness & Press Records
source_type: ["press", "military_whistleblower"]
related_entities: ["Brazilian_Air_Force", "James_Fox", "Moment_of_Contact"]
tags: ["crash_retrieval", "biological_entity"]
---

**Mô tả sự kiện:**
Vào ngày 20/1/1996, nhiều nhân chứng tại Varginha báo cáo...

**Bằng chứng:**
[Link nhúng nguồn tin hoặc link youtube]

```

### 2. Viết code bổ sung các tính năng UI/UX động trên trang tĩnh ra sao?

Vì GitHub Pages không có server chạy database thật (như PostgreSQL), ta sẽ giải quyết bằng cách: **Gộp toàn bộ Frontmatter thành 1 file JSON tĩnh khi Build web, sau đó dùng JavaScript ở phía Client (Trình duyệt) để xử lý.**

* **Interactive Geospatial & Timeline Slider:**
* *Cách làm:* Khi build, hệ thống gom tất cả biến `location` và `date` từ các file `.md` thành `map-data.json`.
* *UI:* Dùng thư viện **Leaflet.js** hoặc **Mapbox GL JS** load file JSON này hiển thị lên bản đồ. Dùng **noUiSlider** làm thanh trượt thời gian. Khi kéo thanh trượt, JavaScript ẩn/hiện các marker trên bản đồ tương ứng với mốc thời gian.


* **Bộ lọc Phổ bằng chứng (Credibility Filter):**
* *Cách làm:* Các thẻ HTML (div/article) chứa danh sách bài viết sẽ được gắn thuộc tính data, ví dụ: `<div class="incident-card" data-tier="1">`.
* *UI:* Tạo các nút Toggle (Tier 1, Tier 2...). Dùng Javascript thuần lắng nghe sự kiện click -> gán CSS `display: none` cho các thẻ không khớp Tier. Cực kỳ mượt và tức thì vì không cần gọi server.


* **Dossier Workspace (Giao diện 3 cột):**
* *Cách làm:* Sử dụng **CSS CSS Grid (`display: grid; grid-template-columns: 1fr 2fr 1fr;`)**.
* *UI:*
* Cột trái: Danh sách Timeline (đọc từ Markdown content).
* Cột giữa: Nhúng thư viện **PDF.js** của Mozilla để hiển thị tài liệu FOIA ngay trên trình duyệt mà không cần tải về.
* Cột phải: Hiển thị các `related_entities` dưới dạng tag có thể click được.


* **Knowledge Graph (Sơ đồ mạng lưới quan hệ):**
* *Cách làm:* Nếu bạn dùng bộ công cụ **Quartz** (được tối ưu hóa cho Markdown/Obsidian), nó đã **có sẵn tính năng Graph View**. Nó tự động quét các liên kết giữa các file `.md` (ví dụ file sự kiện Varginha link tới file Tướng quân đội Brazil) và vẽ ra mạng lưới.
* *Nếu tự code:* Lấy file JSON tổng hợp chứa các `related_entities` nạp vào thư viện **Force-Graph (d3-force)** hoặc **Vis.js Network**. Mạng lưới sẽ hiển thị dưới dạng các node (chấm tròn) nối với nhau bằng các đường thẳng động đậy rất đẹp mắt và chuyên nghiệp.


## Khởi tạo dự án

Khởi tạo 1 project **Astro** hoặc **Quartz**, đẩy lên GitHub Repositories. Thiết lập GitHub Actions: Cứ mỗi khi bạn push file `.md` mới lên, GitHub tự động build trang HTML, gom metadata thành file JSON và publish ra giao diện web.
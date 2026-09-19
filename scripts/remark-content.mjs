export const legacyRouteMap = new Map([
  ['/ai/2026/04/01/ai-tools-for-engineers.html', 'ai/articles/1-llm-gpt-full/'],
  [
    '/ai/2026/04/02/ai-vs-traditional-programming.html',
    'ai/articles/2-ai-vs-traditional-programming/',
  ],
]);

export function normalizeBase(base) {
  const value = base.startsWith('/') ? base : `/${base}`;
  return value === '/' ? '/' : `${value.replace(/\/+$/, '')}/`;
}

export function withBase(base, path) {
  return `${normalizeBase(base)}${path.replace(/^\/+/, '')}`.replace(
    /(?<!:)\/{2,}/g,
    '/',
  );
}

export function rewriteInternalUrl(base, url) {
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) {
    return url;
  }

  const [pathname, hash = ''] = url.split('#');
  const [path, query = ''] = pathname.split('?');
  const mapped = legacyRouteMap.get(path) || path;
  const prefixed = withBase(base, mapped);
  return `${prefixed}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

function uniqueSlug(text, seen) {
  const base =
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}\p{M}-]+/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'section';
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

export function remarkBasePathLinks(options = {}) {
  const base = options.base || '/';
  const rewrite = (node, ctx) => {
    if (typeof node.url !== 'string') return;
    const next = rewriteInternalUrl(base, node.url);
    if (next !== node.url) ctx.setProperty(node, 'url', next);
  };

  return {
    name: 'base-path-links',
    link: rewrite,
    image: rewrite,
  };
}

export function remarkEscapeRawHtml() {
  return {
    name: 'escape-raw-html',
    html(node, ctx) {
      ctx.replaceNode(node, { type: 'text', value: node.value ?? '' });
    },
  };
}

export function rehypeExternalLinks() {
  return {
    name: 'external-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;
        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', 'noopener noreferrer');
      },
    },
  };
}

export function rehypeHeadingAnchors() {
  const seen = new Map();
  return {
    name: 'heading-anchors',
    before() {
      seen.clear();
    },
    element: {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      visit(node, ctx) {
        const existingId = node.properties?.id;
        const slug =
          typeof existingId === 'string' && existingId
            ? existingId
            : uniqueSlug(ctx.textContent(node), seen);
        if (typeof existingId !== 'string' || !existingId) {
          ctx.setProperty(node, 'id', slug);
        }
        ctx.appendChild(node, {
          type: 'element',
          tagName: 'a',
          properties: {
            className: ['heading-anchor'],
            href: `#${slug}`,
            ariaLabel: 'Liên kết tới đề mục',
          },
          children: [],
        });
      },
    },
  };
}

function firstTableHeader(table) {
  const head = table.children?.find(
    (child) => child.type === 'element' && child.tagName === 'thead',
  );
  const row = head?.children?.find(
    (child) => child.type === 'element' && child.tagName === 'tr',
  );
  return row?.children?.find(
    (child) => child.type === 'element' && child.tagName === 'th',
  );
}

export function rehypeCompactIndexTables() {
  return {
    name: 'compact-index-tables',
    element: {
      filter: ['table'],
      visit(node, ctx) {
        const firstHeader = firstTableHeader(node);
        if (!firstHeader || ctx.textContent(firstHeader).trim() !== '#') return;
        ctx.setProperty(node, 'className', ['has-compact-index']);
      },
    },
  };
}

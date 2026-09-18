import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const base = `${(process.env.BASE_PATH || '/ufo-data').replace(/\/+$/, '')}/`;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

const manifest = JSON.parse(
  await readFile(join(root, 'content-manifest.json'), 'utf8'),
);
const expected = [
  join(dist, 'index.html'),
  join(dist, '404.html'),
  join(dist, 'search', 'index.html'),
  ...manifest.map((item) =>
    join(dist, item.domain, 'articles', item.slug, 'index.html'),
  ),
];
const missing = [];
for (const path of expected) {
  if (!(await exists(path))) missing.push(path.slice(dist.length + 1));
}
if (!(await exists(join(dist, 'pagefind', 'pagefind.js'))))
  missing.push('pagefind/pagefind.js');
if (missing.length)
  throw new Error(`BUILD_OUTPUT_MISSING: ${missing.join(', ')}`);

const htmlFiles = (await walk(dist)).filter((path) => path.endsWith('.html'));
const invalid = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const url = match[1];
    if (!url.startsWith(base))
      invalid.push(`${file.slice(dist.length + 1)} -> ${url}`);
  }
  if (/javascript:/i.test(html))
    invalid.push(`${file.slice(dist.length + 1)} -> unsafe protocol`);
}
if (invalid.length)
  throw new Error(`BUILD_BASE_PATH_INVALID:\n${invalid.join('\n')}`);

const unicodePage = await readFile(
  join(
    dist,
    'ai',
    'articles',
    'best-practice-4-spec-driven-development',
    'index.html',
  ),
  'utf8',
);
if (
  !unicodePage.includes(
    'Spec Driven Development: Cách Team Engineering Hiện Đại Làm Việc Với AI',
  )
) {
  throw new Error('BUILD_UNICODE_LOST: Vietnamese article title is missing.');
}

console.log(
  `Verified ${expected.length} required pages, ${htmlFiles.length} HTML files, Pagefind, Unicode, and base path ${base}.`,
);

import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMigrationPlan, checkMigration } from './migrate-content.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const domainDirectories = ['1.ufo', '2.meta', '3.ai', '4.soul', '5.ling'];
const allowedLegacyRoutes = new Set([
  '/ai/2026/04/01/ai-tools-for-engineers.html',
  '/ai/2026/04/02/ai-vs-traditional-programming.html',
]);

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

function relative(path) {
  return path.slice(root.length + 1).replaceAll('\\', '/');
}

function pushError(errors, code, file, field, value, fix) {
  errors.push(`${code} | ${file} | ${field}=${JSON.stringify(value)} | ${fix}`);
}

function extractLinks(markdown) {
  return [...markdown.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map((match) =>
    match[1].trim(),
  );
}

function frontmatterValue(markdown, key) {
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  if (!frontmatter) return undefined;
  const raw = frontmatter
    .match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]
    ?.trim();
  if (!raw) return undefined;
  return raw.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, '$1$2');
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const errors = [];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const sourceFiles = (
    await Promise.all(
      domainDirectories.map(async (directory) =>
        (await walk(join(root, directory))).filter(
          (file) => extname(file) === '.md',
        ),
      ),
    )
  ).flat();

  const manifest = JSON.parse(
    await readFile(join(root, 'content-manifest.json'), 'utf8'),
  );
  const sourceSet = new Set(sourceFiles.map(relative));
  const manifestSet = new Set(manifest.map((item) => item.sourcePath));

  if (sourceFiles.length !== 22) {
    pushError(
      errors,
      'CONTENT_SOURCE_COUNT',
      '.',
      'markdownFiles',
      sourceFiles.length,
      'Expected 22.',
    );
  }
  for (const path of sourceSet) {
    if (!manifestSet.has(path)) {
      pushError(
        errors,
        'CONTENT_MANIFEST_MISSING',
        path,
        'sourcePath',
        path,
        'Add it to content-manifest.json.',
      );
    }
  }
  for (const path of manifestSet) {
    if (!sourceSet.has(path)) {
      pushError(
        errors,
        'CONTENT_SOURCE_MISSING',
        path,
        'sourcePath',
        path,
        'Restore the source or remove the manifest entry.',
      );
    }
  }

  const collectionFiles = (
    await walk(join(root, 'src', 'content', 'articles'))
  ).filter((file) => extname(file) === '.md');
  const seenIds = new Map();
  const seenRoutes = new Map();
  for (const file of collectionFiles) {
    const markdown = await readFile(file, 'utf8');
    const id = frontmatterValue(markdown, 'id');
    const domain = frontmatterValue(markdown, 'domain');
    const slug = frontmatterValue(markdown, 'slug');
    if (!id || !domain || !slug) {
      pushError(
        errors,
        'CONTENT_REQUIRED_FIELD',
        relative(file),
        'frontmatter',
        { id, domain, slug },
        'Add id, domain and slug; Astro schema validates the remaining fields.',
      );
      continue;
    }
    const priorId = seenIds.get(id);
    if (priorId) {
      pushError(
        errors,
        'CONTENT_DUPLICATE_ID',
        relative(file),
        'id',
        id,
        `Also used by ${priorId}. Choose a globally unique immutable ID.`,
      );
    }
    seenIds.set(id, relative(file));

    const route = `${domain}/articles/${slug}`;
    const priorRoute = seenRoutes.get(route);
    if (priorRoute) {
      pushError(
        errors,
        'CONTENT_DUPLICATE_ROUTE',
        relative(file),
        'slug',
        route,
        `Also used by ${priorRoute}. Choose a unique domain/slug route.`,
      );
    }
    seenRoutes.set(route, relative(file));
  }

  const corpus = [];
  for (const file of sourceFiles) {
    const bytes = await readFile(file);
    let markdown;
    try {
      markdown = decoder.decode(bytes);
    } catch {
      pushError(
        errors,
        'CONTENT_INVALID_UTF8',
        relative(file),
        'encoding',
        'non-UTF-8',
        'Save as UTF-8.',
      );
      continue;
    }
    corpus.push(markdown);

    for (const target of extractLinks(markdown)) {
      if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
      if (/^(?:javascript:|data:|vbscript:)/i.test(target)) {
        pushError(
          errors,
          'CONTENT_UNSAFE_URL',
          relative(file),
          'link',
          target,
          'Use https or a local path.',
        );
        continue;
      }
      if (target.startsWith('/assets/')) {
        const asset = join(
          root,
          'public',
          target.replace(/^\/assets\//, 'assets/'),
        );
        if (!(await pathExists(asset))) {
          pushError(
            errors,
            'CONTENT_ASSET_MISSING',
            relative(file),
            'link',
            target,
            'Add the public asset.',
          );
        }
        continue;
      }
      if (target.startsWith('/')) {
        if (!allowedLegacyRoutes.has(target)) {
          pushError(
            errors,
            'CONTENT_ROUTE_UNKNOWN',
            relative(file),
            'link',
            target,
            'Add an explicit legacy route mapping.',
          );
        }
        continue;
      }
      const localPath = resolve(dirname(file), target.split('#')[0]);
      if (!(await pathExists(localPath))) {
        pushError(
          errors,
          'CONTENT_LOCAL_LINK_MISSING',
          relative(file),
          'link',
          target,
          'Fix the relative path.',
        );
      }
    }
  }

  const allMarkdown = corpus.join('\n');
  const requiredConstructs = [
    ['Unicode tiếng Việt', /[ăâđêôơưĂÂĐÊÔƠƯ]/u],
    ['table', /^\|.+\|$/m],
    ['blockquote', /^>\s/m],
    ['fenced code', /^```/m],
  ];
  for (const [name, pattern] of requiredConstructs) {
    if (!pattern.test(allMarkdown)) {
      pushError(
        errors,
        'CONTENT_FIXTURE_MISSING',
        '.',
        'construct',
        name,
        'Keep a representative construct in the corpus.',
      );
    }
  }

  try {
    await checkMigration(await buildMigrationPlan());
  } catch (error) {
    pushError(
      errors,
      'CONTENT_MIGRATION_PARITY',
      '.',
      'migration',
      error instanceof Error ? error.message : String(error),
      'Run npm run content:migrate -- --write and review the diff.',
    );
  }

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(
    `Validated ${sourceFiles.length} UTF-8 legacy files, ${collectionFiles.length} collection entries, links, constructs, uniqueness, and migration parity.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});

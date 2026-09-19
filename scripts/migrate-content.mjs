import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'content-manifest.json');
const outputRoot = join(root, 'src', 'content', 'articles');
const checksumPath = join(root, 'src', 'content', 'migration-checksums.json');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: '', body: source };
  return {
    frontmatter: match[1],
    body: source.slice(match[0].length),
  };
}

function hasYamlKey(frontmatter, key) {
  return new RegExp(`^${key}:`, 'm').test(frontmatter);
}

function yamlString(value) {
  return JSON.stringify(value);
}

function normalizeMatchingTitleHeading(body, title) {
  const match = body.match(
    /^(?:\uFEFF)?[ \t]{0,3}#[ \t]+([^\r\n]+)(?:\r?\n|$)/,
  );
  if (!match || match[1].trim() !== title) {
    return { body, titleH1Removed: false };
  }

  const withoutHeading = body.slice(match[0].length);
  return {
    body: withoutHeading.replace(/^[ \t]*\r?\n/, ''),
    titleH1Removed: true,
  };
}

function destinationFor(item) {
  return join(outputRoot, item.domain, `${item.slug}.md`);
}

function renderArticle(item, original) {
  const { frontmatter, body: sourceBody } = splitFrontmatter(original);
  const { body, titleH1Removed } = normalizeMatchingTitleHeading(
    sourceBody,
    item.title,
  );
  const generated = [
    `id: ${yamlString(item.id)}`,
    ...(hasYamlKey(frontmatter, 'title')
      ? []
      : [`title: ${yamlString(item.title)}`]),
    `slug: ${yamlString(item.slug)}`,
    `domain: ${yamlString(item.domain)}`,
    'kind: "article"',
    ...(hasYamlKey(frontmatter, 'language') ? [] : ['language: "vi"']),
    'status: "published"',
    `order: ${item.order}`,
    `sourcePath: ${yamlString(item.sourcePath)}`,
    'legacy: true',
  ];

  const combinedFrontmatter = [...generated, frontmatter]
    .filter(Boolean)
    .join('\n');
  return {
    content: `---\n${combinedFrontmatter}\n---\n${body}`,
    body,
    sourceFrontmatter: frontmatter,
    titleH1Removed,
  };
}

async function loadManifest() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest))
    throw new Error('content-manifest.json must be an array.');
  return manifest;
}

export function collectManifestCollisions(manifest) {
  const seenIds = new Map();
  const seenRoutes = new Map();
  const errors = [];

  for (const item of manifest) {
    const route = `${item.domain}/articles/${item.slug}`;
    if (seenIds.has(item.id)) {
      errors.push(
        `MIGRATE_DUPLICATE_ID: ${item.id}: ${seenIds.get(item.id)} <> ${item.sourcePath}`,
      );
    }
    if (seenRoutes.has(route)) {
      errors.push(
        `MIGRATE_DUPLICATE_ROUTE: ${route}: ${seenRoutes.get(route)} <> ${item.sourcePath}`,
      );
    }
    seenIds.set(item.id, item.sourcePath);
    seenRoutes.set(route, item.sourcePath);
  }

  return errors;
}

function assertNoCollisions(manifest) {
  const errors = collectManifestCollisions(manifest);
  if (errors.length) throw new Error(errors.join('\n'));
}

export async function buildMigrationPlan() {
  const manifest = await loadManifest();
  assertNoCollisions(manifest);

  const entries = [];
  for (const item of manifest) {
    const sourceFile = join(root, item.sourcePath);
    const source = await readFile(sourceFile, 'utf8');
    const rendered = renderArticle(item, source);
    entries.push({
      item,
      sourceFile,
      destination: destinationFor(item),
      ...rendered,
      checksums: {
        sourceSha256: sha256(source),
        sourceFrontmatterSha256: sha256(rendered.sourceFrontmatter),
        bodySha256: sha256(rendered.body),
        migratedSha256: sha256(rendered.content),
      },
    });
  }

  return entries.sort((a, b) =>
    a.item.sourcePath.localeCompare(b.item.sourcePath, 'en'),
  );
}

function checksumReport(entries) {
  return `${JSON.stringify(
    entries.map((entry) => ({
      sourcePath: entry.item.sourcePath,
      destinationPath: entry.destination
        .slice(root.length + 1)
        .replaceAll('\\', '/'),
      titleH1Removed: entry.titleH1Removed,
      ...entry.checksums,
    })),
    null,
    2,
  )}\n`;
}

async function writeMigration(entries) {
  for (const entry of entries) {
    await mkdir(dirname(entry.destination), { recursive: true });
    await writeFile(entry.destination, entry.content, 'utf8');
  }
  await mkdir(dirname(checksumPath), { recursive: true });
  await writeFile(checksumPath, checksumReport(entries), 'utf8');

  const sourcePdf = join(root, '3.ai', 'best-practice', 'SDD-Ebook.pdf');
  const publicPdf = join(
    root,
    'public',
    'assets',
    'docs',
    '6-it-va-cong-viec',
    'ai',
    'best-practice',
    'Spec-Driven-Development-Ebook.pdf',
  );
  await mkdir(dirname(publicPdf), { recursive: true });
  await writeFile(publicPdf, await readFile(sourcePdf));
}

export async function checkMigration(entries) {
  const errors = [];
  for (const entry of entries) {
    let actual;
    try {
      actual = await readFile(entry.destination, 'utf8');
    } catch {
      errors.push(
        `MIGRATE_MISSING_OUTPUT: ${entry.destination.slice(root.length + 1)}`,
      );
      continue;
    }
    if (sha256(actual) !== entry.checksums.migratedSha256) {
      errors.push(
        `MIGRATE_PARITY_FAILED: ${entry.destination.slice(root.length + 1)}`,
      );
    }
    const actualBody = splitFrontmatter(actual).body;
    if (sha256(actualBody) !== entry.checksums.bodySha256) {
      errors.push(
        `MIGRATE_BODY_CHANGED: ${entry.destination.slice(root.length + 1)}`,
      );
    }
  }

  try {
    const actualChecksums = await readFile(checksumPath, 'utf8');
    if (actualChecksums !== checksumReport(entries)) {
      errors.push(
        'MIGRATE_CHECKSUM_REPORT_STALE: src/content/migration-checksums.json',
      );
    }
  } catch {
    errors.push(
      'MIGRATE_MISSING_CHECKSUM_REPORT: src/content/migration-checksums.json',
    );
  }

  if (errors.length) throw new Error(errors.join('\n'));
}

async function main() {
  const entries = await buildMigrationPlan();
  const flags = new Set(process.argv.slice(2));

  if (flags.has('--write')) {
    await writeMigration(entries);
    console.log(
      `Migrated ${entries.length} articles with body parity verified.`,
    );
    return;
  }
  if (flags.has('--check')) {
    await checkMigration(entries);
    console.log(
      `Verified ${entries.length} migrated articles and checksum report.`,
    );
    return;
  }

  console.log('Dry run: no files written.');
  for (const entry of entries) {
    console.log(
      `${entry.item.sourcePath} -> ${entry.destination.slice(root.length + 1)} ${entry.checksums.bodySha256}`,
    );
  }
  console.log(
    `Ready to migrate ${entries.length} articles. Run with --write to apply.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Loader } from 'astro/loaders';

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(path)));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
  }
  return files.sort((a, b) => a.localeCompare(b, 'en'));
}

function parseValue(raw: string): unknown {
  const value = raw.trim();
  try {
    return JSON.parse(value);
  } catch {
    return value.replace(/^['"]|['"]$/g, '');
  }
}

function splitMarkdown(source: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error('Markdown entry is missing YAML frontmatter.');
  const frontmatter = match[1];
  if (frontmatter === undefined)
    throw new Error('Markdown frontmatter is empty.');

  const data: Record<string, unknown> = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.+)$/);
    if (field?.[1] && field[2] !== undefined)
      data[field[1]] = parseValue(field[2]);
  }
  return { data, body: source.slice(match[0].length) };
}

function posixPath(path: string): string {
  return path.split(sep).join('/');
}

export function markdownDirectoryLoader(directory: string): Loader {
  return {
    name: 'knowledge-atlas-markdown-directory',
    async load({ config, store, parseData, renderMarkdown, generateDigest }) {
      const root = fileURLToPath(config.root);
      const base = resolve(root, directory);
      store.clear();

      for (const file of await markdownFiles(base)) {
        const source = await readFile(file, 'utf8');
        const { data, body } = splitMarkdown(source);
        const domain = String(data.domain ?? '');
        const slug = String(data.slug ?? '');
        const id = `${domain}/${slug}`;
        const filePath = posixPath(relative(root, file));
        const parsedData = await parseData({ id, data, filePath });
        const rendered = await renderMarkdown(body, {
          fileURL: pathToFileURL(file),
        });

        store.set({
          id,
          data: parsedData,
          body,
          filePath,
          digest: generateDigest(source),
          rendered,
          assetImports: rendered.metadata?.imagePaths,
        });
      }
    },
  };
}

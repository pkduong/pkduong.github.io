import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type ManifestItem = {
  sourcePath: string;
  id: string;
  slug: string;
  domain: string;
};

const root = resolve(import.meta.dirname, '../..');

describe('AC-001 / AC-010 article migration contract', () => {
  it('publishes exactly 22 source documents with unique IDs and canonical routes', async () => {
    const manifest = JSON.parse(
      await readFile(resolve(root, 'content-manifest.json'), 'utf8'),
    ) as ManifestItem[];
    const ids = new Set(manifest.map((item) => item.id));
    const routes = new Set(
      manifest.map((item) => `${item.domain}/articles/${item.slug}`),
    );

    expect(manifest).toHaveLength(22);
    expect(ids.size).toBe(manifest.length);
    expect(routes.size).toBe(manifest.length);
  });

  it('keeps every migrated Markdown body byte-equivalent by SHA-256', async () => {
    const checksums = JSON.parse(
      await readFile(
        resolve(root, 'src/content/migration-checksums.json'),
        'utf8',
      ),
    ) as Array<{ destinationPath: string; bodySha256: string }>;

    for (const entry of checksums) {
      const migrated = await readFile(
        resolve(root, entry.destinationPath),
        'utf8',
      );
      const body = migrated.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
      const hash = createHash('sha256').update(body).digest('hex');
      expect(hash, entry.destinationPath).toBe(entry.bodySha256);
    }
  });
});

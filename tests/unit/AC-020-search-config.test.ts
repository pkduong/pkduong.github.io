import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('AC-020 / AC-024 Pagefind contract', () => {
  it('builds a Vietnamese Pagefind index and ships a no-index fallback directory', async () => {
    const packageJson = JSON.parse(
      await readFile(resolve(root, 'package.json'), 'utf8'),
    ) as {
      scripts: Record<string, string>;
    };
    const searchPage = await readFile(
      resolve(root, 'src/pages/search.astro'),
      'utf8',
    );

    expect(packageJson.scripts.build).toContain(
      'pagefind --site dist --force-language vi',
    );
    expect(searchPage).toContain('data-search-fallback');
    expect(searchPage).toContain('Không tải được chỉ mục tìm kiếm');
    expect(searchPage).not.toContain('.innerHTML');
  });
});

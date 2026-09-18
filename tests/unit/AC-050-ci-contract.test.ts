import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('AC-050 / AC-051 / AC-052 CI and static deployment', () => {
  it('gates deployment on validation, unit tests, build, smoke and Lighthouse', async () => {
    const workflow = await readFile(
      resolve(root, '.github/workflows/pages.yml'),
      'utf8',
    );
    for (const command of [
      'npm run validate',
      'npm test',
      'npm run build',
      'npm run test:e2e:smoke',
      'npm run test:lighthouse',
    ]) {
      expect(workflow).toContain(command);
    }
    expect(workflow).toContain('needs: quality');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
  });

  it('uses Astro static output without a server adapter', async () => {
    const config = await readFile(resolve(root, 'astro.config.mjs'), 'utf8');
    expect(config).toContain("output: 'static'");
    expect(config).not.toMatch(/adapter\s*:/);
  });
});

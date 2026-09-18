import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('AC-003 legacy Markdown constructs', () => {
  it('retains Vietnamese Unicode, tables, blockquotes, code fences and ASCII diagrams', async () => {
    const fixturePaths = [
      '1.ai/1-LLM_GPT-full.md',
      '1.ai/best-practice/4-Spec-Driven-Development.md',
      '2.ufo/01-Government-Programs.md',
    ];
    const corpus = (
      await Promise.all(
        fixturePaths.map((path) => readFile(resolve(root, path), 'utf8')),
      )
    ).join('\n');

    expect(corpus).toMatch(/[ăâđêôơư]/iu);
    expect(corpus).toMatch(/^\|.+\|$/m);
    expect(corpus).toMatch(/^>\s/m);
    expect(corpus).toMatch(/^```/m);
    expect(corpus).toContain('┌');
  });
});

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rehypeCompactIndexTables } from '../../scripts/remark-content.mjs';

const root = resolve(import.meta.dirname, '../..');

describe('AC-003 legacy Markdown constructs', () => {
  it('retains Vietnamese Unicode, tables, blockquotes, code fences and ASCII diagrams', async () => {
    const fixturePaths = [
      '3.ai/1-LLM_GPT-full.md',
      '3.ai/best-practice/4-Spec-Driven-Development.md',
      '1.ufo/01-Government-Programs.md',
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

  it('marks tables headed by # so their index column can shrink responsively', () => {
    const table = {
      type: 'element',
      tagName: 'table',
      properties: {},
      children: [
        {
          type: 'element',
          tagName: 'thead',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'tr',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'th',
                  properties: {},
                  children: [{ type: 'text', value: '#' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const plugin = rehypeCompactIndexTables();
    const visit = plugin.element.visit;

    visit(table, {
      textContent: (node: { children: Array<{ value?: string }> }) =>
        node.children.map((child) => child.value ?? '').join(''),
      setProperty: (
        node: { properties: Record<string, unknown> },
        key: string,
        value: unknown,
      ) => {
        node.properties[key] = value;
      },
    });

    expect(table.properties).toEqual({ className: ['has-compact-index'] });
  });
});

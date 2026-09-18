import { describe, expect, it } from 'vitest';
import { collectManifestCollisions } from '../../scripts/migrate-content.mjs';

describe('AC-010 duplicate id and route fail closed', () => {
  it('reports both files when an id or route slug collides', () => {
    const errors = collectManifestCollisions([
      {
        sourcePath: '1.ai/a.md',
        id: 'ART-AI-DUP',
        slug: 'shared-slug',
        domain: 'ai',
      },
      {
        sourcePath: '1.ai/b.md',
        id: 'ART-AI-DUP',
        slug: 'other-slug',
        domain: 'ai',
      },
      {
        sourcePath: '2.ufo/a.md',
        id: 'ART-UFO-A',
        slug: 'same-route',
        domain: 'ufo',
      },
      {
        sourcePath: '2.ufo/b.md',
        id: 'ART-UFO-B',
        slug: 'same-route',
        domain: 'ufo',
      },
    ]);

    expect(
      errors.some((error) => error.startsWith('MIGRATE_DUPLICATE_ID')),
    ).toBe(true);
    expect(
      errors.some((error) => error.startsWith('MIGRATE_DUPLICATE_ROUTE')),
    ).toBe(true);
    expect(errors.join('\n')).toContain('1.ai/a.md');
    expect(errors.join('\n')).toContain('1.ai/b.md');
    expect(errors.join('\n')).toContain('2.ufo/a.md');
    expect(errors.join('\n')).toContain('2.ufo/b.md');
  });
});

import { describe, expect, it } from 'vitest';
import { rewriteInternalUrl } from '../../scripts/remark-content.mjs';
import { joinBase, normalizeBase } from '../../src/lib/url';

describe('AC-004 GitHub Pages base path', () => {
  it('prefixes internal routes and assets with /ufo-data/', () => {
    expect(joinBase('/ufo-data', '/ai/articles/example/')).toBe(
      '/ufo-data/ai/articles/example/',
    );
    expect(joinBase('/ufo-data/', 'assets/document.pdf')).toBe(
      '/ufo-data/assets/document.pdf',
    );
  });

  it('leaves anchors and external URLs untouched', () => {
    expect(joinBase('/ufo-data', '#section')).toBe('#section');
    expect(joinBase('/ufo-data', 'https://example.com')).toBe(
      'https://example.com',
    );
    expect(normalizeBase('/')).toBe('/');
  });

  it('rewrites root-relative Markdown assets and legacy routes under the base path', () => {
    expect(
      rewriteInternalUrl(
        '/ufo-data',
        '/assets/docs/6-it-va-cong-viec/ai/best-practice/Spec-Driven-Development-Ebook.pdf',
      ),
    ).toBe(
      '/ufo-data/assets/docs/6-it-va-cong-viec/ai/best-practice/Spec-Driven-Development-Ebook.pdf',
    );
    expect(
      rewriteInternalUrl(
        '/ufo-data',
        '/ai/2026/04/02/ai-vs-traditional-programming.html',
      ),
    ).toBe('/ufo-data/ai/articles/2-ai-vs-traditional-programming/');
    expect(rewriteInternalUrl('/ufo-data', 'https://example.com/x')).toBe(
      'https://example.com/x',
    );
  });
});

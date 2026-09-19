import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../src/site.config';

describe('AC-002 domain navigation and homepage catalog order', () => {
  it('keeps the requested display order while preserving catalog numbers', () => {
    expect(
      siteConfig.domains.map(({ key, catalogNumber, catalogLabel }) => ({
        key,
        catalogNumber,
        catalogLabel,
      })),
    ).toEqual([
      {
        key: 'ufo',
        catalogNumber: '01',
        catalogLabel: 'Danh mục đã giải mật',
      },
      {
        key: 'meta',
        catalogNumber: '02',
        catalogLabel: 'Danh mục bất khả tri',
      },
      {
        key: 'ai',
        catalogNumber: '03',
        catalogLabel: 'Danh mục nguy hiểm',
      },
      {
        key: 'soul',
        catalogNumber: '04',
        catalogLabel: 'Danh mục dị biệt',
      },
      {
        key: 'ling',
        catalogNumber: '05',
        catalogLabel: 'Danh mục ngoại biên',
      },
    ]);
  });

  it('publishes the renamed SOUL domain from its canonical source directory', () => {
    const soul = siteConfig.domains.find((domain) => domain.key === 'soul');

    expect(soul).toMatchObject({
      name: 'SOUL — Studies Of the Unseen Life',
      shortName: 'SOUL',
      sourceDirectory: '4.soul',
      description:
        'Khảo cứu cổ thư huyền học, cận tâm lý học thực nghiệm và những giới hạn chưa được giải mã của siêu thức con người.',
    });
  });

  it('uses intentional homepage card title lines instead of browser wrapping', () => {
    expect(
      Object.fromEntries(
        siteConfig.domains.map(({ key, cardTitleLines }) => [
          key,
          cardTitleLines,
        ]),
      ),
    ).toMatchObject({
      meta: ['META —', 'Metaphysics,', 'Existence &', 'Alternative Realities'],
      ai: ['A.I —', 'Artificial Intelligence &', 'Future Cognition'],
      soul: ['SOUL — Studies', 'Of the Unseen Life'],
      ling: ['L.I.N.G —', 'Life, Insights,', 'Notes & Growth'],
    });
  });
});

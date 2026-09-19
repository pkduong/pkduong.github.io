export const domainKeys = ['ai', 'ufo', 'meta', 'soul', 'ling'] as const;

export type DomainKey = (typeof domainKeys)[number];

export type DomainConfig = {
  key: DomainKey;
  name: string;
  cardTitleLines: readonly string[];
  shortName: string;
  catalogNumber: string;
  catalogLabel: string;
  description: string;
  sourceDirectory: string;
  accent: string;
};

export const deploymentConfig = {
  basePath: process.env.BASE_PATH || '/ufo-data',
} as const;

export const siteConfig = {
  name: 'Project Knowledge Disclosure',
  shortName: 'PKD',
  tagline: 'Đọc sâu. Tỉnh thức. Vượt mọi giới hạn.',
  description:
    'Không gian giải mã và lưu trữ dữ liệu về hiện tượng lạ, ranh giới khoa học và bản chất thực tại.',
  repositoryName: 'ufo-data',
  domains: [
    {
      key: 'ufo',
      name: 'U.F.O / UAP — Unidentified Anomalous Phenomena',
      cardTitleLines: [
        'U.F.O / UAP —',
        'Unidentified',
        'Anomalous',
        'Phenomena',
      ],
      shortName: 'U.F.O',
      catalogNumber: '01',
      catalogLabel: 'Danh mục đã giải mật',
      description:
        'Hồ sơ giải mật, hiện tượng dị thường trên bầu trời và những dấu vết vượt khỏi giới hạn khoa học thông thường.',
      sourceDirectory: '1.ufo',
      accent: '#838985',
    },
    {
      key: 'meta',
      name: 'META — Metaphysics, Existence & Alternative Realities',
      cardTitleLines: [
        'META —',
        'Metaphysics,',
        'Existence &',
        'Alternative Realities',
      ],
      shortName: 'META',
      catalogNumber: '02',
      catalogLabel: 'Danh mục bất khả tri',
      description:
        'Thước đo của các định luật tự nhiên, biên giới vật lý học và bản thể luận về không-thời gian.',
      sourceDirectory: '2.meta',
      accent: '#aaa39a',
    },
    {
      key: 'ai',
      name: 'A.I — Artificial Intelligence & Future Cognition',
      cardTitleLines: [
        'A.I —',
        'Artificial Intelligence &',
        'Future Cognition',
      ],
      shortName: 'A.I',
      catalogNumber: '03',
      catalogLabel: 'Danh mục nguy hiểm',
      description:
        'Ranh giới ý thức máy, bước tiến AGI và tương lai của nhận thức nhân tạo.',
      sourceDirectory: '3.ai',
      accent: '#9c9c98',
    },
    {
      key: 'soul',
      name: 'SOUL — Studies Of the Unseen Life',
      cardTitleLines: ['SOUL — Studies', 'Of the Unseen Life'],
      shortName: 'SOUL',
      catalogNumber: '04',
      catalogLabel: 'Danh mục dị biệt',
      description:
        'Khảo cứu cổ thư huyền học, cận tâm lý học thực nghiệm và những giới hạn chưa được giải mã của siêu thức con người.',
      sourceDirectory: '4.soul',
      accent: '#8d8982',
    },
    {
      key: 'ling',
      name: 'L.I.N.G — Life, Insights, Notes & Growth',
      cardTitleLines: ['L.I.N.G —', 'Life, Insights,', 'Notes & Growth'],
      shortName: 'L.I.N.G',
      catalogNumber: '05',
      catalogLabel: 'Danh mục ngoại biên',
      description:
        'Những lát cắt đời sống, tư duy con người và điều đọng lại sau từng trang sách, thước phim',
      sourceDirectory: '5.ling',
      accent: '#747b80',
    },
  ] satisfies DomainConfig[],
} as const;

export function getDomain(key: string): DomainConfig | undefined {
  return siteConfig.domains.find((domain) => domain.key === key);
}

export const domainKeys = ['ai', 'ufo', 'meta', 'psychic', 'misc'] as const;

export type DomainKey = (typeof domainKeys)[number];

export type DomainConfig = {
  key: DomainKey;
  name: string;
  shortName: string;
  description: string;
  sourceDirectory: string;
  accent: string;
};

export const deploymentConfig = {
  basePath: process.env.BASE_PATH || '/ufo-data',
} as const;

export const siteConfig = {
  name: 'Knowledge Atlas',
  description:
    'Kho tri thức tĩnh được xuất bản trực tiếp từ Markdown trong Git.',
  repositoryName: 'ufo-data',
  domains: [
    {
      key: 'ai',
      name: 'AI & Software Engineering',
      shortName: 'AI',
      description:
        'Nền tảng AI, quy trình phát triển phần mềm và thực hành kỹ thuật.',
      sourceDirectory: '1.ai',
      accent: '#5144cf',
    },
    {
      key: 'ufo',
      name: 'UFO / UAP',
      shortName: 'UFO / UAP',
      description:
        'Chương trình, sự kiện, nhân vật và thuật ngữ nghiên cứu UAP.',
      sourceDirectory: '2.ufo',
      accent: '#1b7f75',
    },
    {
      key: 'meta',
      name: 'Vật lý & Siêu hình học',
      shortName: 'Vật lý',
      description: 'Các ràng buộc vật lý, giả thuyết và khung nhận thức.',
      sourceDirectory: '3.meta',
      accent: '#a04b73',
    },
    {
      key: 'psychic',
      name: 'Tâm linh & Cận tâm lý',
      shortName: 'Tâm linh',
      description: 'Hệ phái, nghiên cứu cận tâm lý và hồ sơ hiện tượng.',
      sourceDirectory: '4.psychic',
      accent: '#8a5a24',
    },
    {
      key: 'misc',
      name: 'Linh tinh',
      shortName: 'Linh tinh',
      description: 'Tư duy phản biện, tâm lý và các ghi chép liên ngành.',
      sourceDirectory: '5.ling-tinh',
      accent: '#47627a',
    },
  ] satisfies DomainConfig[],
} as const;

export function getDomain(key: string): DomainConfig | undefined {
  return siteConfig.domains.find((domain) => domain.key === key);
}

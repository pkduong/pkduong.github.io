import { deploymentConfig } from '../site.config';

const externalProtocol = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export function normalizeBase(base: string): string {
  const withLeadingSlash = base.startsWith('/') ? base : `/${base}`;
  return withLeadingSlash === '/'
    ? '/'
    : `${withLeadingSlash.replace(/\/+$/, '')}/`;
}

export function joinBase(base: string, path = ''): string {
  if (!path) return normalizeBase(base);
  if (path.startsWith('#') || externalProtocol.test(path)) return path;

  const normalizedBase = normalizeBase(base);
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`.replace(/(?<!:)\/{2,}/g, '/');
}

export function withBase(path = ''): string {
  const envBase = import.meta.env?.BASE_URL;
  const base =
    typeof envBase === 'string' && envBase.length > 0
      ? envBase
      : deploymentConfig.basePath;
  return joinBase(base, path);
}

export function articlePath(domain: string, slug: string): string {
  return withBase(`${domain}/articles/${slug}/`);
}

export function canonicalUrl(
  path: string,
  site: URL | undefined,
): string | undefined {
  if (!site) return undefined;
  return new URL(path, site).toString();
}

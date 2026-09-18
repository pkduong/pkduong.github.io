import { getCollection, type CollectionEntry } from 'astro:content';

export type ArticleEntry = CollectionEntry<'articles'>;

export function compareArticles(a: ArticleEntry, b: ArticleEntry): number {
  return (
    a.data.order - b.data.order ||
    a.data.title.localeCompare(b.data.title, 'vi')
  );
}

export async function getPublishedArticles(): Promise<ArticleEntry[]> {
  const articles = await getCollection(
    'articles',
    ({ data }) => data.status === 'published',
  );
  return articles.sort(compareArticles);
}

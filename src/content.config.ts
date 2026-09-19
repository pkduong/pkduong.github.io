import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { markdownDirectoryLoader } from './lib/markdown-directory-loader';

const articleBase = z.object({
  id: z.string().regex(/^ART-[A-Z0-9-]{3,76}$/),
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  domain: z.enum(['ai', 'ufo', 'meta', 'soul', 'ling']),
  kind: z.literal('article'),
  language: z.literal('vi'),
  status: z.enum(['draft', 'published', 'archived']),
  order: z.number().int().nonnegative(),
  sourcePath: z.string().min(1),
});

const articles = defineCollection({
  loader: markdownDirectoryLoader('./src/content/articles'),
  schema: z.discriminatedUnion('legacy', [
    articleBase.extend({ legacy: z.literal(true) }),
    articleBase.extend({
      legacy: z.literal(false),
      summary: z.string().min(40).max(240),
      tags: z.array(z.string()),
      updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  ]),
});

export const collections = { articles };

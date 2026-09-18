import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import {
  rehypeExternalLinks,
  rehypeHeadingAnchors,
  remarkBasePathLinks,
  remarkEscapeRawHtml,
} from './scripts/remark-content.mjs';

const base = process.env.BASE_PATH || '/ufo-data';
const site = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  output: 'static',
  site,
  base,
  trailingSlash: 'always',
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['txt', 'text', 'plaintext', 'ascii', 'eof'],
    },
    processor: satteri({
      mdastPlugins: [remarkBasePathLinks({ base }), remarkEscapeRawHtml()],
      hastPlugins: [rehypeExternalLinks(), rehypeHeadingAnchors()],
    }),
  },
  vite: {
    build: {
      sourcemap: false,
    },
  },
});

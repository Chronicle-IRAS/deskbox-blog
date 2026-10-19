import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';

function includeInSitemap(page) {
  const { pathname } = new URL(page);

  return !(
    pathname === '/404/' ||
    pathname === '/404.html' ||
    pathname.startsWith('/search/') ||
    pathname.startsWith('/styleguide/') ||
    pathname.startsWith('/blog/page/') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt')
  );
}

export default defineConfig({
  site: 'http://localhost:4321',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap({ filter: includeInSitemap })],
  markdown: {
    remarkPlugins: [remarkGfm],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: true,
    },
  },
});

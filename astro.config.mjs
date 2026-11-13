import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import { rehypeHeadingAnchors, rehypeCodeFrame, rehypeExternalLinks, rehypeTableWrap, rehypeFigures } from './src/lib/rehype.mjs';

// 部署在 https://xlyxh.github.io/deskbox-blog/ ，换域名时只改这两项
const SITE = 'https://xlyxh.github.io';
const BASE = '/deskbox-blog';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  image: {
    // Markdown 里的本地图片也输出响应式 srcset + sizes（宽高写死，不会布局跳动）
    layout: 'constrained',
    responsiveStyles: false,
    breakpoints: [360, 540, 720, 1080, 1440],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !/\/(404|search)\/?$/.test(new URL(page).pathname) && !page.includes('/blog/page/'),
    }),
  ],
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHeadingAnchors, rehypeCodeFrame, rehypeExternalLinks, rehypeTableWrap, rehypeFigures],
    shikiConfig: {
      themes: { light: 'github-light-high-contrast', dark: 'vesper' },
      defaultColor: false,
      wrap: false,
    },
  },
});

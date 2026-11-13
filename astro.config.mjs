import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';

import remarkGfm from 'remark-gfm';
import { rehypeHeadingAnchors, rehypeCodeFrame, rehypeExternalLinks, rehypeTableWrap, rehypeFigures } from './src/lib/rehype.mjs';

// Production uses the existing Node service behind Nginx.
const SITE = 'https://blog.chronicleiras.top';
const BASE = '';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  image: {
    // Markdown 里的本地图片也输出响应式 srcset + sizes（宽高写死，不会布局跳动）
    layout: 'constrained',
    responsiveStyles: false,
    breakpoints: [360, 540, 720, 1080, 1440],
  },
  integrations: [
    mdx(),

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

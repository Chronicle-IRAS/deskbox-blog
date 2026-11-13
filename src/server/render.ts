import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { readingTime } from '../lib/reading-time';
import type { Heading } from './types';

const headingIds = ['id'];

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    h1: [...(defaultSchema.attributes?.h1 ?? []), ...headingIds],
    h2: [...(defaultSchema.attributes?.h2 ?? []), ...headingIds],
    h3: [...(defaultSchema.attributes?.h3 ?? []), ...headingIds],
    h4: [...(defaultSchema.attributes?.h4 ?? []), ...headingIds],
    pre: [
      ...(defaultSchema.attributes?.pre ?? []),
      ['className', /^astro-code/],
      'style',
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', /^language-/],
      ['className', /^astro-code/],
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className'],
      'style',
    ],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      'loading',
      'decoding',
      'width',
      'height',
    ],
  },
};

let processorPromise: ReturnType<typeof createMarkdownProcessor> | undefined;

function processor() {
  processorPromise ??= createMarkdownProcessor({
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeSanitize, schema]],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: true,
    },
  });

  return processorPromise;
}

export interface RenderedMarkdown {
  html: string;
  headings: Heading[];
  readingMinutes: number;
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const renderer = await processor();
  const result = await renderer.render(markdown);

  return {
    html: result.code,
    headings: result.metadata.headings as Heading[],
    readingMinutes: readingTime(markdown),
  };
}

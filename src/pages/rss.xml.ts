import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import mdxRenderer from '@astrojs/mdx/server.js';
import { site } from '../data/site';
import { getPublishedPosts, type BlogEntry } from '../lib/posts';

type AstroContainerInstance = Awaited<ReturnType<typeof AstroContainer.create>>;

function resolveUrl(value: string, base: URL): string {
  const trimmed = value.trim();

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) {
    return trimmed;
  }

  return new URL(trimmed, base).toString();
}

function absolutizeHtml(html: string, itemUrl: URL): string {
  return html
    .replace(
      /\b(href|src)="([^"]*)"/g,
      (_match, attribute: string, value: string) =>
        `${attribute}="${resolveUrl(value, itemUrl)}"`,
    )
    .replace(/\bsrcset="([^"]*)"/g, (_match, value: string) => {
      const candidates = value.split(',').map((candidate) => {
        const [url, ...descriptor] = candidate.trim().split(/\s+/);
        return [resolveUrl(url, itemUrl), ...descriptor].join(' ');
      });

      return `srcset="${candidates.join(', ')}"`;
    });
}

async function renderPostHtml(
  post: BlogEntry,
  getContainer: () => Promise<AstroContainerInstance>,
): Promise<string> {
  const rendered = (post as BlogEntry & { rendered?: { html?: string } }).rendered?.html;

  if (rendered) return rendered;

  const { Content } = await render(post);
  const container = await getContainer();

  return container.renderToString(Content);
}

export async function GET(context: APIContext) {
  const base = context.site ?? new URL(site.url);
  const posts = await getPublishedPosts();
  let containerPromise: Promise<AstroContainerInstance> | undefined;

  const getContainer = () => {
    containerPromise ??= AstroContainer.create().then((container) => {
      container.addServerRenderer({ renderer: mdxRenderer });
      return container;
    });

    return containerPromise;
  };

  const items = await Promise.all(
    posts.map(async (post) => {
      const itemUrl = new URL(`/blog/${post.data.slug}/`, base);

      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/blog/${post.data.slug}/`,
        categories: post.data.tags,
        content: absolutizeHtml(await renderPostHtml(post, getContainer), itemUrl),
      };
    }),
  );

  return rss({
    title: site.name,
    description: site.description,
    site: base,
    items,
    customData: [
      '<language>zh-CN</language>',
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    ].join(''),
  });
}

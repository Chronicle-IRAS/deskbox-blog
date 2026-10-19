import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import mdxRenderer from '@astrojs/mdx/server.js';
import { site } from '../data/site';
import { getPublishedPosts, type BlogEntry } from '../lib/posts';

type AstroContainerInstance = Awaited<ReturnType<typeof AstroContainer.create>>;

function absolutizeHtml(html: string, base: URL): string {
  const { origin } = base;

  return html
    .replace(
      /\b(href|src)="\/(?!\/)/g,
      (_match, attribute: string) => `${attribute}="${origin}/`,
    )
    .replace(/\bsrcset="([^"]*)"/g, (_match, value: string) => {
      const candidates = value.split(',').map((candidate) => {
        const [url, ...descriptor] = candidate.trim().split(/\s+/);
        const absolute = url.startsWith('/') ? `${origin}${url}` : url;
        return [absolute, ...descriptor].join(' ');
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
    posts.map(async (post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.data.slug}/`,
      categories: post.data.tags,
      content: absolutizeHtml(await renderPostHtml(post, getContainer), base),
    })),
  );

  return rss({
    title: site.name,
    description: site.description,
    site: base,
    items,
    customData: '<language>zh-CN</language>',
  });
}

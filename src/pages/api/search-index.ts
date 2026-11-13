import { getPosts, fmtDate } from '../../lib/posts';
import { postUrl } from '../../lib/url';

export const prerender = false;

/** Full published content is fetched only after the visitor opens search. */
export async function GET(): Promise<Response> {
  const posts = await getPosts();
  const index = posts.map((p) => ({
    t: p.data.title, d: p.data.description, u: postUrl(p.data.slug),
    date: fmtDate(p.data.pubDate), tags: p.data.tags, body: p.body ?? '',
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

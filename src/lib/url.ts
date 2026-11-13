/** 给站内路径加上 base（/deskbox-blog），外链原样返回 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export function url(path = '/') {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  return BASE + (path.startsWith('/') ? path : `/${path}`);
}
export const postUrl = (slug: string) => url(`/blog/${slug}/`);
export const tagUrl = (slug: string) => url(`/tags/${slug}/`);

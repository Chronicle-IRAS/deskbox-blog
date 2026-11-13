import type { DatabaseSync } from 'node:sqlite';
import { getDb } from './db';
import type { SearchResult } from './types';

interface SearchRow {
  slug: string;
  title: string;
  description: string;
  body_md: string;
  pub_date: string;
  tags_json: string;
}

// Prefer prose to headings and table rows when several blocks contain the term.
export function excerpt(body: string, query: string, description = ''): string {
  const blocks = body.replace(/^`{3,}[^\n]*\n[\s\S]*?^`{3,}\s*$/gm, '')
    .split(/\n\s*\n/)
    .flatMap(block => block.trim().startsWith('|') ? block.split('\n') : [block])
    .map(raw => ({
      prose: !/^\s*[|#]/.test(raw),
      text: raw.replace(/^\s*\|(?:\s*:?[-]+:?\s*\|)+\s*$/gm, '')
        .replace(/!?\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+)/gm, '')
        .replace(/\*\*|`/g, '')
        .replace(/^\s*\||\|\s*$/g, '').replace(/\s*\|\s*/g, ' · ')
        .replace(/\s+/g, ' ').trim(),
    })).filter(block => block.text);
  const term = query.toLocaleLowerCase();
  const matches = blocks.filter(block => block.text.toLocaleLowerCase().includes(term));
  const text = matches.find(block => block.prose)?.text ?? matches[0]?.text
    ?? (description || blocks.find(block => block.prose)?.text || blocks[0]?.text || '');
  const start = Math.max(0, text.toLocaleLowerCase().indexOf(term) - 55);
  return (start ? '…' : '') + text.slice(start, start + 180) + (start + 180 < text.length ? '…' : '');
}

export function searchPosts(
  query: string,
  limit = 50,
  db: DatabaseSync = getDb(),
): SearchResult[] {
  const term = query.trim();
  if (!term) return [];

  const like = `%${term.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
  const rows = db
    .prepare(
      `SELECT slug, title, description, body_md, pub_date, tags_json
       FROM posts
       WHERE deleted_at IS NULL
         AND draft = 0
         AND date(pub_date, '+8 hours') <= date('now', '+8 hours')
         AND (
           title LIKE ? ESCAPE '\\'
           OR description LIKE ? ESCAPE '\\'
           OR body_md LIKE ? ESCAPE '\\'
         )
       ORDER BY pub_date DESC, slug ASC
       LIMIT ?`,
    )
    .all(like, like, like, Math.min(50, Math.max(1, limit))) as unknown as SearchRow[];

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: excerpt(row.body_md, term, row.description),
    pubDate: row.pub_date,
    tags: JSON.parse(row.tags_json) as string[],
  }));
}

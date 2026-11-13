import type { MarkdownHeading } from 'astro';

export type Heading = MarkdownHeading;

export interface PostRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  html: string;
  headings: Heading[];
  tags: string[];
  series?: { name: string; order: number };
  pubDate: string;
  updatedDate?: string;
  readingMinutes: number;
  coverPath?: string;
  coverAlt?: string;
  ogPath?: string;
}

export interface PostInput {
  id?: string;
  slug: string;
  title: string;
  description: string;
  bodyMd: string;
  html: string;
  headings?: Heading[];
  tags?: string[];
  series?: { name: string; order: number };
  draft?: boolean;
  pubDate: string;
  updatedDate?: string;
  canonical?: string;
  coverPath?: string;
  coverAlt?: string;
  ogPath?: string;
  readingMinutes?: number;
  version?: number;
}

export interface AdminPost extends PostRecord {
  bodyMd: string;
  draft: boolean;
  canonical?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SavePostInput {
  title: string;
  slug: string;
  description: string;
  bodyMd: string;
  pubDate: string;
  tags: string[];
  series?: { name: string; order: number };
  coverPath?: string;
  coverAlt?: string;
  version?: number;
}

export interface SavePostResult {
  id: string;
  slug: string;
  version: number;
  status: 'draft' | 'published';
  updatedAt: string;
}

export interface AdminListQuery {
  status?: 'all' | 'draft' | 'published' | 'trash';
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminPostPage {
  posts: AdminPost[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PreviewResult {
  html: string;
  headings: Heading[];
  readingMinutes: number;
}

export type ApiErrorCode =
  | 'VALIDATION'
  | 'CONFLICT'
  | 'AUTH'
  | 'CSRF'
  | 'NOT_FOUND'
  | 'INTERNAL';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface PostPage {
  posts: PostRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PostQuery {
  page?: number;
  pageSize?: number;
  tag?: string;
  series?: string;
}

export interface SeriesGroup {
  name: string;
  posts: PostRecord[];
  latestDate: string;
}

export interface TagSummary {
  slug: string;
  name: string;
  description?: string;
  count: number;
}

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  pubDate: string;
  tags: string[];
}

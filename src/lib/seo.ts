import { site } from '../data/site';

export interface ArticleJsonLdInput {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  keywords?: string[];
}

export function toAbsoluteUrl(path: string, base: URL | string = site.url): string {
  return new URL(path, base).toString();
}

export function canonicalUrl(pathname: string, base: URL | string = site.url): string {
  return toAbsoluteUrl(pathname, base);
}

export function buildWebsiteJsonLd(base: URL | string = site.url): Record<string, unknown> {
  const home = toAbsoluteUrl('/', base);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': home,
        name: site.name,
        url: home,
        description: site.description,
        inLanguage: 'zh-CN',
      },
      {
        '@type': 'Person',
        name: site.author.name,
        url: toAbsoluteUrl('/about/', base),
      },
    ],
  };
}

export function articleHeadline(title: string): string {
  const suffix = ` · ${site.name}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

export function buildArticleJsonLd(input: ArticleJsonLdInput): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: articleHeadline(input.title),
    description: input.description,
    url: input.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    author: { '@type': 'Person', name: site.author.name },
    inLanguage: 'zh-CN',
  };

  if (input.image) jsonLd.image = input.image;
  if (input.datePublished) jsonLd.datePublished = input.datePublished;
  if (input.dateModified) jsonLd.dateModified = input.dateModified;
  if (input.keywords?.length) jsonLd.keywords = input.keywords.join(', ');

  return jsonLd;
}

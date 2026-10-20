export type IconName =
  | 'github'
  | 'mail'
  | 'rss'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'copy'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-up-right';

export interface NavItem {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: IconName;
}

export interface GiscusConfig {
  provider: 'giscus';
  repo: `${string}/${string}`;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number';
  term?: string;
  reactionsEnabled?: '1' | '0';
  inputPosition?: 'top' | 'bottom';
  lang?: string;
}

export type CommentsConfig = { provider: 'none' } | GiscusConfig;

export const site = {
  name: 'DeskBox',
  title: 'DeskBox',
  description: '写代码，也写生活。',
  url: 'http://localhost:4321',
  author: {
    name: 'DeskBox',
    bio: '{{一句话简介}}',
  },
  nav: [
    { label: '文章', href: '/blog/' },
    { label: '标签', href: '/tags/' },
    { label: '归档', href: '/archive/' },
    { label: '关于', href: '/about/' },
    { label: '搜索', href: '/search/' },
  ] satisfies NavItem[],
  social: [
    { label: 'GitHub', href: 'https://github.com/', icon: 'github' },
    { label: 'Email', href: 'mailto:hello@example.com', icon: 'mail' },
  ] satisfies SocialLink[],
  footer: '© 2026 DeskBox',
  comments: { provider: 'none' } as CommentsConfig,
};

export function pageTitle(title?: string): string {
  return title ? `${title} · ${site.name}` : site.name;
}

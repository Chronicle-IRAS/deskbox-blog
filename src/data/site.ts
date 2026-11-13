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
  name: 'Chronicle-IRAS的博客',
  title: 'Chronicle-IRAS的博客',
  description: '写代码，也写生活。',
  url: import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  author: {
    name: 'Chronicle-IRAS',
    bio: 'Everything is AI',
    avatar: '/avatar.jpg',
    github: 'https://github.com/Chronicle-IRAS',
  },
  nav: [
    { label: '文章', href: '/blog/' },
    { label: '系列', href: '/series/' },
    { label: '标签', href: '/tags/' },
    { label: '归档', href: '/archive/' },
    { label: '关于', href: '/about/' },
    { label: '搜索', href: '/search/' },
  ] satisfies NavItem[],
  social: [
    {
      label: 'GitHub',
      href: 'https://github.com/Chronicle-IRAS',
      icon: 'github',
    },
  ] satisfies SocialLink[],
  footer: '© 2026 Chronicle-IRAS的博客',
  comments: {
    provider: 'giscus',
    repo: 'Chronicle-IRAS/deskbox-blog',
    repoId: 'R_kgDOVQUusw',
    category: 'Announcements',
    categoryId: 'DIC_kwDOVQUus84DJFYE',
    mapping: 'pathname',
    reactionsEnabled: '1',
    inputPosition: 'top',
    lang: 'zh-CN',
  } as CommentsConfig,
};

export function pageTitle(title?: string): string {
  return title ? `${title} · ${site.name}` : site.name;
}

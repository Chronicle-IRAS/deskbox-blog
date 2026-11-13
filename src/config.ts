import { listTags } from './server/posts';
// 站点信息：内容来自原 DeskBox 博客（Chronicle-IRAS/deskbox-blog）的 src/data/site.ts
export const site = {
  name: 'Chronicle-IRAS的博客',
  description: '写代码，也写生活。',
  lang: 'zh-CN',
  timeZone: 'Asia/Shanghai',
  author: {
    name: 'Chronicle-IRAS',
    // 原站这里是占位符 {{一句话简介}}，暂用关于页的介绍
    bio: '这里记录技术、阅读与生活。',
  },
  nav: [
    { label: '首页', href: '/', key: 'home' },
    { label: '文章', href: '/blog/', key: 'blog' },
    { label: '标签', href: '/tags/', key: 'tags' },
    { label: '归档', href: '/archive/', key: 'archive' },
    { label: '关于', href: '/about/', key: 'about' },
  ],
  social: [
    { label: 'GitHub', href: 'https://github.com/Chronicle-IRAS', icon: 'github' },
    { label: '个人网站', href: 'https://www.chronicleiras.top/', icon: 'globe' },
    { label: 'RSS', href: '/rss.xml', icon: 'rss' },
    // 原站邮箱是占位符 hello@example.com，填入真实地址后取消注释
    // { label: 'Email', href: 'mailto:you@example.com', icon: 'mail' },
  ],
  postsPerPage: 8,
  // 评论沿用原站的 Giscus 配置（GitHub Discussions），点击后才加载
  comments: {
    repo: 'Chronicle-IRAS/deskbox-blog',
    repoId: 'R_kgDOVQUusw',
    category: 'Announcements',
    categoryId: 'DIC_kwDOVQUus84DJFYE',
    mapping: 'pathname',
    lang: 'zh-CN',
  },
} as const;

const defaultTags = [
  { name: '前端', slug: 'frontend', description: '浏览器、框架与工程化' },
  { name: '后端', slug: 'backend', description: '服务端、数据与基础设施' },
  { name: '工程实践', slug: 'engineering', description: '协作、测试与交付' },
  { name: '阅读', slug: 'reading', description: '书与长文笔记' },
  { name: '生活', slug: 'life', description: '写作之外' },
] as const;

export const getTags = () => process.env.BLOG_DB_PATH ? listTags().map((t) => ({ ...t, description: t.description ?? '' })) : [...defaultTags];

export const tagSlug = (name: string) => {
  const t = getTags().find((x) => x.name === name);
  if (!t) return encodeURIComponent(name);
  return t.slug;
};

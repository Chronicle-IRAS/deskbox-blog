# omp · P0 实施文档

**执行者：** omp  
**轨道：** Content Routes + Article Reading  
**分支：** `feat/p0-omp-pages`  
**工作区：** `../博客-omp`（独立 worktree）  
**并行方：** Claude Code，主工作区 `C:/Users/Lenovo/DeskBox/博客`，分支 `feat/p0-claude-foundation` → `feat/p0-claude-home`  
**范围：** 只做 P0；部署、评论、分析、P1 功能全部不做。  
**依赖文档：** [原型架构](../architecture.md) · [视觉设计](../design.md) · [设计系统](../../design-system/deskbox-blog/MASTER.md) · [原型计划](../prototype-plan.md)

---

## 1. 任务目标

omp 负责“内容路由 + 文章阅读体验”：

1. `/blog/` 文章列表（P0 展示全部 12 篇，不分页）。
2. `/blog/[slug]/` 文章页、`PostLayout`、TOC、代码复制、上一篇/下一篇。
3. `prose.css` 正文排版。
4. `/about/`、`/404`、`/styleguide`。
5. 上述页面的 Playwright + axe 烟测。

**不做**

- 项目脚手架、`package.json`、`astro.config.mjs`、内容 schema、示例内容（Claude 负责）。
- `BaseLayout`、Header/Footer、主题切换、`PostCard`/`PostList`、首页（Claude 负责）。
- 标签、归档、分页、搜索、RSS、sitemap（P1）。
- 部署、域名、CI/CD、评论、分析、多语言、OG 图。

---

## 2. 工作区与分支

> **前置：** 先把 `docs/plans/*.md` 与相关链接提交到 `main`，否则 `git worktree add ... main` 创建的 worktree 里看不到本计划。

**必须使用独立 worktree**，避免与 Claude 同时写同一工作区：

```bash
# 在仓库根目录执行
git worktree add ../博客-omp -b feat/p0-omp-pages main
cd ../博客-omp
```

- 如果 `../博客-omp` 已存在，先 `git worktree list` 确认，不要重复创建。
- 本仓库暂无 remote；不要 `git push`，分支共享通过同一 Git 仓库/worktree。
- 分支从 `main` 创建；在 Claude 的 foundation 检查点就绪后 rebase：

```bash
git rebase feat/p0-claude-foundation
npm install
npm run dev
```

- foundation 只有骨架与空内容；**最终测试前**要 rebase 到 Claude 的内容分支 `feat/p0-claude-home`（含 12 篇示例文章）：

```bash
git rebase feat/p0-claude-home
npm install
npm run check
npm run test:e2e
```

**并行策略**

- 脚手架未就绪时，omp 先写不依赖构建的文件（§3.1 全部是新增文件），不要运行 `npm`。
- Claude 发出 foundation checkpoint（分支 + commit SHA）后，omp rebase 并开始本地运行/验证。
- Claude 发出 content checkpoint（`feat/p0-claude-home`）后，omp 再 rebase 一次，跑文章列表/文章页测试。
- 如果 foundation 契约变更，omp rebase 后重跑 §5 检查；冲突只在自己的文件中解决。

---

## 3. 文件所有权

### 3.1 omp 创建 / 修改

```text
src/styles/prose.css
src/layouts/PostLayout.astro
src/components/TableOfContents.astro
src/components/PrevNext.astro
src/scripts/code-copy.ts
src/scripts/toc-highlight.ts
src/pages/blog/index.astro
src/pages/blog/[slug].astro
src/pages/about.astro
src/pages/404.astro
src/pages/styleguide.astro
tests/e2e/blog.spec.ts
tests/e2e/post.spec.ts
tests/e2e/a11y.spec.ts
```

### 3.2 omp 禁止修改

```text
package.json
package-lock.json
astro.config.mjs
tsconfig.json
.gitignore
.gitattributes
playwright.config.ts
src/content.config.ts
src/data/**
src/lib/**
src/styles/tokens.css
src/styles/global.css
src/styles/fonts.css
src/layouts/BaseLayout.astro
src/components/SiteHeader.astro
src/components/SiteFooter.astro
src/components/ThemeToggle.astro
src/components/Icon.astro
src/components/PostCard.astro
src/components/PostList.astro
public/scripts/theme-init.js
public/favicon.svg
src/pages/index.astro
src/content/blog/**
tests/unit/**
tests/e2e/home.spec.ts
tests/e2e/theme.spec.ts
docs/plans/claude-code-p0.md
```

> 需要改 Claude 文件时，在提交/PR 中写 `CONTRACT-CHANGE`，由 Claude 修改；不要直接编辑。

---

## 4. 共享契约（只消费，不修改）

**契约版本：** P0-1（2026-10-19；F6 后冻结）

### 4.1 `src/data/site.ts`

```ts
export type IconName =
  | 'github' | 'mail' | 'rss' | 'sun' | 'moon' | 'menu'
  | 'copy' | 'check' | 'chevron-left' | 'chevron-right' | 'arrow-up-right';

export interface NavItem {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: IconName;
}

export const site: {
  name: string;
  title: string;
  description: string;
  url: string;
  author: { name: string; bio: string };
  nav: NavItem[];
  social: SocialLink[];
  footer: string;
};

export function pageTitle(title?: string): string;
```

- `pageTitle('文章')` → `文章 · DeskBox`。
- P0 只使用 `site.name`、`site.description`、`site.author`、`site.footer`。
- 不新增社交链接或导航项；P0 导航由 Claude 在 Header 中实现。

### 4.2 `src/lib/posts.ts`

```ts
import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

export type BlogEntry = CollectionEntry<'blog'>;

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  readingMinutes: number;
  cover?: ImageMetadata;
  coverAlt?: string;
}

export function getPostSlug(post: BlogEntry): string;
export function toPostSummary(post: BlogEntry): PostSummary;
export async function getPublishedPosts(opts?: {
  includeDrafts?: boolean;
  now?: Date;
}): Promise<BlogEntry[]>;
```

**使用方式**

```ts
const posts = await getPublishedPosts();
const summaries = posts.map(toPostSummary);
```

- `getPublishedPosts()` 已排序（`pubDate` 降序、同日 slug），不要再排序。
- 只使用已发布文章；草稿/未来文章由该函数过滤。
- 文章页 `getStaticPaths()` 使用 `getPostSlug()` 作为 `params.slug`。

### 4.3 `src/lib/format.ts`

```ts
export function formatDate(date: Date): string; // 2026.10.18
```

- 统一用 `formatDate()` 显示日期；`<time datetime>` 用 ISO。
- 不要自己写 `toLocaleDateString()`，避免时区差异。

### 4.4 `src/layouts/BaseLayout.astro`

```ts
interface Props {
  title: string;          // 完整标题，来自 pageTitle()
  description: string;
  activeNav?: 'home' | 'blog' | 'about';
  noindex?: boolean;
  image?: string;
}
```

**行为**

- 已包含 Header/Footer、主题切换、跳过链接、`<main id="main">`。
- 页面内容放进 `<BaseLayout>` 的 slot；不要重复 Header/Footer。
- `activeNav="blog"` 用于 `/blog/` 与 `/blog/[slug]/`；`"about"` 用于 `/about/`。
- `/404` 与 `/styleguide` 传 `noindex`。
- 已引入 `tokens.css` 与 `global.css`；omp 不引入这两者。

### 4.5 `src/components/PostCard.astro` / `PostList.astro`

```ts
// PostCard
interface Props {
  post: PostSummary;
  variant?: 'default' | 'featured';
}

// PostList
interface Props {
  posts: PostSummary[];
  emptyText?: string;
}
```

- `/blog/` 使用 `<PostList posts={summaries} />`，不要重写卡片。
- `PostCard` 根元素为 `<article class="post-card">`，每篇一个标题链接；P0 标签是 `#标签` 文本，不链接 `/tags/`。
- 首页由 Claude 使用 `PostCard variant="featured"` 与 `PostList`；omp 不编辑首页。
- 需要调整卡片外观时，提出 `CONTRACT-CHANGE`，不要改组件内部结构。

### 4.6 `src/components/Icon.astro`

```ts
interface Props {
  name: IconName;
  size?: number;   // 默认 20
  class?: string;
}
```

- omp 可用：`copy`、`check`、`chevron-left`、`chevron-right`、`arrow-up-right`。
- 图标默认 `aria-hidden="true"`；独立图标按钮的 `aria-label` 由 omp 提供。

### 4.7 开发端口与 E2E baseURL

两个 agent 同时在各自 worktree 运行 dev server，必须错开端口：

- Claude：默认 `http://localhost:4321`。
- omp：`http://localhost:4322`，命令 `npm run dev -- --port 4322`。
- omp 的 E2E 必须指向自己的端口：
  ```bash
  # Git Bash / WSL
  PLAYWRIGHT_BASE_URL=http://localhost:4322 npm run test:e2e
  # PowerShell
  $env:PLAYWRIGHT_BASE_URL='http://localhost:4322'; npm run test:e2e
  ```
- `playwright.config.ts` 由 Claude 提供并支持 `PLAYWRIGHT_BASE_URL`；omp 不修改该文件。
- 如果 4322 被占用，改用其他端口，并同步更新环境变量。

### 4.8 CSS 与路由

- `tokens.css`、`global.css` 由 Claude 拥有；omp 只能使用 CSS 变量，不添加裸 hex。
- `prose.css` 由 omp 拥有；在 `PostLayout.astro` 中 `import '../styles/prose.css';`。
- omp 可以在自己的组件中使用 scoped `<style>`。
- 路由所有权：

| 路径 | 所有者 |
|---|---|
| `/` | Claude |
| `/blog/` | omp |
| `/blog/[slug]/` | omp |
| `/about/` | omp |
| `/404` | omp |
| `/styleguide` | omp |

---

## 5. 执行步骤

### O1 — `prose.css` 正文排版

- [ ] 从设计系统 §7.7 实现：H2/H3、段落、列表、引用、行内代码、代码块、表格、图片、`figcaption`、脚注、`hr`。
- [ ] 正文宽度 `var(--measure)`；代码块/表格横向滚动。
- [ ] 标题 `scroll-margin-top: 80px`。
- [ ] 只使用 token，不写裸 hex。
- [ ] 先按设计文档写；foundation 就绪后再在浏览器校准。

**验收**

- 长文在 42rem 内可读；宽代码/表格不撑破页面。
- 引用、脚注、图片说明有明确样式。

### O2 — `PostLayout`、TOC、代码复制、上一篇/下一篇

- [ ] `src/layouts/PostLayout.astro`：
  ```ts
  interface Props {
    post: BlogEntry;
    summary: PostSummary;
    headings: MarkdownHeading[];
    prev?: PostSummary;
    next?: PostSummary;
  }
  ```
  - 用 `BaseLayout`，`activeNav="blog"`，`title={pageTitle(post.data.title)}`，`description={post.data.description}`。
  - 文章头部：日期、更新日期、阅读时间、标签、H1、可选摘要、可选封面。
  - 封面用 `astro:assets` 的 `<Image>`，必须有 `coverAlt`。
  - 正文包在 `<article class="prose">`；`<Content />` 由页面传入 slot 或 prop。
  - 桌面右侧 TOC，移动端 `<details>`。
  - 文末 `PrevNext`；不渲染评论。
- [ ] `TableOfContents.astro`：只收 H2/H3；少于 3 项返回 `null`；`<nav aria-label="本文目录">`。
- [ ] `PrevNext.astro`：`prev` 为更早文章（“上一篇”），`next` 为更新文章（“下一篇”）；空值显示“没有更早/更新的文章”。
- [ ] `src/scripts/code-copy.ts`：扫描 `pre`，加复制按钮；成功/失败 `aria-live`；2 秒恢复。
- [ ] `src/scripts/toc-highlight.ts`：IntersectionObserver 高亮当前项；无 JS 时目录仍可用。
- [ ] 不实现评论、系列导航、分享条。

**验收**

- 长文 TOC 锚点跳转不被 Header 遮挡。
- 代码块可键盘聚焦、可横向滚动、可复制。
- 上一篇/下一篇顺序正确；无文章时不报错。

### O3 — 文章列表 `/blog/`

- [ ] `src/pages/blog/index.astro`：
  - `const posts = (await getPublishedPosts()).map(toPostSummary);`
  - `<BaseLayout title={pageTitle('文章')} description={site.description} activeNav="blog">`。
  - 标题“文章”+ 数量；P0 展示全部 12 篇（不分页）。
  - 使用 `<PostList posts={posts} emptyText="还没有文章。" />`。
  - 不加标签筛选、分页、搜索。
- [ ] 列表排序由 `getPublishedPosts()` 保证。

**验收**

- `/blog/` 显示 12 篇；草稿/未来文章不出现。
- 375px 无横向滚动；日期在移动端折叠为元信息。

### O4 — 文章页 `/blog/[slug]/`

- [ ] `getStaticPaths()`：
  ```ts
  const posts = await getPublishedPosts();
  return posts.map((post, i) => ({
    params: { slug: getPostSlug(post) },
    props: {
      post,
      prev: posts[i + 1] ? toPostSummary(posts[i + 1]) : undefined,
      next: posts[i - 1] ? toPostSummary(posts[i - 1]) : undefined,
    },
  }));
  ```
- [ ] `const { Content, headings } = await render(post);`。
- [ ] 传 `summary={toPostSummary(post)}`、`headings`、`prev`、`next` 给 `PostLayout`。
- [ ] 未知 slug 由静态 404 处理；不生成空页面。
- [ ] P0 文章页无评论区块。

**验收**

- `/blog/astro-content-collections/` 有 TOC、代码块、宽表格、图片、脚注。
- `/blog/hello-world/` 少于 3 个标题时不显示 TOC。
- 代码复制、上一篇/下一篇可用。

### O5 — About、404、styleguide

- [ ] `src/pages/about.astro`：`BaseLayout activeNav="about"`；标题、占位简介、社交链接；不写技能条/时间线。
- [ ] `src/pages/404.astro`：`BaseLayout noindex`；大号 404、一句说明、返回首页/浏览文章；P0 不加搜索。
  - 验证时访问未知路由（如 `/does-not-exist/`），不要用 `/404` 当作页面 URL。
- [ ] `src/pages/styleguide.astro`：`BaseLayout noindex`；展示色板、字号、间距、按钮、标签、代码块、正文示例；不进入导航。
- [ ] 三页复用 `prose.css` 与 token；不新增全局样式。

**验收**

- 未知路由在 `npm run preview` 下返回 HTTP 404，并显示自定义 404 页面。
- About 在 375/1440 正常排版。
- styleguide 不出现在公开导航，且 `noindex`。

### O6 — 测试

- [ ] `tests/e2e/blog.spec.ts`：`/blog/` 200、12 篇、标题/日期/标签、375px 无横向滚动。
- [ ] `tests/e2e/post.spec.ts`：长文 200、TOC 锚点、代码复制、上一篇/下一篇、封面 `alt`；短文无 TOC。
- [ ] `tests/e2e/a11y.spec.ts`：`/blog/`、长文、`/about/`、`/404` 的 axe 无 serious/critical。
- [ ] 复用 Claude 的 `playwright.config.ts`；不修改它。
- [ ] 在 content checkpoint 就绪并 rebase 后运行（omp dev 使用 4322）。先在一个终端启动 dev server：

```bash
npm install
npm run check
npm run dev -- --port 4322
```

- [ ] 在另一个终端运行 E2E（`PLAYWRIGHT_BASE_URL` 设置后，Claude 的 config 不再自动启动 webServer）：

```bash
# Git Bash / WSL
PLAYWRIGHT_BASE_URL=http://localhost:4322 npm run test:e2e
# PowerShell
$env:PLAYWRIGHT_BASE_URL='http://localhost:4322'; npm run test:e2e
```

**验收**

- omp 的 spec 全部通过；没有修改 Claude 的 spec。
- axe 无 serious/critical。

### O7 — 集成检查与交接

- [ ] `git rebase feat/p0-claude-home`（含 12 篇示例内容；如 Claude 分支更新，再次 rebase）。
- [ ] 运行 `npm run check`、`npm run build`。
- [ ] 启动 `npm run dev -- --port 4322`，再运行 `PLAYWRIGHT_BASE_URL=http://localhost:4322 npm run test:e2e`（PowerShell 用 `$env:PLAYWRIGHT_BASE_URL='http://localhost:4322'; npm run test:e2e`）。
- [ ] 手工检查 375/768/1024/1440、Light/Dark。
- [ ] 记录 commit SHA、测试结果、已知问题。
- [ ] 通知 Claude：omp 分支就绪，可创建 `feat/p0-integration`。
- [ ] 不合并到 `main`，等用户确认。

---

## 6. 完成标准

- [ ] `/blog/`、`/blog/[slug]/`、`/about/`、`/styleguide` 可访问；未知路由正确显示 404 页面。
- [ ] P0 列表展示 12 篇；文章页 TOC/代码复制/上一篇/下一篇可用。
- [ ] `prose.css` 符合设计系统；宽代码/表格不撑破页面。
- [ ] omp 的 Playwright + axe 通过。
- [ ] 未修改 Claude 拥有的文件；契约无未通知变更。
- [ ] 未引入部署、评论、分析、P1 功能。

---

## 7. 协作规则

1. **独立 worktree**：`../博客-omp`；不要在主工作区写。
2. **分支**：`feat/p0-omp-pages`；从 `main` 创建，foundation 就绪后 rebase。
3. **无 remote**：不要 `git push`；通过本地分支/worktree 共享。
4. **契约冻结**：Claude 的 foundation 检查点后，只消费 §4 契约；需要变更时提交 `CONTRACT-CHANGE` 并通知。
5. **禁止跨文件编辑**：只改 §3.1 文件；需要改 Claude 文件时通知。
6. **依赖**：不新增依赖；需要时由 Claude 修改 `package.json`。
7. **提交规范**：遵循 [Git 工作流](../git-workflow.md)；建议提交：
   - `feat(post): 实现文章页、目录与代码复制`
   - `feat(blog): 实现文章列表`
   - `feat(pages): 添加 About、404 与 styleguide`
   - `test(pages): 添加文章与页面烟测`
8. **不做部署**：不写 `_headers`、`_redirects`、环境变量、CI/CD、Cloudflare 配置。

---

## 8. 交接清单

- [ ] 分支名 + commit SHA。
- [ ] `npm run check` / `npm run build` / `npm run test:e2e` 结果。
- [ ] 契约变更（如有）。
- [ ] 已知问题。
- [ ] 是否已 rebase 到最新 foundation。
- [ ] Claude 可以开始集成。

---

## 9. 下一步（P1）

P0 完成后的 P1 任务见 [P1 并行实施](./p1-parallel.md)：omp 负责分页、标签、归档、搜索页；Claude Code 负责 SEO / Feed / 构建集成。agy 负责前端视觉设计与 P1 组件视觉规格。

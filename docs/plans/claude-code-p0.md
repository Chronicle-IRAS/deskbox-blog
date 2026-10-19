# Claude Code · P0 实施文档

**执行者：** Claude Code  
**轨道：** Foundation + Content + Home + Integration  
**分支：** `feat/p0-claude-foundation` → `feat/p0-claude-home`  
**并行方：** omp，独立 worktree `../博客-omp`，分支 `feat/p0-omp-pages`  
**范围：** 只做 P0；部署、评论、分析、P1 功能全部不做。  
**依赖文档：** [原型架构](../architecture.md) · [视觉设计](../design.md) · [设计系统](../../design-system/deskbox-blog/MASTER.md) · [原型计划](../prototype-plan.md)

---

## 1. 任务目标

Claude Code 负责“项目骨架 + 内容管线 + 共享外壳 + 首页”，并作为最终集成者：

1. 建立可构建的 Astro 7 项目与共享契约。
2. 实现内容集合、Zod schema、12 篇已发布示例 + 1 草稿 + 1 未来文章。
3. 实现共享 `BaseLayout`、Header/Footer、主题切换、`PostCard`/`PostList`。
4. 实现首页 `/`。
5. 编写内容/日期/阅读时间单元测试，以及首页/主题 E2E。
6. 合并 omp 分支后跑完整 P0 验证。

**不做**

- `/blog/`、`/blog/[slug]/`、`/about/`、`/404`、`/styleguide`（omp 负责）。
- `PostLayout`、TOC、代码复制、`prose.css`（omp 负责）。
- 标签、归档、分页、搜索、RSS、sitemap（P1）。
- 部署、域名、CI/CD、评论、分析、多语言、OG 图。

---

## 2. 分支与工作区

> **前置：** 先把 `docs/plans/*.md` 与相关链接提交到 `main`，否则从 `main` 创建的 worktree 里看不到本计划。

Claude 使用当前主工作区 `C:/Users/Lenovo/DeskBox/博客`：

```bash
git switch main
git switch -c feat/p0-claude-foundation
# Phase F 完成后提交 foundation
git switch -c feat/p0-claude-home
# Phase C 内容与首页
```

- foundation 分支是 omp 的 rebase 基线；F6 后不要改写已通知的提交。
- 本仓库暂无 remote；不要 `git push`。
- omp 在 `../博客-omp` 独立 worktree 工作；不要在主工作区同时启动两个 agent。

---

## 3. 文件所有权

### 3.1 Claude Code 创建 / 修改

```text
package.json
package-lock.json
astro.config.mjs
tsconfig.json
.gitignore
.gitattributes
playwright.config.ts
src/env.d.ts
src/content.config.ts
src/data/site.ts
src/data/tags.ts
src/lib/posts.ts
src/lib/format.ts
src/lib/reading-time.ts
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
```

### 3.2 Claude Code 禁止修改

```text
src/pages/blog/**
src/pages/about.astro
src/pages/404.astro
src/pages/styleguide.astro
src/layouts/PostLayout.astro
src/components/TableOfContents.astro
src/components/PrevNext.astro
src/styles/prose.css
src/scripts/code-copy.ts
src/scripts/toc-highlight.ts
tests/e2e/blog.spec.ts
tests/e2e/post.spec.ts
tests/e2e/a11y.spec.ts
docs/plans/omp-p0.md
```

> 需要改对方文件时，先在提交/PR 中写明 `CONTRACT-CHANGE`，由对方修改；不要直接编辑。

---

## 4. 共享契约（冻结后双方遵守）

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
    { label: '关于', href: '/about/' },
  ] satisfies NavItem[],
  social: [
    { label: 'GitHub', href: 'https://github.com/', icon: 'github' },
    { label: 'Email', href: 'mailto:hello@example.com', icon: 'mail' },
  ] satisfies SocialLink[],
  footer: '© 2026 DeskBox',
};

export function pageTitle(title?: string): string {
  return title ? `${title} · ${site.name}` : site.name;
}
```

- `pageTitle()` 返回完整 `<title>`；页面把结果传给 `BaseLayout.title`。
- 原型阶段 `site.url` 固定 `http://localhost:4321`；不做部署配置。

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

**约定**

- `getPublishedPosts()` 过滤 `draft` 与未来日期（`Asia/Shanghai` 日历日），按 `pubDate` 降序、同日按 `slug` 排序。
- `toPostSummary()` 必须包含阅读时间，使用 `readingTime()`。
- `PostSummary.slug` 是 frontmatter 的 ASCII slug，不是文件路径。
- omp 的页面只消费这些函数，不直接读 `src/content/blog`。

### 4.3 `src/lib/format.ts`

```ts
export function formatDate(date: Date): string; // 2026.10.18
```

- 固定 `timeZone: 'Asia/Shanghai'`。
- `formatDate()` 只负责显示；`<time datetime>` 用 ISO。

### 4.4 `src/components/PostCard.astro` / `PostList.astro`

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

- `PostCard` 根元素固定为 `<article class="post-card">`，只输出一个标题链接 `/blog/${post.slug}/`；日期、摘要、标签、阅读分钟为文本。
- P0 标签只显示为 `#标签` 文本，不链接到 `/tags/`（P1 再加链接）。
- `variant="featured"` 用于首页最新文章；`default` 用于列表。
- `PostList` 输出 `<div class="post-list">`，每篇一个 `PostCard`；空数组显示 `emptyText` 或默认空状态。
- 样式由 Claude 在组件内实现；omp 只负责外层页面布局，不改组件内部结构。

### 4.5 `src/layouts/BaseLayout.astro`

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

- 输出 `<html lang="zh-CN">`、meta viewport、title/description、可选 robots noindex、可选 OG image。
- `<head>` 内阻塞加载 `/scripts/theme-init.js`，避免主题闪烁。
- 输出跳过链接、`SiteHeader`、`<main id="main"><slot /></main>`、`SiteFooter`。
- 不包裹 `<article>`；文章语义由 `PostLayout` 负责。
- 引入 `tokens.css` 与 `global.css`；不引入 `prose.css`。

### 4.6 `src/components/Icon.astro`

```ts
interface Props {
  name: IconName;
  size?: number;   // 默认 20
  class?: string;
}
```

- 内联 SVG，`stroke-width: 1.5`，`currentColor`。
- 默认 `aria-hidden="true"`、`focusable="false"`。
- 独立按钮的 `aria-label` 由父组件提供。

### 4.7 开发端口与 E2E baseURL

两个 agent 同时在各自 worktree 运行 dev server，必须错开端口：

- Claude：默认 `http://localhost:4321`。
- omp：`http://localhost:4322`，命令 `npm run dev -- --port 4322`。
- `playwright.config.ts` 必须支持环境变量覆盖，避免 omp 的测试打到 Claude 的 dev server：

```ts
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
  use: { baseURL },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: 'npm run dev', port: 4321 },
});
```

- omp 运行测试时：
  ```bash
  # Git Bash / WSL
  PLAYWRIGHT_BASE_URL=http://localhost:4322 npm run test:e2e
  # PowerShell
  $env:PLAYWRIGHT_BASE_URL='http://localhost:4322'; npm run test:e2e
  ```
- 不要修改对方的端口或 `playwright.config.ts`。

### 4.8 路由与 CSS 所有权

| 路径 | 所有者 | 说明 |
|---|---|---|
| `/` | Claude | 首页 |
| `/blog/` | omp | 文章列表（P0 展示全部 12 篇） |
| `/blog/[slug]/` | omp | 文章详情 |
| `/about/` | omp | 关于 |
| `/404` | omp | 404 |
| `/styleguide` | omp | `noindex` 参考页 |

- Claude 拥有 `tokens.css`、`global.css`；omp 不得添加全局 token 或裸 hex。
- omp 拥有 `prose.css` 与自身组件的 scoped styles。
- 如果 omp 缺 token，向 Claude 提出 `CONTRACT-CHANGE`，由 Claude 加到 `tokens.css`。

---

## 5. 执行步骤

### Phase F — Foundation checkpoint（必须先完成）

> 这是 omp 解除阻塞的检查点。完成后冻结契约，通知 omp rebase。

- [ ] **F1 初始化项目**
  - 在现有工作区用 `npm create astro@latest` 选择 minimal + strict TypeScript。
  - 安装 P0 依赖：`npm install @astrojs/mdx remark-gfm`。
  - 安装开发依赖：`npm install -D @astrojs/check typescript vitest @playwright/test @axe-core/playwright`。
  - 配置 `package.json` scripts：
    ```json
    {
      "dev": "astro dev",
      "check": "astro check && tsc --noEmit",
      "test": "vitest run",
      "build": "astro build",
      "preview": "astro preview",
      "test:e2e": "playwright test"
    }
    ```
  - `astro.config.mjs`：`site: 'http://localhost:4321'`、`trailingSlash: 'always'`、`build.format: 'directory'`、MDX、`remark-gfm`、Shiki 双主题。
  - 添加 `.gitattributes`：`* text=auto eol=lf`。
  - 添加 `src/env.d.ts`（如 create-astro 未生成）。

- [ ] **F2 内容模型**
  - `src/content.config.ts`：按架构 §6.2 实现 schema；`tags` 用注册表 `z.enum(tagNames)`。
  - 创建 `src/content/blog/`（可放 `.gitkeep`，C1 再填内容）。
  - `src/data/tags.ts`：5 个示例标签（前端、后端、工程实践、阅读、生活）+ ASCII slug。
  - `src/lib/format.ts`、`src/lib/reading-time.ts`、`src/lib/posts.ts`：实现 §4.2/§4.3 契约。
  - `src/data/site.ts`：实现 §4.1 契约。

- [ ] **F3 样式基础**
  - `src/styles/tokens.css`：从设计系统复制 token；`light-dark()` + `[data-theme]` 覆盖。
  - `src/styles/global.css`：reset、body、链接、焦点环、容器、`sr-only`、`skip-link`、Header/Footer 基础。
  - `src/styles/fonts.css`：P0 系统字体栈；留空或仅注释，P1 再接 webfont。

- [ ] **F4 共享外壳**
  - `src/layouts/BaseLayout.astro`：实现 §4.5。
  - `src/components/SiteHeader.astro`：P0 导航“文章 / 关于”；移动端 `<details>` 菜单；`aria-current`。
  - `src/components/SiteFooter.astro`：GitHub / Email / 版权。
  - `src/components/ThemeToggle.astro`：44×44、`aria-pressed`、标签随状态变化。
  - `src/components/Icon.astro`：实现 §4.6。
  - `public/scripts/theme-init.js`：`<head>` 阻塞执行，读 localStorage / `prefers-color-scheme`。

- [ ] **F5 文章卡片**
  - `src/components/PostCard.astro` / `PostList.astro`：实现 §4.4。
  - 临时 `src/pages/index.astro`：只渲染 `BaseLayout` + “P0 foundation”占位，确保构建有页面；Phase C 替换。

- [ ] **F6 检查点提交**
  - 运行 `npm run check`、`npm run build`。
  - 提交：`build(config): 初始化 Astro 7 与 P0 共享契约`
  - 记录分支与 commit SHA；通知 omp：基础检查点已就绪，可以 rebase。
  - 冻结 §4 契约；后续变更必须单独提交并通知。

> **Content checkpoint：** C1 完成后，把 `feat/p0-claude-home` 的 commit SHA 通知 omp；omp 需要 rebase 到该分支才能测试 12 篇文章列表/文章页。

**F 验收**

- `npm run dev` 可打开临时首页。
- `npm run check`、`npm run build` 通过。
- `BaseLayout` 可渲染 Header/Footer/主题切换。
- `getPublishedPosts()` 可返回空数组（内容稍后加）。

---

### Phase C — Content + Home + tests

- [ ] **C1 示例内容（12 + 2）**
  - 按 [原型计划 §2](../prototype-plan.md#2-示例内容矩阵) 创建文章目录。
  - 12 篇已发布：`hello-world`、`astro-content-collections`、`reading-notes`、`post-01`…`post-09`。
  - 1 篇 `draft-example`、1 篇 `future-example`。
  - 至少 1 篇 `.mdx` 包含代码块、宽表格、图片、脚注；封面提供 `coverAlt`。
  - 不写真实个人信息、密钥或敏感内容。

- [ ] **C2 首页**
  - 替换临时 `src/pages/index.astro`。
  - 桌面 7/5：左侧站点名/简介/社交；右侧最新文章 `PostCard variant="featured"`。
  - “最近文章”从第 2 篇开始取 6 篇，避免与最新文章重复；使用 `PostList`；空状态按设计。
  - 移动端堆叠；日期列折叠为元信息。
  - 使用 `pageTitle()`、`site`、`getPublishedPosts()`。

- [ ] **C3 单元测试**
  - `tests/unit/posts.test.ts`：排序、过滤、slug 唯一、`toPostSummary` 字段。
  - `tests/unit/format.test.ts`：时区不倒退。
  - `tests/unit/reading-time.test.ts`：中英文、空内容。
  - 测试 fixture 可在测试内构造，不依赖完整内容目录。

- [ ] **C4 E2E**
  - `playwright.config.ts`：`testDir: './tests/e2e'`、`baseURL: 'http://localhost:4321'`、`webServer: { command: 'npm run dev', port: 4321 }`、Chromium。
  - `tests/e2e/home.spec.ts`：首页 200、最新文章/最近文章、空状态不出现（有内容时）。
  - `tests/e2e/theme.spec.ts`：切换、刷新保持、系统暗色首屏无闪烁。
  - `npx playwright install chromium`。

- [ ] **C5 提交**
  - `feat(content): 添加 P0 示例文章`
  - `feat(home): 实现首页与文章卡片`
  - `test(content): 覆盖内容排序、日期与阅读时间`
  - 运行 `npm run check`、`npm run test`、`npm run build`。

**C 验收**

- 首页显示 12 篇已发布文章中的最新 + 最近 6 篇。
- 草稿/未来文章不出现。
- `npm run check`、`npm run test`、`npm run build` 通过。
- 375/1440 无横向滚动；主题切换持久化。

---

### Phase I — 集成（等 omp 分支就绪）

- [ ] **I1 创建集成分支**
  - 从 Claude 最新分支创建 `feat/p0-integration`。
  - 合并/变基 `feat/p0-omp-pages`；只在冲突涉及 Claude 文件时由 Claude 解决。

- [ ] **I2 契约检查**
  - `BaseLayout` props、`site`、`PostSummary`、`PostCard/PostList`、`Icon` 与 §4 一致。
  - omp 没有修改 Claude 拥有的文件；`git diff` 确认。

- [ ] **I3 全量验证**
  - `npm run check`
  - `npm run test`
  - `npm run build`
  - `npm run test:e2e`（Claude + omp 的 spec）
  - `npm run preview` 手工检查 375/768/1024/1440、Light/Dark。
  - axe：首页/文章/404 无 serious/critical。

- [ ] **I4 交付**
  - 记录 P0 结果、已知问题、未做项（部署/评论/分析/P1）。
  - 不合并到 `main`，等用户确认。

**I 验收**

- 所有 P0 路由可访问。
- 首页 → 列表 → 文章 → About → 404 路径完整。
- 无横向滚动；TOC 锚点不被 Header 遮挡；代码复制可用。
- 无部署/评论/分析代码或依赖。

---

## 6. 完成标准

- [ ] `npm run dev` 可浏览 P0 全部路由。
- [ ] `npm run build` 成功。
- [ ] 12 篇已发布 + 2 篇未发布示例内容。
- [ ] 首页、共享外壳、文章卡片符合设计线框。
- [ ] 单元测试 + 首页/主题 E2E 通过。
- [ ] 与 omp 分支集成后全量检查通过。
- [ ] 契约未在未通知的情况下变更。
- [ ] 未引入部署、评论、分析、P1 功能。

---

## 7. 协作规则

1. **独立 worktree**：Claude 使用当前 `C:/Users/Lenovo/DeskBox/博客`；omp 使用 `../博客-omp`。不要在同一工作区同时写。
2. **分支**：`feat/p0-claude-foundation` → `feat/p0-claude-home`；集成用 `feat/p0-integration`。
3. **无 remote**：本仓库暂无远程；分支共享通过同一 Git 仓库/worktree。不要执行 `git push`。
4. **契约冻结**：F6 后 §4 变更必须单独提交并在提交信息写 `CONTRACT-CHANGE`；omp rebase 后重新验证。
5. **禁止跨文件编辑**：只改 §3.1 文件；需要改 omp 文件时通知 omp。
6. **依赖**：不新增依赖；omp 需要时由 Claude 加 `package.json` 并说明。
7. **提交规范**：遵循 [Git 工作流](../git-workflow.md)；一个小提交只做一件事。
8. **不做部署**：不写 `_headers`、`_redirects`、环境变量、CI/CD、Cloudflare 配置。

---

## 8. 交接清单

- [ ] 分支名 + commit SHA。
- [ ] `npm run check/test/build` 结果。
- [ ] 契约是否有变更（有则列出）。
- [ ] 集成分支状态。
- [ ] 已知问题与未做项。
- [ ] omp 是否可以开始 rebase / 集成。

---

## 9. 下一步（P1）

P0 完成后的 P1 任务见 [P1 并行实施](./p1-parallel.md)：Claude Code 负责 SEO / Feed / 构建集成，omp 负责分页 / 标签 / 归档 / 搜索页。agy 的前端设计任务见 [agy 前端设计任务书](./agy-frontend-design.md)。

# 个人博客 · 原型实施计划

**Goal:** 先做出本地可运行、可交互、可检查的静态博客原型，验证视觉系统、内容模型与核心阅读路径。  
**Spec:** [原型架构](./architecture.md) · [视觉与交互设计](./design.md) · [设计系统](../design-system/deskbox-blog/MASTER.md)  
**Stack:** Astro 7.x、TypeScript strict、Content Collections、原生 CSS token、Pagefind（P1）、Vitest / Playwright（基础烟测）

**不在原型内：** 部署、域名、CDN、HTTPS/headers、CI/CD、评论、分析、多语言、OG 图生成、定时发布。

---

## 1. 完成定义

### P0 — 可看的原型

- [ ] `npm install` 后 `npm run dev` 可打开首页。
- [ ] `npm run build` 成功，产出 `dist/`。
- [ ] P0 路由：`/`、`/blog/`、`/blog/<slug>/`、`/about/`、`/404`。
- [ ] 12 篇已发布示例文章 + 1 篇草稿 + 1 篇未来文章（后两者不出现在页面）。
- [ ] 首页、文章列表、文章页按设计线框落地；正文 42rem。
- [ ] Light / Dark / 跟随系统；刷新无闪烁；切换持久化。
- [ ] 375 / 768 / 1024 / 1440 无横向滚动。
- [ ] 文章页 TOC、代码复制、上一篇/下一篇。
- [ ] `npm run check`、`npm run test` 通过；P0 烟测通过。
- [ ] 无第三方请求；无 emoji 图标；无部署/评论/分析代码。

### P1 — 能读的原型

- [ ] `/blog/page/2/` 分页可访问（10 篇/页）。
- [ ] `/tags/`、`/tags/<tag>/`、`/archive/` 可用。
- [ ] `/search/` 中文关键词返回结果；无结果状态正确。
- [ ] `/rss.xml`、`/sitemap-index.xml`、`/robots.txt` 生成。
- [ ] SEO 组件输出 title/description/canonical/OG/JSON-LD。
- [ ] 自托管 Latin 字体子集完成对比与接入。
- [ ] P1 烟测扩展通过；构建产物体积记录。

### P2 — 原型评审

- [ ] 设计文档 §9 内容压力测试通过。
- [ ] axe 无 serious/critical。
- [ ] 已知问题列表与冻结基线。

---

## 1.5 并行实施拆分

两条轨道使用**独立 worktree**，文件所有权不重叠：

| 轨道 | 执行者 | 负责任务 | 文档 |
|---|---|---|---|
| Foundation + Content + Home + Integration | Claude Code | Task 1–5、Task 9 | [Claude Code P0](./plans/claude-code-p0.md) |
| Content Routes + Article Reading | omp | Task 6–8 + 自己的 E2E | [omp P0](./plans/omp-p0.md) |
| Frontend Design Refinement | agy | 视觉/响应式/暗色/可访问性打磨（P0 基线） | [agy 前端设计任务书](./plans/agy-frontend-design.md) |

**依赖与检查点**

- Task 1–4 是共享 foundation：Claude Code 先落地并提交 `feat/p0-claude-foundation`，omp 随后 rebase。
- 内容模型在 foundation 中；C1 的 12 篇示例内容随 Claude 的 `feat/p0-claude-home` 交付，omp 的最终列表/文章测试要 rebase 到该分支。
- omp 在 foundation 就绪前可以先写 `prose.css`、`PostLayout`、TOC、文章页等不依赖构建的文件；不要创建 `package.json` 或改共享文件。
- 共享契约（`site`、`PostSummary`、`BaseLayout` props、`PostCard/PostList`、`Icon`）在两份执行文档中一致；变更必须通知对方。
- P0 完成后的下一步见 [P1 并行实施](./plans/p1-parallel.md)。
- 集成由 Claude Code 在 `feat/p0-integration` 完成，跑全量 P0 检查后交给用户确认。

---

## 2. 示例内容矩阵

> 原型内容只用于验证版式，不代表作者真实经历。标题可替换为占位文案。

| slug | 类型 | 标签 | 目的 |
|---|---|---|---|
| `hello-world` | 短文 | 生活 | 最小文章、无封面、无 TOC |
| `astro-content-collections` | 长文 | 前端、工程实践、后端 | 代码块、宽表格、封面、图片、脚注、多级标题 |
| `reading-notes` | 长文 | 阅读 | 纯中文长段落、引用、列表、无代码 |
| `post-01` … `post-06` | 短文 | 前端 / 工程实践 | 列表密度、日期排序、标签换行 |
| `post-07` | 短文 | 无标签 | 无标签状态 |
| `post-08` | 短文 | 阅读 | 超长中文标题 |
| `post-09` | 短文 | 前端 | 超长英文 slug/标签 |
| `draft-example` | 草稿 | — | 验证构建过滤（不显示） |
| `future-example` | 未来日期 | — | 验证时间过滤（不显示） |

**要求**

- 12 篇已发布文章足以触发第 2 页（10 篇/页）。
- 至少 1 篇无封面、1 篇无标签、1 篇长标题、1 篇宽代码、1 篇宽表格。
- 示例图片放在文章同目录；封面提供 `coverAlt`。
- 文章内不写真实个人信息、密钥或不可公开内容。

---

## 3. 文件清单（目标）

```text
blog/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── public/
│   ├── favicon.svg
│   ├── fonts/                  # P1：Latin 子集 + LICENSE
│   └── scripts/theme-init.js
├── src/
│   ├── content.config.ts
│   ├── content/blog/           # 示例文章目录
│   ├── data/
│   │   ├── site.ts
│   │   └── tags.ts
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── PostLayout.astro
│   ├── components/
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro
│   │   ├── Seo.astro          # P1
│   │   ├── PostCard.astro
│   │   ├── PostList.astro
│   │   ├── TagList.astro
│   │   ├── Pagination.astro   # P1
│   │   ├── TableOfContents.astro
│   │   ├── PrevNext.astro
│   │   └── Icon.astro
│   ├── lib/
│   │   ├── posts.ts
│   │   ├── format.ts
│   │   ├── reading-time.ts
│   │   ├── seo.ts             # P1
│   │   └── urls.ts            # P1
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── fonts.css          # P1 接入
│   │   ├── global.css
│   │   └── prose.css
│   ├── scripts/
│   │   ├── code-copy.ts
│   │   └── toc-highlight.ts
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── 404.astro
│   │   ├── styleguide.astro   # 仅 DEV
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   ├── [slug].astro
│   │   │   └── page/[page].astro   # P1
│   │   ├── tags/              # P1
│   │   ├── archive.astro      # P1
│   │   ├── search.astro       # P1
│   │   ├── rss.xml.ts         # P1
│   │   └── robots.txt.ts      # P1
│   └── env.d.ts
├── tests/
│   ├── unit/
│   └── e2e/
└── docs/
```

---

## 4. P0 任务

### Task 1：初始化 Astro 项目

**文件**

- 创建：`package.json`、`astro.config.mjs`、`tsconfig.json`、`.gitignore`、`src/env.d.ts`

**步骤**

- [ ] 在空目录用 `npm create astro@latest` 选择 minimal template + strict TypeScript（按当前 CLI 提示）。
- [ ] P0 安装依赖：`npm install @astrojs/mdx remark-gfm`。
- [ ] 安装开发依赖：`npm install -D @astrojs/check typescript vitest @playwright/test @axe-core/playwright`。
- [ ] 配置 scripts：

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

> P1 再安装 `@astrojs/rss`、`@astrojs/sitemap`、`pagefind`，并把 `build` 改为 `astro build && pagefind --site dist`。

- [ ] `astro.config.mjs`：`site: 'http://localhost:4321'`（原型占位）、`trailingSlash: 'always'`、`build.format: 'directory'`、MDX、`remark-gfm`、Shiki 双主题、`defaultColor: false`。
- [ ] `npm run dev` 打开默认页；`npm run build` 成功。

**验收**

- 开发服务器可启动；默认页可访问。
- 构建输出 `dist/`。
- 无部署配置、无环境变量。

---

### Task 2：内容模型与示例文章

**文件**

- 创建：`src/content.config.ts`、`src/data/tags.ts`、`src/data/site.ts`
- 创建：`src/lib/posts.ts`、`src/lib/format.ts`、`src/lib/reading-time.ts`
- 创建：`src/content/blog/**/index.md|mdx`（12 + 2 篇）

**步骤**

- [ ] 按架构 §6.2 实现 schema；`tags` 使用注册表 `z.enum(tagNames)`。
- [ ] 实现 `tags` 注册表（5 个示例标签，ASCII slug）。
- [ ] 实现 `getPublishedPosts()`：过滤 `draft`、未来日期（按 `Asia/Shanghai` 日历日），按 `pubDate` 降序、同日按 slug。
- [ ] 实现 slug 唯一性检查；重复时构建/测试失败。
- [ ] 实现 `formatDate()`：`2026.10.18`，固定 `timeZone: 'Asia/Shanghai'`。
- [ ] 实现 `readingTime()`：中文 300 字/分钟、英文 200 词/分钟；空内容返回 1 分钟。
- [ ] 按 §2 内容矩阵创建示例文章；至少 1 篇 `.mdx` 包含代码/表格/图片。
- [ ] 添加单元测试：排序、过滤、日期格式、阅读时间、schema 失败场景。

**验收**

- `getPublishedPosts()` 返回 12 篇；草稿与未来文章不出现。
- 未知标签、缺 `coverAlt`、`updatedDate < pubDate` 构建失败。
- `npm run test` 通过。

---

### Task 3：Token、全局样式与正文排版

**文件**

- 创建：`src/styles/tokens.css`、`src/styles/global.css`、`src/styles/prose.css`、`src/styles/fonts.css`
- 创建：`src/layouts/BaseLayout.astro`
- 创建：`src/pages/styleguide.astro`（仅 DEV）

**步骤**

- [ ] 从设计系统复制 token；P0 使用系统字体栈，`fonts.css` 先留空或仅注释。
- [ ] `global.css`：reset、`body`、链接、焦点环、容器、Header/Footer 基础、`sr-only`、`skip-link`。
- [ ] `prose.css`：H2/H3、段落、列表、引用、行内代码、代码块、表格、图片、脚注、`scroll-margin-top`。
- [ ] 主题：`:root { color-scheme: light dark; }` + `light-dark()`；显式 `[data-theme]` 覆盖。
- [ ] `styleguide.astro` 展示色板、字号、间距、按钮、标签、代码块、正文示例；标记 `noindex`，不进入导航，作为开发参考页保留。
- [ ] 在 BaseLayout 引入全局样式。

**验收**

- styleguide 可检查 token；颜色/字号/间距与 MASTER 一致。
- 暗色模式 token 生效；无裸 hex 散落在组件。
- 正文 42rem；中文 16–17px / 1.85。

---

### Task 4：BaseLayout、Header、Footer、主题切换

**文件**

- 修改：`src/layouts/BaseLayout.astro`
- 创建：`src/components/SiteHeader.astro`、`SiteFooter.astro`、`Icon.astro`
- 创建：`public/scripts/theme-init.js`

**步骤**

- [ ] BaseLayout：`<html lang="zh-CN">`、meta viewport、title/description props、skip link、`<main id="main">`、Header/Footer。
- [ ] Header：P0 导航“文章 / 关于”；当前项 `aria-current="page"`；移动端 `<details>` 菜单；右侧主题切换。
- [ ] Footer：GitHub / Email / 版权占位；P1 加 RSS。
- [ ] `theme-init.js`：读取 `localStorage.theme`，否则跟随 `prefers-color-scheme`；设置 `data-theme` 与 `color-scheme`；放在 `<head>` 阻塞执行。
- [ ] 主题切换按钮：44×44、`aria-pressed`、标签随状态变化；点击写入 localStorage。
- [ ] 图标使用内联 SVG（Lucide path），装饰性 `aria-hidden`。

**验收**

- 刷新无主题闪烁；系统暗色首屏正确。
- 键盘可操作菜单与切换按钮。
- P0 不显示搜索/标签/归档入口。

---

### Task 5：首页

**文件**

- 创建：`src/pages/index.astro`
- 创建：`src/components/PostCard.astro`、`src/components/PostList.astro`
- 创建：`src/data/site.ts`（如未在 Task 2 完成）

**步骤**

- [ ] 桌面 7/5 双栏：左侧站点名/定位/简介/社交；右侧最新文章主推块。
- [ ] “最近文章”列表 6 篇：日期、标题、标签、阅读时间；不显示摘要或最多 2 行。
- [ ] 移动端堆叠；日期列折叠为元信息。
- [ ] 空状态：无文章时显示“第一篇文章正在路上。”
- [ ] 占位文案集中放在 `site.ts`，组件不写死。

**验收**

- 对照设计 §4.1 线框；375/1440 无溢出。
- 最新文章不出现在“最近文章”列表；最近列表从第 2 篇起取 6 篇。
- 所有链接可点击；无 CSS 阴影/位移悬停。

---

### Task 6：文章列表

**文件**

- 创建：`src/pages/blog/index.astro`
- 复用：`PostList`、`PostCard`

**步骤**

- [ ] 页面标题“文章”+ 数量。
- [ ] P0 展示全部 12 篇（P1 改为 10 篇/页）。
- [ ] 每行日期 + 标题 + 摘要（2 行）+ 标签/阅读时间。
- [ ] 排序按 `pubDate` 降序；空状态。
- [ ] 移动端日期折叠到标题上方。

**验收**

- 12 篇均出现；标题不截断；摘要最多 2 行。
- 无横向滚动；行悬停仅背景/边框变化。

---

### Task 7：文章页、TOC、代码复制、上一篇/下一篇

**文件**

- 创建：`src/pages/blog/[slug].astro`、`src/layouts/PostLayout.astro`
- 创建：`src/components/TableOfContents.astro`、`PrevNext.astro`
- 创建：`src/scripts/code-copy.ts`、`src/scripts/toc-highlight.ts`（或组件内脚本）

**步骤**

- [ ] `getStaticPaths()` 使用已发布文章；`slug` 作为参数。
- [ ] 文章头部：日期、更新日期、阅读时间、标签、H1、可选摘要、可选封面。
- [ ] `render(entry)` 输出正文；`headings` 传给 TOC。
- [ ] TOC 只收 H2/H3；少于 3 项隐藏；桌面 sticky；移动端 `<details>`。
- [ ] TOC 当前项高亮（IntersectionObserver，渐进增强）。
- [ ] 代码复制按钮：事件委托；成功/失败 `aria-live`；2 秒恢复。
- [ ] 上一篇/下一篇按发布时间；没有则显示对应文案。
- [ ] 未知 slug 由静态 404 处理；不生成空页面。

**验收**

- 长文 TOC 锚点跳转不被 Header 遮挡。
- 宽代码块横向滚动且可键盘聚焦；复制可用。
- 上一篇/下一篇顺序正确。
- 无评论区块。

---

### Task 8：About、404、styleguide 收尾

**文件**

- 创建/修改：`src/pages/about.astro`、`src/pages/404.astro`、`src/pages/styleguide.astro`

**步骤**

- [ ] About：标题、占位简介、社交链接；无技能条/时间线装饰。
- [ ] 404：大号 404、一句说明、返回首页/浏览文章；P1 加搜索。
- [ ] styleguide：`noindex`、不进入导航、不链接到公开页面；作为开发参考页保留。
- [ ] 三页复用 BaseLayout 与 prose 样式。

**验收**

- 404 返回 HTTP 404（本地 preview 验证）。
- About 在 375/1440 正常排版。
- styleguide 不出现在公开导航，且 `noindex`。

---

### Task 9：P0 验证

**步骤**

- [ ] `npm run check` 通过。
- [ ] `npm run test` 通过。
- [ ] `npm run build` 成功；`npm run preview` 可浏览。
- [ ] 创建 `playwright.config.ts`：`testDir: './tests/e2e'`、`baseURL: 'http://localhost:4321'`、`webServer: { command: 'npm run dev', port: 4321 }`、Chromium。
- [ ] `npx playwright install chromium`。
- [ ] 创建 `tests/e2e/smoke.spec.ts`：路由 200、主题持久化、移动端无溢出、TOC 锚点、代码复制、404。
- [ ] axe：首页/文章/404 无 serious/critical。
- [ ] 手工按设计 §9.1/§9.2 检查视口与内容压力。
- [ ] 记录初始 JS/CSS 体积。

**P0 完成**

- 可交互原型可演示；视觉与内容模型得到验证；没有部署/评论/分析代码。

---

## 5. P1 任务

### Task 10：分页

- [ ] `/blog/` 改为 10 篇/页。
- [ ] 新增 `/blog/page/[page]/`，生成第 2 页。
- [ ] `Pagination` 组件：当前页、上一页/下一页、禁用状态、可访问标签。
- [ ] 第 1 页链接 `/blog/`，不生成 `/blog/page/1/`。
- [ ] 12 篇示例内容验证第 2 页。

### Task 11：标签与归档

- [ ] `/tags/`：注册表顺序、名称、数量、说明。
- [ ] `/tags/[tag]/`：过滤文章、复用列表、空标签不生成。
- [ ] `/archive/`：按年分组、日期降序、行内标题/标签。
- [ ] 导航加“标签 / 归档”；页脚加 RSS（Task 12 后）。

### Task 12：SEO、RSS、sitemap、robots

- [ ] 安装：`npm install @astrojs/rss @astrojs/sitemap`。
- [ ] `astro.config.mjs` 添加 `sitemap()`；过滤 `/search/`、`/404`、`/styleguide/`、分页页。
- [ ] `Seo.astro`：title 模板、description、canonical、OG/Twitter、`lang`。
- [ ] 文章 JSON-LD `BlogPosting`；首页 `WebSite` + `Person`。
- [ ] `/rss.xml`：全文、绝对链接、稳定 guid。
- [ ] `@astrojs/sitemap`：过滤 `/search/`、`/404`、分页页。
- [ ] `/robots.txt`：指向 sitemap；原型用 `http://localhost:4321` 占位。
- [ ] 单元测试：标题模板、description 回退、URL 绝对化。

### Task 13：Pagefind 搜索

- [ ] 安装：`npm install pagefind`；把 `build` 改为 `astro build && pagefind --site dist`。
- [ ] `/search/` 页面加载 Pagefind UI；导航加搜索入口（P1）。
- [ ] 文章 `<article data-pagefind-body>`；Header/Footer `data-pagefind-ignore`。
- [ ] `?q=` 同步；无结果/错误状态；`noindex`。
- [ ] 中文关键词验收（如“内容集合”“排版”）；在 `npm run build && npm run preview` 下测试（`astro dev` 没有 Pagefind 索引，显示“索引未加载”）。
- [ ] `<noscript>` 提示 + 归档链接。

### Task 14：自托管 Latin 字体

- [ ] 下载 Public Sans / Libre Bodoni Latin 子集 woff2（SIL OFL）。
- [ ] `fonts.css` 添加 `@font-face`，`font-display: swap`。
- [ ] 只 preload 正文字体；保留 LICENSE。
- [ ] 对比系统回退与 webfont 的首屏/排版；记录体积。
- [ ] 若收益不明显，保留系统字体并删除字体文件。

### Task 15：P1 验证

- [ ] `npm run check`、`npm run test`、`npm run build` 通过。
- [ ] Playwright：分页、标签、归档、搜索中文、RSS/sitemap 存在。
- [ ] axe：新增页面无 serious/critical。
- [ ] 记录 CSS/字体/搜索页体积。
- [ ] 更新 `docs/design.md` 或 README 中的运行说明（如需要）。

---

## 6. P2 原型评审

- [ ] 设计 §9.2 内容压力测试逐项通过。
- [ ] 375/768/1024/1440、200% 缩放、Light/Dark/系统。
- [ ] 键盘完整路径；焦点可见；触控目标 ≥ 44px。
- [ ] 无横向滚动；CLS 目测稳定；图片有尺寸。
- [ ] 记录已知问题（不修的可延期项）。
- [ ] 冻结原型基线，进入部署/评论/分析决策（不在本轮）。

---

## 7. 明确不做

- 部署、托管平台、域名、CDN、HTTPS、headers、备案。
- CI/CD、Lighthouse CI 门禁、预览环境、回滚。
- 评论（Giscus）、分析（Umami）、Cookie/隐私页面。
- 多语言、OG 图生成、定时发布、邮件订阅。
- 真实作者资料与正式内容。

---

## 8. 本地命令速查

```bash
npm install
npm run dev
npm run check
npm run test
npm run build
npm run preview
npm run test:e2e
```

**原型完成的唯一标准：** 本地打开后，能按设计完成“首页 → 文章列表 → 文章 → 标签/归档（P1）→ 搜索（P1）”的阅读路径，且没有部署/评论/分析依赖。

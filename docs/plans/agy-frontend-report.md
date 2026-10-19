# DeskBox 博客 · 前端视觉设计与 P0/P1/P2 视觉 QA 报告（agy）

**执行者：** 反重力（agy）  
**日期：** 2026-10-19  
**分支：** `feat/agy-frontend`（独立工作区 `../博客-agy`，端口 `4323`）  
**基线：** `main` @ `568511b` / `feat/p1-integration` @ `624050f`（含 P0 + omp P1 阅读路由 + Claude P1 SEO/Pagefind）  
**关联：** [三智能体分工](./three-agent-division.md) · [前端设计任务书](./agy-frontend-design.md) · [视觉与交互设计](../design.md) · [设计系统](../../design-system/deskbox-blog/MASTER.md)

---

## 1. 设计目标与改动摘要

围绕 **Swiss Editorial（瑞士编辑风 · 内容优先 · 单色 + 一个信号色 · 1px 边框建立层级 · 纸感浅色 / 墨感深色）** 的设计方向，在不改变任何路由、内容 schema、数据结构与组件 Props 契约的前提下，完成了 P0 与 P1 全站页面的视觉打磨、设计系统参考页更新及 P2 视觉/无障碍 QA：

1. **Design Tokens 与全局基础（`tokens.css` / `global.css`）**
   - 补齐 `--font-display` 的 Windows 中文宋体回退（`"SimSun"`），形成“西文衬线 + 中文宋体”的编辑标题气质。
   - 在 `≥ 640px` 断点显式锁定 `--text-base: 1.0625rem`（17px）与 `--gutter: 2rem`（32px），`< 640px` 保持 16px 正文与 24px 边距。
   - 修正暗色模式下弹出层阴影 `--shadow-popover` 透明度至 `0.5`（符合 `MASTER.md` §5）。
   - 统一全站页面容器（`/blog/`、`/blog/page/[page]/`、`/blog/[slug]/`、`/tags/`、`/tags/[tag]/`、`/archive/`、`/search/`、`/about/`、`/404`、`/styleguide/`）顶部留白与水平 gutter，消除此前子页面紧贴粘性 Header 或窄屏贴边的问题。
   - 补充 `@media (forced-colors: active)` 高对比度边框与焦点环保障（覆盖卡片、标签、分页、搜索输入与按钮、代码块复制按钮、Skip Link），以及 `@media print` 打印样式（隐藏导航/目录/页脚/上下篇/复制按钮，保留纯净正文并为外链附加 URL）。

2. **正文排版、双主题代码高亮与表格无障碍（`prose.css` / `code-copy.ts`）**
   - **修复 Shiki 双主题语法高亮缺失**：`astro.config.mjs` 启用了 `defaultColor: false`，此前缺少将 `--shiki-light` / `--shiki-dark` 映射至 `color` 的 CSS 规则。现通过 `light-dark()` 结合 `color-mix()` 接入双主题变量，同时在浅色模式下对高亮色混合 25% 墨黑（`#09090b`），确保在 `--surface-muted`（`#F4F4F5`）背景上所有语法高亮 token 均满足 **WCAG 2.2 AA（≥ 4.5:1）** 对比度。
   - **代码块横向滚动与键盘可达**：覆盖 Shiki 内联 `white-space: pre-wrap`，确保宽代码（> 100 字符）在容器内横向滚动；为 `<pre>` 自动注入 `aria-label="代码块"`，为复制按钮补充 `data-state="copied" | "error"` 的状态边框与色彩反馈。
   - **宽表格排版与 375px 键盘可聚焦**：8 列表格表头采用 `--surface-muted` 底色、2px 强下边框与 `white-space: nowrap`，首列采用等宽字体；在 `code-copy.ts` 中为 `.prose table` 补充 `tabindex="0"` 与 `aria-label="数据表格"`，修复移动端 375px 下 axe `scrollable-region-focusable` 警告。
   - **暗色模式图片与封面防眩光**：为正文图与文章封面增加 `1px solid var(--border)` 边界与 `--surface-muted` 底色，暗色模式下施加柔和明度收敛（`brightness(0.92) contrast(1.02)`），消除浅色背景示意图/封面图在 `#09090B` 背景下的刺眼白边。

3. **P0 核心页面与组件视觉打磨**
   - **首页 `/`（`src/pages/index.astro`）**：桌面端 `1024px+` 采用 7/5 列非对称等高对齐，左侧社交链接锚定底部基线，右侧“最新文章”区块与主标题顶线对齐；最新文章卡片（`featured`）采用 `2px solid var(--accent)` 顶部信号线 + 展示衬线标题，与下方安静的“最近文章”列表拉开视觉权重；为“最近文章”标题行补齐 1px 底部分隔线。
   - **文章卡片 `PostCard.astro`**：补齐 `#标签` 前缀、兼容 P1 `/tags/<slug>/` 链接结构与移动端 44px 触控区；日期列启用 `tabular-nums` 并微调桌面端基线偏移。
   - **文章页与目录 `TableOfContents.astro`**：桌面端目录增加“本文目录”小标题；过滤 `remark-gfm` 自动生成的屏幕阅读器隐藏标题 `#footnote-label`（`Footnotes`）；优化 `1024–1279px` 区间正文（`42rem`）与目录（`200px`）的网格比例；无目录短文（如 `/blog/hello-world/`）自动居中为 `42rem` 单列；优化移动端 `<details class="post__toc-mobile">` 折叠面板的 `--surface-muted` 触发条与 `--surface` 展开层对比度；扩大文章页头部 `.post__tag a` 的完整可点击区域与移动端触控高度。
   - **关于页 `/about/` 与 `/404`**：补齐 `.prose h1` 衬线展示字阶与标题下边框，联系链接升级为 44px 边框按钮样式；404 页统一版心留白、字阶比例与操作区顶部分隔线。

4. **P1 阅读与分发页面视觉打磨（`global.css` / `styleguide.astro`）**
   - **修复 `/search/` 动态搜索结果样式失效（关键视觉修复）**：`src/pages/search.astro` 中的 `.search-result`、`.search-excerpt`、`.search-excerpt :global(mark)` 写在 Astro scoped `<style>` 中，而 `src/scripts/search.ts` 在运行时通过 `document.createElement` 动态创建搜索结果节点，不带 `data-astro-cid-*` 属性，导致真实搜索结果丢失底边线、字阶与 `<mark>` 高亮样式。已在 `src/styles/global.css` 补齐全局 `.search-result`、`.search-excerpt` 及柔和混色高亮 `.search-excerpt mark`（`color-mix(in srgb, var(--selection-bg) 42%, var(--surface))`），并在 `.search-page__header` 补齐与其它列表页一致的 `1px` 底部分割线。
   - **消除列表分页双重分割线（`/blog/` 与 `/blog/page/2/`）**：`.post-list` 末篇卡片自带 `border-bottom: 1px solid var(--border)`，而 `Pagination.astro` 自带 `border-top: 1px solid var(--border)`，导致列表底部出现两条平行分割线夹白。已在 `global.css` 中收敛 `.blog-index .pagination` 的冗余 `border-top`。
   - **标签索引 `/tags/` 与按年归档 `/archive/` 细节**：为 `/tags/` 的 `.tag-list__name` 注入等宽 `#` 前缀（与 `/tags/[tag]/` 标题 `#前端` 及卡片标签视觉统一），为 `.tag-list__item` 与 `.archive__item` 增加水平内边距以改善 `:hover` 背景态呼吸感，并为计数、年份标题和状态提示统一启用 `var(--font-mono)` 与 `tabular-nums`。
   - **更新 `/styleguide/`**：同步 P0 与 P1（分页、标签索引、归档、搜索高亮）组件的真实路由链接与视觉样式。

---

## 2. 改动文件清单（严格遵守 `three-agent-division.md` §3 所有权）

| 文件路径 | 所有者 | 改动说明 |
|---|---|---|
| `src/styles/tokens.css` | agy | 补充中文宋体回退、`≥640px` 响应式字号/边距 token、暗色模式弹出层阴影透明度 |
| `src/styles/global.css` | agy | 统一全站 P0/P1 页面容器留白与 gutter、文章页布局与移动端 TOC/标签触控区、修复动态搜索结果 `.search-result` 与 `mark` 样式、消除分页双分割线、补齐 `.tag-list__name` `#` 前缀、`forced-colors` 与 `@media print` |
| `src/styles/prose.css` | agy | 补齐 `.prose h1`、Shiki 双主题高亮与 AA 对比度修正、代码块横向滚动与复制状态、8 列表格样式与焦点环、暗色图片滤镜 |
| `src/pages/styleguide.astro` | agy | 同步更新 P0 token/组件展示与 P1 分页、标签索引、归档、搜索高亮视觉规范示例 |
| `docs/plans/agy-frontend-report.md` | agy | 本前端视觉设计与 P0/P1/P2 视觉 QA 报告 |

> 注：P0 阶段在 `feat/agy-frontend` 上对 `index.astro`、`about.astro`、`404.astro`、`PostCard.astro`、`TableOfContents.astro`、`PrevNext.astro`、`SiteHeader.astro`、`SiteFooter.astro`、`code-copy.ts` 的视觉改动已由 Claude 在 `f18398b` / `624050f` 集成并验证通过；本轮 P1/P2 视觉打磨仅修改 `src/styles/global.css`、`src/pages/styleguide.astro` 与本报告，零越界修改。

---

## 3. 验证与多视口无障碍测试结果

### 3.1 基础门禁检查

在 `../博客-agy` 工作区执行全套门禁命令：

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm run check` | **通过**（0 errors, 0 warnings, 2 hints） | Astro 与 TypeScript 类型检查全部通过 |
| `npm run test` | **通过**（5 files, 29/29 passed） | 单元/构建过滤/SEO/URL 测试全部通过 |
| `npm run build` | **通过**（26 pages + Pagefind 索引 12 篇 / 904 词） | 全部 P0/P1 页面、RSS、sitemap、robots 与 Pagefind 构建正常 |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4323 npx playwright test` | **通过**（36/36 passed，0 skipped） | 含 Pagefind 真实中文检索、分页、标签、归档、SEO、主题、无障碍 |

### 3.2 多视口 × 双主题 × 缩放/高对比度矩阵测试

针对 `/`、`/blog/`、`/blog/page/2/`、`/blog/astro-content-collections/`、`/blog/a-very-long-slug-.../`、`/blog/hello-world/`、`/tags/`、`/tags/frontend/`、`/archive/`、`/search/?q=内容集合`（含等待 `.search-result` 动态渲染完成）、`/about/`、`/does-not-exist/`（404）、`/styleguide/` 共 **13 个路由 × 5 个视口（`375 / 640[200%缩放等效] / 768 / 1024 / 1440`）× 2 种主题（`Light / Dark`）+ `forced-colors: active` & `prefers-reduced-motion: reduce` = 135 个场景** 执行自动化检查：

- **横向溢出（`scrollWidth - clientWidth`）**：**135/135 场景均为 `0px`**（无任何横向滚动条溢出）。
- **axe-core 无障碍扫描（375px & 1440px × Light & Dark，含动态渲染后的搜索结果）**：**0 serious / 0 critical 违规**。
- **截图留档**：已生成 `home`、`blog`、`blog-page-2`、`post-long`、`tags`、`archive`、`search`、`styleguide` 在 `375px` 与 `1440px`、`light` 与 `dark` 下的全套 32 张对照截图（保存在会话归档目录，未污染 Git 仓库）。

---

## 4. 设计 QA 发现的跨轨道问题与修复建议（供 omp / Claude 确认）

### 4.1 `[CONTRACT-CHANGE / BUG]` 搜索结果标题显示为 `未命名`（归属：`omp`）
- **现象**：在 `npm run build` 生成 Pagefind 索引后，访问 `/search/?q=内容集合` 时，搜索结果卡片的标题显示为 **`未命名`**（点击链接可正常跳转至 `/blog/astro-content-collections/`，摘要与 `<mark>` 高亮正常）。
- **根因分析**：
  1. `src/scripts/search.ts` 第 1–5 行与第 40 行将 Pagefind 返回结构声明为 `{ url, title, excerpt }` 并读取 `item.title || '未命名'`，但 Pagefind JS API `result.data()` 返回的标题字段位于 **`item.meta?.title`**（顶层无 `title` 字段）。
  2. `src/layouts/PostLayout.astro` 第 95 行将 `data-pagefind-body` 放在 `<div class="post__content prose" data-pagefind-body>` 上，而文章主标题 `<header class="post__header"><h1>{post.data.title}</h1></header>` 位于其外部，导致 Pagefind 既无法将 `<h1>` 识别为文章标题（退化为读取 `<head><title>`），也无法检索仅出现在文章标题中的关键词。
- **修复建议（由 `omp` 在其所有权文件内完成）**：
  1. 在 `src/layouts/PostLayout.astro` 的 `<h1>{post.data.title}</h1>` 上添加 `data-pagefind-meta="title"`（或将 `data-pagefind-body` 提升至 `<article class="post">`，并在 `.post__meta`、`.post__toc-mobile`、`.post__toc`、`.prev-next` 上添加 `data-pagefind-ignore`）。
  2. 在 `src/scripts/search.ts` 中将 `PagefindData` 补充 `meta?: { title?: string }`，并将第 40 行改为：
     ```ts
     link.textContent = item.meta?.title || item.title || '未命名';
     ```

### 4.2 待确认占位内容與既有非阻塞项
- `src/data/site.ts` 中的 `site.author.bio` 仍保持契约占位字符串 `{{一句话简介}}`，待作者提供真实简介文案后替换。
- `PostLayout.astro` 计算 `tocHeadings` 时建议同步加上 `heading.slug !== 'footnote-label'`（`TableOfContents.astro` 内已做该过滤）。

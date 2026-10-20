# DeskBox 博客 · 前端视觉设计与 P0/P1/P2 视觉 QA 报告（agy）

**执行者：** 反重力（agy）  
**日期：** 2026-10-20  
**分支：** `feat/agy-frontend`（独立工作区 `../博客-agy`，端口 `4323`）  
**基线：** `main` @ `857632f`（含 P0 + P1 集成 + 搜索标题修复 `b0425d1` + agy 视觉调整 `9b50e66`）  
**关联：** [三智能体分工](./three-agent-division.md) · [前端设计任务书](./agy-frontend-design.md) · [搜索标题问题记录](./issue-search-title.md) · [视觉与交互设计](../design.md) · [设计系统](../../design-system/deskbox-blog/MASTER.md)

---

## 1. 设计目标与改动摘要

围绕 **Swiss Editorial（瑞士编辑风 · 内容优先 · 单色 + 一个信号色 · 1px 边框建立层级 · 纸感浅色 / 墨感深色）** 的设计方向，在不改变任何路由、内容 schema、数据结构与组件 Props 契约的前提下，完成了 P0、P1 与 P2 全站页面的视觉打磨、设计系统参考页扩展及全量多视口无障碍 QA：

1. **Design Tokens 与全局基础（`tokens.css` / `global.css`）**
   - 补齐 `--font-display` 的 Windows 中文宋体回退（`"SimSun"`），形成“西文衬线 + 中文宋体”的编辑标题气质。
   - 在 `≥ 640px` 断点显式锁定 `--text-base: 1.0625rem`（17px）与 `--gutter: 2rem`（32px），`< 640px` 保持 16px 正文与 24px 边距。
   - 修正暗色模式下弹出层阴影 `--shadow-popover` 透明度至 `0.5`（符合 `MASTER.md` §5）。
   - 统一全站页面容器（`/blog/`、`/blog/page/[page]/`、`/blog/[slug]/`、`/tags/`、`/tags/[tag]/`、`/archive/`、`/search/`、`/about/`、`/404`、`/styleguide/`）顶部留白与水平 gutter，消除此前子页面紧贴粘性 Header 或窄屏贴边的问题。
   - 补充 `@media (forced-colors: active)` 高对比度边框与焦点环保障（覆盖卡片、标签、分页、搜索框与按钮、系列导航、快捷键 `<kbd>`、代码块复制按钮、Skip Link），以及 `@media print` 打印样式（隐藏导航/目录/系列导航/页脚/上下篇/复制按钮，保留纯净正文并为外链附加 URL）。

2. **正文排版、双主题代码高亮、脚注与打印防断行（`prose.css` / `code-copy.ts`）**
   - **修复 Shiki 双主题语法高亮缺失**：`astro.config.mjs` 启用了 `defaultColor: false`，通过 `light-dark()` 结合 `color-mix()` 接入 `--shiki-light` / `--shiki-dark`，同时在浅色模式下对高亮色混合 25% 墨黑（`#09090b`），确保在 `--surface-muted`（`#F4F4F5`）背景上所有语法高亮 token 均满足 **WCAG 2.2 AA（≥ 4.5:1）** 对比度。
   - **代码块顶栏分隔线与横向滚动**：为 `.code-block` 增加 `1px` 顶栏底边线，将左上语言标识 `.code-lang` 与右上复制按钮 `.code-copy` 与下方代码正文清晰分隔；覆盖 Shiki 内联 `white-space: pre-wrap`，确保宽代码（> 100 字符）在容器内横向滚动，并在 `@media print` 下自动切换为 `pre-wrap` 折行与 `break-inside: avoid` 防断页。
   - **长文脚注排版细节**：为 `remark-gfm` 生成的脚注引用角标 `sup a[data-footnote-ref]` 与回跳符号 `a[data-footnote-backref]` 配置等宽字体与无下划线芯片样式，并为 `.footnotes ol` 启用 `tabular-nums` 对齐。
   - **宽表格排版与 375px 键盘可聚焦**：8 列表格表头采用 `--surface-muted` 底色、2px 强下边框与 `white-space: nowrap`，首列采用等宽字体；在 `code-copy.ts` 中为 `.prose table` 补充 `tabindex="0"` 与 `aria-label="数据表格"`，消除移动端 375px 下 axe `scrollable-region-focusable` 警告。
   - **暗色模式图片与封面防眩光**：为正文图与文章封面增加 `1px solid var(--border)` 边界与 `--surface-muted` 底色，暗色模式下施加柔和明度收敛（`brightness(0.92) contrast(1.02)`）。

3. **P0 / P1 / P2 页面与组件视觉打磨**
   - **首页 `/`**：桌面端 `1024px+` 采用 7/5 列非对称等高对齐；最新文章卡片（`featured`）采用 `2px solid var(--accent)` 顶部信号线 + 展示衬线标题，与下方安静的“最近文章”列表拉开视觉权重。
   - **文章页与目录**：桌面端目录增加“本文目录”小标题；过滤 `footnote-label` 隐藏标题；优化 `1024–1279px` 区间正文（`42rem`）与目录（`200px`）网格比例；无目录短文自动居中为 `42rem` 单列；优化移动端 `.post__toc-mobile` 面板对比度与 `.post__tag a` 完整可点击区域。
   - **P1 分页、标签、归档与搜索**：
     - 在 `global.css` 补齐运行时动态创建的 `.search-result`、`.search-excerpt` 与柔和混色高亮 `.search-excerpt mark` 样式；
     - 收敛 `.blog-index .pagination` 的冗余 `border-top`，消除末篇卡片与分页栏之间的双重分割线；
     - 为 `/tags/` 的 `.tag-list__name` 注入等宽 `#` 前缀，并为 `.tag-list__item` 与 `.archive__item` 增加水平内边距以改善悬停呼吸感。
   - **P2 系列导航与检索增强规范（`global.css` / `styleguide.astro`）**：
     - 为 P2 `.series-nav` 限定 `max-width: var(--measure)`（确保在带右侧 TOC 的长文中与 `42rem` 正文列及 `.prev-next` 左对齐）并注入 `2px solid var(--accent)` 左侧信号线与 `tabular-nums` 进度数字；
     - 为搜索快捷键 `<kbd>`、结果元信息 `.search-result__meta` 与空状态推荐框 `.search-empty` 提供全局样式，并在 `/styleguide/` 新增 **`06 · P2 阅读与检索增强视觉规范`** 章节。

---

## 2. 改动文件清单（严格遵守 `three-agent-division.md` §3 所有权）

| 文件路径 | 所有者 | 改动说明 |
|---|---|---|
| `src/styles/tokens.css` | agy | 补充中文宋体回退、`≥640px` 响应式字号/边距 token、暗色模式弹出层阴影透明度 |
| `src/styles/global.css` | agy | 统一全站 P0/P1/P2 容器留白与 gutter、修复动态搜索结果 `.search-result` 与 `mark` 样式、消除分页双分割线、对齐 P2 `.series-nav` 版心与信号线、补充 `<kbd>` 与 `.search-empty` 样式、`forced-colors` 与 `@media print` |
| `src/styles/prose.css` | agy | 补齐 `.prose h1`、Shiki 双主题高亮与 AA 对比度修正、代码块顶栏分隔线与复制状态、脚注角标排版、8 列表格焦点环、暗色图片滤镜、打印防断页规则 |
| `src/pages/styleguide.astro` | agy | 同步展示 P0 token/组件、P1（分页、标签索引、归档、搜索高亮）及 P2（系列导航 `.series-nav`、快捷键 `<kbd>/</kbd>`、空状态推荐）视觉规范 |
| `docs/plans/agy-frontend-report.md` | agy | 本前端视觉设计与 P0/P1/P2 视觉 QA 报告 |

---

## 3. 验证与多视口无障碍测试结果

### 3.1 基础门禁检查

在 `../博客-agy` 工作区基于 `main` @ `857632f` 执行全套门禁命令：

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm run check` | **通过**（0 errors, 0 warnings, 2 hints） | Astro 与 TypeScript 类型检查全部通过 |
| `npm run test` | **通过**（5 files, 29/29 passed） | 单元/构建过滤/SEO/URL 测试全部通过 |
| `npm run build` | **通过**（26 pages + Pagefind 索引 12 篇 / 948 词） | 全部 P0/P1 页面、RSS、sitemap、robots 与 Pagefind（含标题索引）构建正常 |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4323 npx playwright test` | **通过**（36/36 passed，0 skipped） | 含 Pagefind 真实中文检索（标题与高亮断言）、分页、标签、归档、SEO、主题、无障碍 |

### 3.2 多视口 × 双主题 × 200% 缩放 × 高对比度矩阵测试

针对 `/`、`/blog/`、`/blog/page/2/`、`/blog/astro-content-collections/`、`/blog/a-very-long-slug-.../`、`/blog/hello-world/`、`/tags/`、`/tags/frontend/`、`/archive/`、`/search/?q=内容集合`（含等待 `.search-result` 动态渲染完成）、`/about/`、`/does-not-exist/`（404）、`/styleguide/` 共 **13 个路由 × 5 个视口（`375 / 640[200%缩放等效] / 768 / 1024 / 1440`）× 2 种主题（`Light / Dark`）+ `forced-colors: active` & `prefers-reduced-motion: reduce` = 135 个场景** 执行自动化检查：

- **横向溢出（`scrollWidth - clientWidth`）**：**135/135 场景均为 `0px`**（无任何横向滚动条溢出）。
- **axe-core 无障碍扫描（375px & 1440px × Light & Dark，含动态渲染后的搜索结果）**：**0 serious / 0 critical 违规**。
- **截图留档**：已刷新 `home`、`blog`、`blog-page-2`、`post-long`、`tags`、`archive`、`search`（已显示真实文章标题 `用 Astro 内容集合管理博客文章`）、`styleguide` 在 `375px` 与 `1440px`、`light` 与 `dark` 下的全套 32 张对照截图（保存在会话归档目录，未污染 Git 仓库）。

---

## 4. 跨轨道问题闭环记录与剩余非阻塞项

### 4.1 `[已闭环]` 搜索结果标题显示为 `未命名`（`b0425d1`）
- **状态**：已由 `omp` 在 `fix/omp-search-title`（`626d2b4` / `b0425d1`）修复并合入 `main`，详见 [issue-search-title.md](./issue-search-title.md)。
- **复验结果**：在 `main` @ `857632f` 下重新构建并运行 `/search/?q=内容集合` 视觉验收，Pagefind 索引词数由 `904` 增至 `948`，搜索结果卡片正确渲染标题 **`用 Astro 内容集合管理博客文章`**，Light/Dark 雙主题下标题与 `<mark>` 摘要高亮均符合设计规范。

### 4.2 待作者确认的占位内容
- `src/data/site.ts` 中的 `site.author.bio` 仍保持契约占位字符串 `{{一句话简介}}`，待作者提供真实简介文案后替换。

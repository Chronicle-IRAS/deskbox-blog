# DeskBox 博客 · 前端视觉设计报告（agy）

**执行者：** 反重力（agy）  
**日期：** 2026-10-19  
**分支：** `feat/agy-frontend`（独立工作区 `../博客-agy`，端口 `4323`）  
**基线：** `main` @ `46a345c`（P0 集成基线 `1548af1`）  
**关联：** [前端设计任务书](./agy-frontend-design.md) · [视觉与交互设计](../design.md) · [设计系统](../../design-system/deskbox-blog/MASTER.md) · [P1 并行实施](./p1-parallel.md)

---

## 1. 设计目标与改动摘要

围绕 **Swiss Editorial（瑞士编辑风 · 内容优先 · 单色 + 一个信号色 · 1px 边框建立层级 · 纸感浅色 / 墨感深色）** 的设计方向，在不改变任何路由、内容 schema、数据结构与组件 Props 契约的前提下，完成了全站视觉层打磨与 P1 视觉规格交付：

1. **Design Tokens 与全局基础（`tokens.css` / `global.css`）**
   - 补齐 `--font-display` 的 Windows 中文宋体回退（`"SimSun"`），形成“西文衬线 + 中文宋体”的编辑标题气质。
   - 在 `≥ 640px` 断点显式锁定 `--text-base: 1.0625rem`（17px）与 `--gutter: 2rem`（32px），`< 640px` 保持 16px 正文与 24px 边距。
   - 修正暗色模式下弹出层阴影 `--shadow-popover` 透明度至 `0.5`（符合 `MASTER.md` §5）。
   - 统一全站页面容器（`/blog/`、`/blog/[slug]/`、`/about/`、`/404`、`/styleguide` 及 P1 `/tags/`、`/archive/`、`/search/`）顶部留白与水平 gutter，消除此前子页面紧贴粘性 Header 或窄屏贴边的问题。
   - 补充 `@media (forced-colors: active)` 高对比度边框与焦点环保障，以及 `@media print` 打印样式（隐藏导航/目录/页脚/复制按钮，保留纯净正文）。

2. **正文排版、双主题代码高亮与表格无障碍（`prose.css` / `code-copy.ts`）**
   - **修复 Shiki 双主题语法高亮缺失**：`astro.config.mjs` 启用了 `defaultColor: false`，此前缺少将 `--shiki-light` / `--shiki-dark` 映射至 `color` 的 CSS 规则。现通过 `light-dark()` 结合 `color-mix()` 接入双主题变量，同时在浅色模式下对高亮色混合 25% 墨黑（`#09090b`），确保在 `--surface-muted`（`#F4F4F5`）背景上所有语法高亮 token 均满足 **WCAG 2.2 AA（≥ 4.5:1）** 对比度。
   - **代码块横向滚动与键盘可达**：覆盖 Shiki 内联 `white-space: pre-wrap`，确保宽代码（> 100 字符）在容器内横向滚动；为 `<pre>` 自动注入 `aria-label="代码块"`，为复制按钮补充 `data-state="copied" | "error"` 的状态边框与色彩反馈。
   - **宽表格排版与 375px 键盘可聚焦**：8 列表格表头采用 `--surface-muted` 底色、2px 强下边框与 `white-space: nowrap`，首列采用等宽字体；在 `code-copy.ts` 中为 `.prose table` 补充 `tabindex="0"` 与 `aria-label="数据表格"`，修复移动端 375px 下 axe `scrollable-region-focusable` 警告。
   - **暗色模式图片与封面防眩光**：为正文图与文章封面增加 `1px solid var(--border)` 边界与 `--surface-muted` 底色，暗色模式下施加柔和明度收敛（`brightness(0.92) contrast(1.02)`），消除浅色背景示意图/封面图在 `#09090B` 背景下的刺眼白边。

3. **首页、列表、文章页、About、404 与外壳组件打磨**
   - **首页 `/`（`src/pages/index.astro`）**：桌面端 `1024px+` 采用 7/5 列非对称等高对齐，左侧社交链接锚定底部基线，右侧“最新文章”区块与主标题顶线对齐；最新文章卡片（`featured`）采用 `2px solid var(--accent)` 顶部信号线 + 展示衬线标题，与下方安静的“最近文章”列表拉开视觉权重；为“最近文章”标题行补齐 1px 底部分隔线。
   - **文章卡片 `PostCard.astro`**：修复 P0 标签缺失 `#` 前缀的问题（统一显示 `#标签`），同时兼容 P1 的 `<a href="/tags/...">` 链接结构；日期列启用 `tabular-nums` 并微调桌面端基线偏移。
   - **目录 `TableOfContents.astro` 与文章页布局**：桌面端目录增加“本文目录”小标题；过滤 `remark-gfm` 自动生成的屏幕阅读器隐藏标题 `#footnote-label`（`Footnotes`），避免英文隐藏节点混入中文目录；优化 `1024–1279px` 区间正文（`42rem`）与目录（`200px`）的网格间距比例；无目录短文（如 `/blog/hello-world/`）自动居中为 `42rem` 单列。
   - **上下篇导航 `PrevNext.astro`**：宽度与正文列 `42rem` 对齐，链接触控高度 ≥ 44px。
   - **Header / Footer（`SiteHeader.astro` / `SiteFooter.astro`）**：Header 改为 `min-height: 64px` 并允许桌面导航在 200% 缩放或 P1 五项导航下自然换行；补齐导航悬停态 2px 下划线预览；社交链接确保 44px 触控高度与 ≥ 8px 间距。
   - **关于页 `/about/` 与 `/404`**：补齐 `.prose h1` 衬线展示字阶与标题下边框，联系链接升级为 44px 边框按钮样式；404 页统一版心留白、字阶比例与操作区顶部分隔线。
   - **设计系统参考页 `/styleguide`（`src/pages/styleguide.astro`）**：同步更新 P0 色板（含 WCAG 对比度标注）、字阶、间距、按钮、标签、代码块、正文引用及 **P1 分页、标签索引、按年归档、搜索高亮状态** 示例。

---

## 2. 改动文件清单

严格遵守任务书 §10 文件所有权，仅修改视觉层与允许文件，未改动任何 `src/content/**`、`src/data/**`、`src/lib/**`、配置文件或测试文件：

| 文件路径 | 改动类型 | 说明 |
|---|---|---|
| `src/styles/tokens.css` | 修改 | 补充中文宋体回退、`≥640px` 响应式字号/边距 token、暗色模式弹出层阴影透明度 |
| `src/styles/global.css` | 修改 | 统一全站页面容器留白与 gutter、文章页 `.post` 1024–1279px 比例与无目录居中、P1 共享视觉层、`forced-colors` 与 `@media print` |
| `src/styles/prose.css` | 修改 | 补齐 `.prose h1`、Shiki 双主题高亮与 AA 对比度修正、代码块横向滚动与复制状态、8 列表格样式与焦点环、暗色图片滤镜 |
| `src/scripts/code-copy.ts` | 修改 | 为 `<pre>` 补充 `aria-label="代码块"`、复制按钮 `data-state` 状态属性、`.prose table` 键盘可聚焦属性 |
| `src/components/SiteHeader.astro` | 修改 | 仅改 `<style>`：`min-height: 64px`、导航换行容错、悬停/当前 2px 下划线、移动菜单弹出层细节 |
| `src/components/SiteFooter.astro` | 修改 | 仅改 `<style>`：社交链接基线对齐与 44px 触控间距 |
| `src/components/PostCard.astro` | 修改 | 补齐 `#标签` 前缀、兼容 P1 标签链接、拉开 `featured` 与 `default` 视觉层级 |
| `src/components/TableOfContents.astro` | 修改 | 过滤 `footnote-label` 隐藏标题、补充桌面端“本文目录”标题与 H3 缩进层级 |
| `src/components/PrevNext.astro` | 修改 | 仅改 `<style>`：限制最大宽度 `var(--measure)` 与正文对齐、44px 触控目标 |
| `src/pages/index.astro` | 修改 | 仅改 `<style>`：7/5 非对称双栏等高基线对齐、主推与最近列表层级、最近文章标题底边线 |
| `src/pages/about.astro` | 修改 | 仅改 `<style>`：统一 `42rem` 版心与水平 gutter、H1 底边线、44px 联系按钮 |
| `src/pages/404.astro` | 修改 | 仅改 `<style>`：统一版心与留白、收敛 404 字号比例、操作按钮分隔线 |
| `src/pages/styleguide.astro` | 修改 | 同步更新 P0 token/组件展示，新增 P1 分页、标签索引、归档、搜索视觉规范示例 |
| `docs/plans/agy-frontend-report.md` | 新建 | 本前端视觉设计报告与 P1 协作规范 |

---

## 3. 验证与多视口无障碍测试结果

### 3.1 基础门禁检查

在 `../博客-agy` 工作区执行全套门禁命令：

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm run check` | **通过**（0 errors, 0 warnings, 2 hints） | Astro 与 TypeScript 类型检查全部通过 |
| `npm run test` | **通过**（3 files, 19/19 passed） | 单元/构建过滤测试全部通过 |
| `npm run build` | **通过**（17 pages built in 1.91s） | 12 篇已发布文章 + 首页/列表/About/404/styleguide 静态生成正常 |
| `PLAYWRIGHT_BASE_URL=http://localhost:4323 npm run test:e2e` | **通过**（15/15 passed） | 首页、列表、文章页、主题切换、axe 无障碍全部通过 |

### 3.2 多视口 × 双主题矩阵测试（375 / 768 / 1024 / 1440 × Light / Dark）

针对 `/`、`/blog/`、`/blog/astro-content-collections/`（含封面、宽代码、8 列表格、脚注）、`/blog/a-very-long-slug-.../`（长标题与超长英文 slug）、`/blog/hello-world/`（无封面无目录短文）、`/about/`、`/does-not-exist/`（404）、`/styleguide/` 共 **8 个路由 × 4 个断点 × 2 种主题 = 64 个场景** 执行自动化检查：

- **横向溢出（`scrollWidth - clientWidth`）**：**64/64 场景均为 `0px`**（无任何横向滚动条溢出）。
- **axe-core 无障碍扫描（375px & 1440px × Light & Dark）**：**0 serious / 0 critical 违规**。
- **截图留档**：已生成 `home`、`blog`、`post-long`、`styleguide` 在 `375px` 与 `1440px`、`light` 与 `dark` 下的全套对照截图（保存在会话归档目录，未污染 Git 仓库）。

---

## 4. P1 组件视觉规格与协作落地建议（供 omp / Claude 集成）

为避免与 `omp`（`feat/p1-omp-reading`）和 `Claude Code`（`feat/p1-claude-seo`）产生文件冲突，**P1 共享视觉增强规则已预先写入 `src/styles/global.css`**，并在 `/styleguide` 页面提供了完整 DOM 与样式参考。集成时建议如下：

### 4.1 分页控件（`Pagination.astro`）
- **结构约定**：`<nav class="pagination" aria-label="分页">`，两侧为 `.pagination__arrow`（禁用态使用 `<span class="pagination__arrow" aria-disabled="true">`，不渲染假链接），中间为 `<ol class="pagination__pages">`。
- **视觉状态**：所有页码与上一页/下一页按钮最小尺寸 `44×44px`，页码使用 `var(--font-mono)` 与 `tabular-nums`；当前页 `[aria-current="page"]` 使用 `color: var(--accent); border-color: var(--accent); font-weight: 600;`；悬停态仅改变边框色与 `--surface-muted` 背景，不做位移。

### 4.2 标签索引与标签链接（`/tags/`、`TagList.astro`、`PostCard.astro`、`PostLayout.astro`）
- **卡片与文章页标签**：`PostCard.astro` 与 `PostLayout.astro` 的标签样式已支持内部嵌套 `<a href="/tags/<slug>/">#标签</a>`（`color: inherit; text-decoration: none;`），外层 `.post-tag` / `.post__tag` 提供 `1px solid var(--border)` 轻量 chip 边界，悬停态变为 `--fg` 与 `--border-strong`。
- **标签索引页 `/tags/`**：`.tag-list__item` 采用双列网格（左侧标签名、右侧篇数 `tabular-nums`，第二行跨列显示标签说明 `.tag-list__description`），行悬停应用 `--surface-muted` 背景过渡。

### 4.3 按年归档（`/archive/`）
- **年份标题**：`.archive__year h2` 使用 `var(--font-mono)`、`var(--text-sm)`、`var(--fg-muted)`。
- **归档行**：`.archive__item` 桌面端采用 `96px minmax(0, 1fr) auto`（日期 + 标题 + 标签），移动端 `< 640px` 折叠为单列堆叠；行悬停已在 `global.css` 注入 `--surface-muted` 背景过渡。

### 4.4 搜索页（`/search/`）
- **输入栏**：`.search-form__input` 高度 `44px`，边框 `1px solid var(--border-strong)`，背景 `var(--surface)`，关联可见 `<label>` 与 `#search-status`（`aria-live="polite"`）。
- **结果与高亮**：命中关键词 `<mark>` 使用 `background: var(--selection-bg); color: var(--selection-fg);`（粉底深字，对比度 ≥ 5.02:1）；错误状态 `#search-status[data-state="error"]` 使用 `--error` 并伴随文字说明。

### 4.5 给 `omp` / `Claude` 的集成合并提示
1. **`PostCard.astro` 合并**：本分支将 P0 标签从 `{tag}` 修正为 `#{tag}` 并优化了 `<style>`（同时兼容 `<a>` 子元素）；与 `Claude` 的 `feat/p1-claude-seo` 合并时，保留 `Claude` 的 `<a href={`/tags/${tagSlugByName(tag)}/`}>#{tag}</a>` 模板标记，并保留本分支 `<style>` 块即可。
2. **`PostLayout.astro` 目录过滤建议**：建议在 `PostLayout.astro` 计算 `tocHeadings` 时同步加上 `heading.slug !== 'footnote-label'`（`TableOfContents.astro` 内已做该过滤，双端一致可避免仅有 2 个正文标题 + 脚注的文章误渲染移动端 `<details>` 外壳）。

---

## 5. 已知问题、待确认项与设计偏差说明

1. **待确认占位内容（未自行编造）**
   - `src/data/site.ts` 中的 `site.author.bio` 仍保持契约占位字符串 `{{一句话简介}}`，待作者提供真实简介文案后替换。
2. **与 `docs/design.md` 的细微实现说明**
   - **浅色模式代码高亮对比度增强**：`astro.config.mjs` 使用 `github-light` 主题，其原生橙色（`#E36209`）与红色（`#D73A49`）在 `--surface-muted`（`#F4F4F5`）背景上的对比度分别为 `3.18:1` 与 `4.16:1`，低于 WCAG 2.2 AA 的 `4.5:1` 门禁。因此在 `src/styles/prose.css` 中使用 `color-mix(in srgb, var(--shiki-light, var(--fg)) 75%, #09090b)` 进行了墨感加深，既保留语法色相区分，又使全部代码 token 通过 axe AA 对比度检查。
   - **移动端表格键盘焦点**：为满足 375px 下 8 列宽表的键盘横向滚动与 WCAG 2.2 AA `scrollable-region-focusable` 要求，在 `src/scripts/code-copy.ts` 中为 `.prose table` 自动补充了 `tabindex="0"` 与 `aria-label="数据表格"`。

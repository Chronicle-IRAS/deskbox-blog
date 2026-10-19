# DeskBox 博客 · 前端设计任务书（agy）

**执行者：** 反重力（agy）  
**基线：** `main` @ `1548af1`（P0 已实现并通过集成验证）  
**建议分支：** `feat/agy-frontend`  
**建议工作区：** `../博客-agy`（独立 worktree）  
**目标：** 在**不改变路由、内容模型、组件契约**的前提下，完成前端视觉、排版、响应式、暗色模式与可访问性的设计打磨，并提交可运行代码。  
**必读：** [视觉与交互设计](../design.md) · [设计系统](../../design-system/deskbox-blog/MASTER.md) · [原型架构](../architecture.md) · [P0 集成报告](./p0-integration-report.md) · [P1 并行实施](./p1-parallel.md) · [三智能体分工](./three-agent-division.md)

> 本文件是 agy 的任务书；`docs/design.md` 是设计意图来源，`src/styles/tokens.css` 是实现来源。两者冲突时，以本文的验收标准与 `tokens.css` 为准，并在报告中记录偏差。

---

## 1. 范围

### 1.1 要做

- 首页 `/` 的视觉层级、间距、双栏比例与移动端堆叠。
- 文章列表 `/blog/` 的行高、日期列、标题/摘要、标签、空状态。
- 文章页 `/blog/[slug]/` 的头部、封面、正文、目录、代码块、表格、脚注、上一篇/下一篇。
- About `/about/`、404、`/styleguide` 的视觉一致性。
- Header / Footer / 主题切换 / 移动菜单的视觉与交互状态。
- Light / Dark / 跟随系统三种模式。
- 375 / 768 / 1024 / 1440 的响应式细节。
- 键盘焦点、对比度、触控目标、`prefers-reduced-motion`。
- 组件状态：默认、悬停、焦点、当前、空、错误、加载（如适用）。

### 1.2 不要做

- 不改 `src/content/**`、`src/data/**`、`src/lib/**`、`src/content.config.ts`。
- 不改 `package.json`、`package-lock.json`、`astro.config.mjs`、`tsconfig.json`、`playwright.config.ts`、`vitest.config.ts`。
- 不新增依赖、字体 CDN、图标库、UI 组件库、客户端框架。
- 不改路由路径、组件 props、内容字段、`PostSummary` / `BaseLayout` 契约。
- 不做 P1：标签页、归档、分页、搜索、RSS、sitemap、SEO 组件。
- 不做部署、域名、CI/CD、评论、分析、多语言、OG 图。
- 不改 `docs/design.md` 或 `docs/plans/*` 的既有结论；在报告中记录建议即可。

> 如果视觉实现必须改动共享文件（`src/lib/**`、`src/data/**`、`package.json` 等），先写 `CONTRACT-CHANGE` 说明并停止，不要直接改。

---

## 2. 当前基线

### 2.1 已实现页面

| 路径 | 文件 | 说明 |
|---|---|---|
| `/` | `src/pages/index.astro` | 简介 + 最新文章 + 最近 6 篇 |
| `/blog/` | `src/pages/blog/index.astro` | P0 展示全部 12 篇，无分页 |
| `/blog/[slug]/` | `src/pages/blog/[slug].astro` + `src/layouts/PostLayout.astro` | 文章详情、TOC、代码复制、上一篇/下一篇 |
| `/about/` | `src/pages/about.astro` | 关于与社交链接 |
| `/404` | `src/pages/404.astro` | 未知路由触发 |
| `/styleguide` | `src/pages/styleguide.astro` | `noindex` 设计参考页 |

### 2.2 已实现组件

- `BaseLayout` / `SiteHeader` / `SiteFooter` / `ThemeToggle` / `Icon`
- `PostCard` / `PostList` / `TableOfContents` / `PrevNext`
- `prose.css` 正文排版
- `code-copy.ts` / `toc-highlight.ts`

### 2.3 当前内容

- 12 篇已发布示例文章；1 篇草稿、1 篇未来文章不进入构建。
- 内容里的作者简介仍是占位文案；不要编造真实个人信息。
- 文章页已支持封面、代码块、表格、脚注、长标题、无标签、无目录等压力场景。

### 2.4 当前已知视觉问题（建议优先看）

- `PostCard` 的 P0 标签只显示标签名，没有统一的 `#` 前缀；设计意图是 `#标签`。
- 首页 `latest` 与 `recent` 的视觉权重、间距需要按真实内容再平衡。
- 文章页在 1024–1279px 的正文/TOC 比例需要检查。
- 暗色模式下代码块、表格、封面图的对比需要逐页检查。
- 404 与 About 的留白、标题层级需要与首页统一。

---

## 3. 设计方向

**关键词：** 瑞士编辑风 · 内容优先 · 单色 + 一个信号色 · 边框而非阴影 · 纸感浅色 / 墨感深色。

### 3.1 原则

1. **文字优先**：正文是页面主角；导航、标签、元信息退到次级。
2. **一个信号色**：粉色只用于链接、当前项、可操作强调；大面积保持纸白/墨黑。
3. **边框建立层级**：1px 边框 + 留白；不用卡片投影堆叠。
4. **排版建立秩序**：字号、字重、间距、对齐形成层级，不靠装饰图形。
5. **克制动效**：只做状态过渡（120–180ms），不做滚动动画、视差、自动播放。
6. **暗色是同一设计**：层级、对比、强调色关系一致，不是简单反色。
7. **中文阅读优先**：正文 16–17px / 1.85；每行约 40 个中文字符。

### 3.2 明确避免

- 渐变 Hero、玻璃拟态、大面积模糊、卡片阴影堆叠。
- 滚动触发动画、视差、自动播放视频。
- 用 emoji 当 UI 图标。
- 正文宽度超过 42rem；手机上横向滚动。
- 低对比灰字、隐藏焦点环、12px 正文。
- 无限滚动；P0 用静态列表。
- Google Fonts / 第三方字体 CDN 运行时加载。

---

## 4. Design Tokens

> 实现以 `src/styles/tokens.css` 为唯一来源；下表是设计意图。不要在组件里写裸 hex。

### 4.1 颜色

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--bg` | `#FAFAFA` | `#09090B` | 页面背景 |
| `--surface` | `#FFFFFF` | `#141416` | 卡片、输入框、弹出层 |
| `--surface-muted` | `#F4F4F5` | `#1C1C1F` | 代码块、悬停行 |
| `--fg` | `#09090B` | `#FAFAFA` | 主文本 |
| `--fg-muted` | `#52525B` | `#A1A1AA` | 元信息、摘要 |
| `--border` | `#E4E4E7` | `#27272A` | 装饰分隔线、卡片边框 |
| `--border-strong` | `#71717A` | `#A1A1AA` | 输入框、可交互控件 |
| `--accent` | `#BE185D` | `#F9A8D4` | 正文链接、当前项 |
| `--accent-hover` | `#9D174D` | `#FBCFE8` | 链接悬停 |
| `--accent-solid` | `#EC4899` | `#F472B6` | 主按钮背景 |
| `--accent-solid-hover` | `#F472B6` | `#F9A8D4` | 主按钮悬停 |
| `--on-accent` | `#18181B` | `#18181B` | 主按钮文字 |
| `--focus` | `#09090B` | `#FAFAFA` | 焦点环 |

**对比度（必须保持）**

- `--fg` / `--bg`：19.06:1（Light/Dark）。
- `--fg-muted` / `--bg`：7.41:1 / 7.76:1。
- `--accent` / `--bg`：5.78:1 / 10.97:1。
- `--on-accent` / `--accent-solid`：5.02:1 / 6.69:1。
- 主按钮不能用白字配 `#EC4899`（仅 3.53:1）。

### 4.2 字体

```css
--font-sans: "Public Sans", system-ui, -apple-system, "Segoe UI",
  "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
--font-display: "Libre Bodoni", "Iowan Old Style", "Palatino Linotype",
  Palatino, Georgia, "Songti SC", "Noto Serif SC", serif;
--font-mono: ui-monospace, "SFMono-Regular", "Cascadia Code",
  Consolas, "Liberation Mono", monospace;
```

| Token | 值 | 用途 |
|---|---|---|
| `--text-display` | `clamp(2.75rem, 1.5rem + 5vw, 4.5rem)` | 首页站点名 |
| `--text-h1` | `clamp(2rem, 1.25rem + 3vw, 3rem)` | 页面/文章标题 |
| `--text-h2` | `1.75rem` | 正文 H2 |
| `--text-h3` | `1.375rem` | 正文 H3 |
| `--text-lg` | `1.25rem` | 导语、卡片标题 |
| `--text-base` | `clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)` | 正文 |
| `--text-sm` | `0.875rem` | 元信息、导航 |
| `--text-xs` | `0.75rem` | 说明、代码语言标签 |

- 中文正文行高 1.85；标题 `text-wrap: balance`；段落 `text-wrap: pretty`。
- 展示标题字距 `-0.02em`；中文正文不额外加字距。

### 4.3 布局与间距

- `--container: 72rem`；`--measure: 42rem`；`--gutter: clamp(1.5rem, 4vw, 2rem)`。
- `--section: clamp(4rem, 8vw, 6rem)`。
- 间距 token：`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px`。
- 圆角：`--radius-sm: 4px`、`--radius-md: 6px`、`--radius-lg: 8px`。
- 默认无阴影；仅弹出层使用 `--shadow-popover`。
- 页面框架可用 12 列网格；正文永远单列。

### 4.4 动效

- `--duration-fast: 120ms`、`--duration-base: 180ms`、`--ease-out`。
- 只过渡颜色、背景、边框、下划线、透明度。
- 不做布局位移；`prefers-reduced-motion` 下全部关闭。

---

## 5. 页面设计任务

### 5.1 首页 `/`

**当前结构：** `.container home` → `.home-intro`（左：站点名/定位/简介/社交；右：最新文章）+ `.recent`（最近 6 篇）。

**要做的**

- 桌面 1024+：左侧 7 列 / 右侧 5 列的非对称关系；左右 baseline 对齐，不要让右侧卡片比左侧标题高太多。
- 移动端：先简介，再最新，再最近；不要出现横向滚动。
- 最新文章卡片与最近列表的视觉权重拉开：最新更大、更有边界；最近列表更安静。
- 最近文章从第 2 篇开始取 6 篇，避免与最新重复。
- 空状态：没有文章时显示“第一篇文章正在路上。”，不要留下空白大区块。
- 社交链接不超过 4 个；图标与文字基线对齐。

**验收**

- 375 / 768 / 1024 / 1440 无溢出。
- 首屏能看到站点名、定位、简介、最新文章标题。
- Light/Dark 下最新卡片边框与最近列表分隔线都清晰。

### 5.2 文章列表 `/blog/`

**当前结构：** `.blog-index` → 标题 + 数量 → `PostList` → `PostCard` 行。

**要做的**

- 每行是 `96px 日期列 + 标题/摘要/标签/阅读时间`；移动端日期折叠到标题上方。
- 日期使用 mono 字体、`--fg-muted`，不抢标题。
- 标题最多自然换行，不截断；摘要最多 2 行。
- 标签在 P0 只显示 `#标签` 文本，不做链接；视觉上像轻量 chip，但不要过度装饰。
- 行悬停只改变背景/分隔线，不位移；焦点环清晰。
- 空状态使用 1px 虚线边框 + 居中说明。
- P0 不显示分页；不要提前设计分页控件。

**验收**

- 12 篇全部显示；草稿/未来文章不出现。
- 375 下日期、标题、标签不重叠；无横向滚动。
- 长标题、长标签、无标签文章均正常。

### 5.3 文章页 `/blog/[slug]/`

**当前结构：** `PostLayout` → 文章头部（元信息、H1、摘要、封面）→ 移动端 TOC `<details>` → 正文 + 桌面 TOC → `PrevNext`。

**要做的**

- 文章头部与正文同宽 42rem；标题不跨到 TOC 列。
- 元信息：日期、更新日期、阅读时间、标签；层级低于标题。
- 封面：16:9 左右，宽度不超过正文；必须有 `coverAlt`；暗色下不要出现刺眼白边。
- 正文：H2/H3 间距、段落 1.25em、引用左侧 2px 粉色线、代码块/表格横向滚动。
- 代码块：语言标签 + 复制按钮；按钮不遮挡代码；复制成功有反馈。
- 桌面 TOC：220px，sticky，当前项高亮；移动端折叠 `<details>`，44px 摘要行。
- 少于 3 个 H2/H3 不显示 TOC。
- 上一篇/下一篇：桌面两列，移动端堆叠；空值显示“没有更早/更新的文章”。
- 文末不加评论、不加分享条。

**验收**

- 长文 TOC 锚点不被粘性 Header 遮挡。
- 宽代码块、8 列表格不撑破页面。
- 375 下文章标题、正文、TOC 摘要不贴边。
- 暗色下代码高亮、表格边框、封面图仍可读。

### 5.4 About `/about/`

- 标题、2–5 段简介、社交链接；可选方形头像（当前无）。
- 不写技能进度条、时间线装饰、客户 Logo 墙。
- 正文 42rem；联系链接 44px 触控目标。

### 5.5 404

- 大号 `404` + 一句说明 + 返回首页/浏览文章。
- 不卖萌、不自动跳转、不放搜索（P0 无搜索）。
- 404 页面 `noindex`；未知路由返回 HTTP 404。

### 5.6 Styleguide `/styleguide`

- 保持 `noindex`、不进入导航。
- 展示色板、字号、间距、按钮、标签、代码块、正文示例。
- 如果修改了组件或 token，同步更新此页，保证它能反映真实设计系统。

### 5.7 Header / Footer / 主题切换

- Header 64px、粘性、1px 底边；导航当前项 2px 粉色下划线。
- 移动端 `<details>` 菜单；`summary` 44px；不依赖 JS。
- 主题切换 44×44、图标与 `aria-pressed` 状态正确；刷新保持。
- Footer 只放社交/版权；不重复主导航。

---

## 6. 组件设计要点

| 组件 | 要求 |
|---|---|
| `PostCard` | 根元素 `article.post-card`；一个标题链接；P0 标签 `#标签` 文本；默认/精选两种视觉权重 |
| `PostList` | 列表容器；空状态；不要重写卡片内部 |
| `TableOfContents` | H2/H3；少于 3 项不渲染；当前项 `aria-current="location"` |
| `PrevNext` | 上一篇=更早，下一篇=更新；空值文案；箭头图标 |
| Code block | 语言标签、复制按钮、横向滚动、键盘可聚焦 |
| Link | 粉色下划线；悬停加粗下划线；焦点环 2px |
| Button | 主/次/幽灵；44px 高；主按钮 `--on-accent` 文字 |
| Tag | 12px、1px 边框、`--radius-sm`；P0 仅展示 |
| Empty | 1px 虚线边框、居中、最多两行 + 一个动作 |

**注意**

- 组件 props 和路由不要改；只改视觉层与内部标记。
- 需要新增 token 时改 `src/styles/tokens.css`，不要在组件里写裸 hex。
- 图标使用现有 `Icon.astro` 或内联 SVG；不要引入图标库，不要用 emoji。

---

## 7. 响应式

| 断点 | 布局 | 关键规则 |
|---|---|---|
| `< 640px` | 单列 | 正文 16px；gutter 24px；日期折叠；TOC `<details>` |
| `640–1023px` | 单列 | 正文 17px；gutter 32px；导航可换行 |
| `1024–1279px` | 文章 + 右侧 TOC；首页 7/5 | TOC sticky；正文 42rem |
| `≥ 1280px` | 容器 1152px 居中 | 不要无限拉宽正文 |

**硬性规则**

- 375px 无横向滚动；代码块/表格在自身容器内滚动。
- 图片 `max-width: 100%; height: auto`。
- 触控目标 ≥ 44×44px；相邻目标 ≥ 8px。
- 200% 缩放不丢内容、不重叠。
- 粘性 Header 不遮挡锚点：`scroll-padding-top: 80px`。

---

## 8. 可访问性

目标 **WCAG 2.2 AA**。

- 每页一个 H1；标题层级不跳级。
- 跳过链接指向 `#main`；键盘可完成主要路径。
- 焦点环：`outline: 2px solid var(--focus); outline-offset: 2px`；不要移除。
- 对比度：正文 ≥ 4.5:1；控件边界 ≥ 3:1。
- 图片：内容图有意义的 alt；装饰图 `alt=""`；封面必须有 `coverAlt`。
- 主题切换：`aria-pressed`；标签随状态变化。
- TOC：`<nav aria-label="本文目录">`；当前项 `aria-current="location"`。
- 代码复制：`aria-live="polite"` 播报成功/失败。
- 动效：`prefers-reduced-motion: reduce` 下关闭。
- 语言：`<html lang="zh-CN">`；英文长引用可加 `lang="en"`。
- 不要用颜色单独传达状态；错误/成功同时有文字。

---

## 9. 内容压力测试

逐项在 375 / 768 / 1024 / 1440 与 Light/Dark 下检查：

- [ ] 中文 40 字 / 英文 80 字符长标题。
- [ ] 无摘要、无标签、无封面、无目录的文章。
- [ ] 超长标签 / 英文长 slug。
- [ ] 宽代码块（> 100 字符）。
- [ ] 8 列表格。
- [ ] 图片缺失/加载失败时保留尺寸与 alt。
- [ ] 只有 1 篇文章的首页/列表。
- [ ] 0 篇文章的空状态。
- [ ] 深色模式代码高亮。
- [ ] 200% 缩放、`forced-colors` 模式。
- [ ] 键盘 Tab 顺序、焦点可见。
- [ ] 打印样式（可选）：隐藏导航，保留正文。

---

## 10. 文件所有权

### 10.1 可以改

```text
src/styles/**
src/components/**
src/layouts/**
src/pages/**（仅视觉标记与 scoped styles）
public/favicon.svg
docs/plans/agy-frontend-report.md（新建）
```

### 10.2 不要改

```text
src/content/**
src/content.config.ts
src/data/**
src/lib/**
package.json
package-lock.json
astro.config.mjs
tsconfig.json
playwright.config.ts
vitest.config.ts
tests/**
docs/design.md
docs/plans/claude-code-p0.md
docs/plans/omp-p0.md
docs/plans/p0-integration-report.md
```

> 需要改共享文件时，写 `CONTRACT-CHANGE` 说明原因、影响与建议，停止并交给用户决定。

---

## 11. 工作流

```bash
# 独立 worktree，避免与主工作区冲突
git worktree add ../博客-agy -b feat/agy-frontend main
cd ../博客-agy

npm ci
npm run dev -- --port 4323
```

- 端口使用 `4323`，避免与 Claude（4321）和 omp（4322）冲突。
- 自检：
  ```bash
  npm run check
  npm run test
  npm run build
  PLAYWRIGHT_BASE_URL=http://localhost:4323 npm run test:e2e
  ```
  （PowerShell：`$env:PLAYWRIGHT_BASE_URL='http://localhost:4323'; npm run test:e2e`）
- 提交规范见 [Git 工作流](../git-workflow.md)；建议：
  - `style(layout): ...`
  - `style(components): ...`
  - `style(pages): ...`
  - `docs(design): ...`
- 不合并到 `main`；完成后交给用户确认。

---

## 12. 交付物

1. **可运行代码**：视觉层改动，保持 P0 结构、路由与 props 不变。
2. **设计说明**：新建 `docs/plans/agy-frontend-report.md`，包含：
   - 设计目标与改动摘要。
   - 改动文件清单。
   - 375 / 1440、Light / Dark 截图（可用 Playwright 或浏览器截图）。
   - `check / test / build / test:e2e` 结果。
   - 已知问题与未做项。
   - 对 `docs/design.md` 的偏差说明（如有）。
3. **不提交生成物**：`dist/`、`node_modules/`、测试报告、截图缓存按 `.gitignore` 处理。

---

## 13. 验收清单

- [ ] `/`、`/blog/`、`/blog/[slug]/`、`/about/`、未知路由 404 全部正常。
- [ ] 12 篇已发布文章显示；草稿/未来文章不出现。
- [ ] 375 / 768 / 1024 / 1440 无横向滚动。
- [ ] Light / Dark / 跟随系统三种状态正确；刷新无闪烁。
- [ ] 正文 42rem、中文 16–17px / 1.85；标题层级正确。
- [ ] TOC、代码复制、上一篇/下一篇、主题切换可用。
- [ ] 键盘焦点可见；触控目标 ≥ 44×44px；`prefers-reduced-motion` 生效。
- [ ] 对比度符合 §4.1；axe 无 serious/critical。
- [ ] `npm run check`、`npm run test`、`npm run build`、`npm run test:e2e` 通过。
- [ ] 没有修改内容、数据、lib、package、config、既有计划文档。
- [ ] 没有引入第三方脚本、字体 CDN、UI 图库、emoji 图标。

---

## 14. 待确认（不要自行编造）

- `site.author.bio` 仍是 `{{一句话简介}}`；等作者提供文案。
- 站点名 `DeskBox` 为工作名；不要改成其他品牌。
- 头像、精选文章、真实社交链接未定；当前使用占位/无头像。
- P1 的标签页、归档、分页、搜索、RSS 尚未实现；不要提前加隐藏路由。
- 评论、分析、部署不在本轮；不要添加相关代码或依赖。

---

## 15. P1 设计扩展（与 omp / Claude 协作）

P1 的功能实现见 [P1 并行实施](./p1-parallel.md)。agy 的职责是**视觉设计**，不是 P1 路由逻辑：

### 15.1 需要设计

- **分页控件**：当前页、上一页/下一页、首尾禁用；桌面/移动端尺寸；`aria-current` 视觉状态。
- **标签索引 / 标签页**：chip 样式、数量、说明、长标签换行；标签链接的悬停/焦点。
- **归档**：年份分组标题、日期列、标题层级、行悬停。
- **搜索页**：输入框、结果列表、命中片段、空/错误状态、`?q=` 状态；无结果文案。
- **文章页**：标签从纯文本变为链接后的视觉；搜索索引不影响 UI。
- **StyleGuide**：同步新增的 P1 token/组件示例。

### 15.2 不要做

- 不实现 `/blog/page/[page]/`、`/tags/*`、`/archive/`、`/search/` 的路由逻辑。
- 不修改 `src/data/tags.ts`、`src/lib/**`、`package.json`、`astro.config.mjs`。
- 不设计评论、分享条、相关推荐、无限滚动。
- 不新增搜索服务、第三方 UI 库、图标库。

### 15.3 协作边界

| 内容 | agy | omp | Claude |
|---|---|---|---|
| 分页视觉 | 设计 | 实现路由/组件 | — |
| 标签视觉 | 设计 | 实现页面/链接 | 提供标签映射 |
| 归档视觉 | 设计 | 实现页面 | — |
| 搜索视觉 | 设计 | 实现页面/脚本 | 构建/索引集成 |
| SEO | 不涉及 | 传入 title/image | 实现 Seo/RSS/sitemap |
| tokens/styleguide | 维护 | 消费 | 不修改 |

- agy 与 omp 不同时改同一组件；需要改 omp 文件时，在 `agy-frontend-report.md` 写建议，由 omp 落地。
- P1 集成后，agy 只做视觉复查；功能验收由 Claude 负责。

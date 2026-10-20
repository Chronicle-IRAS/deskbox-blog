# agy P4 生产发布最终视觉与社交预览 QA 报告

**执行者：** 反重力（agy）  
**日期：** 2026-10-20  
**分支：** `feat/p4-visual`（独立工作区 `../博客-agy`，端口 `4323`）  
**基线：** `feat/p4-release` @ `6f1ece1`（含 Giscus 评论启用、Umami 可选分析与 `/privacy/` 页面、每篇文章 `/og/[slug].png` 自动生成、CSP 哈希锁与 GitHub Actions CI）  
**合并：** `main` @ `b817695`（P4 上线运营）  
**关联：** [P4 三智能体分工](./three-agent-p4.md) · [P4 上线决策](./p4-decisions.md) · [P4 发布报告](./p4-release-report.md) · [agy P3 报告](./agy-p3-report.md) · [agy 前端视觉报告](./agy-frontend-report.md) · [视觉与交互设计](../design.md) · [设计系统](../../design-system/deskbox-blog/MASTER.md)

---

## 1. 任务完成清单（对应 `three-agent-p4.md` §3 & §5 A1–A5）

| 编号 | 任务 | 状态 | 交付与验证产物 |
|---|---|---|---|
| **A1** | 生产预览最终视觉 QA（含评论区与 `/privacy/` 页） | **已完成** | 修复 `/privacy/` 窄屏贴边与顶部留白（`src/styles/global.css`）；完成 15 路由 × 5 视口 × 明暗双主题 + 高对比度 + 减少动态效果全矩阵扫描（0 溢出、0 serious/critical 违规） |
| **A2** | 每篇文章 OG 图模板与社交预览检查 | **已完成** | 逐一核验构建产物 `dist/og/*.png`（12 张 `1200×630` PNG）与默认回退 `public/og-default.png` 的中文折行、长标题/长摘要截断与墨感深色视觉层次 |
| **A3** | Favicon / 头像 / 分享卡片最终检查 | **已完成** | 核验 `public/favicon.svg`（明暗自适应）、`public/avatar.svg`（512×512 JSON-LD `Person.image`）、文章与非文章页 `og:image` / `twitter:card` 一致性 |
| **A4** | `/styleguide` 与设计系统同步 | **已完成** | 更新 `src/pages/styleguide.astro` 第 `07` 节，接入构建期动态生成的 `/og/astro-content-collections.png` 实图预览与 `/privacy/` 链接 |
| **A5** | 视觉报告与偏差记录 | **已完成** | 新增 `docs/plans/agy-p4-report.md`，更新 `docs/plans/agy-frontend-report.md` 与 `docs/plans/agy-p3-report.md`，核对 `docs/design.md` 与 `MASTER.md` 一致性 |

---

## 2. 视觉发现与修复详情

### 2.1 `/privacy/` 隐私页容器留白与窄屏贴边修复（A1）

- **问题现象**：P4 新增的 `src/pages/privacy.astro` 使用 `<article class="privacy prose">`，仅定义了局部 `.privacy { margin-inline: auto; }`，未纳入全站页面容器留白规则。导致：
  1. 在 `375px` 移动端视口下左右 `padding-inline` 为 `0px`，正文紧贴屏幕边缘；
  2. 顶部 `padding-block-start` 为 `0px`，`<h1>隐私</h1>` 紧贴粘性 Header 下沿；
  3. 桌面端 `1440px` 下宽度受 `.prose`（`65ch`）约束但缺少统一的 `<h1>` 底部分割线（与 `/about/` 页视觉不一致）。
- **修复方案（`src/styles/global.css`）**：
  - 将 `.privacy` 纳入全局页面容器 `:where(.blog-index, .post, .about, .privacy, ...)`，统一赋予 `padding-block-start: clamp(2.5rem, 6vw, 4.5rem)` 与 `padding-inline: var(--gutter)`；
  - 设置 `.privacy { max-width: calc(var(--measure) + 2 * var(--gutter)); }` 与 `.privacy h1 { padding-block-end: var(--space-4); border-bottom: 1px solid var(--border); }`，使其在 `375px` 与 `1440px`、浅色与深色主题下与 `/about/` 保持完全一致的瑞士编辑风版式。
  - 由于 `astro.config.mjs` 启用了 `inlineStylesheets: 'always'`，CSS 调整仅更新内联 `<style>`，不影响任何 `<script>` 哈希（`npm run check:csp` 5 个脚本哈希完全匹配）。

### 2.2 文章页按需评论区（`.comments`）生产预览核验（A1）

- P4 已在 `src/data/site.ts` 默认启用 Giscus 按需评论（`enabled: true`），所有文章详情页底部均渲染 `<section class="comments" data-comments>`。
- 实测 `/blog/astro-content-collections/` 等文章页在 `375px` 与 `1440px`、`Light` 与 `Dark` 主题下：
  - `.comments` 顶部 `1px solid var(--border)` 分隔线与 `.post__adjacent`（上下篇导航）间距克制，最大宽度 `var(--measure)` 与正文列严格左对齐；
  - 触发按钮 `.comments__trigger` 满足 `min-height: 44px` 触控目标，`forced-colors: active` 下具备显式边框，`@media print` 下自动隐藏；
  - 页脚新增的 `隐私`（`/privacy/`）链接与 `GitHub`、`Email` 并列对齐，无换行错位。

### 2.3 每篇文章动态 OG 图（`/og/[slug].png`）与社交预览核验（A2 / A3）

- 构建阶段通过 `src/lib/og.ts` + `src/pages/og/[slug].png.ts`（基于 `sharp` 渲染 SVG 模板）为全部 12 篇已发布文章生成 `1200×630` PNG（位于 `dist/og/<slug>.png`）。
- 抽样视觉核验结果：
  - **常规长文（`/og/astro-content-collections.png`）**：墨感深色底（`#09090B`）+ 顶部 `8px` 信号色条（`#EC4899`）+ 瑞士网格内框（`#27272A`）；顶栏 `DESKBOX · ARTICLE` 与右上 `2026.10.18 · 约 2 分钟` 等宽对齐；主标题 `用 Astro 内容集合管理博客文章` 衬线字重饱满，摘要与底部 `#前端 #工程实践 #后端` 芯片层次分明。
  - **极端长 slug 与长标题测试文（`/og/a-very-long-slug-for-testing-list-layout-and-line-wrapping-behavior.png`）**：中文与西文混排标题 `长标题与长 slug 的排版测试` 及长摘要均在安全边界内自然折行，无溢出或文字重叠。
  - **回退策略与元数据一致性**：
    - 有独立 `cover` 的文章（如 `astro-content-collections`）优先使用 Astro 优化后的封面图作为 `og:image`，同时保留 `/og/astro-content-collections.png` 供直接访问或分享卡片调用；
    - 无独立 `cover` 的文章（如 `hello-world`、`post-01` 等）自动将 `og:image` 指向 `/og/<slug>.png`；
    - 非文章页面（首页、列表、标签、归档、关于、隐私）统一回退至 `/og-default.png`（纸感浅色卡），与文章级墨感深色卡形成清晰视觉区分。

### 2.4 `/styleguide` 与设计文档一致性核对（A4 / A5）

- **`/styleguide` 更新**：在 `src/pages/styleguide.astro` 第 `07 · P3/P4 社交预览（OG Card）、评论与隐私视觉规范` 章节中，将文章级 OG 卡片预览切换为构建期真实生成的 `/og/astro-content-collections.png`，并在隐私声明块补充 `/privacy/` 页面入口链接。
- **与 `docs/design.md` 及 `design-system/deskbox-blog/MASTER.md` 对照**：
  - 色彩系统（`#FAFAFA` / `#09090B` 主背景、文字链接 `#BE185D` / `#F9A8D4`、实心按钮 `#EC4899` + `#18181B`）、字体栈（`Libre Bodoni` + 宋体标题、系统无衬线正文、`JetBrains Mono` 代码）、版心与断点（`42rem` 阅读宽、`72rem` 容器宽）均 100% 遵循规范，无设计偏差。

---

## 3. 全量门禁与多视口无障碍矩阵验证结果

在 `../博客-agy`（分支 `feat/p4-visual`）执行完整生产构建与验证矩阵：

| 检查项 | 结果 | 详情 |
|---|---|---|
| `npm run check` | **通过**（0 errors, 0 warnings, 2 hints） | 74 个文件 Astro + TypeScript 类型检查全部通过 |
| `npm run test` | **通过**（6 files, 34/34 passed） | 含 `og.test.ts`、`posts.test.ts`、`seo.test.ts`、`reading-time.test.ts`、`urls.test.ts`、`format.test.ts` |
| `npm run build` | **通过**（27 pages + 12 张 `/og/*.png` + Pagefind 12 篇 / 972 词） | 自动生成 5 个 CSP 脚本哈希、`_headers` 与 Nginx 配置 |
| `npm run check:csp` | **通过**（5 hashes match） | `deploy/csp-hashes.json`、`deploy/csp-policy.txt` 与 `dist/` 完全一致 |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4323 npx playwright test` | **通过**（51/51 passed，0 skipped） | 含新增 `文章 OG 图可由构建生成`、`非文章页面使用默认 OG 图`、全站链接检查（含 `/privacy/`）、无障碍与主题切换 |
| **15 路由 × 5 视口 × 明暗双主题 + 高对比度 + 减少动态效果矩阵** | **通过**（158/158 场景 0 溢出，0 serious/critical 违规） | 覆盖 `/`、`/blog/`、`/blog/page/2/`、`/blog/astro-content-collections/`（含评论区）、`/blog/post-01/`（含系列导航）、`/blog/a-very-long-slug-.../`、`/blog/hello-world/`、`/tags/`、`/tags/frontend/`、`/archive/`、`/search/?q=内容集合`、`/about/`、`/privacy/`、`/does-not-exist/`、`/styleguide/` 在 `375 / 640[200%缩放等效] / 768 / 1024 / 1440` 下的 Light/Dark 表现 |

---

## 4. 改动文件清单（严格遵守文件所有权）

| 文件路径 | 类型 | 说明 |
|---|---|---|
| `src/styles/global.css` | 修改 | 将 `.privacy` 纳入全局容器留白与版心规则，并补齐 `.privacy h1` 底部分割线 |
| `src/pages/styleguide.astro` | 修改 | 第 `07` 节接入构建生成的 `/og/astro-content-collections.png` 预览与 `/privacy/` 链接 |
| `docs/plans/agy-p4-report.md` | 新增 | 本 P4 生产发布最终视觉与社交预览 QA 报告 |
| `docs/plans/agy-p3-report.md` | 修改 | 增补指向 P4 报告的后续阶段链接 |
| `docs/plans/agy-frontend-report.md` | 修改 | 增补指向 P4 报告的后续阶段链接 |

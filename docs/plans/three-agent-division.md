# 三智能体分工：Claude Code / omp / agy

**基线：** `main` @ `1d33633`（P0/P1/P2/P3 完成；49/49 E2E）  
**下一步：** [P3 上线准备](./three-agent-p3.md) · [P4 上线运营与问题记录](./three-agent-p4.md)  
**目标：** 记录 P0–P3 的分工与所有权，并指引下一轮 P4 上线运营。  
**关联：** [P1 并行实施](./p1-parallel.md) · [agy 前端设计任务书](./agy-frontend-design.md) · [omp P1 报告](./omp-p1-report.md) · [P0 集成报告](./p0-integration-report.md)

---

## 1. 当前状态

| 轨道 | 状态 | 分支 | 说明 |
|---|---|---|---|
| P0 | 完成 | `feat/p0-integration`（已合并） | 首页、列表、文章、About、404、styleguide |
| Claude P1 | 完成并合并 | `feat/p1-claude-seo` → `feat/p1-integration` | SEO、RSS、sitemap、robots、Pagefind 构建、标签映射、导航激活态 |
| omp P1 | 完成并合并 | `feat/p1-omp-reading` → `main` | 分页、标签、归档、搜索页 |
| agy P1/P2 | 完成并合并 | `feat/agy-frontend` → `main` @ `9b50e66` | P0/P1/P2 视觉调整、token、styleguide、视觉 QA |

**当前 `main` 能力（`main` @ `9b50e66`）**

- 分页、标签页、归档、搜索页、文章标签链接、`data-pagefind-body`。
- SEO 组件、JSON-LD、RSS、sitemap、robots、Pagefind build 集成。
- `npm run check` 0 errors；`npm run test` 29/29；`npm run build` 26 页 + Pagefind；`npm run test:e2e` 36/36。
- 搜索在 preview + Pagefind 下可用；dev 下显示“索引未生成”。

---

## 2. 角色章程

### Claude Code — Platform / SEO / Integration

**负责**

- `package.json` / `astro.config.mjs` / 构建脚本。
- SEO：`Seo.astro`、JSON-LD、canonical、OG/Twitter。
- Feed：`rss.xml.ts`、`sitemap`、`robots.txt`。
- 搜索基础设施：`pagefind` 依赖、`build` 集成、Header/Footer `data-pagefind-ignore`。
- 共享数据：`tagSlugByName`、`BaseLayout.activeNav` 扩展。
- 最终集成：`feat/p1-integration`、全量验证、报告。

**不负责**

- P1 页面布局与路由（omp）。
- 视觉设计、token 与 styleguide（agy）。
- 内容写作与 frontmatter（作者）。

### omp — Reading Routes / Search UX

**负责**

- 分页、标签、归档、搜索页、文章页标签链接。
- 搜索交互：`?q=`、加载/空/错误、无 JS 兜底。
- P2 阅读增强：系列导航、搜索快捷键、打印样式、长文体验。
- P1/P2 页面级 E2E。

**不负责**

- SEO/Feed/构建配置（Claude）。
- 视觉系统与 token（agy）。
- 内容/数据/lib 契约（Claude）。

### agy — Frontend Design / Visual QA

**负责**

- token、typography、间距、暗色模式、响应式细节。
- P0/P1 页面视觉打磨：首页、列表、文章、tags、archive、search、404、styleguide。
- P1 组件视觉规格：分页、标签 chip、归档行、搜索输入/结果。
- 视觉验收、截图、设计偏差报告。

**不负责**

- 路由逻辑、数据、SEO、Feed、构建配置。
- 内容文案与真实个人信息。
- 部署、评论、分析。

---

## 3. 文件所有权

> 完整表格见 [P1 并行实施](./p1-parallel.md) §3；这里是三智能体的关键边界。

| 文件/区域 | 所有者 |
|---|---|
| `package.json`、`astro.config.mjs`、`src/lib/**`、`src/data/tags.ts` | Claude |
| `src/data/site.ts` 导航 | omp（已加 P1 入口；Claude 可扩展 activeNav） |
| `src/components/Seo.astro`、`src/pages/rss.xml.ts`、`src/pages/robots.txt.ts` | Claude |
| `src/components/PostCard.astro`、`SiteHeader/Footer`、`BaseLayout.astro` | Claude |
| `src/pages/blog/page/**`、`src/pages/tags/**`、`src/pages/archive.astro`、`src/pages/search.astro` | omp |
| `src/components/Pagination.astro`、`TagList.astro`、`BlogIndexView.astro` | omp |
| `src/layouts/PostLayout.astro` | omp（标签链接、搜索标记、SEO image） |
| `src/styles/**`、`src/pages/styleguide.astro` | agy（token/视觉） |
| `tests/e2e/**` | 按页面归属；Claude 负责集成全量 |
| `docs/plans/*` | 用户/对应轨道；不改他人计划 |

**规则**

- 需要改他人文件时写 `CONTRACT-CHANGE`，停止并交给用户。
- 不在同一工作区同时编辑同一文件。
- 视觉改动优先通过 token/scoped styles，不重构路由与数据。

---

## 4. 当前 P1 收尾任务

### Claude Code

- [ ] C1 安装 `@astrojs/rss`、`@astrojs/sitemap`、`pagefind`；`build` 加 Pagefind。
- [ ] C2 `src/data/tags.ts` 增加 `tagSlugByName`；`PostCard` 标签改为 `/tags/<slug>/`。
- [ ] C3 新建 `Seo.astro` / `lib/seo.ts`，接入 `BaseLayout`；文章 JSON-LD。
- [ ] C4 `/rss.xml`、`/robots.txt`、sitemap 过滤。
- [ ] C5 Header/Footer `data-pagefind-ignore`；扩展 `BaseLayout.activeNav` 为 `tags | archive | search`，`SiteHeader` 映射当前项。
- [ ] C6 创建 `feat/p1-integration`，合并 omp/agy；跑 `check / test / build / test:e2e`；更新 `p1-integration-report.md`。

### omp

- [ ] O1 等 Claude 提供 `tagSlugByName` 后，把 PostLayout 的本地 `tags.find()` 改为共享 helper。
- [ ] O2 等 Claude 扩展 `activeNav` 后，为 `/tags/`、`/tags/[tag]/`、`/archive/`、`/search/` 传当前项。
- [ ] O3 配合 Claude 验证 preview + Pagefind 搜索；确认 29/29 E2E。
- [ ] O4 更新 `omp-p1-report.md` 的合并状态与剩余依赖。

### agy

- [ ] A1 按 `agy-frontend-design.md` 完成 P0 视觉打磨。
- [ ] A2 产出 P1 组件视觉规格（分页、标签、归档、搜索）。
- [ ] A3 更新 `/styleguide`；提供 375/1440、Light/Dark 截图与报告。

---

## 5. 下一轮 P2 建议（待确认）

**主题：阅读体验加固与视觉一致性。** 不涉及部署、评论、分析。

### Claude Code — 质量门禁与结构化数据

- [ ] 性能预算：记录 CSS/JS/字体/HTML 体积；Lighthouse 手工基线。
- [ ] SEO 回归测试：canonical、OG、JSON-LD、RSS item、sitemap 过滤。
- [ ] 内部链接爬取；404/重定向检查。
- [ ] 依赖审计与 Node 版本收敛（建议 Node 22.22+ 或 24）。
- [ ] P2 集成与报告。

### omp — 长文与搜索体验

- [ ] 系列导航：使用现有 `series` frontmatter，在文章页显示同系列文章。
- [ ] 搜索快捷键 `/` 聚焦输入；结果元信息（日期/标签）；无结果时推荐标签/归档。
- [ ] 文章打印样式：隐藏导航/TOC，保留正文与链接 URL。
- [ ] 标签页/归档在文章数增长后的分页策略（当前 12 篇不需要）。
- [ ] P2 页面级 E2E。

### agy — 视觉打磨与设计 QA

- [ ] P0/P1 页面视觉复查：首页、列表、文章、tags、archive、search、404。
- [ ] 中文长文排版、暗色代码块、宽表格、移动端 TOC。
- [ ] 200% 缩放、`forced-colors`、`prefers-reduced-motion`。
- [ ] 更新 styleguide 与设计偏差报告。

> P2 是建议范围；开始前由用户确认，避免范围膨胀。

### 5.1 P2 启动状态（2026-10-19）

agy 仍在 `feat/agy-frontend` 工作，当前修改：

```text
src/pages/styleguide.astro
src/styles/global.css
```

因此：

- **Claude Code 可以立即开始 P2**：质量门禁、SEO 回归、性能基线、链接检查，不与 agy 的视觉文件重叠。
- **omp 可以先开始不冲突的 P2 任务**：
  - `PostLayout.astro` 系列导航（agy 当前未改此文件）。
  - `search.ts` 搜索快捷键与结果增强（agy 当前未改脚本）。
- **omp 暂缓**：
  - 打印样式涉及 `prose.css` / `global.css`，等 agy 合并后再做。
  - 任何 `styleguide.astro` 修改等 agy 完成。
- **分支**：Claude `feat/p2-claude-quality`，omp `feat/p2-omp-reading`，agy 继续 `feat/agy-frontend`。
- **集成顺序**：agy 先合并 → omp rebase → Claude 创建 `feat/p2-integration` 跑全量 → 用户确认后合并 `main`。

---

## 6. 共享契约

| 契约 | 提供者 | 消费者 |
|---|---|---|
| `tagSlugByName(name)` / `tagBySlug(slug)` | Claude | omp、PostCard、PostLayout |
| `BaseLayout.activeNav` 扩展 | Claude | omp 页面 |
| `Seo` / `BaseLayout.image` | Claude | omp 页面传 title/description/image |
| `Pagination` props | omp | 仅 omp |
| `data-pagefind-body` | omp | Pagefind |
| `data-pagefind-ignore` | Claude | Pagefind |
| `/pagefind/pagefind.js` | Claude 构建 | omp 搜索页 |
| P1 token/组件视觉 | agy | omp/Claude 消费 |

**变更规则**

- 契约变更先在提交/PR 写 `CONTRACT-CHANGE`，说明影响范围。
- omp/agy 不直接改 Claude 的共享文件；Claude 不直接改 omp 的 P1 页面。
- 集成分支只由 Claude 创建；全量检查通过后再交给用户。

---

## 7. 工作区、分支与端口

| 轨道 | 工作区 | 分支 | 端口 |
|---|---|---|---|
| Claude Code | `C:/Users/Lenovo/DeskBox/博客` | `feat/p1-claude-seo` → `feat/p1-integration` | 4321 |
| omp | `../博客-omp` | `feat/p1-omp-reading`（已合并） | 4322 |
| agy | `../博客-agy` | `feat/agy-frontend` | 4323 |

```bash
# Claude
git switch main
git switch -c feat/p1-claude-seo

# omp（复用 worktree，从 main 建新分支）
git -C ../博客-omp switch -c feat/p2-omp-reading main

# agy（新 worktree）
git worktree add ../博客-agy -b feat/agy-frontend main
```

- 本仓库暂无 remote；不要 `git push`。
- 三条轨道从最新 `main` 创建；omp/agy 在 Claude 的共享契约提交后 rebase。
- 集成由 Claude 在 `feat/p1-integration` / `feat/p2-integration` 完成，不直接合并 `main`，等用户确认。

---

## 8. 集成顺序

1. **Claude P1 契约先行**：依赖、`build`、`tagSlugByName`、`activeNav`、`data-pagefind-ignore`。
2. **omp P1 收尾**：rebase 后改用共享 helper，补 activeNav，preview + Pagefind 验证。
3. **agy P1 视觉**：基于最新 `main` 或 Claude 契约分支，完成 P0/P1 视觉；不碰路由逻辑。
4. **Claude 集成**：`feat/p1-integration` 合并 omp/agy；跑全量检查；更新报告。
5. **用户确认后合并 `main`**。
6. P2 按 §5 重新开分支，重复同样的所有权与集成规则。

---

## 9. 验收

- [ ] P1 所有路由、搜索、RSS、sitemap、robots、SEO 正常。
- [ ] `npm run check`、`npm run test`、`npm run build`、`npm run test:e2e` 通过。
- [ ] preview + Pagefind 下搜索中文有结果；dev 下显示索引未生成提示。
- [ ] 375/768/1024/1440 无横向滚动；Light/Dark 正常。
- [ ] 无第三方脚本；无部署/评论/分析代码。
- [ ] 共享契约无未通知变更；文件所有权无越界。

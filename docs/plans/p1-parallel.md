# P1 并行实施：Claude Code + omp

**基线：** `main` @ P0 合并后（P0 已通过 `check / test / build / E2E`）  
**目标：** 在 P0 原型上补齐阅读与分发能力：分页、标签、归档、搜索、RSS、sitemap、robots、SEO。  
**分工：** Claude Code 负责 SEO / Feed / 构建集成；omp 负责阅读路由与搜索页；agy 负责前端视觉设计与 P1 组件视觉规格。  
**相关文档：** [agy 前端设计任务书](./agy-frontend-design.md) · [原型架构](../architecture.md) · [视觉设计](../design.md) · [设计系统](../../design-system/deskbox-blog/MASTER.md)

---

## 1. 范围

### 1.1 要做

- `/blog/` 改为每页 10 篇；新增 `/blog/page/[page]/`。
- `/tags/`、`/tags/[tag]/`。
- `/archive/` 按年归档。
- `/search/` Pagefind 搜索；中文关键词可命中；`?q=` 可分享。
- `/rss.xml`、`/sitemap-index.xml`、`/robots.txt`。
- 每页 SEO：title、description、canonical、OG/Twitter、JSON-LD。
- 文章/列表的标签变为 `/tags/<slug>/` 链接。
- 搜索索引：文章正文 `data-pagefind-body`，Header/Footer `data-pagefind-ignore`。
- 单元/E2E 覆盖新增路由与搜索。

### 1.2 不做

- 部署、域名、CDN、CI/CD、headers、备案。
- 评论、分析、多语言、OG 图生成、定时发布。
- 自建搜索服务、数据库、服务端 API。
- 重写 P0 页面结构或组件契约。

---

## 2. 分支、工作区与端口

| 轨道 | 执行者 | 分支 | 工作区 | 端口 |
|---|---|---|---|---|
| SEO / Feed / 集成 | Claude Code | `feat/p1-claude-seo` | 主工作区 `C:/Users/Lenovo/DeskBox/博客` | 4321 |
| 阅读路由 / 搜索 | omp | `feat/p1-omp-reading` | `../博客-omp` | 4322 |
| 前端设计 | agy | `feat/agy-frontend` | `../博客-agy` | 4323 |

```bash
# omp
git worktree add ../博客-omp -b feat/p1-omp-reading main
# agy
git worktree add ../博客-agy -b feat/agy-frontend main
```

- 本仓库暂无 remote；不要 `git push`。
- 三条轨道都从 P0 合并后的 `main` 创建；omp/agy 在 Claude 的共享契约提交后 rebase。
- 集成由 Claude 在 `feat/p1-integration` 完成，跑全量检查后交给用户。

---

## 3. 文件所有权

### 3.1 Claude Code

```text
package.json
package-lock.json
astro.config.mjs
src/data/tags.ts                 # 新增 tagBySlug / tagSlugByName
src/components/Seo.astro         # 新建
src/components/PostCard.astro    # 标签链接
src/components/SiteHeader.astro  # data-pagefind-ignore
src/components/SiteFooter.astro  # data-pagefind-ignore
src/layouts/BaseLayout.astro     # 接入 Seo
src/lib/seo.ts                   # 新建
src/lib/urls.ts                  # 新建
src/pages/rss.xml.ts             # 新建
src/pages/robots.txt.ts          # 新建
tests/unit/seo.test.ts           # 新建
tests/unit/urls.test.ts          # 新建
tests/e2e/seo.spec.ts            # 新建
```

### 3.2 omp

```text
src/pages/blog/index.astro       # 改为第 1 页（10 篇）
src/pages/blog/page/[page].astro # 新建
src/components/Pagination.astro  # 新建
src/pages/tags/index.astro       # 新建
src/pages/tags/[tag].astro       # 新建
src/components/TagList.astro     # 新建
src/pages/archive.astro          # 新建
src/pages/search.astro           # 新建
src/scripts/search.ts            # 新建
src/layouts/PostLayout.astro     # 标签链接、data-pagefind-body、SEO image
tests/e2e/pagination.spec.ts     # 新建
tests/e2e/tags.spec.ts           # 新建
tests/e2e/search.spec.ts         # 新建
```

### 3.3 agy

```text
src/styles/**                   # token / 视觉调整
src/components/**               # 仅 P0/P1 视觉层，避免与 omp 功能文件冲突
src/pages/styleguide.astro      # 同步设计系统
docs/plans/agy-frontend-report.md
```

- agy 不实现 P1 路由逻辑；P1 组件视觉规格写到报告，由 omp 落地。
- 如果 agy 需要改 omp 正在实现的组件，先在报告中标注，不要直接改同一文件。

### 3.4 禁止修改

- omp 不改 `package.json`、`astro.config.mjs`、`src/lib/**`、`src/data/**`、`src/components/Seo.astro`。
- Claude 不改 omp 的 P1 页面（`blog/page`、`tags`、`archive`、`search`）与 `Pagination`/`TagList`。
- agy 不改内容、数据、lib、路由逻辑、部署配置。
- 任何跨所有权变更先写 `CONTRACT-CHANGE`，停止并交给用户。

---

## 4. 共享契约（P1）

### 4.1 标签映射（Claude 提供，omp 消费）

```ts
// src/data/tags.ts
export interface Tag {
  name: string;
  slug: string;
  description?: string;
}

export const tags: readonly Tag[];
export function tagBySlug(slug: string): Tag | undefined;
export function tagSlugByName(name: string): string;
```

- `tagSlugByName()` 对未知标签抛错或构建失败；与现有 Zod 校验一致。
- `PostCard`（Claude）与 `PostLayout`（omp）都使用该函数生成 `/tags/<slug>/` 链接。
- P0 的“标签仅文本”在 P1 改为链接；不要改变标签显示名。

### 4.2 分页（omp 自洽）

```ts
// Pagination.astro
interface Props {
  page: number;       // 1-based
  totalPages: number;
}
```

- 第 1 页链接 `/blog/`；第 N 页 `/blog/page/N/`。
- 不生成 `/blog/page/1/`。
- `/blog/` 只显示第 1 页 10 篇；`/blog/page/[page]/` 生成 2..N。
- 上一页/下一页禁用状态使用 `aria-disabled`，不要用不可聚焦的假链接。

### 4.3 SEO（Claude 提供，omp 通过 BaseLayout 消费）

```ts
// Seo.astro（由 BaseLayout 内部使用）
interface Props {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
}
```

- `BaseLayout` props 不变：`title`、`description`、`activeNav`、`noindex`、`image`。
- 文章页 `PostLayout` 传 `image={post.data.cover?.src}`（`ImageMetadata.src` 是字符串）。
- 首页/列表/About/404 由各页面传 `title`/`description`；`noindex` 仅用于 404/styleguide/search。
- canonical 统一使用 `Astro.site` + pathname 尾斜杠。
- 文章 JSON-LD `BlogPosting`；首页 `WebSite` + `Person`。

### 4.4 搜索（Claude 构建 + omp 页面）

- Claude：安装 `pagefind`，`build` 改为 `astro build && pagefind --site dist`。
- Claude：`SiteHeader`/`SiteFooter` 加 `data-pagefind-ignore`。
- omp：`PostLayout` 的 `<article class="prose">` 加 `data-pagefind-body`。
- omp：`/search/` 加载 `/pagefind/pagefind-ui.js` 与 CSS；`?q=` 同步；无结果/错误状态；`<noscript>` 链接到 `/archive/`。
- 搜索页 `noindex`，不进入 sitemap。
- `astro dev` 没有 Pagefind 索引；搜索验收用 `npm run build && npm run preview`。

### 4.5 Feed / Sitemap（Claude）

- `/rss.xml`：全文、绝对链接、稳定 guid。
- `@astrojs/sitemap`：过滤 `/search/`、`/404`、`/styleguide/`、分页页。
- `/robots.txt`：允许抓取，指向 sitemap；原型阶段用 `http://localhost:4321` 占位。
- 不把草稿/未来文章放入 RSS、sitemap 或搜索索引。

---

## 5. Claude Code 任务

### C1 — 依赖与构建

- [ ] 安装：`npm install @astrojs/rss @astrojs/sitemap pagefind`。
- [ ] `package.json` 的 `build` 改为 `astro build && pagefind --site dist`。
- [ ] `astro.config.mjs` 添加 `sitemap()`；过滤 `/search/`、`/404`、`/styleguide/`、分页页。
- [ ] 保持 `site: 'http://localhost:4321'` 占位。
- [ ] 提交：`build(p1): 接入 RSS、sitemap 与 Pagefind 构建`。

### C2 — 标签映射与卡片链接

- [ ] `src/data/tags.ts` 增加 `tagBySlug`、`tagSlugByName`。
- [ ] `PostCard` 标签渲染为 `<a href={`/tags/${tagSlugByName(tag)}/`}>#{tag}</a>`。
- [ ] 保持 `PostCard` 根元素 `article.post-card` 与 props 不变。
- [ ] 未知标签仍由构建/Zod 失败。
- [ ] 提交：`feat(tags): 添加标签映射与卡片链接`。

### C3 — SEO 组件与 BaseLayout

- [ ] 新建 `src/lib/seo.ts`：title 模板、JSON-LD 数据、canonical。
- [ ] 新建 `src/components/Seo.astro`：title/description/canonical/OG/Twitter/robots。
- [ ] `BaseLayout` 接入 `Seo`；保持现有 props。
- [ ] 文章页 JSON-LD `BlogPosting`；首页 `WebSite` + `Person`。
- [ ] `PostLayout` 由 omp 传 `image`；Claude 只保证 BaseLayout 支持。
- [ ] 提交：`feat(seo): 添加页面元数据与结构化数据`。

### C4 — RSS / robots

- [ ] 新建 `src/pages/rss.xml.ts`：全文、绝对链接、稳定 guid。
- [ ] 新建 `src/pages/robots.txt.ts`：指向 sitemap。
- [ ] 单元测试：URL 绝对化、RSS item 数量、草稿/未来文章排除。
- [ ] 提交：`feat(feed): 添加 RSS 与 robots`。

### C5 — 搜索索引标记

- [ ] `SiteHeader`/`SiteFooter` 加 `data-pagefind-ignore`。
- [ ] 确认 `PostLayout` 的 `data-pagefind-body` 由 omp 添加（契约 §4.4）。
- [ ] 提交：`feat(search): 标记搜索索引范围`。

### C6 — P1 集成与验证

- [ ] 创建 `feat/p1-integration`，合并 omp/agy 分支。
- [ ] 运行：
  ```bash
  npm run check
  npm run test
  npm run build
  npm run test:e2e
  ```
- [ ] 验证 RSS/sitemap/robots、SEO、搜索索引、分页、标签、归档。
- [ ] 更新 `docs/plans/p1-integration-report.md`；不合并 `main`，等用户确认。

---

## 6. omp 任务

### O1 — 分页

- [ ] `/blog/` 改为第 1 页，10 篇/页。
- [ ] 新建 `/blog/page/[page].astro`，生成第 2..N 页。
- [ ] 新建 `Pagination.astro`，按契约 §4.2；首/尾页禁用。
- [ ] 12 篇示例内容验证第 2 页。
- [ ] 测试：第 1 页 10 篇、第 2 页 2 篇、不生成 `/blog/page/1/`。
- [ ] 提交：`feat(pagination): 为文章列表添加分页`。

### O2 — 标签

- [ ] 新建 `/tags/`：按注册表顺序显示名称、数量、说明。
- [ ] 新建 `/tags/[tag]/`：按 slug 过滤；空标签不生成。
- [ ] 新建 `TagList.astro`；复用 `PostList`。
- [ ] `PostLayout` 标签链接使用 `tagSlugByName()`。
- [ ] 测试：标签页数量、链接、未知 slug 404。
- [ ] 提交：`feat(tags): 添加标签索引与标签页`。

### O3 — 归档

- [ ] 新建 `/archive/`：按年分组，组内日期降序。
- [ ] 行内日期、标题、标签；摘要省略。
- [ ] 测试：年份分组、排序、空年份不生成。
- [ ] 提交：`feat(archive): 添加按年归档`。

### O4 — 搜索

- [ ] 新建 `/search/` 与 `src/scripts/search.ts`；加载 Pagefind UI。
- [ ] `?q=` 同步；无结果/错误状态；`noindex`；`<noscript>` 链接 `/archive/`。
- [ ] `PostLayout` 的 `<article class="prose">` 加 `data-pagefind-body`。
- [ ] 用 `npm run build && npm run preview` 验收中文关键词（如“内容集合”“排版”）。
- [ ] 测试：有结果、无结果、无 JS 兜底。
- [ ] 提交：`feat(search): 添加 Pagefind 搜索页`。

### O5 — SEO 配合

- [ ] `PostLayout` 传 `image={post.data.cover?.src}` 给 BaseLayout。
- [ ] 确认列表/标签/归档/搜索页传正确的 `title`/`description`/`noindex`。
- [ ] 不实现 `Seo.astro`（Claude 所有）。
- [ ] 提交：`feat(seo): 补充页面 SEO 输入`。

### O6 — P1 验证与交接

- [ ] 运行 `npm run check`、`npm run test`、`npm run build`。
- [ ] 启动 `npm run dev -- --port 4322`，运行：
  ```bash
  PLAYWRIGHT_BASE_URL=http://localhost:4322 npm run test:e2e
  ```
- [ ] 记录 commit SHA、测试结果、已知问题。
- [ ] 通知 Claude 集成。

---

## 7. agy 协作

agy 的完整任务见 [agy 前端设计任务书](./agy-frontend-design.md)。

P1 设计交付：

- 分页控件视觉（当前页、禁用、上一页/下一页）。
- 标签索引/标签页视觉（chip、数量、说明、长标签换行）。
- 归档行视觉（年份分组、日期列、标题层级）。
- 搜索页视觉（输入框、结果、片段高亮、空/错误状态）。
- SEO 不产生新 UI；不要设计隐藏的分享条/评论。
- 同步更新 `/styleguide`；token 变更写入 `src/styles/tokens.css`。

协作规则：

- agy 只做视觉层；P1 路由逻辑由 omp 实现。
- agy 与 omp 不同时改同一组件；需要改 omp 文件时在报告中列建议。
- agy 分支合并进 `feat/p1-integration` 后，Claude 跑全量检查。

---

## 8. 验收清单

- [ ] `/blog/` 10 篇/页；`/blog/page/2/` 存在；不生成 `/blog/page/1/`。
- [ ] `/tags/` 与 `/tags/<slug>/` 正常；标签链接从卡片和文章页可达。
- [ ] `/archive/` 按年分组。
- [ ] `/search/` 中文关键词有结果；无结果/错误状态；`?q=` 可分享。
- [ ] `/rss.xml`、`/sitemap-index.xml`、`/robots.txt` 生成；草稿/未来/搜索页不进入 sitemap。
- [ ] 每页 title/description/canonical/OG；文章 JSON-LD。
- [ ] `npm run check`、`npm run test`、`npm run build`、`npm run test:e2e` 通过。
- [ ] 375/768/1024/1440 无横向滚动；Light/Dark 正常。
- [ ] 无第三方脚本；无部署/评论/分析代码。

---

## 9. 明确不做

- 部署、域名、CDN、headers、备案、回滚。
- 评论、分析、多语言、OG 图生成、定时发布。
- 自建搜索/数据库/服务端 API。
- 改 P0 路由、内容 schema、`PostSummary`/`BaseLayout` 契约。

# P3 上线准备与运营能力：三智能体分工

**基线：** `main` @ `37f48c0`（P0/P1/P2 完成；47/47 E2E）  
**目标：** 把已完成的原型推进到可上线状态：性能收口、部署与安全、评论/分析、OG/社交预览、最终视觉 QA。  
**原则：** 先决策、再并行；部署平台与评论/分析是否启用由用户确认。  
**关联：** [三智能体分工](./three-agent-division.md) · [P2 质量报告](./p2-quality-report.md) · [agy 视觉报告](./agy-frontend-report.md) · [原型架构](../architecture.md)

---

## 1. 当前状态

**已完成**

- P0 原型、P1 阅读/搜索/SEO/Feed、P2 系列导航/搜索快捷键/质量门禁/视觉收尾。
- `npm run check` 0 errors；`npm run test` 29/29；`npm run build` 26 页 + Pagefind；`npm run test:e2e` 47/47。
- 搜索、分页、标签、归档、RSS、sitemap、robots、JSON-LD、暗色模式、主题切换、TOC、代码复制、系列导航。
- 默认无第三方脚本；评论/分析/部署未启用。

**已知非阻塞项**

- 移动端 LCP 超预算：首页 1661ms、长文 1812ms（预算 1500ms）。
- Node 23.9 触发 `EBADENGINE`；建议 Node 24 LTS。
- `scripts/measure-size.mjs` 有一个未使用 `extname` 导入提示。
- `site.author.bio` 仍为 `{{一句话简介}}` 占位。
- 无 remote；CI/部署尚未建立。

---

## 2. 上线前必须确认

| 决策 | 选项 | 影响 |
|---|---|---|
| 托管区域 | Cloudflare Pages / 国内 OSS+CDN+备案 / 其他静态托管 | 部署、CSP、缓存、访问速度 |
| 域名与站点 URL | 正式域名 | canonical、RSS、sitemap、OG |
| 评论 | 关闭 / Giscus（需公开仓库 + Discussions） | 第三方请求、CSP、隐私 |
| 分析 | 关闭 / Umami（Cloud SaaS 或自托管） | 脚本、隐私、CSP |
| 作者资料 | 姓名、简介、社交链接、头像 | 首页/About/JSON-LD |
| 仓库远程 | GitHub/GitLab 等 | CI、Giscus、编辑链接 |

> P3 在托管/评论/分析决策前，只做不依赖平台的工作（性能、安全的通用部分、OG 设计、最终 QA）。

---

## 3. 角色分工

### Claude Code — Release / Infra / Performance

**负责**

- P2 性能收口：首页/长文 LCP；CSS 关键路径、封面响应式尺寸、字体/图片交付。
- 托管与部署：构建命令、输出目录、环境变量、预览、回滚。
- 安全与缓存：CSP、`X-Content-Type-Options`、Referrer-Policy、Permissions-Policy、HSTS（域名稳定后）、`_headers`/平台等价配置。
- CI：`check / test / build / test:e2e`；依赖审计；Node 24。
- 分析接入（若启用）：Umami 脚本、环境变量、CSP、隐私说明。
- 最终集成：`feat/p3-integration`、上线检查清单、报告。

**不负责**

- 评论 UI/交互（omp）。
- OG 视觉、社交卡片、最终视觉 QA（agy）。
- 内容文案与作者资料（作者）。

### omp — Comments / Reader finalization

**负责**

- Giscus 评论（若启用）：
  - `Comments.astro`，默认不加载，点击后注入；加载/失败/未配置状态。
  - `site.comments` 配置、公开 repo/category ID、隐私说明。
  - CSP `frame-src` / `script-src` 配合 Claude。
- 阅读收尾：
  - 404 页加搜索入口（P1 已有搜索）。
  - 搜索结果元信息（日期/标签）或空状态推荐（视 Pagefind meta 支持）。
  - 系列索引页 `/series/`（可选，若作者需要）。
- 评论/阅读相关 E2E 与 axe。

**不负责**

- 部署/headers/CSP（Claude）。
- 评论视觉规范与 OG（agy）。
- 内容、数据、构建配置。

### agy — Social / Visual final

**负责**

- OG 图设计（1200×630）：站点默认 + 文章模板；与 Claude 确定生成方式（静态模板或 `astro-og-canvas`）。
- 评论/隐私/分析相关页面的视觉规范（若启用）。
- 最终视觉 QA：部署预览上的 375/768/1024/1440、Light/Dark、200% 缩放、forced-colors。
- favicon / 社交头像 / 分享卡片视觉。
- 更新 styleguide 与视觉报告。

**不负责**

- 评论脚本逻辑（omp）。
- 部署、CSP、环境变量（Claude）。
- 内容文案。

---

## 4. 任务清单

### Claude Code

- [ ] C1 性能收口：减少首屏阻塞 CSS；封面 `widths/sizes`；复测 LCP。
- [ ] C2 清理 `scripts/measure-size.mjs` 未使用导入；Node 24 收敛。
- [ ] C3 托管决策落地：`_headers` / 平台配置 / 缓存 / 404 / 回滚。
- [ ] C4 CSP 与安全头；评论/分析域名按开关加入。
- [ ] C5 CI（若配置 remote）：check/test/build/e2e + 产物测量。
- [ ] C6 分析（可选）：Umami + 隐私说明。
- [ ] C7 `feat/p3-integration`：合并 omp/agy，跑全量，出上线报告。

### omp

- [ ] O1 `Comments.astro`：点击加载 Giscus，状态完整；未配置不渲染。
- [ ] O2 `site.comments` 配置与 CSP 输入；与 Claude 对齐。
- [ ] O3 404 搜索入口；搜索结果元信息/空状态增强。
- [ ] O4 可选 `/series/` 系列索引。
- [ ] O5 评论/阅读 E2E 与 axe。
- [ ] O6 报告与交接。

### agy

- [ ] A1 OG 图视觉模板（默认 + 文章）；确定生成方式。
- [ ] A2 评论/隐私/分析页面视觉规范（若启用）。
- [ ] A3 favicon / 社交头像 / 分享卡片。
- [ ] A4 部署预览全站视觉 QA。
- [ ] A5 更新 styleguide 与报告。

---

## 5. 共享契约

| 契约 | 提供者 | 消费者 |
|---|---|---|
| `site.comments` 配置结构 | omp | Claude CSP、agy 视觉 |
| `Comments.astro` props / 加载策略 | omp | 文章页 |
| CSP 允许域名 | Claude | omp/agy |
| OG 图路径与生成方式 | agy + Claude | `Seo.astro`、文章页 |
| 分析脚本与环境变量 | Claude | agy 隐私页 |
| 部署 URL / site | Claude | SEO、RSS、sitemap、OG |

**规则**

- 先由 Claude 落部署/安全/OG 生成方式，再让 omp/agy 接入。
- 评论/分析默认关闭；启用时才加第三方域名与隐私说明。
- 不把密钥写入客户端；只使用公开 ID/URL。

---

## 6. 分支、工作区与端口

| 轨道 | 分支 | 工作区 | 端口 |
|---|---|---|---|
| Claude | `feat/p3-release` → `feat/p3-integration` | 主工作区 | 4321 |
| omp | `feat/p3-comments` | `../博客-omp` | 4322 |
| agy | `feat/p3-social` | `../博客-agy` | 4323 |

```bash
# Claude
git switch main
git switch -c feat/p3-release

# omp
git -C ../博客-omp switch -c feat/p3-comments main

# agy
git -C ../博客-agy switch -c feat/p3-social main
```

- 本仓库暂无 remote；CI/Giscus 需要先配置远程仓库。
- 集成由 Claude 在 `feat/p3-integration` 完成；部署预览验证后再合并 `main`。

---

## 7. 验收

- [ ] 上线决策已记录（托管/域名/评论/分析/作者资料）。
- [ ] LCP 首页/长文回到 1.5s 预算内，或记录例外与原因。
- [ ] `check / test / build / test:e2e` 全绿。
- [ ] CSP/安全头/缓存/404/回滚验证通过。
- [ ] 评论默认不加载；启用后点击加载，失败有提示。
- [ ] 分析默认关闭；启用后隐私说明与 CSP 同步。
- [ ] OG 图、favicon、分享卡片正确。
- [ ] 375/768/1024/1440、Light/Dark、200% 缩放、forced-colors 通过。
- [ ] 无第三方脚本（除用户启用的评论/分析）。
- [ ] 部署预览通过后再合并 `main`。

---

## 8. 明确不做

- 多语言、邮件订阅、支付/电商、CMS、用户账号。
- 自建评论/分析后端（除非用户明确要求）。
- 大规模内容迁移与重新设计。

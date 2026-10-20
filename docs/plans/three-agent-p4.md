# P4 三智能体分工与问题记录

**基线：** `main` @ `1d33633`（P0/P1/P2/P3 完成；49/49 E2E）  
**目标：** 从“可上线”推进到“已上线并可持续运营”，并把 P0–P3 遇到的问题沉淀为可复用经验。  
**关联：** [P3 上线准备](./three-agent-p3.md) · [P3 上线报告](./p3-release-report.md) · [三智能体分工](./three-agent-division.md)

---

## 1. 上线决策门（P4 开始前）

| 决策 | 选项 | 影响 | 当前 |
|---|---|---|---|
| 托管 | Cloudflare Pages / 国内 OSS+CDN+备案 / 自有 Nginx | 部署、CSP、缓存、访问速度 | **暂不考虑**；P3 已生成 headers/nginx 模板 |
| 域名 / site URL | 正式域名 | canonical、RSS、sitemap、OG、CSP | **`http://localhost:4321`** |
| 评论 | 关闭 / Giscus | 公开 repo、CSP、隐私 | **已启用**：`Chronicle-IRAS/deskbox-blog` / Announcements |
| 分析 | 关闭 / Umami | 脚本、CSP、隐私 | **已接入**；等待 `PUBLIC_UMAMI_WEBSITE_ID` |
| 作者资料 | 姓名/简介/社交/头像 | 首页、About、JSON-LD | 占位 |
| 远程仓库 / CI | GitHub/GitLab 等 | CI、Giscus、部署 | **GitHub**：`https://github.com/Chronicle-IRAS/deskbox-blog` |
| Node | 24 LTS | 构建/测试 | `.nvmrc` 为 24；本机 23.9 仍有 `EBADENGINE` |

> 当前：GitHub 仓库已创建并推送；Giscus 已启用（CSP 自动加入 `giscus.app`）；Umami 组件已接入，但缺少 Website ID，未加载脚本。托管/域名仍按本地原型处理。

---

## 2. 角色分工

### Claude Code — Release / Operations

**负责**

- 托管落地：Cloudflare Pages、国内 OSS+CDN 或 Nginx 三选一；使用 P3 生成的 `dist/_headers` / `nginx.conf`。
- 域名与 `site` URL：canonical、RSS、sitemap、OG、CSP `connect-src` 同步。
- CI/CD：Node 24、`check / test / build / check:csp / e2e`、部署预览、回滚。
- HSTS/HTTPS、缓存、404、备份、uptime 监控与 runbook。
- 分析（若启用）：Umami 脚本、环境变量、CSP、隐私页。
- 每篇文章 OG 图的构建接入（与 agy 的模板对接）。
- 最终集成：`feat/p4-integration`、生产预览验证、上线报告。

**不负责**

- 评论 UI/交互（omp）。
- OG 视觉、评论/隐私页视觉、最终视觉 QA（agy）。
- 内容写作与作者资料（作者）。

### omp — Community / Content Ops

**负责**

- Giscus 启用：真实 repo/category ID、点击加载、主题同步、失败/重试、CSP 配合。
- 评论配置文档与 moderation runbook（GitHub Discussions）。
- 搜索体验：结果元信息、快捷键、空状态；P4 只做必要增量。
- 可选 `/series/` 系列索引页。
- 内容工作流辅助：新文章模板/检查清单（不改 schema）。
- 评论/搜索 E2E 与 axe。

**不负责**

- 部署/CSP/域名（Claude）。
- OG/评论视觉规范（agy）。
- 内容数据与 lib 契约（Claude/作者）。

### agy — Production Visual / Social

**负责**

- 生产预览最终视觉 QA：375/768/1024/1440、Light/Dark、200% 缩放、forced-colors。
- 每篇文章 OG 图的视觉模板与社交预览检查（与 Claude 构建对接）。
- 评论/隐私页/分析说明页视觉规范（若启用）。
- favicon/头像/分享卡片最终检查。
- 设计系统与 styleguide 维护；记录与 `docs/design.md` 的偏差。

**不负责**

- 评论脚本、CSP、部署（omp/Claude）。
- 内容文案与作者资料。

---

## 3. 任务清单

### Claude Code

- [ ] C1 托管决策落地；配置 `_headers` / Nginx / OSS 缓存与 404。
- [ ] C2 域名与 `site` URL；重建并校验 canonical/RSS/sitemap/OG。
- [ ] C3 CI/CD（若配置 remote）：Node 24、check/test/build/check:csp/e2e、部署预览。
- [ ] C4 HTTPS/HSTS、缓存、回滚、备份、uptime 监控 runbook。
- [ ] C5 分析（可选）：Umami + 隐私页 + CSP。
- [ ] C6 每篇文章 OG 图构建接入（与 agy 模板）。
- [ ] C7 `feat/p4-integration`：合并 omp/agy，生产预览全量验证。
- [ ] C8 上线报告与交接。

### omp

- [ ] O1 启用 Giscus：`site.comments` 真实配置、主题同步、失败/重试。
- [ ] O2 评论 moderation runbook（GitHub Discussions）。
- [ ] O3 搜索/404/空状态最后检查；必要时补结果元信息。
- [ ] O4 可选 `/series/` 系列索引。
- [ ] O5 新文章模板/检查清单（不新增依赖）。
- [ ] O6 评论/搜索 E2E 与 axe；报告。

### agy

- [ ] A1 生产预览最终视觉 QA（含评论/隐私页）。
- [ ] A2 每篇文章 OG 图模板与社交预览检查。
- [ ] A3 favicon/头像/分享卡片最终检查。
- [ ] A4 styleguide 与设计系统同步。
- [ ] A5 视觉报告与偏差记录。

---

## 4. 共享契约

| 契约 | 提供者 | 消费者 |
|---|---|---|
| `site.comments` 真实配置 | omp | Claude CSP、agy 视觉 |
| CSP giscus 域名 | Claude | omp 评论 |
| `site.url` / 正式域名 | Claude | SEO、RSS、sitemap、OG |
| OG 模板与生成路径 | agy + Claude | `Seo.astro`、文章页 |
| Umami 环境变量/脚本 | Claude | agy 隐私页 |
| 部署 headers/缓存 | Claude | 托管平台 |

**规则**

- 评论/分析默认关闭；启用时才加第三方域名与隐私说明。
- CSP 只加实际使用的域名；不扩大 `script-src`。
- 域名/托管未定前，不把 localhost 写死到生产内容。

---

## 5. 分支、工作区与端口

| 轨道 | 分支 | 工作区 | 端口 |
|---|---|---|---|
| Claude | `feat/p4-release` → `feat/p4-integration` | 主工作区 | 4321 |
| omp | `feat/p4-comments` | `../博客-omp` | 4322 |
| agy | `feat/p4-visual` | `../博客-agy` | 4323 |

```bash
# Claude
git switch main
git switch -c feat/p4-release

# omp
git -C ../博客-omp switch -c feat/p4-comments main

# agy
git -C ../博客-agy switch -c feat/p4-visual main
```

- 集成由 Claude 在 `feat/p4-integration` 完成；生产预览通过后再合并 `main`。
- 合并前确认主工作区没有他人未提交改动；必要时用独立 worktree 验证。

---

## 6. 验收

- [ ] 上线决策已记录；托管/域名/评论/分析/作者资料明确。
- [ ] `check / test / build / check:csp / e2e` 全绿。
- [ ] 生产 URL：HTTPS、CSP、缓存、404、回滚验证通过。
- [ ] 评论默认不加载；启用后点击加载，失败提示与重试正常。
- [ ] 分析默认关闭；启用后隐私说明与 CSP 同步。
- [ ] OG 图、favicon、社交卡片正确。
- [ ] 375/768/1024/1440、Light/Dark、200% 缩放、forced-colors 通过。
- [ ] 无未启用的第三方脚本。
- [ ] 备份/回滚 runbook 可执行。

---

## 7. P0–P3 遇到的问题记录

| # | 阶段 | 问题 | 根因 | 修复 / 预防 |
|---|---|---|---|---|
| 1 | P0 | `npm run dev` 无法访问 | Astro 默认只监听 IPv6 `::1` | `server.host: '127.0.0.1'`（`b9b9f42`） |
| 2 | P0 | Playwright webServer 超时 | IPv6/端口占用/旧 preview 进程 | 固定 127.0.0.1；独立端口 4399；`--ignore-lock` |
| 3 | P0 | 并发 agent 切换主工作区分支 | 多 agent 共用 worktree | 各 agent 独立 worktree；合并前检查 `branch/status` |
| 4 | P1 | 375px 横向溢出 | `PostCard` 负外边距依赖父级 gutter | 移除负边距，列表/文章补 `padding-inline`（`845f92a`、`547e1bf`） |
| 5 | P2 | 搜索结果标题显示“未命名” | Pagefind 标题在 `meta.title`；`data-pagefind-body` 未包含 h1 | h1 `data-pagefind-meta="title"`；body 提升到 article；`b0425d1` |
| 6 | P2 | 动态搜索结果无样式 | Astro scoped CSS 不作用于运行时 DOM | 样式放 `global.css`（`.search-result`、`mark`） |
| 7 | P2 | dev 下搜索测试跳过 | Pagefind 索引只在 build 后存在 | preview + build 验收；CI 不允许跳过 |
| 8 | P2 | Astro 7 remark 插件报错 | 默认 Markdown 处理器不再带 `@astrojs/markdown-remark` | 显式安装（`7214a02`） |
| 9 | P2 | Vitest 收进 E2E 文件 | 默认 include 匹配 `*.spec.ts` | `vitest.config.ts` 限定 `tests/unit/**` |
| 10 | P2/P3 | Node 23.9 `EBADENGINE` | Vitest 5 要求 22.12+/24/26 | `.nvmrc` 24；CI 固定 Node 24 |
| 11 | P3 | CSP 内联脚本被拦 | 内联 theme/脚本需要 hash | `scripts/csp-hashes.mjs` 生成/校验；`check:csp` |
| 12 | P3 | Giscus 默认关闭但 CSP 需预留 | 启用评论才需要第三方域名 | CSP 生成器按 `site.comments` 开关追加 giscus |
| 13 | P3 | LCP 超预算 | 渲染阻塞 CSS/封面大图 | 内联 CSS、`widths/sizes`；上线后复测 |
| 14 | P3 | 作者简介/域名占位 | 用户资料未提供 | 不编造；上线前替换 |
| 15 | P3 | 未使用 `extname` 提示 | 脚本遗留导入 | 已清理（`5ac6c6d`） |
| 16 | 全程 | Pagefind 中文不做词干匹配 | 引擎限制 | 用真实中文查询验收；不承诺词干匹配 |

**经验**

1. **独立 worktree + 明确端口** 是并行前提；不要假设主工作区在 `main`。
2. **构建后预览** 才能验证 Pagefind/CSP/headers；dev 通过不等于上线通过。
3. **动态 DOM 的样式必须全局**，不要依赖 Astro scoped CSS。
4. **CSP 从构建产物生成**，不要手写哈希；评论/分析开关要进入生成器。
5. **合并前先跑 `check:csp` 和全量 E2E**；有他人未提交改动时用独立集成 worktree。
6. **性能数字要记录环境**；LCP 优化后仍需真实域名复测。

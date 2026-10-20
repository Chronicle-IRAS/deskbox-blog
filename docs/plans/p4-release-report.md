# P4 上线运营报告（Claude Code）

**执行者：** Claude Code  
**日期：** 2026-10-20  
**基线：** `main` @ `e196f25`  
**分支：** `feat/p4-release`  
**合并：** `main` @ `b817695`（`merge: 合并 P4 上线运营到 main`）  
**范围：** CI、分析、每篇 OG、运维 runbook 与集成准备

---

## 1. 当前决策

| 项 | 结果 |
|---|---|
| 远程仓库 | GitHub `Chronicle-IRAS/deskbox-blog` |
| 托管 | 暂不考虑；等待用户服务器计划 |
| 域名 / `site` | `http://localhost:4321` 占位 |
| 评论 | **Giscus 已启用**：公开仓库 / Announcements |
| 分析 | **Umami 已接入**；未设置 Website ID 时不加载 |
| 作者资料 | 仍为占位 |

---

## 2. 任务状态

| 任务 | 状态 | 交付 |
|---|---|---|
| C1 托管落地 | 待决策 | P3 已提供 `_headers` / Nginx 生成配置 |
| C2 域名与 `site` | 待决策 | 运维手册列出替换与复验步骤 |
| C3 CI | **完成** | `.github/workflows/ci.yml` |
| C4 HTTPS/缓存/回滚/监控 | **Runbook 完成** | `docs/p4-operations.md` |
| C5 分析 | **完成（待 ID）** | `Analytics.astro`、`/privacy/`、CSP 自动加入 |
| C6 每篇 OG | **完成** | `/og/<slug>.png`，每篇 1200×630 |
| C7 P4 集成 | 等待 omp/agy | `feat/p4-integration` 尚未创建 |
| C8 报告 | 本文件 | — |

---

## 3. CI

`.github/workflows/ci.yml`：

- Node 24，`npm ci`。
- `check` → `test` → 安装 `fonts-noto-cjk` → `build` → `check:csp`。
- 未启用分析时检查 `deploy/csp-hashes.json` / `csp-policy.txt` 无漂移。
- Playwright Chromium → `test:e2e` → `measure` → 上传 `dist/` artifact。
- Umami 通过仓库 Variables 的 `PUBLIC_UMAMI_WEBSITE_ID` / `PUBLIC_UMAMI_SRC` 注入。

## 4. 评论与分析

- Giscus：`site.comments` 使用真实 repo/category ID；默认不加载，点击后注入；
  CSP 自动把 `https://giscus.app` 加入 `script-src` / `connect-src` / `frame-src`。
- Umami：`PUBLIC_UMAMI_WEBSITE_ID` 未设置时 `Analytics.astro` 不输出脚本；
  设置后 CSP 自动加入分析源。
- 隐私页 `/privacy/` 说明评论、分析与第三方请求；页脚已加入入口。
- 新增单元测试覆盖 OG；评论 E2E 使用 stub 验证点击注入。

## 5. 每篇 OG 图（C6）

- 新增 `src/lib/og.ts`：标题/摘要换行、XML 转义、1200×630 SVG 模板。
- 新增 `src/pages/og/[slug].png.ts`：构建期为 12 篇已发布文章生成 PNG。
- `BaseLayout` 文章页 `og:image` 指向 `/og/<slug>.png`；
  首页/列表/About/404 回退 `/og-default.png`（1200×630）。
- 首页 `Person` JSON-LD 使用 `/avatar.svg`。
- 构建机需 CJK 字体；CI 安装 `fonts-noto-cjk`，本地使用系统字体。

**生成结果**：12 张 PNG，单张约 33–61 KB；已人工检查中文标题、摘要、
日期、阅读时间与标签渲染正常。

## 6. 验证

| 检查 | 结果 |
|---|---|
| `npm run check` | 0 errors，2 hints |
| `npm run test` | 34/34 通过 |
| `npm run build` | 27 个 HTML 页面 + 12 张 OG + Pagefind |
| `npm run test:e2e` | **51/51 通过** |
| `npm run check:csp` | 5 个哈希与生成 headers 一致 |
| `npm run measure` | HTML 248.1 KB gzip；图片 623.0 KB gzip（含 OG）；Pagefind 207.6 KB |

体积说明：OG 图只在社交抓取时下载，不进入首屏；HTML 内联 CSS 后
首页 7.8 KB、长文 13.6 KB gzip。

## 7. 运维手册

`docs/p4-operations.md` 覆盖：

- 托管确定后的 `site` 替换与复验步骤。
- 构建/部署命令与 artifact。
- 备份、回滚、缓存、HSTS、404。
- uptime 监控目标与频率。
- Giscus/Umami 开关与 moderation。
- OG 字体与常见故障排查。
- 上线前清单。

## 8. 已知问题

- 托管/域名未定：CSP/缓存/HSTS 尚未在生产生效。
- 作者资料仍为 `{{一句话简介}}`。
- Node 23.9 触发 Vitest `EBADENGINE`；CI 使用 Node 24。
- Umami 缺少 Website ID，当前不加载分析脚本。
- Giscus 启用路径的 E2E 使用 stub，真实 GitHub 登录/评论未自动化验证。
- OG 图使用系统字体渲染；已在本机与 CI 字体方案中覆盖中文，仍需在生产构建机复验。

## 9. 交接

- `feat/p4-release` 已并入 agy `feat/p4-visual`，并合并到 `main` @ `b817695`。
- 本地验收：`check` 0 errors、单元 34/34、构建 27 页 + 12 张 OG、`check:csp` 通过、E2E 51/51。
- GitHub Actions 在 `main` 推送后运行 `check/test/build/check:csp/e2e/measure`。
- 托管/域名确定后再执行部署与生产预览验收；Umami 仍需 Website ID。

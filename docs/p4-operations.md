# P4 上线运维手册

**状态：** 平台无关 runbook（托管/域名待定）  
**日期：** 2026-10-20  
**关联：** [P4 分工](./plans/three-agent-p4.md) · [P4 报告](./plans/p4-release-report.md) · [安全策略](./p3-security.md)

---

## 1. 当前部署前提

| 项 | 状态 |
|---|---|
| 仓库 | GitHub `Chronicle-IRAS/deskbox-blog` |
| CI | `.github/workflows/ci.yml`（Node 24） |
| 托管 | 未定 |
| 域名 / `site` | `http://localhost:4321` 占位 |
| 评论 | Giscus 已启用（`site.comments`） |
| 分析 | Umami 组件已接入；未设置 Website ID 时不加载 |
| 数据库 / 上传 | 无；内容与图片都在 Git |

**托管确定后必须修改**

1. `astro.config.mjs` 的 `site` 改为正式 URL。
2. 重新构建，确认 canonical、RSS、sitemap、OG 使用新域名。
3. 按平台使用 `dist/_headers`（Cloudflare/Netlify）或
   `dist/nginx.conf` + `dist/nginx-security-headers.conf`。
4. HTTPS 稳定后启用 HSTS；此前不要开启。
5. 在 `site.social` 与作者资料中替换占位。

---

## 2. CI

- 工作流：`.github/workflows/ci.yml`。
- 步骤：`npm ci` → `check` → `test` → 安装 `fonts-noto-cjk` → `build` →
  `check:csp` → CSP 漂移检查 → Playwright Chromium → `test:e2e` → `measure`。
- 构建产物 `dist/` 作为 artifact 上传。
- 若启用 Umami，在仓库 Variables 设置 `PUBLIC_UMAMI_WEBSITE_ID`
  （可选 `PUBLIC_UMAMI_SRC`），CSP 会自动加入分析域名。
- 未启用分析时，CI 会检查 `deploy/csp-hashes.json` / `csp-policy.txt` 无漂移。

## 3. 构建与部署

```bash
npm ci
npm run check
npm run test
npm run build        # clean + astro build + pagefind + csp + headers
npm run check:csp
npm run test:e2e
npm run measure
```

上传 `dist/` 到目标静态托管。**不要**上传 `node_modules/`、`.env` 或源文件。
`.env` 不进入仓库；只有 `PUBLIC_*` 变量会被客户端使用。

## 4. 备份与回滚

- **备份**：GitHub 仓库是唯一内容源；无数据库、无用户上传。
  - 开启分支保护与 2FA。
  - 里程碑打 tag（如 `v1.0.0`）。
  - 部署产物可由任意历史提交重建。
- **回滚**：
  1. `git revert <bad-sha>`，走 CI；
  2. 或重新部署上一版 `dist/` artifact；
  3. 无数据迁移，回滚只影响静态文件。

## 5. 缓存、安全头与 404

- 缓存与 CSP 见 `docs/p3-security.md`；部署后用 `curl -I` 验证：
  - `Content-Security-Policy` 包含当前内联脚本哈希与 `giscus.app`；
  - HTML `Cache-Control: public, max-age=0, must-revalidate`；
  - `/_astro/*` 为一年 immutable；
  - `/pagefind/*` 为 3600 秒。
- 自定义 404：`dist/404.html`；Nginx 需 `error_page 404 /404.html`。
- HSTS 只在 HTTPS 与域名稳定后启用。

## 6. 监控

建议至少监控：

| 目标 | 期望 | 频率 |
|---|---|---|
| `/` | 200 | 1–5 分钟 |
| `/rss.xml` | 200，XML | 5–15 分钟 |
| `/sitemap-index.xml` | 200 | 1 小时 |
| `/search/` | 200 | 1 小时 |
| TLS 证书到期 | > 14 天 | 每日 |
| 构建/部署失败 | 通知 | 每次 |

- 不引入客户端监控脚本；使用外部 uptime 服务。
- 404 与 5xx 通过托管平台日志/告警观察。

## 7. 评论与分析

**Giscus**

- 配置在 `src/data/site.ts` 的 `site.comments`；CSP 自动加入 `giscus.app`。
- 评论由 GitHub Discussions 管理；删除/隐藏评论在 GitHub 侧完成。
- 关闭评论：把 `provider` 改为 `'none'`，重新构建；CSP 自动移除 giscus 域名。
- 若首页/文章不加载评论，点击“加载评论”才会请求第三方。

**Umami**

- 仅当设置 `PUBLIC_UMAMI_WEBSITE_ID` 时加载；脚本地址由 `PUBLIC_UMAMI_SRC` 决定。
- 隐私页 `/privacy/` 已说明；不使用 Cookie。
- 关闭分析：移除环境变量并重新构建。

## 8. OG 图

- 每篇已发布文章构建期生成 `/og/<slug>.png`（1200×630，sharp + SVG）。
- 非文章页面使用 `/og-default.png`；首页 Person JSON-LD 使用 `/avatar.svg`。
- 构建机需要 CJK 字体（CI 已安装 `fonts-noto-cjk`）；本地 Windows/macOS 使用系统字体。
- 修改标题/摘要/标签后重新构建即可更新 OG 图。

## 9. 故障排查

| 现象 | 检查 |
|---|---|
| 页面 5xx | 托管平台状态、artifact 是否完整、`dist/index.html` 是否存在 |
| 样式丢失 | 是否上传 `dist/_astro/` 与内联 CSS 的 HTML |
| 搜索无结果 | `/pagefind/pagefind.js` 200、CSP 允许 `wasm-unsafe-eval` 与 worker |
| 评论被拦截 | CSP `script-src`/`frame-src` 含 `https://giscus.app` |
| OG 中文变方框 | 构建机缺 CJK 字体；安装 `fonts-noto-cjk` 后重建 |
| 缓存旧页面 | 检查 HTML `max-age=0` 与 CDN 缓存规则 |
| 分析无数据 | `PUBLIC_UMAMI_WEBSITE_ID` 是否在构建时设置 |

## 10. 上线前清单

- [ ] 托管/域名/HTTPS 已确定。
- [ ] `site` 已替换，canonical/RSS/sitemap/OG 复验。
- [ ] 作者资料与社交链接替换占位。
- [ ] `check / test / build / check:csp / e2e` 全绿。
- [ ] CSP、缓存、404、回滚在生产预览验证。
- [ ] 监控与告警已配置。
- [ ] 评论 moderation 与隐私页确认。

# P3 上线准备报告

**执行者：** Claude Code  
**日期：** 2026-10-20  
**基线：** `main` @ `2aea8aa`  
**分支：** `feat/p3-release` → `feat/p3-integration`（未合并到 `main`）

---

## 1. 上线决策（2026-10-20）

| 决策 | 结果 |
|---|---|
| 托管 | **暂不托管**；用户后续有自有服务器计划 |
| 域名 / 站点 URL | 保留 `http://localhost:4321` 占位 |
| 评论 | **先做组件，默认关闭**（Giscus 可配置，未启用） |
| 分析 | **关闭**，不加载任何分析脚本 |
| 作者资料 | 仍为占位，待作者提供 |
| 远程仓库 / CI | 暂无 remote；提供 CI 模板 |

因此本轮只落地平台无关工作：性能、CSP/安全策略、部署与 CI 模板、评论接入验证。
实际 headers/缓存/HSTS 在托管确定后启用。

---

## 2. 性能收口（C1）

| 项目 | 优化前 | 优化后 |
|---|---:|---:|
| 首页 LCP（Slow 4G + 4× CPU） | 1661 ms | **1014 ms** |
| 长文 LCP | 1812 ms | **1291 ms** |
| CLS | 0.00 | 0.00 |
| 首页 INP | 19 ms | 19 ms |
| 首屏外部 CSS | 3.3–5.9 KB gzip | **0（已内联）** |
| 首屏外部 JS | 0.2 KB | **0（已内联）** |

改动：

- `build.inlineStylesheets: 'always'`，移除渲染阻塞的 CSS 请求。
- `theme-init` 改为内联脚本，移除 `<head>` 阻塞请求；CSP 使用 sha256 哈希约束。
- 封面 `<Image>` 增加 `widths={[480, 672, 960, 1200]}` 与 `sizes`，移动端下载更小变体。
- `build` 前执行 `clean`，避免旧 `public` 资源残留。

体积（干净构建）：

| 项 | 结果 |
|---|---|
| HTML gzip | 首页 7.6 KB；长文 13.2 KB（含评论加载器） |
| 外部 CSS / JS | 无（全部内联） |
| 图片 | 7 个变体，48.2 KB gzip |
| Pagefind | 25 个文件，207.6 KB gzip（按需） |

> 内联 CSS 以“每次 HTML 请求携带样式”换取无阻塞首屏；个人博客内容规模下可接受。

---

## 3. 安全与缓存（C3/C4）

- 策略文档：`docs/p3-security.md`。
- CSP：`script-src 'self' 'wasm-unsafe-eval' <sha256 hashes>`，脚本不使用 `unsafe-inline`。
- `npm run build` 自动生成 `deploy/csp-hashes.json`、`deploy/csp-policy.txt`、
  `dist/_headers`、`dist/nginx.conf` 与 `dist/nginx-security-headers.conf`。
- `npm run check:csp` 校验哈希、策略与实际生成的 headers/nginx 配置一致。
- 评论开关自动进入 CSP：`provider: 'giscus'` 时生成器加入 `https://giscus.app`
  到 `script-src` / `connect-src` / `frame-src`。
- CI 模板：`deploy/ci.example.yml`（Node 24，check/test/build/check:csp/e2e，
  并检查 `deploy/csp-*` 无漂移）。
- Nginx 模板在每个设置 `Cache-Control` 的 location 中 include 安全头片段，
  避免 `add_header` 覆盖；包含 `error_page 404 /404.html` 与 favicon 缓存。
- Pagefind 1.5.2 不使用 `.wasm` 流式加载，模板已移除无效的 wasm MIME 映射。
- 分析保持关闭；若启用 Umami，再追加对应域名与隐私说明。
- HSTS 仅在 HTTPS 与域名稳定后启用。

---

## 4. 评论与阅读收尾（omp）

- `Comments.astro` + `site.comments` 契约已并入；默认 `provider: 'none'`。
- 默认关闭时：不渲染评论区、不加载 Giscus、无第三方请求。
- 启用后：点击加载；脚本、iframe 或 CSP 失败均有错误提示与重试；
  `mapping: 'specific' | 'number'` 通过 `term` 输出 `data-term`。
- Pagefind meta 的日期/标签标记为 `aria-hidden`，避免屏幕阅读器重复播报。
- 404 增加搜索入口；搜索结果显示日期/标签（Pagefind meta）。
- 搜索 E2E 不再把任何 Pagefind 错误当作 dev 跳过；preview/CI 下缺失索引会失败。

---

## 5. 验证结果

| 检查 | 结果 |
|---|---|
| `npm run check` | 0 errors，2 hints |
| `npm run test` | 29/29 通过 |
| `npm run build` | 26 个页面 + Pagefind（12 篇） |
| `npm run test:e2e` | **49/49 通过** |
| `npm run check:csp` | 5 个哈希匹配 |
| 外部请求 | 无；评论默认关闭，无 Giscus 请求 |

---

## 6. 部署清单（托管确定后执行）

1. Node 24；`npm ci`。
2. `npm run check && npm run test && npm run build && npm run check:csp && npm run test:e2e`。
3. 将 `dist/` 上传到目标静态托管。
4. 使用构建生成的 `dist/_headers`（Cloudflare/Netlify）或
   `dist/nginx.conf` + `dist/nginx-security-headers.conf` 配置安全头与缓存。
5. 确认 `/_astro/*` 长缓存；Pagefind 的 `wasm.unknown.pagefind` 可正常取回。
6. 更新 `site` 为正式域名，重新构建；检查 canonical、RSS、sitemap、OG。
7. 部署预览验证：首页、列表、分页、文章、标签、归档、搜索、About、404。
8. 回滚：`git revert` 目标提交 → 重新构建 → 重新部署；无需数据库回滚。

---

## 7. 待办与依赖

- **agy P3**：OG 图、favicon/分享卡片、部署预览视觉 QA 尚未提交；`feat/p3-social` 仍停在 `main`。
- **托管/域名**：等待用户服务器计划；HSTS、缓存与正式 canonical 在确定后启用。
- **作者资料**：`site.author.bio` 仍为 `{{一句话简介}}`。
- **CI**：模板已备，需先配置 remote。
- **Node**：当前开发机 Node 23.9 触发 Vitest 引擎警告，建议 Node 24 LTS。

---

## 8. 分支状态

- `feat/p3-release`：性能、CSP/安全策略、部署模板。
- `feat/p3-integration`：已并入 omp P3 评论与阅读收尾；等待 agy P3。
- 未合并到 `main`；全量检查通过后再由用户确认。

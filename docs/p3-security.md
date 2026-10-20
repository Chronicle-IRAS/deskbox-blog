# P3 安全与缓存策略

**状态：** 平台无关策略（托管待定）  
**日期：** 2026-10-20  
**关联：** [P3 分工](./plans/three-agent-p3.md) · [P3 上线报告](./plans/p3-release-report.md)

> 托管尚未决定。本文件定义可直接映射到 Cloudflare Pages / Netlify / Nginx 的
> CSP、安全头与缓存规则；构建会生成 `dist/_headers`、`dist/nginx.conf` 与
> `dist/nginx-security-headers.conf`，部署时按平台选用。

---

## 1. CSP（构建期生成）

CSP 由 `scripts/csp-hashes.mjs` 从构建后的 HTML 生成，写入：

- `deploy/csp-hashes.json`：内联脚本 sha256 哈希
- `deploy/csp-policy.txt`：完整策略
- `dist/_headers` / `dist/nginx.conf`：渲染后的平台配置

当前策略：

```text
default-src 'self';
script-src 'self' 'wasm-unsafe-eval' <sha256 hashes>;
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
worker-src 'self';
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

说明：

- 脚本不使用 `unsafe-inline`；主题初始化、主题切换、代码复制/TOC、搜索、评论加载器均为内联脚本，逐个哈希。
- `'wasm-unsafe-eval'` 供 Pagefind 的 WebAssembly 后端使用。
- `style-src 'unsafe-inline'` 是 `inlineStylesheets: 'always'` 的结果；脚本仍受哈希约束。
- `worker-src 'self'` 供 `pagefind-worker.js`。
- 启用 HTTPS 且域名稳定后，再追加 `upgrade-insecure-requests`。
- **Giscus**：当 `site.comments.provider === 'giscus'` 时，生成器自动把
  `https://giscus.app` 加入 `script-src`、`connect-src`、`frame-src`。
- **Umami**：默认关闭；启用时需手工把分析域名加入 `script-src` / `connect-src`。

**哈希维护**

```bash
npm run build       # 构建并自动生成 CSP 与 headers
npm run check:csp   # 校验 dist/_headers、dist/nginx.conf 与策略一致
```

CI 在 build 后运行 `git diff --exit-code -- deploy/csp-hashes.json deploy/csp-policy.txt`，
确保提交的哈希与构建产物没有漂移。

## 2. 安全头

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
```

- `Strict-Transport-Security: max-age=31536000; includeSubDomains` 只在 HTTPS 与域名稳定后启用。
- 不设置 `Access-Control-Allow-Origin: *`。
- 静态文件不包含密钥；评论/分析只使用公开 ID。

## 3. 缓存

| 路径 | 建议 |
|---|---|
| `/`、`/*/` HTML 路由、`/404.html` | `Cache-Control: public, max-age=0, must-revalidate` |
| `/_astro/*` | `public, max-age=31536000, immutable` |
| `/pagefind/*` | `public, max-age=3600` |
| `/rss.xml`、`/sitemap*.xml`、`/robots.txt` | `public, max-age=3600` |
| `/favicon.svg` | `public, max-age=86400` |

- `_headers` 模板按真实路由（`/blog/*`、`/tags/*` 等）匹配，不使用 `/*.html`。
- Nginx 的 `add_header` 只在子级未定义任何 `add_header` 时继承父级；因此每个设置
  `Cache-Control` 的 location 都 `include` 安全头片段。

**MIME**

- 确保 `mime.types` 包含 `webp` / `avif`。
- Pagefind 1.5.2 不使用 `.wasm` 流式加载；它请求 `wasm.unknown.pagefind`
  并在 JS 中解压后调用 `WebAssembly.instantiate`，无需 `application/wasm` 映射。

## 4. 平台映射

- `deploy/headers.example` → 渲染为 `dist/_headers`（Cloudflare Pages / Netlify）。
- `deploy/nginx.example.conf` + `deploy/nginx-security-headers.example`
  → 渲染为 `dist/nginx.conf` 与 `dist/nginx-security-headers.conf`。
- `deploy/ci.example.yml`：GitHub Actions 模板（配 remote 后使用）。

## 5. 验证清单

- [ ] `npm run build` 生成 `dist/_headers`、`dist/nginx.conf`，无 `{{...}}` 占位。
- [ ] `npm run check:csp` 通过。
- [ ] 生产响应包含 CSP 与安全头（`curl -I`）。
- [ ] 每个 HTML 路由命中正确的缓存规则。
- [ ] Pagefind 搜索在 CSP 下可用（wasm 与 worker 未被拦截）。
- [ ] Giscus 未启用时无第三方请求；启用后 `https://giscus.app` 已加入 CSP。
- [ ] HSTS 仅在 HTTPS 稳定后启用。

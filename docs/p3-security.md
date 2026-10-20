# P3 安全与缓存策略

**状态：** 平台无关策略（托管待定）  
**日期：** 2026-10-20  
**关联：** [P3 分工](./plans/three-agent-p3.md) · [P3 上线报告](./plans/p3-release-report.md)

> 托管尚未决定，本文件定义可直接映射到 Cloudflare Pages / Netlify / Nginx / 对象存储的
> CSP、安全头与缓存规则。实际生效前需要在目标平台配置。

---

## 1. CSP

站点无用户输入渲染，MDX 为作者可信内容；脚本全部由构建内联或同源加载。
主题初始化脚本已内联，因此使用 **sha256 哈希**而不是 `unsafe-inline`。

```text
default-src 'self';
script-src 'self' 'wasm-unsafe-eval' {{CSP_HASHES}};
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

- `{{CSP_HASHES}}` 来自 `deploy/csp-hashes.json`，由 `npm run csp` 从构建后的 HTML 生成。
- `'wasm-unsafe-eval'` 仅供 Pagefind 的 WebAssembly 搜索索引使用。
- `style-src 'unsafe-inline'` 是 `inlineStylesheets: 'always'` 的结果；脚本仍受哈希约束。
- `worker-src 'self'` 供 Pagefind 的 `pagefind-worker.js` 使用。
- 启用 HTTPS 且域名稳定后，再追加 `upgrade-insecure-requests`。
- 评论默认关闭。启用 Giscus 时追加：
  - `script-src` / `connect-src` / `frame-src`: `https://giscus.app`
- 分析默认关闭。启用 Umami 时追加对应脚本与上报域名到 `script-src` / `connect-src`。

**哈希维护**

```bash
npm run build
npm run csp        # 重新生成 deploy/csp-hashes.json
npm run check:csp  # CI/部署前校验，脚本或内联样式变化后必须更新
```

## 2. 安全头

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
X-Frame-Options: DENY
Cross-Origin-Opener-Policy: same-origin
```

- `Strict-Transport-Security: max-age=31536000; includeSubDomains` 只在 HTTPS 与域名稳定后启用。
- 不设置 `Access-Control-Allow-Origin: *`；站点不需要跨域资源。
- 静态文件不包含密钥；分析/评论只使用公开 ID。

## 3. 缓存

| 路径 | 建议 |
|---|---|
| `/*.html`、`/` | `Cache-Control: public, max-age=0, must-revalidate` |
| `/_astro/*` | `public, max-age=31536000, immutable` |
| `/pagefind/*` | `public, max-age=3600`（索引随构建变化，不使用 immutable） |
| `/rss.xml`、`/sitemap*.xml`、`/robots.txt` | `public, max-age=3600` |
| `/favicon.svg` | `public, max-age=86400` |

**MIME**

- `.wasm` 必须返回 `application/wasm`，否则 Pagefind 会退化为较慢的 `WebAssembly.instantiate`。
- `.webp` 返回 `image/webp`，`.avif` 返回 `image/avif`。

## 4. 平台映射示例

- `deploy/headers.example`：Cloudflare Pages / Netlify 的 `_headers` 语法。
- `deploy/nginx.example.conf`：自有服务器（用户后续的服务器计划）的 Nginx 片段。
- `deploy/ci.example.yml`：GitHub Actions 模板（配 remote 后使用）。

## 5. 验证清单

- [ ] 生产响应包含 CSP 与安全头（`curl -I`）。
- [ ] CSP 无 `unsafe-inline`（脚本）；`check:csp` 通过。
- [ ] Pagefind 搜索在 CSP 下可用（wasm 与 worker 未被拦截）。
- [ ] Giscus/Umami 未启用时不产生任何第三方请求。
- [ ] HSTS 仅在 HTTPS 稳定后启用。
- [ ] 缓存头与 MIME 符合 §3。

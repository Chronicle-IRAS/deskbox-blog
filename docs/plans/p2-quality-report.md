# P2 质量门禁报告（Claude Code）

**执行者：** Claude Code  
**日期：** 2026-10-20  
**基线：** `main` @ `857632f`  
**分支：** `feat/p2-claude-quality`  
**范围：** 性能基线、SEO 回归、内部链接、依赖审计与 Node 收敛

---

## 1. 提交

| 提交 | 内容 |
|---|---|
| `5763adc` | Astro 补丁升级、`engines`、`.nvmrc` |
| `fc0d89d` | `npm run measure` 产物体积脚本 |
| `24cc33f` | SEO 回归与内部链接 E2E |

---

## 2. 性能基线

### 2.1 产物体积（`npm run measure`）

| 类别 | 原始 | gzip |
|---|---:|---:|
| CSS（13 个文件） | 99.0 KB | 23.8 KB |
| HTML（26 个页面） | 352.7 KB | 104.4 KB |
| 图片（4 个） | 36.9 KB | 31.1 KB |
| 首屏 JS（`theme-init.js`） | 0.4 KB | 0.2 KB |
| Pagefind（按需加载） | 686.1 KB | 309.2 KB |

关键页面（gzip）：

| 页面 | HTML | CSS | JS |
|---|---:|---:|---:|
| 首页 | 4.6 KB | 3.3 KB | 0.2 KB |
| 文章列表 | 4.7 KB | 3.3 KB | 0.2 KB |
| 长文 | 6.5 KB | 5.9 KB | 0.2 KB |
| 标签 / 归档 / 搜索 | 2.5–4.4 KB | 3.3 KB | 0.2 KB |
| About | 2.4 KB | 4.6 KB | 0.2 KB |

- 单页 CSS 3.3–6.3 KB、HTML 2.4–6.5 KB，均低于预算。
- 首屏 JS 仅 `theme-init.js`（0.2 KB），文章页的代码复制/TOC 脚本内联在 HTML 中。
- 无自托管字体请求；中文使用系统字体。

### 2.2 Core Web Vitals 实验室基线

环境：Slow 4G + 4× CPU（Chrome trace），`preview` 静态产物。

| 页面 | LCP | CLS | INP | 结论 |
|---|---:|---:|---:|---|
| 首页 | 1661 ms | 0.00 | 19 ms | LCP 超预算 161 ms |
| 长文 | 1812 ms | 0.00 | 未触发交互 | LCP 超预算 312 ms |

Lighthouse 移动端导航审计（首页）：Accessibility 100、Best Practices 100、SEO 100。

**主要瓶颈**

- 首页：渲染阻塞 CSS，估算可节省 FCP/LCP 约 717 ms。
- 长文：封面图加载 703 ms + 渲染延迟 500 ms；图片交付估算浪费 20.4 KB。
- 建议：内联首屏关键 CSS、为封面生成更小尺寸（`widths`/`sizes`），并在集成后复测。

---

## 3. SEO 回归

新增 `tests/e2e/seo-regression.spec.ts`：

- 从 sitemap 动态取 12 篇文章，逐篇校验 canonical、`og:type=article`、`og:url`、BlogPosting JSON-LD、`datePublished` 与标题去站点后缀。
- 封面文章有绝对 `og:image`，无封面文章不输出 `og:image`。
- `/blog/page/2/` canonical 指向自身；`/search/` 为 `noindex, follow`。
- RSS 12 条链接唯一且为绝对 URL。
- sitemap 含 12 篇文章与标签/归档，排除 search/styleguide/404/分页。

## 4. 内部链接与 404

新增 `tests/e2e/links.spec.ts`：

- 从 9 个种子页爬取站内 `<a href>`，去重后逐个请求。
- 所有内部链接返回 200，无 3xx 重定向。
- `/blog/page/1/` 与未知路由返回 404；未知路由渲染自定义 404 页。

---

## 5. 依赖审计与 Node

- `npm audit`：0 漏洞。
- 应用补丁升级：`astro` 7.4.0 → 7.4.1；`@astrojs/check` 0.9.10 → 0.9.11。
- 未升级 TypeScript 7（`@astrojs/check` peer 仍要求 `^5 || ^6`）。
- `engines.node`：`^22.22.0 || ^24.0.0 || >=26.0.0`；`.nvmrc` 为 `24`。
- 当前机器 Node 23.9.0 会触发 Vitest 5 的 `EBADENGINE` 警告；测试仍通过，建议切换到 Node 24 LTS。

---

## 6. 验证结果

| 检查 | 结果 |
|---|---|
| `npm run check` | 0 errors，3 hints |
| `npm run test` | 29/29 通过 |
| `npm run build` | 26 个页面 + Pagefind（12 篇索引） |
| `npm run test:e2e` | **43/43 通过** |
| `npm run measure` | 见 §2.1 |

---

## 7. 已知问题

- 移动端 LCP 超出 1.5 s 预算（首页 1661 ms、长文 1812 ms），需在 P2 集成后做 CSS/封面优化并复测。
- Node 23.9 为非 LTS，Vitest 5 仅支持 22.12+/24/26；建议 Node 24。
- Astro `remarkPlugins`、zod `.url()`、`execCommand` 仍有弃用提示。
- `PostLayout` 标签查找仍为本地 `tags.find()`（omp 所有），建议后续统一为 `tagSlugByName()`。
- `site.author.bio` 仍为占位 `{{一句话简介}}`。

---

## 8. 集成状态

- agy P2 视觉、omp P2 系列导航/搜索快捷键、Claude P2 质量门禁均已合并。
- `feat/p2-integration` 已合并到 `main` @ `d45f7b6`。
- 集成后：`npm run check` 0 errors；`npm run test` 29/29；`npm run build` 26 页 + Pagefind；`npm run test:e2e` 47/47。

---

## 9. 交接

```bash
npm run check    # 0 errors, 3 hints
npm run test     # 29/29
npm run build    # 26 pages + Pagefind
npm run test:e2e # 43/43
npm run measure  # 产物体积报告
```

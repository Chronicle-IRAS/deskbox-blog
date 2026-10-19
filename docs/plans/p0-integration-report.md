# P0 集成报告

**执行者：** Claude Code  
**日期：** 2026-10-19  
**分支：** `feat/p0-integration`（未合并到 `main`）  
**集成对象：** `feat/p0-omp-pages`（omp）

---

## 1. 分支与提交

| 分支 | 提交 | 内容 |
|---|---|---|
| `feat/p0-claude-foundation` | `bb413f1` | Astro 7 骨架、内容模型、共享契约、样式与外壳 |
| `feat/p0-claude-home` | `7214a02`…`79bc010` | 依赖补充、示例内容、首页、单元/E2E 测试 |
| `feat/p0-omp-pages` | `cbeea00`、`10e50cc`、`0fd8c6d`、`f6a0d21` | 列表、文章页、About、404、styleguide；修复列表/文章 gutter 与目录测试 |
| `feat/p0-integration` | `0af862f`、`845f92a`、`547e1bf`、`d0da5ce` | 合并 omp 分支；修复 PostCard 窄屏溢出；并入 omp 修复 |

两份计划文档中的共享契约未发生类型或 props 变更。

---

## 2. 验证结果

| 检查 | 结果 |
|---|---|
| `npm run check` | 0 errors，2 hints（zod `.url()` 与 `execCommand` 弃用提示） |
| `npm run test` | 3 个文件，19/19 通过 |
| `npm run build` | 成功，17 个页面（12 篇文章 + 首页/列表/About/404/styleguide） |
| E2E（dev webServer） | 15/15 通过 |
| E2E（preview，端口 4330） | 修复后未复跑；dev webServer 全量通过 |
| Lighthouse（首页 / 文章页） | Accessibility / Best Practices / SEO 均 100 |
| 手工检查 | 375 无横向滚动（修复后）、主题切换持久化、TOC 锚点偏移、代码复制反馈、脚注、8 列表格 |

**产物体积**

| 项 | 结果 |
|---|---|
| `dist/` | 370 KB |
| CSS gzip（各页面） | 0.94–2.96 KB |
| `theme-init.js` | 408 B |
| HTML gzip | 首页 4.1 KB；列表 4.3 KB；长文 7.1 KB |
| 第三方请求 | 无；外部脚本仅 `/scripts/theme-init.js` |

---

## 3. 已知问题

### 3.1 已由 omp 修复

1. **`tests/e2e/post.spec.ts` 选择器**
   - 原 `[data-toc]` 命中移动端 `<details>` 内隐藏的 TOC；已改为 `.post__toc [data-toc]`，桌面视口下断言可见。
   - 全量 E2E 通过。

2. **`tests/e2e/a11y.spec.ts` 404 路径**
   - 改用未知路由 `/does-not-exist/` 验证自定义 404，不再用 `/404` 当作页面 URL。
   - dev webServer 下全量 E2E 通过。

3. **列表页与文章页 gutter**
   - `.blog-index` 与 `.post` 均补充 `padding-inline: var(--gutter)`；`.post` 同时补偿最大宽度。
   - 375px 横向溢出已归零。

### 3.2 已由 Claude 修复

- `PostCard` 的 `margin-inline: -12px` 依赖外层容器内边距；在 omp 的无内边距列表容器中造成 12px 横向溢出。已移除负外边距，375px 溢出归零。

### 3.3 占位与提示（非阻塞）

- `site.author.bio` 仍为契约占位 `{{一句话简介}}`，需作者提供文案（契约变更需双方确认）。
- Astro 7 提示 `markdown.remarkPlugins` 已弃用；当前配置可用，升级时再迁移到 `unified()`。
- `z.string().url()` 与 `document.execCommand('copy')` 为弃用提示，不影响构建与功能。

---

## 4. 未做项

- P1：标签、归档、分页、Pagefind 搜索、RSS、sitemap、robots、SEO 组件。
- 部署、域名、CI/CD、评论、分析、多语言、OG 图。
- 未合并 `feat/p0-integration` 到 `main`，等待用户确认。

---

## 5. 交接

- 最新全量验证：
  ```bash
  npm run check   # 0 errors, 2 hints
  npm run test    # 19/19
  npm run build   # 17 pages
  npm run test:e2e # 15/15
  ```
- `feat/p0-integration` 已通过上述检查；由用户决定是否合并到 `main`。

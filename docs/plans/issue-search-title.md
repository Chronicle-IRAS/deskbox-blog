# 问题：搜索结果标题显示为“未命名”

**状态：** 已修复  
**归属：** omp（用户确认，按 omp 所有权处理）  
**发现：** agy P1/P2 视觉 QA  
**修复分支：** `fix/omp-search-title`  
**关联：** [agy 前端报告](./agy-frontend-report.md) · [P1 集成报告](./p1-integration-report.md)

---

## 1. 现象

运行 `npm run build` 生成 Pagefind 索引后，访问：

```text
/search/?q=内容集合
```

搜索结果卡片标题显示为 **“未命名”**；链接跳转、摘要与 `<mark>` 高亮正常。

---

## 2. 根因

1. `src/scripts/search.ts` 把 Pagefind 返回结构声明为 `{ url, title, excerpt }`，并读取 `item.title`；Pagefind JS API 的实际标题在 `item.meta.title`，导致回退到“未命名”。
2. `src/layouts/PostLayout.astro` 的 `data-pagefind-body` 只包住正文 `.post__content`，文章 `<h1>` 在 body 外，Pagefind 无法把文章标题作为索引标题/正文关键词。

---

## 3. 修复

### `src/layouts/PostLayout.astro`

- 将 `data-pagefind-body` 提升到 `<article class="post">`。
- `<h1>` 加 `data-pagefind-meta="title"`。
- 对以下区域加 `data-pagefind-ignore`：
  - `.post__meta`
  - `.post__cover`
  - `.post__toc-mobile`
  - `.post__toc`
  - `PrevNext` 外层
- `tocHeadings` 同步过滤 `footnote-label`，避免脚注标题影响目录数量判断。

### `src/scripts/search.ts`

```ts
interface PagefindData {
  url: string;
  title?: string;
  excerpt: string;
  meta?: { title?: string };
}

link.textContent = item.meta?.title || item.title || '未命名';
```

### `tests/e2e/search.spec.ts`

搜索 `内容集合` 后断言：

- 第一条结果可见；
- 标题不是“未命名”；
- 标题包含“内容集合”；
- 输入框保留 `?q=` 值。

---

## 4. 验证

| 检查 | 结果 |
|---|---|
| `npm run check` | 0 errors，2 hints |
| `npm run test` | 29/29 |
| `npm run build` | 26 页 + Pagefind；索引 12 页 / 948 words |
| `npm run test:e2e` | 36/36 |
| 搜索标题断言 | 通过，不再显示“未命名” |

Pagefind 索引词数从 904 增至 948，确认文章标题/描述进入索引。

---

## 5. 后续

- `src/data/` 的 `site.author.bio` 仍是占位文案，等作者提供。
- `PostLayout` 的标签查找可后续统一为 `tagSlugByName()`（不影响功能）。

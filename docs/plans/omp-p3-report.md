# omp P3 实施报告

**执行者：** omp  
**分支：** `feat/p3-comments`  
**基线：** `main` @ `2aea8aa`  
**范围：** 可选 Giscus 评论、搜索结果元信息、404 搜索入口；不涉及部署/CSP/OG。

---

## 1. 实现

### 1.1 可选 Giscus 评论

- `src/data/site.ts` 增加 `CommentsConfig`，默认：

  ```ts
  comments: { provider: 'none' }
  ```

- 新增 `src/components/Comments.astro`：
  - `provider: 'none'` 时整段不渲染。
  - `provider: 'giscus'` 时显示“讨论”标题、隐私说明与“加载评论”按钮。
  - 点击后才注入 `https://giscus.app/client.js`；未点击零第三方请求。
  - 加载中/失败/已加载状态；失败可重试。
  - 主题切换通过 `postMessage` 同步 Giscus iframe。
  - `data-pagefind-ignore`，不进入搜索索引。
- 新增 `src/scripts/comments.ts`。
- `PostLayout` 在文章末尾接入 `<Comments />`。
- 默认关闭，因此现有页面无第三方脚本。

启用方式（由作者/Claude 提供真实值）：

```ts
comments: {
  provider: 'giscus',
  repo: 'owner/repo',
  repoId: '...',
  category: 'Announcements',
  categoryId: '...',
  mapping: 'pathname',
}
```

同时需要在部署 CSP 中加入 `https://giscus.app`（Claude P3）。

### 1.2 搜索结果元信息

- `PostLayout` 为日期/标签增加 `data-pagefind-meta`。
- `search.ts` 读取 `meta.date` / `meta.tags`，在结果标题下显示“日期 · 标签”。
- Pagefind 索引词数 948 → 972。

### 1.3 404 搜索入口

- `/404` 操作区增加“搜索”链接到 `/search/`。

---

## 2. 测试

- `tests/e2e/comments.spec.ts`：
  - 默认关闭时无评论区块、无 giscus 脚本。
  - 404 页面有搜索入口。
- `tests/e2e/search.spec.ts`：
  - 搜索结果标题不是“未命名”，包含查询词。
  - 结果元信息包含 `2026`。

---

## 3. 验证

| 检查 | 结果 |
|---|---|
| `npm run check` | 0 errors，3 hints |
| `npm run test` | 29/29 |
| `npm run build` | 26 页 + Pagefind（12 篇 / 972 words） |
| `npm run test:e2e` | 49/49 |

---

## 4. 状态与交接

- 分支 `feat/p3-comments` 已提交，待合并 `main`。
- 评论默认关闭；启用前需要真实 Giscus repo/category ID 与 CSP。
- 未做：Giscus 真实加载测试（需要公开仓库/网络）、可选 `/series/` 索引、部署/CSP/OG。
- Claude P3 接入 CSP/部署后，再验证 Giscus 实际加载。

# P5 内容运营与发布准备（两智能体 + 作者）

**基线：** `main` @ `562956e`（P0–P4 完成；51/51 E2E；GitHub Actions 通过）  
**目标：** 从“示例原型”切换到“真实个人博客运营”：真实内容、作者资料、评论/分析闭环、内容工作流与仓库治理。  
**约束：** 托管暂不考虑，域名继续 `http://localhost:4321`；agy 暂不可用，视觉变更由 Claude/omp 按现有设计系统维护。  
**关联：** [P4 分工与问题记录](./three-agent-p4.md) · [P4 发布报告](./p4-release-report.md) · [P3 上线报告](./p3-release-report.md)

---

## 1. 当前输入缺口

| 输入 | 当前 | 需要谁 |
|---|---|---|
| 作者姓名/简介/社交/头像 | 占位 | 作者 |
| 真实文章 | 12 篇示例内容 | 作者 |
| 标签分类 | 5 个示例标签 | 作者 + omp |
| 系列规划 | 1 个示例系列 | 作者 + omp |
| Umami Website ID | 缺失，分析不加载 | 作者/用户 |
| Node 24 | `.nvmrc` 已 24，本机 23.9 | 作者/用户 |
| Giscus 真实评论 | 已启用，仅 stub 测试 | omp |
| 托管/域名 | 暂不考虑 | 后续 |

---

## 2. P5 范围

### 要做

- 作者资料替换占位；首页/About/JSON-LD 一致。
- 新文章工作流：模板、frontmatter 校验、草稿/预览、标签/系列登记。
- 真实内容至少 3 篇，覆盖长文、代码、表格、图片、系列。
- Giscus 真实加载与评论验证；moderation runbook。
- Umami Website ID 接入、隐私说明与 CSP 验证。
- 标签/系列/归档/搜索在真实内容下的回归。
- GitHub 仓库治理：PR 模板、分支保护、CI 必过、Issue 模板（可选）。
- Node 24 本地切换；CI 已用 24。

### 不做

- 托管/域名/CDN/备案/生产部署。
- 新功能：多语言、邮件订阅、支付、账号、CMS。
- 大规模视觉重构；agy 不可用，视觉维护以现有 token/styleguide 为准。
- 搜索/评论后端自建。

---

## 3. 分工

### Claude Code — 内容管线 / 仓库 / 分析

- [ ] C1 `npm run new` 脚本：按 slug 生成文章目录、frontmatter 模板、可选系列/标签。
- [ ] C2 内容校验：slug 唯一、标签注册、coverAlt、日期规则；错误信息可执行。
- [ ] C3 草稿/预览工作流：本地草稿可见、构建排除；不引入托管。
- [ ] C4 Umami：拿到 Website ID 后写入 `.env`，构建验证脚本与 CSP；隐私页同步。
- [ ] C5 GitHub 治理：PR 模板、CI 必过、分支保护、Issue 模板（可选）。
- [ ] C6 Node 24：本地切换说明；CI 已固定 24。
- [ ] C7 真实内容集成后的全量验证与报告。

### omp — 内容运营 / 阅读与评论

- [ ] O1 标签分类定稿：名称、slug、说明；清理未使用标签。
- [ ] O2 系列规划：系列名、顺序、系列索引页（若需要）。
- [ ] O3 新文章模板与作者清单：frontmatter、图片、代码、表格、脚注。
- [ ] O4 Giscus 真实加载验证：点击加载、主题同步、失败重试、CSP。
- [ ] O5 评论 moderation runbook：GitHub Discussions 分类、权限、删除/锁定。
- [ ] O6 真实内容回归：长文/宽代码/表格/图片/无标签/无封面、搜索/标签/归档。
- [ ] O7 E2E/axe/SEO 回归与报告。

### 作者

- [ ] 提供姓名、简介、社交链接、头像（可选）。
- [ ] 写 3–5 篇真实文章；决定标签与系列。
- [ ] 提供 Umami Website ID；确认评论是否对读者开放。
- [ ] 后续再决定托管与域名。

### agy（暂不可用）

- 视觉任务冻结；如需修复，按 `docs/design.md` + `design-system/deskbox-blog/MASTER.md` 由 Claude/omp 做最小改动，不新增视觉方向。

---

## 4. 工作流

1. 作者提供资料与 Umami ID；Claude 接通分析，omp 验证评论。
2. Claude 落地 `npm run new` 与内容校验；omp 定稿标签/系列/模板。
3. 作者写真实文章；omp 做阅读/搜索/评论回归。
4. Claude 集成、跑全量、更新报告；托管仍不做。

建议分支：

- Claude：`feat/p5-content-pipeline`
- omp：`feat/p5-content-ops`
- 主工作区 4321；omp `../博客-omp` 4322。
- 集成分支 `feat/p5-integration`，通过后再合并 `main`。

---

## 5. 验收

- [ ] `npm run new -- "标题"` 生成合法文章目录与 frontmatter。
- [ ] 未知标签、重复 slug、缺 `coverAlt`、错误日期构建失败并指出字段。
- [ ] 作者资料替换完成，首页/About/JSON-LD 一致。
- [ ] 至少 3 篇真实文章通过阅读、搜索、标签、归档、系列验证。
- [ ] Giscus 真实点击加载成功；禁用/失败状态正确。
- [ ] Umami 有数据；CSP 与隐私页同步。
- [ ] `check / test / build / check:csp / e2e` 全绿。
- [ ] GitHub PR/CI/分支保护可用。
- [ ] 未引入托管/域名/新功能。

---

## 6. 明确不做

- 托管、域名、CDN、备案。
- 评论/分析自建后端。
- 多语言、邮件订阅、支付、账号、CMS。
- 大规模视觉重构。

# 项目工作约定

> 本文件供 Claude Code 读取。Git 提交要求的完整版本见 [docs/git-workflow.md](./docs/git-workflow.md)，两处内容保持一致。

# Git 工作流与提交规范

**状态：** 生效  
**日期：** 2026-10-19  
**适用：** 本仓库所有代码与内容提交  
**关联：** [架构设计](./docs/architecture.md) · [原型实施计划](./docs/prototype-plan.md)

---

## 1. 原则

1. **`main` 始终可构建**：`npm run check`、`npm run test`、`npm run build` 在 `main` 上必须通过。
2. **小步提交**：一次提交只做一件逻辑上的事；能独立回滚。
3. **可审查**：提交信息说明“为什么”，diff 说明“改了什么”。
4. **不提交生成物**：`node_modules/`、`dist/`、`.astro/`、测试报告、日志、环境变量均不进入仓库。
5. **不改写已共享历史**：已推送到远程的提交用 `revert`，不改公共分支历史。

---

## 2. 分支模型

| 分支 | 用途 | 生命周期 |
|---|---|---|
| `main` | 可构建的主线；只接受合并，不直接开发 | 长期 |
| `feat/<topic>` | 新功能（页面、组件、搜索等） | 合并后删除 |
| `fix/<topic>` | 缺陷修复 | 合并后删除 |
| `docs/<topic>` | 文档、ADR、注释 | 合并后删除 |
| `refactor/<topic>` | 不改变行为的重构 | 合并后删除 |
| `test/<topic>` | 测试补充或修正 | 合并后删除 |
| `chore/<topic>` | 依赖、构建、配置 | 合并后删除 |

**约定**

- `<topic>` 使用小写 ASCII kebab-case，例如 `feat/blog-pagination`、`fix/theme-flash`。
- 分支从最新的 `main` 创建，保持短生命周期；合并后删除。
- 个人原型阶段允许直接提交到 `main` 做文档/配置类小改动；涉及代码与内容模型的功能仍走分支。

```bash
git switch main
git pull --rebase
git switch -c feat/blog-pagination
```

---

## 3. 日常流程

1. **同步**：切换到 `main`，`git pull --rebase`。
2. **建分支**：按 §2 命名。
3. **开发**：小步修改，随时本地预览。
4. **自检**：运行 `npm run check`、`npm run test`；合并前跑 `npm run build`。
5. **选择性暂存**：用 `git add -p` 或按文件暂存，避免混入无关改动。
6. **审查暂存内容**：`git diff --staged`，确认没有调试代码、密钥、生成物。
7. **提交**：按 §6 写提交信息。
8. **推送并合并**：推送分支；通过 PR 或本地合并回 `main`。
9. **清理**：删除已合并分支，再次同步 `main`。

---

## 4. 提交前检查

- [ ] `npm run check` 通过。
- [ ] `npm run test` 通过（涉及 `lib/`、schema、内容时必跑）。
- [ ] 合并前 `npm run build` 成功。
- [ ] `git diff --staged` 中没有无关文件、调试输出、注释掉的死代码。
- [ ] 没有密钥、token、个人隐私信息（原型内容也不写真实敏感数据）。
- [ ] 没有 `dist/`、`node_modules/`、`.astro/`、测试报告等生成物。
- [ ] 新增/删除文件已在 `git status` 中确认。
- [ ] 提交信息符合 §6。

> 提交前检查失败时不要用 `--no-verify` 绕过钩子（若后续配置了 hooks）。

---

## 5. 提交粒度

**一次提交 = 一个可独立描述、可独立回滚的变更。**

应该拆开的情况：

| 混在一起 | 应拆为 |
|---|---|
| 新增组件 + 顺手全局格式化 | `feat: ...` + `style: ...` |
| 修 bug + 改文档 | `fix: ...` + `docs: ...` |
| 升级依赖 + 适配代码 | `build: ...` + `refactor: ...` |
| 多篇无关文章 | 每篇一个 `content: ...` 提交 |

不应该拆得太碎的情况：同一功能的“实现 + 对应测试 + 必要文档”可以放在一个提交中。

---

## 6. 提交信息规范

采用 **Conventional Commits** 格式：

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### 6.1 type

| type | 用途 |
|---|---|
| `feat` | 新功能：页面、组件、交互 |
| `fix` | 修复缺陷 |
| `docs` | 文档、README、ADR、注释 |
| `style` | 仅格式调整，不改变行为 |
| `refactor` | 重构，不改变行为 |
| `perf` | 性能优化 |
| `test` | 新增或修正测试 |
| `build` | 构建脚本、依赖、工具链 |
| `ci` | CI/CD 配置（原型阶段暂无） |
| `content` | 文章内容、frontmatter、示例图片 |
| `chore` | 杂项维护 |
| `revert` | 回滚某次提交 |

### 6.2 scope（可选）

使用小写 kebab-case，建议取值：`layout`、`components`、`styles`、`content`、`search`、`seo`、`rss`、`a11y`、`deps`、`docs`、`config`。

### 6.3 subject

- 使用祈使语气，描述“这次提交做了什么”，例如“add pagination to blog list”。
- 中文或英文均可，仓库内保持一致；本仓库默认中文。
- 不超过 50 个字符；不以句号结尾。
- 具体到对象，避免“update files”“fix bug”这类空泛描述。

### 6.4 body（可选，但推荐）

- 空一行后开始；说明动机、取舍、影响范围。
- 每行不超过 72 个字符。
- 解释“为什么”和“和之前有什么不同”，不重复 diff 内容。

### 6.5 footer（可选）

- 破坏性变更：`BREAKING CHANGE: <说明>`。
- 关联任务：`Refs: docs/prototype-plan.md#task-10` 或 `Closes #123`。
- 协作署名（可选）：`Co-Authored-By: Name <email>`。

### 6.6 示例

```text
feat(blog): 为文章列表添加分页

/blog/ 改为每页 10 篇，新增 /blog/page/[page]/。
第 1 页仍指向 /blog/，不生成 /blog/page/1/。

Refs: docs/prototype-plan.md#task-10
```

```text
fix(theme): 修复首屏主题闪烁

theme-init.js 原先在 DOMContentLoaded 后执行，
先渲染浅色再切暗色。改为 <head> 内阻塞执行，
初始化前读取 localStorage 与 prefers-color-scheme。
```

```text
content: 添加内容集合示例文章

覆盖代码块、宽表格、图片、脚注与无标签场景，
用于验证正文排版与列表布局。
```

**反例**

```text
update
fix bug
feat: 改了东西。
WIP
```

---

## 7. 合并策略

- 功能分支合并前先变基到最新 `main`，保证历史线性、冲突在分支内解决。
- 默认使用 **squash merge**：一个功能分支在 `main` 上形成一个完整提交，提交信息按 §6 重写。
- 需要保留分支内多个原子提交时，使用 merge commit，并在合并信息中说明。
- 不使用 fast-forward 之外的隐式合并；不使用 `git merge` 合并未审查的远端分支。
- 合并后删除功能分支。
- 合并前必须满足 §4；`main` 上不允许“先合并再修”。

```bash
git switch feat/blog-pagination
git fetch origin
git rebase origin/main
# 解决冲突并自检后
git switch main
git merge --squash feat/blog-pagination
git commit
git branch -d feat/blog-pagination
```

---

## 8. 变基与冲突

- 只对**未推送**或**仅自己使用**的分支执行 `git rebase`。
- 拉取远程更新使用 `git pull --rebase`，避免无意义的 merge 提交。
- 已推送的个人分支需要强制更新时，使用 `git push --force-with-lease`，禁止裸 `--force`。
- 冲突解决后必须重新运行 §4 的检查，不凭“看起来没问题”提交。
- 冲突解决不得顺手夹带无关修改。

---

## 9. 回滚

| 场景 | 做法 |
|---|---|
| 已推送的错误提交 | `git revert <sha>`，生成反向提交 |
| 本地未推送的提交 | `git reset --soft HEAD~1`（保留改动）或 `git reset --hard`（丢弃，谨慎） |
| 单个文件恢复到某版本 | `git restore --source=<sha> <path>` |
| 暂存区误加文件 | `git restore --staged <path>` |

禁止对 `main` 执行 `git reset --hard` 后强制推送。

---

## 10. 标签（可选）

原型里程碑可打轻量或附注标签，便于回看：

```bash
git tag -a v0.1.0 -m "原型 P0 完成"
git push origin v0.1.0
```

- `v0.1.0`：P0 可看的原型。
- `v0.2.0`：P1 能读的原型。
- `v1.0.0`：原型验收冻结基线。

标签对应的提交必须满足 §4；标签推送后不删除、不移动。

---

## 11. 禁止清单

- 向 `main` 强制推送。
- 提交密钥、token、`.env`、私人联系方式等敏感信息。
- 提交 `node_modules/`、`dist/`、`.astro/`、测试报告、编辑器配置（共享配置除外）。
- 提交二进制大文件（示例图片应压缩并控制在合理体积）。
- 一个提交混合格式化、重构与功能变更。
- 使用“WIP”“update”“fix”等无信息量的提交信息。
- 通过 `--no-verify` 绕过检查。
- 改写已推送到共享分支的历史。

---

## 12. 速查

```bash
# 同步主线并建分支
git switch main && git pull --rebase
git switch -c feat/<topic>

# 查看与暂存
git status
git diff
git add -p
git diff --staged

# 提交与推送
git commit -m "feat(scope): 说明"
git push -u origin feat/<topic>

# 变基与合并
git fetch origin && git rebase origin/main
git switch main && git merge --squash feat/<topic>
git branch -d feat/<topic>

# 回滚已推送提交
git revert <sha>
```

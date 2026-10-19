# ADR 0003：原生 CSS + 设计 token，不引入 CSS 框架

- **状态：** 提议（设计基线，待作者确认）
- **日期：** 2026-10-18
- **决策者：** 项目作者
- **关联：** [设计系统](../../design-system/deskbox-blog/MASTER.md) · [视觉设计](../design.md)

## 背景

博客的 UI 组件数量有限：Header/Footer、文章列表、文章排版、标签、分页、TOC、搜索、评论。设计方向是瑞士编辑风，强调排版、边框、留白，而不是大量可复用业务组件。

候选方案：Tailwind CSS、UnoCSS、CSS Modules、原生 CSS + custom properties、UI 组件库（shadcn/ui 等）。

## 决策

使用 **原生 CSS custom properties（设计 token）+ Astro scoped styles + 一个全局 prose 样式表**。

结构：

```text
src/styles/
├── tokens.css    # 颜色、字体、间距、圆角、动效
├── fonts.css     # 自托管 Latin 子集 @font-face
├── global.css    # reset、base、布局、Header/Footer
└── prose.css     # Markdown 正文（全局，因为内容不在 scoped 范围）
```

- 颜色使用 `light-dark()` + `data-theme` 覆盖；不复制两套主题变量。
- 组件样式写在 `.astro` 文件的 `<style>` 中，Astro 自动 scoped。
- 全局只保留：reset、token、字体、正文 prose、布局工具类（极少）。
- 不引入 Tailwind、UnoCSS、CSS-in-JS 或 UI 组件库。
- 图标使用内联 SVG（Lucide path），不引入图标运行时。

## 后果

### 正面

- 构建链更短；无额外 PostCSS/Tailwind 配置与版本升级面。
- 设计 token 是唯一来源，颜色/间距/字体改动集中。
- HTML 类名少，文章正文不被工具类污染。
- CSS 体积可控；可按页面拆分。
- 样式与设计文档一一对应，便于审查。

### 负面 / 约束

- 没有工具类的快速开发体验；新组件需要手写 CSS。
- 需要自律维护 token，避免散落魔法值。
- 复杂组件的响应式/状态样式比 Tailwind 啰嗦。
- 团队协作时缺少 Tailwind 的默认约束；本项目为单人维护。

## 备选方案

| 方案 | 放弃原因 |
|---|---|
| Tailwind CSS | 组件少、设计固定；工具类会增加 HTML 噪音与构建依赖 |
| UnoCSS | 同上；额外配置与生态依赖 |
| CSS Modules | Astro scoped styles 已覆盖组件隔离；prose 仍需全局 |
| UI 组件库 | 设计方向需要强定制；引入运行时/样式覆盖成本高于收益 |

## 验证

- 所有颜色/间距/字体来自 `tokens.css`；组件中不出现裸 hex（Shiki 主题变量除外）。
- 修改 `--accent` 能同时影响链接、当前导航、按钮、TOC。
- 浅色/深色/系统模式通过 `light-dark()` + `data-theme` 正确切换。
- 构建后 CSS < 20KB gzip；无 Tailwind/UnoCSS 依赖。

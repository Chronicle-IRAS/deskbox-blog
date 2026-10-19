# DeskBox Blog — Design System

> 本文件是**唯一的设计 token 来源**。页面组合与交互细节见 `docs/design.md`，系统架构见 `docs/architecture.md`，任务顺序见 `docs/prototype-plan.md`。
> 页面级覆盖目录 `design-system/deskbox-blog/pages/` 尚未创建；页面规则统一在 `docs/design.md` 描述。

**Version:** 1.0  
**Updated:** 2026-10-18  
**Direction:** Swiss editorial · 内容优先 · 单色 + 一个信号色

---

## 1. Principles

1. **阅读优先**：正文是页面唯一的主角；导航、标签、元信息都退到次级。
2. **一个信号色**：粉色只用于链接、当前导航、可操作强调；大面积保持纸白/墨黑。
3. **边框而非阴影**：用 1px 边框和留白建立层级，不用卡片投影堆叠。
4. **排版建立秩序**：字号、字重、间距、对齐形成层级，不靠装饰图形。
5. **克制的动效**：只做状态过渡（120–180ms），不做滚动动画、视差、自动播放。
6. **暗色是同一设计**：层级、对比、强调色关系保持一致，不是简单反色。
7. **系统字体优先**：中文使用系统字体；拉丁展示字体自托管子集，不依赖 Google Fonts 运行时。

---

## 2. Color

在 `:root` 设置 `color-scheme: light dark`，使用 CSS `light-dark()`。显式主题通过 `<html data-theme="light|dark">` 覆盖：

```css
:root {
  color-scheme: light dark;
  --bg: light-dark(#fafafa, #09090b);
  /* ... */
}

:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
```

目标浏览器为 2024+ 常青浏览器（Chrome/Edge 123+、Safari 17.5+、Firefox 120+）。不支持 `light-dark()` 的旧浏览器回退为浅色，不复制第二套暗色变量。

### 2.1 Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#FAFAFA` | `#09090B` | 页面背景 |
| `--surface` | `#FFFFFF` | `#141416` | 卡片、弹出层、输入框 |
| `--surface-muted` | `#F4F4F5` | `#1C1C1F` | 代码块、悬停行、次级区域 |
| `--fg` | `#09090B` | `#FAFAFA` | 主文本 |
| `--fg-muted` | `#52525B` | `#A1A1AA` | 元信息、摘要、说明 |
| `--border` | `#E4E4E7` | `#27272A` | 装饰性分隔线、卡片边框 |
| `--border-strong` | `#71717A` | `#A1A1AA` | 输入框、可交互控件边界 |
| `--accent` | `#BE185D` | `#F9A8D4` | 正文链接、当前项、强调文本 |
| `--accent-hover` | `#9D174D` | `#FBCFE8` | 链接悬停 |
| `--accent-solid` | `#EC4899` | `#F472B6` | 主按钮背景 |
| `--accent-solid-hover` | `#F472B6` | `#F9A8D4` | 主按钮悬停 |
| `--on-accent` | `#18181B` | `#18181B` | 主按钮文字 |
| `--focus` | `#09090B` | `#FAFAFA` | 键盘焦点环 |
| `--success` | `#15803D` | `#4ADE80` | 成功状态 |
| `--warning` | `#B45309` | `#FBBF24` | 警告状态 |
| `--error` | `#B91C1C` | `#F87171` | 错误状态 |
| `--selection-bg` | `#EC4899` | `#F472B6` | 文本选中背景 |
| `--selection-fg` | `#18181B` | `#18181B` | 文本选中文字 |

### 2.2 Contrast (WCAG 2.2)

| Pair | Light | Dark | Threshold |
|---|---:|---:|---|
| `--fg` / `--bg` | 19.06:1 | 19.06:1 | ≥ 4.5 |
| `--fg-muted` / `--bg` | 7.41:1 | 7.76:1 | ≥ 4.5 |
| `--accent` / `--bg` | 5.78:1 | 10.97:1 | ≥ 4.5 |
| `--on-accent` / `--accent-solid` | 5.02:1 | 6.69:1 | ≥ 4.5 |
| `--border-strong` / `--bg` | 4.63:1 | 7.76:1 | ≥ 3.0（控件） |

**Rules**

- 不在粉色背景上放白字：白字对 `#EC4899` 仅 3.53:1，不达 AA。
- `--accent` 只用于文字/图标/边线；大面积强调使用 `--accent-solid` + `--on-accent`。
- 正文不使用 `--fg-muted`；摘要、日期、阅读时间等辅助信息才使用。
- 暗色模式不通过透明度制造灰色；直接使用暗色 token。

---

## 3. Typography

### 3.1 Families

```css
--font-sans:
  "Public Sans", system-ui, -apple-system, "Segoe UI",
  "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
  "Noto Sans SC", sans-serif;

--font-display:
  "Libre Bodoni", "Iowan Old Style", "Palatino Linotype",
  Palatino, Georgia, "Songti SC", "Noto Serif SC", serif;

--font-mono:
  ui-monospace, "SFMono-Regular", "Cascadia Code",
  Consolas, "Liberation Mono", monospace;
```

- **Latin 子集自托管**：`Public Sans`（正文/UI）与 `Libre Bodoni`（展示标题）各一份 woff2，`font-display: swap`，只含 Latin 子集。原型 P0 先用系统字体回退，P1 再接入并对比。
- **中文走系统字体**：不加载中文 webfont，避免数 MB 下载与 FOIT；Windows 用 Microsoft YaHei，macOS 用 PingFang SC，Linux 用 Noto Sans CJK SC。
- **中文标题**：`--font-display` 的 CJK fallback 为宋体（Songti SC / Noto Serif SC / SimSun），形成“西文衬线 + 中文宋体”的编辑气质。
- **等宽**：代码、slug、日期数字使用 `--font-mono`。
- **许可**：Public Sans 与 Libre Bodoni 均为 SIL OFL；自托管时在 `public/fonts/` 保留对应 LICENSE 文件。

### 3.2 Scale

| Token | Size | Line-height | Usage |
|---|---|---|---|
| `--text-display` | `clamp(2.75rem, 1.5rem + 5vw, 4.5rem)` | `1.0` | 首页主标题 |
| `--text-h1` | `clamp(2rem, 1.25rem + 3vw, 3rem)` | `1.1` | 文章标题 |
| `--text-h2` | `1.75rem` | `1.2` | 正文 H2 |
| `--text-h3` | `1.375rem` | `1.35` | 正文 H3 |
| `--text-lg` | `1.25rem` | `1.5` | 引导段、卡片标题 |
| `--text-base` | `clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)` | `1.85` | 正文（16–17px） |
| `--text-sm` | `0.875rem` | `1.6` | 元信息、导航、标签 |
| `--text-xs` | `0.75rem` | `1.5` | 说明文字、代码语言标签 |

**Rules**

- 正文最小 16px；中文正文 17px，行高 1.85。
- 标题使用 `text-wrap: balance`；段落使用 `text-wrap: pretty`（渐进增强）。
- 展示标题字距 `-0.02em`；中文正文不额外加字距。
- 每页一个 `<h1>`；标题层级不跳级。
- 正文列宽 `--measure: 42rem`（约 40 个中文字符），不随视口无限拉宽。
- 英文与中文混排时，在代码/英文单词两侧保留正常空格，不用 `&nbsp;` 强行控制。

---

## 4. Space & Layout

### 4.1 Spacing

| Token | Value | Usage |
|---|---:|---|
| `--space-1` | `4px` | 紧凑内联间距 |
| `--space-2` | `8px` | 图标与文字 |
| `--space-3` | `12px` | 标签内边距、小间距 |
| `--space-4` | `16px` | 常规内边距 |
| `--space-5` | `24px` | 卡片内边距、段落组 |
| `--space-6` | `32px` | 区块内间距 |
| `--space-7` | `48px` | 区块间距 |
| `--space-8` | `64px` | 大区块 |
| `--space-9` | `96px` | 页面章节 |

### 4.2 Layout

```css
--container: 72rem;        /* 1152px */
--measure: 42rem;          /* 672px, 正文 */
--gutter: clamp(1.5rem, 4vw, 2rem);
--section: clamp(4rem, 8vw, 6rem);
```

- 桌面端页面框架可用 12 列网格：`repeat(12, minmax(0, 1fr))`，`gap: var(--space-5)`。
- 正文永远是单列；12 列只用于首页/列表页的非对称布局。
- 内容最大宽度 1152px；两侧留白优先于拉宽内容。
- 页面垂直节奏以 8px 为基本单位，4px 只用于微调。
- 粘性头部高度 64px；锚点滚动预留 `scroll-padding-top: 80px`。

---

## 5. Shape · Border · Elevation

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | 标签、内联代码 |
| `--radius-md` | `6px` | 按钮、输入框、卡片、代码块 |
| `--radius-lg` | `8px` | 搜索面板、移动菜单 |
| `--radius-full` | `999px` | 头像（可选） |
| `--border-width` | `1px` | 默认边框 |
| `--shadow-popover` | `0 12px 40px rgb(0 0 0 / 0.12)` | 仅弹出层 |

**Rules**

- 默认无阴影；卡片用 1px 边框 + `--surface` 区分。
- 悬停不改变尺寸、不位移；只改边框色/背景色。
- 焦点环：`outline: 2px solid var(--focus); outline-offset: 2px;`。
- 暗色模式阴影透明度提高到 `0.5`，但仅用于弹出层。

---

## 6. Motion

```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--duration-fast: 120ms;
--duration-base: 180ms;
```

- 允许过渡的属性：`color`、`background-color`、`border-color`、`text-decoration-color`、`opacity`。
- 不允许：`width`、`height`、`top`、`left`、`margin`、`transform: scale()` 造成的布局位移。
- 页面进入不做整体淡入；不做滚动触发动画。
- `prefers-reduced-motion: reduce` 下将所有过渡/动画设为 `0.01ms`，并禁用平滑滚动。

---

## 7. Components

### 7.1 Link

```css
a {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
  transition: color var(--duration-fast) var(--ease-out),
              text-decoration-thickness var(--duration-fast) var(--ease-out);
}

a:hover {
  color: var(--accent-hover);
  text-decoration-thickness: 2px;
}
```

- 访问过的链接不改变颜色（个人博客无需区分）。
- 导航链接默认无下划线；悬停/当前项显示 2px 下划线。
- 外部链接使用 12px 内联 SVG 箭头，`aria-hidden="true"`，并在 `title`/文本中说明。

### 7.2 Button

| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | `--accent-solid` | `--on-accent` | none |
| Secondary | transparent | `--fg` | `1px --border-strong` |
| Ghost | transparent | `--fg-muted` | none |

- 最小高度 44px；水平内边距 20px；字号 14px；字重 600。
- Primary 悬停使用 `--accent-solid-hover`；Secondary/Ghost 悬停使用 `--surface-muted`。
- 禁用：`opacity: .5; cursor: not-allowed;`，不改变布局。
- 图标按钮必须有 `aria-label`；视觉尺寸 44×44px。

### 7.3 Tag

- 字号 12px；`padding: 4px 10px`；`border: 1px solid var(--border)`；`border-radius: var(--radius-sm)`。
- 默认 `--fg-muted`；悬停 `--fg` + `--border-strong`。
- 中文标签不加 `text-transform: uppercase`；英文标签也不强制大写。
- 移动端可点击区域至少 44px 高（通过 `min-height` 或伪元素扩展）。

### 7.4 Card

- `background: var(--surface)`；`border: 1px solid var(--border)`；`border-radius: var(--radius-md)`；`padding: var(--space-5)`。
- 悬停：`border-color: var(--border-strong)`；背景不变；无位移、无阴影。
- 整卡可点击时，使用一个覆盖链接（`::after`）并保证焦点环落在卡片上。

### 7.5 Input / Search

- 高度 44px；`border: 1px solid var(--border-strong)`；`border-radius: var(--radius-md)`；`background: var(--surface)`。
- Placeholder 使用 `--fg-muted`；必须有可见 `<label>` 或 `aria-label`。
- 焦点：`outline: 2px solid var(--focus); outline-offset: 2px;`。
- 错误文本紧邻输入框，使用 `--error`，并关联 `aria-describedby`。

### 7.6 Code Block

- `background: var(--surface-muted)`；`border: 1px solid var(--border)`；`border-radius: var(--radius-md)`。
- 字号 14px；行高 1.7；内边距 16px；水平滚动。
- 可横向滚动的代码块加 `tabindex="0"` 和 `aria-label="代码块"`，保证键盘可滚动。
- 右上角语言标签（12px，`--fg-muted`）与复制按钮（44×44px，点击后 2 秒显示“已复制”）。
- 双主题 Shiki：使用 `--shiki-light` / `--shiki-dark` CSS 变量，不依赖运行时高亮。

### 7.7 Prose

- H2：`margin-top: 2.5em`；H3：`2em`；H4：`1.5em`；标题 `scroll-margin-top: 80px`。
- 段落间距 `1.25em`；列表间距 `1.5em`；列表内段落间距 `0.5em`。
- 引用：左侧 2px `--accent` 边框，`--fg-muted` 文本，左内边距 16px。
- 行内代码：`--surface-muted` 背景，4px 圆角，`0.9em` 字号。
- 表格：`border-collapse: collapse`；表头下边框 2px；单元格下边框 1px；外层容器水平滚动。
- 图片：`max-width: 100%; height: auto; border-radius: var(--radius-md);`；`figcaption` 使用 `--text-sm` + `--fg-muted`。
- 分隔线：1px `--border`，上下 `var(--space-7)`。

### 7.8 TOC

- 桌面端宽度 220px；`position: sticky; top: 96px`；左侧 1px 边框。
- 字号 14px；默认 `--fg-muted`；当前项 `--accent` + 2px 左边框。
- 移动端折叠为 `<details>`，`<summary>` 显示“本文目录”，最小高度 44px。

### 7.9 Header / Footer

- Header：高 64px；粘性；`background: var(--bg)`；`border-bottom: 1px solid var(--border)`；`z-index: 10`。
- 导航：14px；间距 24px；当前项 `aria-current="page"` + 2px 下划线。
- 移动端导航使用 `<details>` 下拉，不依赖 JS；面板使用 `--surface` + `--shadow-popover`。
- Footer：`border-top: 1px solid var(--border)`；上下 `var(--space-7)`；字号 14px；`--fg-muted`。

### 7.10 Empty / Error / Loading

- 空状态：1px 虚线边框，`--fg-muted`，居中，最多两行说明 + 一个明确动作。
- 错误：说明发生了什么 + 可执行的下一步；不显示堆栈/内部错误码。
- 加载：骨架屏仅用于搜索/评论；静态页面不显示加载态。
- 404：大号 `404`（`--font-display`）+ 一句说明 + 返回首页/搜索的链接。

---

## 8. Iconography

- 统一使用 20px 线性 SVG 图标，`stroke-width: 1.5`，`currentColor`。
- 图标集：Lucide（只复制所需 path，不引入运行时依赖）。
- 装饰性图标 `aria-hidden="true"`；独立图标按钮必须有 `aria-label`。
- 禁止用 emoji 充当 UI 图标。

---

## 9. Anti-patterns

- ❌ 渐变 Hero、Glassmorphism、大面积模糊背景。
- ❌ 卡片投影堆叠、悬停位移/缩放。
- ❌ 滚动触发动画、视差、自动播放视频。
- ❌ Google Fonts / 第三方字体 CDN 运行时加载。
- ❌ 正文宽度超过 42rem，或手机上出现横向滚动。
- ❌ 低对比灰字、12px 正文、隐藏焦点环。
- ❌ 无限滚动（静态博客需要可索引的分页）。
- ❌ Cookie 横幅（默认不设置 Cookie）。
- ❌ 用颜色单独传达状态（需同时有文字/图标）。

---

## 10. Pre-Delivery Checklist

- [ ] 375 / 768 / 1024 / 1440 宽度无横向滚动。
- [ ] Light / Dark / 跟随系统三种状态均正确。
- [ ] 对比度符合 §2.2；正文 ≥ 4.5:1。
- [ ] 键盘可完成：跳过链接 → 导航 → 主题切换 → 正文 → 目录 → 上一页/下一页。
- [ ] 所有交互元素有可见焦点，触控目标 ≥ 44×44px。
- [ ] `prefers-reduced-motion` 下无过渡动画。
- [ ] 标题层级正确，每页一个 H1。
- [ ] 图片有 `alt`；装饰图 `alt=""`。
- [ ] 代码块/表格可键盘滚动。
- [ ] 200% 缩放不丢内容；`forced-colors` 模式边框可见。
- [ ] Lighthouse 移动端 Performance ≥ 95，Accessibility/Best Practices/SEO = 100。
- [ ] 无 emoji 图标、无 Google Fonts 运行时请求。

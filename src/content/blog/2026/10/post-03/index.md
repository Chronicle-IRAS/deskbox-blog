---
title: CSS 逻辑属性的几个使用场景
description: 从 margin-inline 到 inset-inline，逻辑属性让组件在不同书写方向下少写一层特判。
slug: post-03
pubDate: 2026-10-05
tags:
  - 前端
---

逻辑属性刚出现时，我以为它只和阿拉伯语、希伯来语这类从右到左的语言有关。实际用下来，它在普通的中文页面里也能减少不少特判。

## 水平方向

把 `margin-left` / `margin-right` 换成 `margin-inline-start` / `margin-inline-end`，组件就不再假设文字从左往右排。

对于图标和文字的间距，`gap` 通常更直接；只有在需要单侧偏移时，逻辑属性才真正体现价值。

## 定位

`inset-inline-start` 和 `inset-inline-end` 可以替代 `left` / `right`。写浮层、角标和关闭按钮时，这个替换几乎是无成本的。

## 什么时候不用

如果布局本身有明确的物理方向，比如图表坐标轴或者固定位置的装饰线，继续使用物理属性反而更清楚。

逻辑属性是表达“相对于文字方向”的工具，不是所有场景都适用。

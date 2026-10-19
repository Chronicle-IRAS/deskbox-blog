---
title: 长标题与长 slug 的排版测试
description: 这篇文章用一个很长的英文 slug 和较长的标题，检查列表、卡片与归档场景下的换行表现。
slug: a-very-long-slug-for-testing-list-layout-and-line-wrapping-behavior
pubDate: 2026-08-20
tags:
  - 前端
---

这篇示例文章的主要作用是压力测试。它的 slug 很长，URL 会明显超过常见文章；标题也比平均长度更长。

## 列表里的表现

在文章列表中，标题应该自然换行，不被截断。日期列保持固定宽度，摘要最多两行，元信息在换行后仍然对齐。

## URL 与分享

过长的 slug 不适合真实写作，但在原型中保留一篇，可以提前暴露路由、分页和复制链接时的边界问题。

如果以后需要支持中文 slug，再单独评估编码与兼容性，不在 P0 处理。

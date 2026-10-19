---
title: 草稿示例
description: 这是一篇草稿，用于验证构建期过滤；它不应该出现在首页、列表或任何索引中。
slug: draft-example
pubDate: 2026-10-16
draft: true
tags:
  - 生活
---

这是一篇草稿。它的内容只用于验证构建期过滤。

预期行为：运行 `npm run build` 之后，`dist/`、首页、文章列表和所有索引中都不应出现这篇文章。

如果它出现在任何页面上，说明草稿过滤有问题。

---
title: LazyInclude examples
---

# Examples

## Basic usage

<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

## Error

<PreviewPlayground
  :html="() => import('./stories/error.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

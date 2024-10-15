---
title: FigureShopify examples
---

# Examples

## Simple

This is a simple example using a 1 × 1 pixels transparent PNG as a placeholder.

<PreviewPlayground
  :html="() => import('./stories/app.liquid?raw')"
  :script="() => import('./stories/app.js?raw')"
  />

## Blurred placeholder

This example uses a small sized image with a maximum width of 10 pixels with a blur backdrop-filter as a placeholder.

<PreviewPlayground
  :html="() => import('./stories/blurred.liquid?raw')"
  :script="() => import('./stories/app.js?raw')"
  />

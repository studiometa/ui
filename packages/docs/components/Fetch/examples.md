---
title: Fetch examples
---

# Examples

## Simple

Intercepting clicks on links, displaying a loader and updating the targets' content.

<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :script="() => import('./stories/simple/app.js?raw')"
  />

## Form

In the following example, we intercept a form submission, display a loader and use a custom view transition to animate only the updated content once the request is finished.

<PreviewPlayground
  :html="() => import('./stories/form/app.twig')"
  :script="() => import('./stories/form/app.js?raw')"
  :css="() => import('./stories/form/app.css?raw')"
  />

## Modes

Modes are configured with the [`data-option-mode` attribute](./js-api.md#mode).

<PreviewPlayground
  :html="() => import('./stories/modes/app.twig')"
  :script="() => import('./stories/modes/app.js?raw')"
  />

## Add to cart / Quickbuy

<PreviewPlayground
  :html="() => import('./stories/products/app.twig')"
  :script="() => import('./stories/products/app.js?raw')"
  />

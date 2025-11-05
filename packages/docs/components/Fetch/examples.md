---
title: Fetch examples
---

# Examples

## Simple

Intercepting clicks on links, displaying a loader and updating the targets' content.

<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :script="() => import('./stories/simple/app.ts?raw')"
  />

## Form

In the following example, we intercept a form submission, display a loader and use a custom view transition to animate only the updated content once the request is finished.

<PreviewPlayground
  :html="() => import('./stories/form/app.twig')"
  :script="() => import('./stories/form/app.ts?raw')"
  :css="() => import('./stories/form/app.css?raw')"
  />

## Modes

Modes are configured with the [`data-option-mode` attribute](./js-api.md#mode).

<PreviewPlayground
  :html="() => import('./stories/modes/app.twig')"
  :script="() => import('./stories/modes/app.ts?raw')"
  />

## Add to cart / Quickbuy

<PreviewPlayground
  :html="() => import('./stories/products/app.twig')"
  :script="() => import('./stories/products/app.ts?raw')"
  />

## Error handling

<PreviewPlayground
  :html="() => import('./stories/error/app.twig')"
  :script="() => import('./stories/error/app.ts?raw')"
  />

## Cancelling a request

Use the [`abort` method](./js-api.md#abort-reason-any) to cancel a request. In the following example, we use the [`Action` component](../Action/index.md) to cancel any pending request from any mounted `Fetch` component.

<PreviewPlayground
  :html="() => import('./stories/abort/app.twig')"
  :script="() => import('./stories/abort/app.ts?raw')"
  />

::: tip
In this example, we could use a more specific version of the [`data-option-target` attribute](../Action/js-api.md#target) of the `Action` component to target a single `Fetch` instance.
:::

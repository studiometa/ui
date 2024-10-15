---
title: Transition examples
---

# Examples

## Togglable

<PreviewPlayground
  :html="() => import('./stories/toggle/app.twig')"
  :script="() => import('./stories/toggle/app.js?raw')"
  />

## Group

Use the [`group` option](/components/primitives/Transition/js-api.html#group) to keep multiple instances in sync. In the example below, the buttons only control the first component, the second one is synced with the `data-option-group` attribute.

<PreviewPlayground
  :html="() => import('./stories/group/app.twig')"
  :script="() => import('./stories/group/app.js?raw')"
  />

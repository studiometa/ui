---
title: Action examples
---

# Examples

## Close modals and panels

<PreviewPlayground
  :html="() => import('./stories/close-modal-and-panel/app.twig')"
  :script="() => import('./stories/close-modal-and-panel/app.js?raw')"
  />

## Prevent default

<PreviewPlayground
  :html="() => import('./stories/prevent-default/app.twig')"
  :script="() => import('./stories/prevent-default/app.js?raw')"
  />

## Debounce modifier

Use the `debounce` modifier to prevent firing the action's effect too often.

<PreviewPlayground
  :html="() => import('./stories/debounce/app.twig')"
  :script="() => import('./stories/debounce/app.js?raw')"
  />

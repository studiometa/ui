---
title: DataBind, DataModel, DataEffect and DataComputed examples
---

# Examples

## Checkbox

<PreviewPlayground
  :html="() => import('./stories/checkbox.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

## Checkboxes

When working with multiple checkboxes, it can be useful to store the value in an array rather than a simple boolean indicating if the checkbox is checked. Checkboxes sharing the same value will be synced and checked or unchecked together.

<PreviewPlayground
  :html="() => import('./stories/checkboxes.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

## Select

<PreviewPlayground
  :html="() => import('./stories/select.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

## Select multiple

<PreviewPlayground
  :html="() => import('./stories/select-multiple.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

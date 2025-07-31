---
title: Draggable examples
---

# Examples

## Simple

<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

## Fit bounds

Use the `data-option-fit-bounds` attribute to keep the draggable target in the component's root element bounds.

<PreviewPlayground
  :html="() => import('./stories/bounds/app.twig')"
  :script="() => import('./stories/bounds/app.js?raw')"
  :css="() => import('./stories/bounds/app.css?raw')"
  :css-editor="false"
  />

## Strict fit bounds

Use the `data-option-strict-fit-bounds` attribute to keep the draggable target in the component's root element bounds.

<PreviewPlayground
  :html="() => import('./stories/strict-bounds/app.twig')"
  :script="() => import('./stories/strict-bounds/app.js?raw')"
  :css="() => import('./stories/strict-bounds/app.css?raw')"
  :css-editor="false"
  />

## Carousel like

By disabling drag on the `y` axis with the `data-option-no-y` attribute and with the `data-option-fit-bounds` option enabled, we can begin implementing a draggable carousel.

<PreviewPlayground
  :html="() => import('./stories/carousel/app.twig')"
  :script="() => import('./stories/carousel/app.js?raw')"
  :css="() => import('./stories/carousel/app.css?raw')"
  :css-editor="false"
  />

## Dynamic parent

By default, the [`parent` getter](./js-api.md#parent) returns the component's root element. The getter can be overriden to get a dynamic parent that will be resolved when dropping the element defined by the [`target` getter](./js-api.md#target).

In the following example, the [`Action` component](../Action/index.md) is used to toggle the `ring` class on each colored square when they are clicked. The `Draggable` component is extended to override the `parent` getter to find the first element in the DOM with the `ring` class and use it as a basis to calculate the bounds.

<PreviewPlayground
  :html="() => import('./stories/dynamic-parent/app.twig')"
  :script="() => import('./stories/dynamic-parent/app.js?raw')"
  />

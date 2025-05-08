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

## Carousel like

By disabling drag on the `y` axis with the `data-option-no-y` attribute and with the `data-option-fit-bounds` option enabled, we can begin implementing a draggable carousel.

<PreviewPlayground
  :html="() => import('./stories/carousel/app.twig')"
  :script="() => import('./stories/carousel/app.js?raw')"
  :css="() => import('./stories/carousel/app.css?raw')"
  :css-editor="false"
  />

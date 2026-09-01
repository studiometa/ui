---
title: Carousel examples
---

# Examples

## Horizontal

<PreviewPlayground
  :html="() => import('./stories/horizontal/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/horizontal/app.js?raw')"
  :script-editor="false"
  />

## Vertical

<PreviewPlayground
  :html="() => import('./stories/vertical/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/vertical/app.js?raw')"
  :script-editor="false"
  />

## Automatic rotation

The `CarouselPlay` button rotates the carousel every three seconds. Hover the carousel or tab into it and the rotation stops — and stays stopped, because nothing should start moving under a user who is reading. The ring around the button is the inherited `timer-progress` ratio. Under `prefers-reduced-motion: reduce`, the rotation does not start at all.

<PreviewPlayground
  :html="() => import('./stories/autoplay/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/autoplay/app.js?raw')"
  :script-editor="false"
  />

## Boundaries

The `boundary` option, inherited from the [`Indexable`](/reference/items/Indexable/) primitive, controls what happens at the ends of the track. Use `clamp` (the default), `loop` or `bounce`. Watch the Prev/Next buttons: they disable at the ends in `clamp` mode but stay active in `loop` and `bounce`.

<PreviewPlayground
  :html="() => import('./stories/boundaries/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/boundaries/app.js?raw')"
  :script-editor="false"
  />

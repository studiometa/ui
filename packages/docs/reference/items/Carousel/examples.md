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

## Alignment

Where a slide comes to rest is its own `scroll-snap-align`, and `goTo()` reads it — so a button, a dot and a native snap all land on the same place. Press Next on each track: the same index stops at the left edge, the middle and the right edge. There is no option for this; the CSS is the only place it is declared.

<PreviewPlayground
  :html="() => import('./stories/alignment/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/alignment/app.js?raw')"
  :script-editor="false"
  />

## Free scrolling

A track set to `scroll-snap-type: none` does not snap, and neither does a drag released on it: the throw coasts to where its momentum was heading and stops between slides. The buttons still move slide by slide, because an index is still an index. This is what `Slider`'s `fit-bounds: false` was.

<PreviewPlayground
  :html="() => import('./stories/free-scroll/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/free-scroll/app.js?raw')"
  :script-editor="false"
  />

## Controls

The four controls that read the carousel's state: a continuous [`CarouselProgress`](./js-api#carouselprogress) bar that follows the drag rather than the index, a [`CarouselThumbnails`](./js-api#carouselthumbnails) picker naming itself from each image's `alt`, [`CarouselDots`](./js-api#carouseldots) taking their names from the carousel's `slide-label`, and a [`CarouselCount`](./js-api#carouselcount) readout. The current thumbnail and the current dot are styled with `[aria-current="true"]`, which is the marker the component writes.

<PreviewPlayground
  :html="() => import('./stories/controls/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/controls/app.js?raw')"
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

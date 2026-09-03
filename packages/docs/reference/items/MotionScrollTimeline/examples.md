---
title: MotionScrollTimeline examples
---

# Examples

## Scroll-driven timeline

[`MotionScrollTimeline`](./js-api) separates the timeline from the animations: the tall section defines the scroll range, and every `Motion` inside it is driven by that progress through Motion's `scroll()` — hardware-accelerated where the browser supports `ScrollTimeline`. Keyframe arrays give each child a multi-step track across the same range, and registering the timeline is enough: it mounts its `Motion` children itself.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/with-scroll-timeline/app.twig')"
    :script="() => import('./stories/with-scroll-timeline/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/with-scroll-timeline/app.twig
<<< ./stories/with-scroll-timeline/app.js

:::

</llm-only>

## Reading progress bar

The timeline element is the article, and the [`offset`](./js-api#offset) maps progress `0` to its top reaching the top of the viewport and progress `1` to its bottom reaching the bottom — the reading range, rather than the default entering-and-leaving range. The sticky bar holds a single `Motion` child scrubbed from `scaleX: 0` to `scaleX: 1`, which is the cheap way to draw a progress indicator: the browser animates a transform instead of a width, anchored to the left edge by `origin-left`.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/reading-progress/app.twig')"
    :script="() => import('./stories/reading-progress/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/reading-progress/app.twig
<<< ./stories/reading-progress/app.js

:::

</llm-only>

## Parallax layers

One timeline, one scroll range, three `Motion` children: only the travelled distance changes. The far disc moves 80 pixels, the card 180 and the badge 300 over the same progress, and the speed difference alone reads as depth. The timeline scrubs every child with the same progress, so depth is authored entirely in the keyframes — there is no per-layer speed or offset option to set.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/parallax-layers/app.twig')"
    :script="() => import('./stories/parallax-layers/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/parallax-layers/app.twig
<<< ./stories/parallax-layers/app.js

:::

</llm-only>

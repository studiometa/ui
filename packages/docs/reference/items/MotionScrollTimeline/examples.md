---
title: MotionScrollTimeline examples
---

# Examples

## Scroll-driven timeline

[`MotionScrollTimeline`](./js-api) separates the timeline from the animations, like the `ScrollAnimation` family: the tall section defines the scroll range, and every `Motion` inside it is driven by that progress through Motion's `scroll()` — hardware-accelerated where the browser supports `ScrollTimeline`. Keyframe arrays give each child a multi-step track across the same range, and registering the timeline is enough: it mounts its `Motion` children itself.

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

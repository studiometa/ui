---
title: GsapTimeline examples
---

# Examples

## Intro choreography

The steps compose one timeline in DOM order, with `"<"` and `"-=0.2"` positions. The `timeline` option sets the defaults of every step, and one `restart()` replays the whole timeline.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/timeline/app.twig')"
    :script="() => import('./stories/timeline/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/timeline/app.twig
<<< ./stories/timeline/app.js

:::

</llm-only>

## Pinned and scrubbed timeline

The `scrollTrigger` option pins a stage inside the component and scrubs the timeline with the scroll. The third step starts at `0`, with the first one.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/scroll-scrub/app.twig')"
    :script="() => import('./stories/scroll-scrub/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/scroll-scrub/app.twig
<<< ./stories/scroll-scrub/app.js

:::

</llm-only>

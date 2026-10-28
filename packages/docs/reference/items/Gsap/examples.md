---
title: Gsap examples
---

# Examples

## Playback and events

The `targets` selector resolves inside the component, so the tween animates the three bars with a `stagger`. Each button calls one playback method, and an ancestor `Action` shows the last `gsap-*` event.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/playback/app.twig')"
    :script="() => import('./stories/playback/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/playback/app.twig
<<< ./stories/playback/app.js

:::

</llm-only>

## Scroll-scrubbed tween

The `scrollTrigger` option creates a [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) with the component root as trigger. With `scrub`, the scroll position drives the progress of the tween.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/scroll-trigger/app.twig')"
    :script="() => import('./stories/scroll-trigger/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/scroll-trigger/app.twig
<<< ./stories/scroll-trigger/app.js

:::

</llm-only>

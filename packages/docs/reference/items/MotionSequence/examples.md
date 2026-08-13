---
title: MotionSequence examples
---

# Examples

## Staggered sequence

[`MotionSequence`](./js-api) composes its `Motion` children into one timeline: the `stagger` option spreads the first three items, the finale positions itself with `data-option-at="+0.2"`, and one `Action` target plays or reverses the entire choreography — a single animation under the hood.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/sequence/app.twig')"
    :script="() => import('./stories/sequence/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/sequence/app.twig
<<< ./stories/sequence/app.js

:::

</llm-only>

## Hero intro on mount

A badge, a heading, a paragraph and a button entering as one choreography: `data-option-autoplay` goes on the sequence, never on the children, because the sequence owns their playback. The three positioning modes are mixed in one timeline — the badge and the heading follow one another in DOM order, the paragraph starts _with_ the heading through [`data-option-at="<"`](./js-api#at-on-the-children), and the button overlaps the end of the paragraph with the relative offset `data-option-at="-0.2"`. Each child keeps its own `initial`/`animate` keyframes and its own spring. A mount animation is over before a reader reaches the preview, so the replay button restarts the whole choreography with a single `play()` on the sequence.

<llm-exclude>
  <PreviewPlayground
    :html="() => import('./stories/hero-intro/app.twig')"
    :script="() => import('./stories/hero-intro/app.js?raw')"
    />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/hero-intro/app.twig
<<< ./stories/hero-intro/app.js

:::

</llm-only>

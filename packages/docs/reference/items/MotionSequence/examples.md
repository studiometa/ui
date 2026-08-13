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

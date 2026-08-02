---
title: Modal examples
---

# Examples

## Simple

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :script="() => import('./stories/simple/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/simple/app.twig
<<< ./stories/simple/app.js

:::

</llm-only>

## With transition

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :script="() => import('./stories/transition/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/simple/app.twig
<<< ./stories/transition/app.js

:::

</llm-only>

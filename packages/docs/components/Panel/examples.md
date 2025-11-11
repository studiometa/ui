---
title: Panel examples
---

# Examples

## Top panel

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/top/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/top/app.twig
<<< ./stories/app.js

:::

</llm-only>

## Right panel

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/right/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/right/app.twig
<<< ./stories/app.js

:::

</llm-only>

## Bottom panel

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/bottom/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/bottom/app.twig
<<< ./stories/app.js

:::

</llm-only>

## Left panel

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/left/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/left/app.twig
<<< ./stories/app.js

:::

</llm-only>

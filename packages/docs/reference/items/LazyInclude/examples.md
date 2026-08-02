---
title: LazyInclude examples
---

# Examples

## Basic usage

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/app.twig
<<< ./stories/app.js

:::

</llm-only>

## Error

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/error.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/error.twig
<<< ./stories/app.js

:::

</llm-only>

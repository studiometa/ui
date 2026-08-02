---
title: ImageGrid examples
---

# Examples

## With 3 images

<llm-exclude>
<PreviewPlayground
  :zoom="0.8"
  :html="() => import('./stories/3-images/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/3-images/app.twig
<<< ./stories/app.js

:::

</llm-only>

## With 5 images

<llm-exclude>
<PreviewPlayground
  :zoom="0.8"
  :html="() => import('./stories/5-images/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/5-images/app.twig
<<< ./stories/app.js

:::

</llm-only>

## With scroll reveal transitions

<llm-exclude>
<PreviewPlayground
  :zoom="0.8"
  :html="() => import('./stories/block-image/app.twig')"
  :script="() => import('./stories/block-image/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/block-image/app.twig
<<< ./stories/block-image/app.js

:::

</llm-only>

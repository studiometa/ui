---
title: FigureShopify examples
---

# Examples

## Simple

This is a simple example using a 1 × 1 pixels transparent PNG as a placeholder.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/app.liquid?raw')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/app.liquid
<<< ./stories/app.js

:::

</llm-only>

## Blurred placeholder

This example uses a small sized image with a maximum width of 10 pixels with a blur backdrop-filter as a placeholder.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/blurred.liquid?raw')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/blurred.liquid
<<< ./stories/app.js

:::

</llm-only>

## Advanced reveal

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/reveal.liquid?raw')"
  :script="() => import('./stories/reveal.js?raw')"
  :css="() => import('./stories/reveal.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/reveal.liquid
<<< ./stories/reveal.js
<<< ./stories/reveal.css

:::

</llm-only>

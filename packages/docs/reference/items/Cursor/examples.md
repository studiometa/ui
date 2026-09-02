---
title: Cursor examples
---

# Examples

## Simple

The `states` map names three states — `grow` over links, `shrink` and `invert` over elements marked for them — and the stylesheet decides what each one looks like: a scale, a colour, a blend mode. Press the button to see `data-cursor-down`, which is published apart from the state, so a press over the link keeps its `grow`.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  :css="() => import('./stories/app.css?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/app.twig
<<< ./stories/app.js
<<< ./stories/app.css

:::

</llm-only>

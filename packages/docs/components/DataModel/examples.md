---
title: DataBind, DataModel, DataEffect and DataComputed examples
---

# Examples

## Checkbox

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/checkbox.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/checkbox.twig
<<< ./stories/app.js

:::

</llm-only>

## Checkboxes

When working with multiple checkboxes, it can be useful to store the value in an array rather than a simple boolean indicating if the checkbox is checked. Checkboxes sharing the same value will be synced and checked or unchecked together.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/checkboxes.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/checkboxes.twig
<<< ./stories/app.js

:::

</llm-only>

## Select

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/select.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/select.twig
<<< ./stories/app.js

:::

</llm-only>

## Select multiple

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/select-multiple.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/select-multiple.twig
<<< ./stories/app.js

:::

</llm-only>

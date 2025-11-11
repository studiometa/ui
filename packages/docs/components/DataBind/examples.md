---
title: DataBind, DataModel, DataEffect and DataComputed examples
---

# Examples

## Immediate propagation

In the following example, we use the `data-option-immediate` attribute to enable the [`immediate` option](./js-api.md#immediate) on the first `<input>`, in order to set the value of the second `<input>` on mount.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/immediate.twig')"
  :script="() => import('./stories/immediate.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/immediate.twig
<<< ./stories/immediate.js

:::

</llm-only>

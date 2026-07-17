---
title: DataBind, DataModel, DataEffect and DataComputed examples
---

# Examples

## Immediate propagation

In the following example, the first [`DataModel`](../DataModel/index.md) uses the [`immediate` option](./js-api.md#immediate) to hydrate the scoped `text` key on mount. The second model mirrors the same native `name`, and the keyed `DataBind` renders their shared value.

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

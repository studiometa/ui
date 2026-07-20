---
title: DataEffect JavaScript API
outline: deep
---

# DataEffect JS API

The `DataEffect` component extends the [`DataBind` component](../DataBind/js-api.md) and inherits its binding API. Mutation helpers such as `toggle()`, `increment()`, and `cycle()` are not supported on effects.

## Options

### `effect`

- Type: `string`
- Default: `''`

Use this option to define a piece of JavaScript code to be executed when the value changes. The `value` and `target` variables can be used to access both the current value of the binding and the DOM element targeted by the changes. Inside a `DataScope`, the third `$data` argument is a frozen snapshot of all keyed values in the resolved group.

**Example**

In the following example, the counter is animated whenever the range value changes:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/effect-example.twig')"
  :script="() => import('./stories/effect-example.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/effect-example.twig
<<< ./stories/effect-example.js

:::

</llm-only>

---
title: DataComputed JavaScript API
outline: deep
---

# JS API

The `DataComputed` component extends the [`DataBind` component](../DataBind/js-api.md) and inherits its binding API. Mutation helpers such as `toggle()`, `increment()`, and `cycle()` are not supported on computed values.

## Options

### `compute`

- Type: `string`
- Default: `''`

Use this option to define a piece of JavaScript code to transform the value before it is updated on the target. The `value` and `target` variables can be used to access both the current value of the binding and the DOM element targeted by the changes. Inside a `DataScope`, the third `$data` argument is a frozen snapshot of all keyed values in the resolved group.

**Example**

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/compute-example.twig')"
  :script="() => import('./stories/compute-example.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/compute-example.twig
<<< ./stories/compute-example.js

:::

</llm-only>

## Methods

### `set(value: DataValue)`

Compute and set the value for the current instance.

**Params**

- `value` (`DataValue`): the source value to transform

### `get()`

Get the current value.

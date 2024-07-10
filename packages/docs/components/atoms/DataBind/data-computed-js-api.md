---
title: DataComputed JavaScript API
outline: deep
---

# DataComputed JS API

The `DataComputed` component extends the [`DataBind` component](./data-bind-js-api.html), it inherits from its API.

## Options

### `compute`

- Type: `string`
- Default: `''`

Use this option to define a piece of JavaScript code to transform the value before it is updated on the target. The `value` and `target` variables can be used to access both the current value of the binding and the DOM element targeted by the changes.

**Example**

<PreviewPlayground
  :html="() => import('./stories/compute-example.twig')"
  :script="() => import('./stories/compute-example.js?raw')"
  />


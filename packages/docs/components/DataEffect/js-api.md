---
title: DataEffect JavaScript API
outline: deep
---

# DataEffect JS API

The `DataEffect` component extends the [`DataBind` component](../DataBind/js-api.md), it inherits from its API.

## Options

### `effect`

- Type: `string`
- Default: `''`

Use this option to define a piece of JavaScript code to be executed when the value changes. The `value` and `target` variables can be used to access both the current value of the binding and the DOM element targeted by the changes.

**Example**

In the following example, the counter text color is changed based on the input's length:

<PreviewPlayground
  :html="() => import('./stories/effect-example.twig')"
  :script="() => import('./stories/effect-example.js?raw')"
  />

---
title: DataBind, DataModel, DataEffect and DataComputed examples
---

# Examples

## Basic example

<PreviewPlayground
  :html="() => import('./stories/basic.twig')"
  :script="() => import('./stories/basic.js?raw')"
  />

## Double computed example

In this example, we set the value of the `data-option-compute` attribute to `(value || 0) * 2`. By using a number input, the `value` is automatically casted to a number (or `NaN` if the input is empty), so we can simply multiply it by 2 to get the desired result.

<PreviewPlayground
  :html="() => import('./stories/double.twig')"
  :script="() => import('./stories/double.js?raw')"
  />

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

## Radio

Radio inputs sharing the same native `name` inside a [`DataScope`](../DataScope/index.md) behave as a single keyed value: the checked radio is the current source, and selecting another one updates every subscriber for that key.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/radio.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/radio.twig
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

## Number

Number inputs resolve their value with the `valueAsNumber` property, so computed callbacks and mutation helpers such as [`increment()`](../DataBind/js-api.md#increment) work with a real number.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/number.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/number.twig
<<< ./stories/app.js

:::

</llm-only>

## Date

Date inputs resolve their value with the `valueAsDate` property. The bound value is a `Date` object (or `null` when empty), so it can be formatted freely in [virtual bindings](../DataBind/index.md#multiple-virtual-bindings) or computed callbacks.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/date.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/date.twig
<<< ./stories/app.js

:::

</llm-only>

## Textarea

Textareas behave like text inputs and bind their `value` property.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/textarea.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/textarea.twig
<<< ./stories/app.js

:::

</llm-only>

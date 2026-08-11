---
title: DataBind, DataModel, DataEffect and DataComputed examples
---

# Examples

## Virtual bindings

The examples below show each [virtual binding](./js-api.md#virtual-bindings) in isolation. All of them can be combined on the same element.

### Property binding

The `data-bind:prop.<name>` binding assigns a DOM property. The button below enables itself only when the email value looks valid, by assigning its `disabled` property.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/prop.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/prop.twig
<<< ./stories/app.js

:::

</llm-only>

### Attribute binding

The `data-bind:attr.<name>` binding writes an attribute, and removes it for `false`, `null`, or `undefined` results. The disclosure below drives both the `aria-expanded` state of its button and the `hidden` attribute of its panel from one value. Note the explicit `String(…)` on `aria-expanded`: ARIA states must keep their `"false"` value instead of removing the attribute.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/attr.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/attr.twig
<<< ./stories/app.js

:::

</llm-only>

### Class binding

The `data-bind:class.<name>` binding toggles a class according to the result's boolean value. An empty expression passes the raw value through, so a checkbox's boolean value can drive classes directly.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/class.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/class.twig
<<< ./stories/app.js

:::

</llm-only>

### Style binding

The `data-bind:style.<name>` binding writes an inline style, and clears it for `false`, `null`, or `undefined` results. The progress bar below computes its `width` from a range input. Custom properties work too, for example `data-bind:style.--progress="value"`.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/style.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/style.twig
<<< ./stories/app.js

:::

</llm-only>

### Text binding

The `data-bind:text` binding assigns `textContent`. Use an expression to format the value, or an empty attribute to render it as is.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/text.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/text.twig
<<< ./stories/app.js

:::

</llm-only>

### Conditional rendering

The `data-bind:if` binding adds or removes the content of a `<template>` element based on the bound value. The shipping address field below only exists in the DOM — and in the submitted form — while the checkbox is checked. See the [conditional rendering reference](./js-api.md#conditional-rendering-with-data-bind-if) for the trade-offs against `data-bind:attr.hidden`.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/if.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/if.twig
<<< ./stories/app.js

:::

</llm-only>

The template content can hold components of its own: they mount when the content is inserted and are destroyed when it is removed. Give nested keyed bindings the [`immediate` option](./js-api.md#immediate) so they sync with the current scoped value on insertion — the results line below renders the query that inserted it, then follows every keystroke.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/if-nested.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/if-nested.twig
<<< ./stories/app.js

:::

</llm-only>

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

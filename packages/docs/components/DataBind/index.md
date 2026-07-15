---
badges: [JS]
---

# DataBind <Badges :texts="$frontmatter.badges" />

Use the `DataBind` to create a one-way binding of a property of the targeted DOM element. This component should be used with the [`DataModel` component](../DataModel/index.md), which handles two-way bindings.

The related [`DateComputed`](../DataComputed/index.md) and [`DataEffect`](../DataEffect/index.md) components can also be used for computed values and side effects respectively.

## Table of content

- [Examples](./examples.md)
- [JavaScript API](./js-api.md)

## Usage

Import the components in your main app and use the [`DataModel` component](../DataModel/index.md) on HTML `<form>` elements and the `DataBind` and [`DataComputed`](../DataComputed/index.md) components on other elements that need to be updated accordingly. The [`DataEffect` component](../DataEffect/index.md) can be used to execute side effects when the value changes.

### Basic usage

::: code-group

```js [app.js] twoslash
import { registerComponent } from '@studiometa/js-toolkit';
import { DataBind } from '@studiometa/ui';

registerComponent(DataBind);
```

```html [index.html]
<!-- Bind "textContent" to the "text" group -->
<div data-component="DataBind" data-option-group="text"></div>

<!-- Bind "value" to the "text" group -->
<input type="text" data-component="DataModel" data-option-group="text" />

<!-- Bind "value" to the "text" group and sync it on mount -->
<input type="text" data-component="DataModel" data-option-group="text" data-option-immediate />
```

:::

### Multiple virtual bindings

Use virtual `data-bind:*` attributes to update several parts of an element from the same value:

| Syntax                   | Behavior                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `data-bind:prop.<name>`  | Assigns the DOM property.                                                                                                                |
| `data-bind:attr.<name>`  | Removes the attribute for `false`, `null`, or `undefined`; writes an empty attribute for `true`; otherwise writes the stringified value. |
| `data-bind:class.<name>` | Toggles the class according to the result's boolean value.                                                                               |
| `data-bind:style.<name>` | Clears the style for `false`, `null`, or `undefined`; otherwise writes the stringified value.                                            |
| `data-bind:text`         | Assigns `textContent`.                                                                                                                   |

A non-empty attribute value is a JavaScript expression with access to `value`, `target`, and `$data`. An empty attribute passes through the current value. When an element has one or more virtual bindings, they replace the default single `textContent` or property update. Bindings are read when first used; changing their attributes afterward is not supported.

Use kebab-case for camel-cased DOM properties because HTML attribute names are case-insensitive, for example `data-bind:prop.tab-index` targets `tabIndex`.

For ARIA attributes, explicitly stringify booleans when `"false"` must remain present, for example `data-bind:attr.aria-selected="String(value === 'overview')"`.

The following Tabs-like controls keep their labels while updating state and panels from the `tab` group:

```html
<input
  id="current-tab"
  type="hidden"
  value="overview"
  data-component="DataBind"
  data-option-group="tab"
  data-option-immediate />

<button
  data-component="Action DataBind"
  data-option-group="tab"
  data-on:click="DataBind(#current-tab) -> target.value = 'overview'"
  data-bind:class.is-active="value === 'overview'"
  data-bind:attr.aria-selected="String(value === 'overview')">
  Overview
</button>
<button
  data-component="Action DataBind"
  data-option-group="tab"
  data-on:click="DataBind(#current-tab) -> target.value = 'details'"
  data-bind:class.is-active="value === 'details'"
  data-bind:attr.aria-selected="String(value === 'details')">
  Details
</button>

<section
  data-component="DataBind"
  data-option-group="tab"
  data-bind:attr.hidden="value !== 'overview'">
  Overview panel
</section>
<section
  data-component="DataBind"
  data-option-group="tab"
  data-bind:attr.hidden="value !== 'details'">
  Details panel
</section>
```

Expression errors are reported without interrupting updates to the other bindings, matching `DataComputed` and `DataEffect` behavior.

### Advanced usage with computed and effects

The whole family of `Data...` components can be used to create reactivity in your HTML with only a few `data-...` attributes.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic.twig')"
  :script="() => import('./stories/basic.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic.twig
<<< ./stories/basic.js

:::

</llm-only>

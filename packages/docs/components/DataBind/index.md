---
badges: [JS]
---

# DataBind <Badges :texts="$frontmatter.badges" />

Use the `DataBind` to create a one-way binding of a property of the targeted DOM element. This component should be used with the [`DataModel` component](../DataModel/index.md), which handles two-way bindings.

The related [`DataComputed`](../DataComputed/index.md) and [`DataEffect`](../DataEffect/index.md) components can also be used for computed values and side effects respectively.

## Usage

Import the components in your main app and use the [`DataModel` component](../DataModel/index.md) on HTML `<form>` elements and the `DataBind` and [`DataComputed`](../DataComputed/index.md) components on other elements that need to be updated accordingly. The [`DataEffect` component](../DataEffect/index.md) can be used to execute side effects when the value changes.

### Basic usage

::: code-group

```js [app.js] twoslash
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, DataBind, DataModel, DataScope } from '@studiometa/ui';

registerComponent(DataScope);
registerComponent(DataBind);
registerComponent(DataModel);
registerComponent(Action);
```

```html [index.html]
<div data-component="DataScope" data-option-group="message">
  <!-- Hydrate the "text" key from the input's native name. -->
  <input name="text" value="Hello world" data-component="DataModel" data-option-immediate />

  <!-- Render only updates published for the "text" key. -->
  <output data-component="DataBind" data-option-key="text">Hello world</output>
</div>
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

The following disclosure keeps its button label while updating its class, ARIA state, and panel visibility from one scoped value. The `DataModel` uses its `value` property to hydrate the initial state; virtual bindings then retain the reactive value without replacing the label.

```html
<div data-component="DataScope" data-option-group="disclosure">
  <button
    type="button"
    value="closed"
    aria-controls="details"
    aria-expanded="false"
    data-component="Action DataModel"
    data-option-key="state"
    data-option-prop="value"
    data-option-immediate
    data-on:click="DataModel.toggle('open', 'closed')"
    data-bind:class.is-active="value === 'open'"
    data-bind:attr.aria-expanded="String(value === 'open')">
    Details
  </button>

  <section
    id="details"
    hidden
    data-component="DataBind"
    data-option-key="state"
    data-bind:attr.hidden="value !== 'open'">
    Disclosure content
  </section>
</div>
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

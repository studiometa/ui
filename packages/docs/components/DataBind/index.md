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

### Advanced usage with computed and effects

The whole family of `Data...` components can be used to create reactivity in your HTML with only a few `data-...` attributes.

<PreviewPlayground
  :html="() => import('./stories/basic.twig')"
  :script="() => import('./stories/basic.js?raw')"
  />

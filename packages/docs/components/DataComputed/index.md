---
badges: [JS]
---

# DataComputed <Badges :texts="$frontmatter.badges" />

Use the `DataComputed` component to create a one-way binding of a property of the targeted DOM element with a computed value. This component extends the [`DataBind` component](../DataBind/index.md), so it inherits from its API.

## Table of content

- [Examples](./examples.md)
- [JavaScript API](./js-api.md)

## Usage

### Basic usage to transform a value

Use the `DataComputed` component alongside the [`DataModel` component](../DataModel/index.md) to create a two-way binding with a computed value.

::: code-group

```html [index.html]
<!-- Two ways binding on the "text" group for the input's value -->
<input type="text" data-component="DataModel" data-option-group="text" />

<!-- Update the text content with the input's value in UPPERCASE -->
<div
  data-component="DataComputed"
  data-option-group="text"
  data-option-compute="value.toUpperCase()">
  ...
</div>
```

```js [app.js] twoslash
import { registerComponent } from '@studiometa/js-toolkit';
import { DataModel, DataComputed } from '@studiometa/ui';

registerComponent(DataModel);
registerComponent(DataComputed);
```

:::

<PreviewPlayground
  height="300px"
  zoom="1"
  header="hidden"
  :html="() => import('./stories/uppercase.twig')"
  :script="() => import('./stories/uppercase.js?raw')"
  />


### Double computed value

<PreviewPlayground
  :html="() => import('./stories/compute-example.twig')"
  :script="() => import('./stories/compute-example.js?raw')"
  />

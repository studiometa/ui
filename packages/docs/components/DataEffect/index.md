---
badges: [JS]
---

# DataEffect <Badges :texts="$frontmatter.badges" />

Use the `DataEffect` component to execute side effects when the value of the `Data...` components group changes. This component extends the [`DataBind` component](../DataBind/index.md), so it inherits from its API.

## Table of content

- [JavaScript API](./js-api.md)

## Usage

::: code-group

```html {5,7} [index.html]
<!-- Two ways binding on the "text" group for the input's value -->
<!-- And show an alert if the content of the input is too loong -->
<input
  type="text"
  data-component="DataModel DataEffect"
  data-option-group="text"
  data-option-effect="value.length > 20 && alert('Too long')" />
```

```js [app.js] twoslash
import { registerComponent } from '@studiometa/js-toolkit';
import { DataModel, DataEffect } from '@studiometa/ui';

registerComponent(DataModel);
registerComponent(DataEffect);
```

:::

<llm-exclude>
<PreviewPlayground
  height="300px"
  zoom="1"
  header="hidden"
  :html="() => import('./stories/too-long.twig')"
  :script="() => import('./stories/too-long.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/too-long.twig
<<< ./stories/too-long.js

:::

</llm-only>

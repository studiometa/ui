---
badges: [JS]
---

# DataEffect <Badges :texts="$frontmatter.badges" />

Use the `DataEffect` component to execute side effects when the value of the `Data...` components group changes. This component extends the [`DataBind` component](../DataBind/index.md), so it inherits from its API.

## Usage

::: code-group

```html [index.html]
<div data-component="DataScope" data-option-group="validation">
  <!-- "message" is the scoped key for both components. -->
  <input
    name="message"
    type="text"
    data-component="DataModel DataEffect"
    data-option-effect="target.setCustomValidity(value.length > 10 ? 'Use 10 characters or fewer.' : '')" />
</div>
```

```js [app.js] twoslash
import { registerComponent } from '@studiometa/js-toolkit';
import { DataEffect, DataModel, DataScope } from '@studiometa/ui';

registerComponent(DataScope);
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

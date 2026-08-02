---
badges: [JS]
---

# Draggable <Badges :texts="$frontmatter.badges" />

## Usage

Use this component to add drag capabilities to an element.

::: code-group

```js twoslash [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { Draggable } from '@studiometa/ui';

registerComponent(Draggable);
```

```html [index.html]
<div data-component="Draggable">
  <div data-ref="target">...</div>
</div>
```

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/app.twig
<<< ./stories/app.js

:::

</llm-only>

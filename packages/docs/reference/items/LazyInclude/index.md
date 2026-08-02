---
badges: [JS]
---

# LazyInclude <Badges :texts="$frontmatter.badges" />

## Usage

Use the `LazyInclude` component to load parts of your page lazily.

::: code-group

```js [app.js] twoslash
import { registerComponent } from '@studiometa/js-toolkit';
import { LazyInclude } from '@studiometa/ui';

registerComponent(LazyInclude);
```

```html index.html
<div data-component="LazyInclude" data-option-src="/path/to/section-renderer">
  <span data-ref="loading">Loading...</span>
  <span data-ref="error" class="hidden">An error occured.</span>
</div>
```

:::

::: warning Orchestration
The content is fetched when the component is mounted. Use [`withMount...` decorators](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html) to wrap the ` LazyInclude` class for a fine grained loading strategy.
:::

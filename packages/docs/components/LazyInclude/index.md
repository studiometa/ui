---
badges: [JS]
---

# LazyInclude <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

Use the `LazyInclude` component to load parts of your page lazyliy.

::: code-group

```js [app.js] twoslash {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { LazyInclude } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      LazyInclude,
    },
  };
}

createApp(App);
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

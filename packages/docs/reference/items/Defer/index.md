---
badges: [JS]
---

# Defer <Badges :texts="$frontmatter.badges" />

## Usage

Use the `Defer` component to load parts of your page lazily.

::: code-group

```js [app.js] twoslash
import { registerComponent } from '@studiometa/js-toolkit';
import { Defer } from '@studiometa/ui';

registerComponent(Defer);
```

```html index.html
<div data-component="Defer" data-option-src="/path/to/section-renderer">
  <span data-ref="loading">Loading...</span>
  <span data-ref="error" class="hidden">An error occured.</span>
</div>
```

:::

::: warning Orchestration
The content is fetched when the component is mounted. Use the `data-mount` attribute to pick one of the [js-toolkit mount strategies](https://js-toolkit-v4.studiometa.dev/) — `visible`, `in-view`, `idle`, `interaction` or `media:<query>` — for a fine grained loading strategy.
:::

::: tip Renamed in v2
`Defer` was named `LazyInclude` in v1, and its events were named `content`, `error` and `always`. Both the class and its events now carry the family prefix: `defer-content`, `defer-error` and `defer-always`.
:::

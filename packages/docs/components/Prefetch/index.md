---
badges: [JS]
---

# Prefetch <Badges :texts="$frontmatter.badges" />

The family of prefetch components can be used to improve performance when navigating in a page by prefetching content for the target links.

## Table of content

- [JS API](./js-api.md)

## Usage

Import one of the available prefetch component in you app and use them in your HTML to enable a performance boost while navigating between pages.

::: code-group

```js twoslash [app.js] {2,8-9}
import { Base, createApp } from '@studiometa/js-toolkit';
import { PrefetchWhenOver, PrefetchWhenVisible } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      PrefetchWhenOver,
      PrefetchWhenVisible,
    },
  };
}

export default createApp(App);
```

```html [index.html]
<!-- Will be prefetched on mouseenter -->
<a href="/path" data-component="PrefetchWhenOver">...</a>

<!-- Will be prefetched when visible in the viewport -->
<a href="/path" data-component="PrefetchWhenVisible">...</a>
```

:::

### Create your own prefetch strategy

If you need a custom strategy to prefetch a given link, you can extend the `AbstractPrefetch` class exported by the package and call its [`prefetch()` method](./js-api.md#prefetch) when needed.

```js twoslash
import { AbstractPrefetch } from '@studiometa/ui';

export default class PrefetchOnPointerdown extends AbstractPrefetch {
  static config = {
    name: 'AbstractPrefetch',
  };

  onPointerdown() {
    this.prefetch();
  }
}
```

---
badges: [JS]
---

# Hoverable <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

Use this component to move an oversized element withing its parent bounds.

::: code-group

```js twoslash [app.js]
import { Base, createApp } from '@studiometa/js-toolkit';
import { Hoverable } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Hoverable,
    },
  };
}

export default createApp(App);
```

```html [index.html]
<div data-component="Hoverable" class="relative w-96 h-96">
  <div data-ref="target" class="absolute w-[120%] h-[120%]">
    ...
  </div>
</div>
```

<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />

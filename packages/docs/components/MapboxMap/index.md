---
badges: [JS]
---

# MapboxMap <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

Use this component to display a map with [mapbox-gl](https://github.com/mapbox/mapbox-gl-js).

::: code-group

```js twoslash [app.js]
import { Base, createApp } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      MapboxMap,
    },
  };
}

export default createApp(App);
```

```html [index.html]
<div data-component="MapboxMap">
  <div data-ref="container"></div>
</div>
```

```css [app.css]
@import 'mapbox-gl/dist/mapbox-gl.css';
```

<PreviewPlayground
  :html="() => import('./stories/map/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/map/app.js?raw')"
  :script-editor="false"
  :css="() => import('./stories/map/app.css?raw')"
  :css-editor="false"
  />

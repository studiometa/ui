---
badges: [JS]
---

# MapboxMap <Badges :texts="$frontmatter.badges" />

The `MapboxMap` component and its family let you build [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) maps declaratively, straight from your HTML, with [js-toolkit](https://js-toolkit.studiometa.dev/) — no Vue, no framework runtime. A `MapboxMap` element owns the underlying Mapbox `Map` instance, and every other component (markers, popups, controls, sources, layers, images, clusters) is authored as a child element that registers itself against that map once it is loaded.

These components are published in the standalone [`@studiometa/ui-mapbox`](https://www.npmjs.com/package/@studiometa/ui-mapbox) package and replace the [`@studiometa/vue-mapbox-gl`](https://www.npmjs.com/package/@studiometa/vue-mapbox-gl) library. If you are coming from the Vue library, read the [migration guide](/migration-guides/vue-mapbox-gl/).

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Installation

Install the package alongside its `mapbox-gl` peer dependency. The [`@mapbox/mapbox-gl-geocoder`](https://github.com/mapbox/mapbox-gl-geocoder) package is only required if you use the [`MapboxGeocoder`](./js-api#mapboxgeocoder) component.

```bash
npm install @studiometa/ui-mapbox mapbox-gl

# Optional, only for the geocoder control
npm install @mapbox/mapbox-gl-geocoder
```

The Mapbox GL stylesheet is required for the map, its controls and popups to render correctly. Add it to your page, either as a `<link>` tag pointing to the CDN or by importing it from the package with your bundler.

```html
<link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.css" />
```

```css
/* or, when using a bundler */
@import 'mapbox-gl/dist/mapbox-gl.css';
```

You will also need a [Mapbox access token](https://docs.mapbox.com/help/getting-started/access-tokens/). Pass it to the `MapboxMap` component through the `access-token` option.

## Usage

Register the `MapboxMap` component with [`registerComponent`](https://js-toolkit.studiometa.dev/api/helpers/registerComponent.html). All child components are declared internally, so you only ever register `MapboxMap` itself — they are resolved automatically once the map is loaded.

Author the map with a root `MapboxMap` element holding a `container` ref, and give it a size through CSS.

::: code-group

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

```html [index.html]
<div
  data-component="MapboxMap"
  data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
  data-option-zoom="10"
  data-option-center="[2.35, 48.86]"
  class="h-96 w-full">
  <div data-ref="container" class="h-full w-full"></div>
</div>
```

```css [app.css]
@import 'mapbox-gl/dist/mapbox-gl.css';
```

:::

::: tip Options are read once at mount
Component options are read a single time when the map mounts and are **not** reactive, unlike the Vue library. To move the map or update its data afterwards, call the underlying Mapbox objects directly (e.g. `instance.map.setCenter(...)`). See the [reactivity note](./js-api#reactivity-and-updates) for details.
:::

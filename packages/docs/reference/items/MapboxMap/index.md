---
badges: [JS]
---

# MapboxMap <Badges :texts="$frontmatter.badges" />

The `MapboxMap` component and its family let you build [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) maps declaratively, straight from your HTML, with [js-toolkit](https://js-toolkit.studiometa.dev/). A `MapboxMap` element owns the underlying Mapbox `Map` instance, and every other component (markers, popups, controls, sources, layers, images, clusters) is authored as a child element that registers itself against that map once it is loaded.

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

[Register](/guide/usage/#registering-components) each component your page uses: a bare map with just a `container` needs only `MapboxMap`, and each marker, popup, control, source, layer, image or cluster you declare must be registered too. Registration order does not matter, because a child registered before its `MapboxMap` still wires up once the map connects.

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

`mapbox-gl` is a heavy dependency (~230&nbsp;kB gzipped, more with the geocoder), so the recommended default is to register each component lazily — see [Lazy loading](#lazy-loading) below.

## Lazy loading

Keep `mapbox-gl` out of your main bundle by lazy-registering each component with js-toolkit's [`importWhen*` helpers](https://js-toolkit.studiometa.dev/api/helpers/importWhenVisible.html) and the per-component subpaths. `importWhenVisible` defers the dynamic import until a `MapboxMap` element scrolls into view, then hands the resolved component to `registerComponent`, code-splitting `mapbox-gl` into its own chunk loaded only when a map is actually needed.

Every component is available at its own subpath (`@studiometa/ui-mapbox/<Component>`), whose default export is the component class — so the dynamic import needs no destructuring. Because each component is registered independently, lazy-register each one you use: deferring `MapboxMap` pulls in `mapbox-gl`, but a marker or a cluster is its own module and must get its own lazy registration.

```js
import { registerComponents, importWhenVisible } from '@studiometa/js-toolkit';

registerComponents(
  importWhenVisible(() => import('@studiometa/ui-mapbox/MapboxMap'), 'MapboxMap'),
  importWhenVisible(() => import('@studiometa/ui-mapbox/MapboxMarker'), 'MapboxMarker'),
  importWhenVisible(() => import('@studiometa/ui-mapbox/MapboxPopup'), 'MapboxPopup'),
);
```

Reach for a different trigger when it fits better: `importWhenIdle` (load during browser idle time), `importOnInteraction` (wait for a first click/focus/touch on the element) or `importOnMediaQuery` (load only above a breakpoint, e.g. to skip the map on small screens).

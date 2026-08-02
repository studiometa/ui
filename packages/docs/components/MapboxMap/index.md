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

Every component in the family is **self-registering**: `MapboxMap` no longer declares its children, so each one registers independently and resolves its parent map on its own (through `$closest('MapboxMap')`, then waits for readiness). Register only the components your page uses — registration order does not matter, because a child registered before its `MapboxMap` still wires up once the map connects. Once a component is registered, js-toolkit's document-wide `MutationObserver` mounts it whenever its element enters the DOM. A map with nothing but a `container` needs only `MapboxMap`; the moment you add markers, controls, sources or clusters you must register those components too, otherwise their elements are inert.

`mapbox-gl` is a heavy dependency (~230&nbsp;kB gzipped, more with the geocoder), so the **recommended default** is to lazy-register each component with js-toolkit's [`importWhen*` helpers](https://js-toolkit.studiometa.dev/api/helpers/importWhenVisible.html) and the per-component subpaths — each subpath's default export is the component class, so the dynamic import needs no destructuring. This keeps `mapbox-gl` out of your main bundle until a map element is actually on the page. The [Lazy loading](#lazy-loading) section below covers the other triggers.

Author the map with a root `MapboxMap` element holding a `container` ref, and give it a size through CSS.

::: code-group

```js [app.js]
import { registerComponent, importWhenVisible } from '@studiometa/js-toolkit';

// Register only the components your page uses; order doesn't matter.
// A bare map with just a `container` needs only `MapboxMap`; register each
// marker, popup, control, source, layer, image or cluster you declare too.
registerComponent(importWhenVisible(() => import('@studiometa/ui-mapbox/MapboxMap'), 'MapboxMap'));
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

If you do not need code-splitting, register eagerly instead — every component is exported by name from the package:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

::: tip Options are read once at mount
Component options are read a single time when the map mounts and are **not** reactive, unlike the Vue library. To move the map or update its data afterwards, call the underlying Mapbox objects directly (e.g. `instance.map.setCenter(...)`). See the [reactivity note](./js-api#reactivity-and-updates) for details.
:::

## Lazy loading

The [Usage](#usage) example above already leads with lazy registration — `importWhenVisible` defers the dynamic import until a `MapboxMap` element scrolls into view, then hands the resolved component to `registerComponent`. This keeps `mapbox-gl` code-split into its own chunk, loaded only when a map is actually needed rather than pulled into your main bundle on every page.

Every component is available at its own subpath (`@studiometa/ui-mapbox/<Component>`), whose default export is the component class — so the dynamic import needs no destructuring. Because each component is registered independently, lazy-register each one you use: deferring `MapboxMap` pulls in `mapbox-gl`, but a marker or a cluster is its own module and must get its own lazy registration. Registration order stays irrelevant — a child lazily registered before its `MapboxMap` still wires up once the map connects.

```js
import { registerComponent, importWhenVisible } from '@studiometa/js-toolkit';

for (const name of ['MapboxMap', 'MapboxMarker', 'MapboxPopup']) {
  registerComponent(importWhenVisible(() => import(`@studiometa/ui-mapbox/${name}`), name));
}
```

Reach for a different trigger when it fits better: `importWhenIdle` (load during browser idle time), `importOnInteraction` (wait for a first click/focus/touch on the element) or `importOnMediaQuery` (load only above a breakpoint, e.g. to skip the map on small screens).

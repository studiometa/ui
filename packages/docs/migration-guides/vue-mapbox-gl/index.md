# @studiometa/vue-mapbox-gl → @studiometa/ui-mapbox

This guide helps you migrate from the Vue 3 library [`@studiometa/vue-mapbox-gl`](https://www.npmjs.com/package/@studiometa/vue-mapbox-gl) to the [js-toolkit](https://js-toolkit.studiometa.dev/) components published in [`@studiometa/ui-mapbox`](https://www.npmjs.com/package/@studiometa/ui-mapbox).

[[toc]]

## Why migrate

`@studiometa/ui-mapbox` re-implements the Mapbox GL components on top of [js-toolkit](https://js-toolkit.studiometa.dev/) instead of Vue. The main benefits are:

- **No Vue dependency** — the components are plain js-toolkit classes bound to the DOM through `data-component` attributes. You do not need Vue in your project to render a map.
- **Lighter for simple maps** — you ship the map logic and Mapbox GL, without a framework runtime, which keeps the footprint small for mostly-static maps.
- **Server-rendered friendly** — the map is authored as regular HTML and enhanced in place, which fits Twig/Blade/Nunjucks templates naturally.

The trade-off is that component options are **not reactive** (see [Reactivity caveat](#reactivity-caveat)). If your map relies heavily on reactive props driven by application state, weigh that difference before migrating.

## Install and setup

Replace the Vue library with the js-toolkit package and its peers.

```bash
npm remove @studiometa/vue-mapbox-gl
npm install @studiometa/ui-mapbox mapbox-gl

# Optional, only if you use the geocoder
npm install @mapbox/mapbox-gl-geocoder
```

The Mapbox GL stylesheet is still required. Keep importing it as before:

```css
@import 'mapbox-gl/dist/mapbox-gl.css';
```

Instead of registering the components on a Vue app, register the `MapboxMap` component with js-toolkit. All child components are declared internally, so a single registration is enough:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

## Component mapping

Every Vue component has a one-to-one js-toolkit equivalent, with the same name. You author them as `data-component` elements nested inside a `MapboxMap` instead of Vue templates.

| `@studiometa/vue-mapbox-gl` | `@studiometa/ui-mapbox`   | Notes                                                                 |
| --------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `MapboxMap`                 | `MapboxMap`               | Root component, owns the map instance.                                |
| `MapboxMarker`              | `MapboxMarker`            |                                                                       |
| `MapboxPopup`               | `MapboxPopup`             | Content comes from the element's inner HTML.                          |
| `MapboxNavigationControl`   | `MapboxNavigationControl` |                                                                       |
| `MapboxGeolocateControl`    | `MapboxGeolocateControl`  |                                                                       |
| `MapboxFullscreenControl`   | `MapboxFullscreenControl` | Ported.                                                               |
| `MapboxGeocoder`            | `MapboxGeocoder`          | Needs the optional `@mapbox/mapbox-gl-geocoder`.                      |
| `MapboxSource`              | `MapboxSource`            | Ported.                                                               |
| `MapboxLayer`               | `MapboxLayer`             |                                                                       |
| `MapboxImage`               | `MapboxImage`             | Ported.                                                               |
| `MapboxImages`              | `MapboxImages`            | Ported.                                                               |
| `MapboxCluster`             | `MapboxCluster`           | Ported. `data` only accepts a URL — see [below](#mapboxcluster-data). |
| `StoreLocator`              | —                         | **Not yet available** — planned follow-up.                            |
| `VueScroller`               | —                         | **Not yet available** — planned follow-up.                            |

::: warning Not yet ported
`StoreLocator` and its internal `VueScroller` helper have no js-toolkit equivalent yet. They are planned as a follow-up. If you rely on `StoreLocator`, keep it on `@studiometa/vue-mapbox-gl` for now, or rebuild the layout on top of `MapboxMap` + `MapboxMarker` + `MapboxCluster`.
:::

## API translation

### Props → options

Vue props become js-toolkit `data-option-*` attributes on the corresponding element, in kebab-case. Objects and arrays are passed as JSON strings.

```html
<!-- Vue -->
<MapboxMap :access-token="token" :zoom="10" :center="[2.35, 48.86]">
  <MapboxMarker :lng-lat="[2.35, 48.86]" :marker-options="{ color: '#e11d48' }" />
</MapboxMap>
```

```html
<!-- js-toolkit -->
<div
  data-component="MapboxMap"
  data-option-access-token="pk.…"
  data-option-zoom="10"
  data-option-center="[2.35, 48.86]">
  <div data-ref="container"></div>
  <div
    hidden
    data-component="MapboxMarker"
    data-option-lng-lat="[2.35, 48.86]"
    data-option-marker-options='{ "color": "#e11d48" }'></div>
</div>
```

The js-toolkit `MapboxMap` exposes a focused set of options (`access-token`, `zoom`, `center`) and forwards them to the Mapbox `Map` constructor, so any other serializable map option can be added as a `data-option-*` attribute. See the [full options reference](/components/MapboxMap/js-api).

A key structural difference: the map needs an explicit **`container` ref** child (`<div data-ref="container">`), and child components that only act as declarative definitions (markers, popups, controls, sources, layers, images, clusters) are wrapped in a `hidden` element so they do not take part in the document flow.

### Event listeners → emitted events

The Vue library re-emits Mapbox map events prefixed with `mb-` (e.g. `@mb-load`, `@mb-click`). In js-toolkit, listen to the emitted events from a parent component with `on<ComponentName><EventName>` handler methods.

| Vue listener                  | js-toolkit emitted event | Parent handler method         |
| ----------------------------- | ------------------------ | ----------------------------- |
| `@mb-load` (map loaded)       | `map-load`               | `onMapboxMapMapLoad`          |
| `@mb-click`                   | `click`                  | `onMapboxMapClick`            |
| `@mb-moveend`                 | `moveend`                | `onMapboxMapMoveend`          |
| `@mb-zoomend`                 | `zoomend`                | `onMapboxMapZoomend`          |
| `MapboxCluster` cluster click | `cluster-click`          | `onMapboxClusterClusterClick` |
| `MapboxCluster` feature click | `feature-click`          | `onMapboxClusterFeatureClick` |

The `MapboxMap` component re-emits the full list of Mapbox map events; `MapboxCluster` emits `cluster-click`, `feature-click`, `feature-mouseenter` and `feature-mouseleave`; `MapboxImage` and `MapboxImages` emit `ready`. See each component's events in the [JS API](/components/MapboxMap/js-api).

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

class App extends Base {
  static config = {
    name: 'App',
    components: { MapboxMap },
  };

  onMapboxMapMapLoad(map) {
    console.log('Map is ready', map);
  }

  onMapboxMapClick(event) {
    console.log('Clicked at', event.lngLat);
  }
}

createApp(App);
```

### Slots → DOM children and refs

Vue slots become real DOM children:

- The `MapboxMap` default slot content becomes child elements inside the `MapboxMap` element. The map canvas target moves from an internal ref to an explicit `<div data-ref="container">`.
- The `MapboxMarker` / `MapboxPopup` content (Vue `default` / `popup` slots) becomes the inner HTML of the corresponding element. A popup nested inside a marker is attached to it automatically.

```html
<!-- Vue -->
<MapboxMarker :lng-lat="[2.35, 48.86]">
  <template #popup>
    <h3>Paris</h3>
  </template>
</MapboxMarker>
```

```html
<!-- js-toolkit -->
<div hidden data-component="MapboxMarker" data-option-lng-lat="[2.35, 48.86]">
  <div data-component="MapboxPopup">
    <h3>Paris</h3>
  </div>
</div>
```

### MapboxCluster data {#mapboxcluster-data}

In the Vue library, the `MapboxCluster` `data` prop accepts either a URL string or an inline GeoJSON object. In js-toolkit, options cannot express a `String | Object` union, so `data` is declared as a `String` and only accepts the **URL of a `.geojson` file** when set via the data attribute. To pass inline GeoJSON, provide it programmatically instead of through `data-option-data`.

## Reactivity caveat

In `@studiometa/vue-mapbox-gl`, changing a prop updated the map reactively (moving the center, updating the source data, and so on). In `@studiometa/ui-mapbox`, **options are read once at mount and are not reactive**.

To update the map after mount, call the underlying Mapbox objects directly through the component instances:

```js
import { getInstance } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

const mapboxMap = getInstance(element, MapboxMap);

// Move the map
mapboxMap.map.setCenter([2.35, 48.86]);
mapboxMap.map.setZoom(12);

// Update a source
mapboxMap.map.getSource('points').setData(newGeoJson);
```

Each component exposes its Mapbox object (`map`, `marker`, `popup`, `control`, …). See the [JS API](/components/MapboxMap/js-api#reactivity-and-updates) for the full list.

## Before / after

A complete map with a marker and an attached popup.

**Before — `@studiometa/vue-mapbox-gl`:**

```vue
<script setup>
  import { MapboxMap, MapboxMarker, MapboxPopup } from '@studiometa/vue-mapbox-gl';

  const token = 'pk.…';
</script>

<template>
  <MapboxMap :access-token="token" :zoom="12" :center="[2.35, 48.86]" @mb-load="onLoad">
    <MapboxMarker :lng-lat="[2.35, 48.86]">
      <template #popup>
        <h3>Paris</h3>
        <p>Capital of France</p>
      </template>
    </MapboxMarker>
  </MapboxMap>
</template>
```

**After — `@studiometa/ui-mapbox`:**

```html
<div
  data-component="MapboxMap"
  data-option-access-token="pk.…"
  data-option-zoom="12"
  data-option-center="[2.35, 48.86]"
  class="h-96 w-full">
  <div data-ref="container" class="h-full w-full"></div>

  <div hidden data-component="MapboxMarker" data-option-lng-lat="[2.35, 48.86]">
    <div data-component="MapboxPopup">
      <h3>Paris</h3>
      <p>Capital of France</p>
    </div>
  </div>
</div>
```

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

class App extends Base {
  static config = {
    name: 'App',
    components: { MapboxMap },
  };

  onMapboxMapMapLoad(map) {
    // former @mb-load handler
  }
}

createApp(App);
```

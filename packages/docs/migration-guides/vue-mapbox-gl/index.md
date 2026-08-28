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

Instead of registering the components on a Vue app, register them with js-toolkit. Every component is self-registering — `MapboxMap` no longer declares its children, so each one must be registered with [`registerComponent`](https://js-toolkit-v4.studiometa.dev/api/registry/registerComponent.html). Register only the ones you use — a bare map needs only `MapboxMap`, but every marker, control, source or cluster you declare needs its own registration. Registration order does not matter, because a child registered before its `MapboxMap` still wires up once the map connects. Because `mapbox-gl` is heavy (~230&nbsp;kB gzipped), the recommended default is to register them through a lazy [manifest](/guide/autoloading/), whose entries import the per-component subpaths on demand (each subpath's default export is the component class):

```js
import { registerManifest } from '@studiometa/js-toolkit';

// Register only the components your page uses; order doesn't matter.
registerManifest({
  MapboxMap: {
    mountStrategy: 'visible',
    load: () => import('@studiometa/ui-mapbox/MapboxMap'),
  },
  MapboxMarker: {
    mountStrategy: 'visible',
    load: () => import('@studiometa/ui-mapbox/MapboxMarker'),
  },
  MapboxPopup: {
    mountStrategy: 'visible',
    load: () => import('@studiometa/ui-mapbox/MapboxPopup'),
  },
});
```

## Component mapping

Most Vue components have a same-named js-toolkit equivalent, which you author as `data-component` elements nested inside a `MapboxMap` instead of Vue templates. The clustering and store-locator components are the exception — they were re-architected around a new `MapboxClusterItem`, detailed below the table.

| `@studiometa/vue-mapbox-gl` | `@studiometa/ui-mapbox`   | Notes                                                                                                                                                     |
| --------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MapboxMap`                 | `MapboxMap`               | Root component, owns the map instance.                                                                                                                    |
| `MapboxMarker`              | `MapboxMarker`            |                                                                                                                                                           |
| `MapboxPopup`               | `MapboxPopup`             | Content comes from the element's inner HTML.                                                                                                              |
| `MapboxNavigationControl`   | `MapboxNavigationControl` |                                                                                                                                                           |
| `MapboxGeolocateControl`    | `MapboxGeolocateControl`  |                                                                                                                                                           |
| `MapboxFullscreenControl`   | `MapboxFullscreenControl` | Ported.                                                                                                                                                   |
| `MapboxGeocoder`            | `MapboxGeocoder`          | Needs the optional `@mapbox/mapbox-gl-geocoder`.                                                                                                          |
| `MapboxSource`              | `MapboxSource`            | Ported.                                                                                                                                                   |
| `MapboxLayer`               | `MapboxLayer`             |                                                                                                                                                           |
| `MapboxImage`               | `MapboxImage`             | Ported.                                                                                                                                                   |
| `MapboxImages`              | `MapboxImages`            | Ported.                                                                                                                                                   |
| `MapboxCluster`             | `MapboxCluster`           | Re-architected — the source is derived from child `MapboxClusterItem`s, not a `data` prop. See [below](#mapboxcluster-data).                              |
| —                           | `MapboxClusterItem`       | **New** — a rendered cluster entry (list item + map feature). See [below](#mapboxcluster-data).                                                           |
| `StoreLocator`              | `StoreLocator`            | Re-implemented as a thin orchestrator over `MapboxMap` + `MapboxCluster` + `MapboxClusterItem`s. See its [documentation](/reference/items/StoreLocator/). |
| `VueScroller`               | —                         | No equivalent needed — the store list is a plain scrollable element, styled with CSS.                                                                     |

::: tip StoreLocator is now available
`StoreLocator` has been re-implemented as a thin **orchestrator** over a `MapboxMap` + `MapboxCluster` + `MapboxClusterItem`s (plus an optional `MapboxGeocoder`). The single-purpose `StoreLocatorItem` class of the Vue library is gone: each store is a `MapboxClusterItem` that is at once the sidebar list entry and the map feature. The `VueScroller` helper has no equivalent — the list is a plain scrollable element you style with CSS. See the [`StoreLocator` documentation](/reference/items/StoreLocator/).
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

The js-toolkit `MapboxMap` exposes a focused set of options (`access-token`, `zoom`, `center`) and forwards them to the Mapbox `Map` constructor, so any other serializable map option can be added as a `data-option-*` attribute. See the [full options reference](/reference/items/MapboxMap/js-api).

A key structural difference: the map needs an explicit **`container` ref** child (`<div data-ref="container">`), and child components that only act as declarative definitions (markers, popups, controls, sources, layers, images, clusters) are wrapped in a `hidden` element so they do not take part in the document flow.

### Event listeners → emitted events

The Vue library re-emits Mapbox map events prefixed with `mb-` (e.g. `@mb-load`, `@mb-click`). The js-toolkit components use the `map-` prefix instead. Listen to the emitted events from a parent component with `on<ComponentName><EventName>` handler methods.

| Vue listener                  | js-toolkit emitted event | Parent handler method            |
| ----------------------------- | ------------------------ | -------------------------------- |
| `@mb-load` (map loaded)       | `map-load`               | `onMapboxMapMapLoad`             |
| `@mb-click`                   | `map-click`              | `onMapboxMapMapClick`            |
| `@mb-moveend`                 | `map-moveend`            | `onMapboxMapMapMoveend`          |
| `@mb-zoomend`                 | `map-zoomend`            | `onMapboxMapMapZoomend`          |
| `MapboxCluster` cluster click | `map-cluster-click`      | `onMapboxClusterMapClusterClick` |
| `MapboxCluster` feature click | `map-item-click`         | `onMapboxClusterMapItemClick`    |

Every public event uses the `map-` prefix. The `MapboxMap` component re-emits the full list of Mapbox map events; `MapboxCluster` emits `map-cluster-click`, `map-item-click` (an unclustered point, resolved back to the registered `MapboxClusterItem` behind it) and `map-update` (the item set changed); `MapboxGeocoder` emits `map-result`; `MapboxImage` and `MapboxImages` emit `map-ready`; map children emit `map-error` when guarded lifecycle work fails; and `StoreLocator` emits `map-select`, `map-deselect` and `map-filter`. See each component's events in the [JS API](/reference/items/MapboxMap/js-api).

```js
import { Base, registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

class App extends Base {
  static config = {
    name: 'App',
    components: { MapboxMap },
  };

  onMapboxMapMapLoad({ payload: { map } }) {
    console.log('Map is ready', map);
  }

  onMapboxMapMapClick({ payload: { event } }) {
    console.log('Clicked at', event.lngLat);
  }
}

registerComponent(App);
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

In the Vue library, the `MapboxCluster` `data` prop accepted a URL string or an inline GeoJSON object. The re-architected `MapboxCluster` has **no `data` option at all**: it is a pure source driver whose features _are_ its rendered children. Each point is a `MapboxClusterItem` element (living in the cluster's subtree, typically a sidebar list `<li>`) that self-registers with its closest `MapboxCluster`; the cluster derives its clustered GeoJSON `FeatureCollection` from that registry and rebuilds it (debounced) whenever items mount or unmount. The same markup is at once the sidebar list and the map source.

```html
<div hidden data-component="MapboxCluster" data-option-cluster-radius="60">
  <ul>
    <li
      data-component="MapboxClusterItem"
      data-option-id="a"
      data-option-lng-lat="[2.35, 48.86]"></li>
    <li
      data-component="MapboxClusterItem"
      data-option-id="b"
      data-option-lng-lat="[2.29, 48.86]"></li>
  </ul>
</div>
```

To load points from a server, render the `MapboxClusterItem` list from your backend (or swap it with a [`Fetch`](/reference/items/Fetch/)): mounting/terminating the items drives the map data, no `data` URL needed. For one-off imperative control you can still push a `FeatureCollection` straight to the source with the cluster's `setData(data)` method, but the registry remains the source of truth and the next item change overwrites it. See the [`MapboxCluster` reference](/reference/items/MapboxMap/js-api#mapboxcluster) and the [`StoreLocator`](/reference/items/StoreLocator/) built on top of it.

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

Each component exposes its Mapbox object (`map`, `marker`, `popup`, `control`, …). See the [JS API](/reference/items/MapboxMap/js-api#reactivity-and-updates) for the full list.

Two things the new lifecycle now handles for you, which the Vue library did not:

- **Switching the base style keeps your layers.** Calling `map.setStyle(…)` wipes every source, layer and sprite, but each declarative child re-injects its contribution on the map's `style.load`, so your sources, layers, images and clusters survive a base-style change (resolving [`vue-mapbox-gl` #248](https://github.com/studiometa/vue-mapbox-gl/issues/248)). You no longer need to re-declare data after a style switch.
- **Async ergonomics are internal.** Children resolve their parent map, wait for it to load, adopt or re-add resources across `Fetch` swaps and map remounts, and load the geocoder module on demand — all inside the shared base class, so you author plain declarative markup instead of orchestrating imperative `map.on('load', …)` wiring.

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
import { Base, registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

class App extends Base {
  static config = {
    name: 'App',
    components: { MapboxMap },
  };

  onMapboxMapMapLoad({ payload: { map } }) {
    // former @mb-load handler
  }
}

registerComponent(App);
```

---
badges: [JS]
---

# StoreLocator <Badges :texts="$frontmatter.badges" />

The `StoreLocator` component coordinates a "find a store near you" experience around a [`MapboxMap`](/components/MapboxMap/). It is a thin, composable coordinator: it owns no map rendering of its own and instead wires together a `MapboxMap`, an optional [`MapboxCluster`](/components/MapboxMap/js-api#cluster) (the map data source), an optional [`MapboxGeocoder`](/components/MapboxMap/js-api#mapboxgeocoder) (address search) and a sidebar list of `StoreLocatorItem`s — all authored declaratively from your HTML with [js-toolkit](https://js-toolkit.studiometa.dev/), no framework runtime.

It is part of the [`@studiometa/ui-mapbox`](https://www.npmjs.com/package/@studiometa/ui-mapbox) package, alongside the rest of the [`MapboxMap` family](/components/MapboxMap/).

## The three-state model

Each store has three independent states, each with its own source of truth. Keeping them separate is what makes the coordinator predictable — panning the map never rebuilds the map data, and updating the item set never fights with the current viewport.

| State          | Source of truth                            | Drives                                          | Recomputed on        |
| -------------- | ------------------------------------------ | ----------------------------------------------- | -------------------- |
| **Registered** | the item exists in the DOM                 | the **map data** (markers/clusters)             | item-set change only |
| **In bounds**  | the item's `lngLat` is inside the viewport | **list visibility + distance sort** only        | every map `moveend`  |
| **Selected**   | the chosen item                            | fly-to, `active` styling and the `select` event | selection            |

Because the map data is derived only from the registered items, swapping the list (for instance through a [`Fetch`](/components/Fetch/)) updates both the list **and** the map at once. See the [faceted example](./examples#faceted-list).

## Composability

The `StoreLocator` emits events and reflects state as data-attributes; it makes no decision about how a selected store is presented. The [examples](./examples.md) use a [`Dialog`](/components/Dialog/) drawer as the detail panel, but a [`MapboxPopup`](/components/MapboxMap/js-api#mapboxpopup) or a plain static `aside` would work just as well — wire whichever you like to the [`select`](./js-api#select) event.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Installation

The component ships with the `@studiometa/ui-mapbox` package. Install it alongside its `mapbox-gl` peer dependency, exactly like the rest of the [`MapboxMap` family](/components/MapboxMap/#installation).

```bash
npm install @studiometa/ui-mapbox mapbox-gl
```

The [Mapbox GL stylesheet](/components/MapboxMap/#installation) and a [Mapbox access token](https://docs.mapbox.com/help/getting-started/access-tokens/) are required, just like for a plain map.

## Usage

Register only the `StoreLocator` with [`registerComponent`](https://js-toolkit.studiometa.dev/api/helpers/registerComponent.html): it declares `MapboxMap` and `StoreLocatorItem` internally, and the `MapboxCluster` living inside the map is resolved automatically once the map has loaded.

Author a root `StoreLocator` element wrapping a sidebar `list` ref of `StoreLocatorItem`s and a `MapboxMap`. The `MapboxCluster` carries **no** authored data — the coordinator derives a GeoJSON `FeatureCollection` from the items and pushes it to the cluster once the map is ready.

::: code-group

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { StoreLocator } from '@studiometa/ui-mapbox';

registerComponent(StoreLocator);
```

```html [index.html]
<div data-component="StoreLocator" class="grid md:grid-cols-[20rem_1fr] h-[500px]">
  <ul data-ref="list" class="overflow-y-auto">
    <li
      data-component="StoreLocatorItem"
      data-option-id="louvre"
      data-option-lng-lat="[2.3364, 48.8592]">
      <button type="button" data-ref="select">Paris 1er — Louvre</button>
    </li>
    <!-- more items… -->
  </ul>

  <div
    data-component="MapboxMap"
    data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
    data-option-zoom="11"
    data-option-center="[2.35, 48.86]"
    data-option-map-options='{"style":"mapbox://styles/mapbox/streets-v12"}'>
    <div data-ref="container" class="h-full w-full"></div>

    <!-- No authored data: the StoreLocator drives this source. -->
    <div hidden data-component="MapboxCluster"></div>
  </div>
</div>
```

```css [app.css]
@import 'mapbox-gl/dist/mapbox-gl.css';

/* List-visibility contract: hide items outside the current viewport. */
[data-component='StoreLocatorItem']:not([data-in-bounds]) {
  display: none;
}

/* Selected-item contract. */
[data-component='StoreLocatorItem'][data-active] {
  /* highlight the active store */
}
```

:::

The styling contract is entirely data-attribute driven: `data-in-bounds` toggles list visibility, `data-active` (plus `aria-current="true"`) marks the selected item. See the [styling contract](./js-api#styling-contract) for details.

## Lazy loading

Registering `StoreLocator` pulls in `MapboxMap` and its heavy `mapbox-gl` dependency (~230&nbsp;kB gzipped). Register it lazily so it is code-split into its own chunk and only loaded when the locator is on the page, using the same [`importWhen*` helpers](https://js-toolkit.studiometa.dev/api/helpers/importWhenVisible.html) as the rest of the [`MapboxMap` family](/components/MapboxMap/#lazy-loading):

```js
import { registerComponent, importWhenVisible } from '@studiometa/js-toolkit';

registerComponent(
  importWhenVisible(
    () => import('@studiometa/ui-mapbox').then(({ StoreLocator }) => StoreLocator),
    'StoreLocator',
  ),
);
```

`importWhenIdle`, `importOnInteraction` and `importOnMediaQuery` are available too — see the [MapboxMap lazy-loading note](/components/MapboxMap/#lazy-loading).

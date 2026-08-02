---
badges: [JS]
---

# StoreLocator <Badges :texts="$frontmatter.badges" />

The `StoreLocator` component adds a "find a store near you" experience on top of a [`MapboxMap`](/components/MapboxMap/). It is a thin **orchestrator**: it owns no map rendering and no item registry of its own. It wraps a `MapboxMap` containing a [`MapboxCluster`](/components/MapboxMap/js-api#cluster) — the declarative clustered map **and** list source driver, whose [`MapboxClusterItem`](/components/MapboxMap/js-api#mapboxclusteritem)s are the sidebar entries — plus an optional [`MapboxGeocoder`](/components/MapboxMap/js-api#mapboxgeocoder) (address search), and layers the search UX on top: selection, viewport filtering and address search. Everything is authored declaratively from your HTML with [js-toolkit](https://js-toolkit.studiometa.dev/), no framework runtime.

It is part of the [`@studiometa/ui-mapbox`](https://www.npmjs.com/package/@studiometa/ui-mapbox) package, alongside the rest of the [`MapboxMap` family](/components/MapboxMap/).

## Cluster vs. orchestrator

The responsibilities are split in two:

- The **`MapboxCluster`** is a pure source driver. Its `MapboxClusterItem`s self-register, and it derives a clustered GeoJSON source from that registry (the map data), handles the click-to-zoom on clusters, and reports a click on an unclustered point through an `item-click` event. Used on its own it renders a working clustered map + list, but it never selects, flies, filters by viewport or opens popups.
- The **`StoreLocator`** wraps such a cluster and adds exactly those search-UX concerns: it selects items (fly-to, `active` styling, popup), filters and sorts the list on every map move, wires the geocoder, and re-frames the map on item-set changes.

## The three-state model

Each store has three independent states, each with its own source of truth. Keeping them separate is what makes the orchestrator predictable — panning the map never rebuilds the map data, and updating the item set never fights with the current viewport.

| State          | Source of truth                            | Owner           | Drives                                          | Recomputed on        |
| -------------- | ------------------------------------------ | --------------- | ----------------------------------------------- | -------------------- |
| **Registered** | the item exists in the DOM                 | `MapboxCluster` | the **map data** (markers/clusters)             | item-set change only |
| **In bounds**  | the item's `lngLat` is inside the viewport | `StoreLocator`  | **list visibility + distance sort** only        | every map `moveend`  |
| **Selected**   | the chosen item                            | `StoreLocator`  | fly-to, popup, `active` styling, `select` event | selection            |

Because the map data is derived only from the cluster's registered items, swapping the list (for instance through a [`Fetch`](/components/Fetch/)) updates both the list **and** the map at once: the cluster re-derives its source and emits an `update`, and the orchestrator re-fits and re-filters in response. See the [faceted example](./examples#faceted-list).

## Composability

The `StoreLocator` emits events and reflects state as data-attributes on each `MapboxClusterItem`; it makes no decision about how a selected store is presented beyond the built-in popup. The [examples](./examples.md) use a [`Dialog`](/components/Dialog/) drawer as the detail panel, but a static `aside` would work just as well — wire whichever you like to the [`select`](./js-api#select) event.

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

The `StoreLocator` declares no child components — `StoreLocator`, `MapboxMap`, `MapboxCluster`, `MapboxClusterItem` and the optional `MapboxGeocoder` are each registered independently and mount on their own; the orchestrator then discovers them in its subtree once mounted. Registration order does not matter, because a child registered before its `MapboxMap` still wires up once the map connects. As with a plain map, the recommended default is to lazy-register each component with js-toolkit's [`importWhen*` helpers](https://js-toolkit.studiometa.dev/api/helpers/importWhenVisible.html) and the per-component subpaths (each subpath's default export is the component class), keeping the heavy `mapbox-gl` dependency out of your main bundle until the store locator is on the page.

Because a `MapboxClusterItem` resolves its cluster and the cluster resolves its map through the closest matching ancestor, the DOM nests them: the `MapboxCluster` wraps the sidebar list of `MapboxClusterItem`s **inside** the `MapboxMap`, next to the map container. The `StoreLocator` wraps the map. The cluster carries **no** authored data — it derives its source from the registered items.

::: code-group

```js [app.js]
import { registerComponent, importWhenVisible } from '@studiometa/js-toolkit';

// Register only the components your page uses; order doesn't matter.
for (const name of ['StoreLocator', 'MapboxMap', 'MapboxCluster', 'MapboxClusterItem']) {
  registerComponent(importWhenVisible(() => import(`@studiometa/ui-mapbox/${name}`), name));
}
```

```html [index.html]
<div data-component="StoreLocator" class="h-[500px]">
  <div
    data-component="MapboxMap"
    data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
    data-option-zoom="11"
    data-option-center="[2.35, 48.86]"
    data-option-map-options='{"style":"mapbox://styles/mapbox/streets-v12"}'
    class="grid h-full grid-cols-[20rem_1fr]">
    <!-- The cluster wraps the list; `contents` lets the items flow into the map grid. -->
    <div data-component="MapboxCluster" class="contents">
      <ul class="overflow-y-auto">
        <li
          data-component="MapboxClusterItem"
          data-option-id="louvre"
          data-option-lng-lat="[2.3364, 48.8592]">
          <button type="button">Paris 1er — Louvre</button>
        </li>
        <!-- more items… -->
      </ul>
    </div>

    <div data-ref="container" class="h-full w-full"></div>
  </div>
</div>
```

```css [app.css]
@import 'mapbox-gl/dist/mapbox-gl.css';

/* List-visibility contract: hide items outside the current viewport. */
[data-component='MapboxClusterItem']:not([data-in-bounds]) {
  display: none;
}

/* Selected-item contract. */
[data-component='MapboxClusterItem'][data-active] {
  /* highlight the active store */
}
```

:::

Clicking anywhere in a `MapboxClusterItem` selects it (the orchestrator delegates the click on its root), and clicking an unclustered pin on the map selects the matching item too. The styling contract is entirely data-attribute driven: `data-in-bounds` toggles list visibility, `data-active` (plus `aria-current="true"`) marks the selected item. See the [styling contract](./js-api#styling-contract) for details.

## Lazy loading

Registering the family pulls in `MapboxMap` and its heavy `mapbox-gl` dependency (~230&nbsp;kB gzipped). Register it lazily so it is code-split into its own chunk and only loaded when the locator is on the page, using the same [`importWhen*` helpers](https://js-toolkit.studiometa.dev/api/helpers/importWhenVisible.html) as the rest of the [`MapboxMap` family](/components/MapboxMap/#lazy-loading):

```js
import { registerComponent, importWhenVisible } from '@studiometa/js-toolkit';

registerComponent(
  importWhenVisible(() => import('@studiometa/ui-mapbox/StoreLocator'), 'StoreLocator'),
);
```

When lazy-loading only the `StoreLocator` subpath, remember to register the `MapboxMap`, `MapboxCluster` and `MapboxClusterItem` it orchestrates too (each is available at its own subpath, whose default export is the component class, so a dynamic import needs no destructuring).

`importWhenIdle`, `importOnInteraction` and `importOnMediaQuery` are available too — see the [MapboxMap lazy-loading note](/components/MapboxMap/#lazy-loading).

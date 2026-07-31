---
title: StoreLocator JS API
outline: deep
---

# JS API

The store locator is made of two components:

- `StoreLocator` — the coordinator, wrapping a [`MapboxMap`](/components/MapboxMap/js-api#map) and the sidebar list.
- `StoreLocatorItem` — a single store entry living in the sidebar.

You only ever register `StoreLocator` with [`registerComponent`](https://js-toolkit.studiometa.dev/api/helpers/registerComponent.html): it declares `MapboxMap` and `StoreLocatorItem` internally, and the optional `MapboxCluster`/`MapboxGeocoder` inside the map are discovered automatically once the map has loaded.

The coordinator reads its options **once, at mount time** — they are **not** reactive, like the rest of the [`MapboxMap` family](/components/MapboxMap/js-api#reactivity-and-updates). To change the store set afterwards, change the DOM of the list (add/remove `StoreLocatorItem` elements) and the coordinator re-derives the map data automatically.

## StoreLocator

The coordinator. It owns no map rendering: it registers the `StoreLocatorItem`s, derives a GeoJSON `FeatureCollection` from them, pushes it to the child `MapboxCluster` once the map is loaded, filters and sorts the list on every map move, and handles selection.

### Options

| Option            | Type      | Default | Description                                                                                             |
| ----------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `item-zoom-level` | `Number`  | `14`    | The zoom level the map flies to when a store is selected.                                               |
| `no-sort`         | `Boolean` | `false` | Disable the distance sort. By default the in-view items are reordered nearest-first on every map move.  |
| `fit-on-update`   | `Boolean` | `false` | Fit the map bounds to the whole item set whenever it changes (on mount and on any add/remove of items). |

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="StoreLocator"
  data-option-item-zoom-level="16"
  data-option-fit-on-update>
  ...
</div>
```
<!-- prettier-ignore-end -->

### Refs

| Ref    | Type          | Description                                                                                               |
| ------ | ------------- | --------------------------------------------------------------------------------------------------------- |
| `list` | `HTMLElement` | The sidebar container holding the `StoreLocatorItem`s. The coordinator reorders its children by distance. |

### Getters

| Getter              | Type                          | Description                                                                     |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| `isLoaded`          | `boolean`                     | Whether the underlying map has finished loading. (a public field, not a getter) |
| `mapboxMap`         | `MapboxMap`                   | The closest child `MapboxMap` component.                                        |
| `map`               | `mapboxgl.Map`                | The underlying Mapbox `Map` instance. Only valid once the map has loaded.       |
| `cluster`           | `MapboxCluster \| undefined`  | The optional `MapboxCluster` child, mounted by the `MapboxMap`.                 |
| `geocoder`          | `MapboxGeocoder \| undefined` | The optional `MapboxGeocoder` child, mounted by the `MapboxMap`.                |
| `featureCollection` | `FeatureCollection`           | The GeoJSON derived from the registered items — the data pushed to the source.  |

### Methods

#### `selectItem(item)`

- Arguments: `StoreLocatorItem`

Select a store: deactivate the previous one, fly the map to the item at `item-zoom-level`, mark it active (`data-active` + `aria-current="true"`) and emit [`select`](#select). Called by an item's own click, by a cluster feature-click, and available for you to call directly.

#### `deselect()`

Clear the current selection, remove the active state and emit [`deselect`](#deselect).

#### `registerItem(item)` / `unregisterItem(item)`

- Arguments: `StoreLocatorItem`

Add/remove an item from the coordinator's registry and schedule a coalesced map-data sync. These are called automatically by the `StoreLocatorItem`s on mount/destroy — you rarely call them yourself, but they are the hook a `Fetch` list swap relies on.

### Events

#### `select`

Emitted when a store is selected, with the selected `StoreLocatorItem` instance. Wire your detail panel here.

```js
onStoreLocatorSelect({ args: [item] }) {
  // item.id, item.lngLat, item.$el …
}
```

#### `deselect`

Emitted when the selection is cleared through [`deselect()`](#deselect-1).

#### `filter`

Emitted whenever the in-view list is recomputed (on every map `moveend` and after an item-set change), with the array of in-view items in display order (nearest-first unless `no-sort` is set).

```js
onStoreLocatorFilter({ args: [items] }) {
  // e.g. update a "N stores in view" counter
}
```

## StoreLocatorItem

A single store entry. Unlike the other `@studiometa/ui-mapbox` components, it does **not** live inside the map: its DOM is in the sidebar list, and its context is the parent `StoreLocator` (resolved via `$closest('StoreLocator')`). It is headless — the coordinator only reflects state as data-attributes so you can style it with plain CSS.

### Options

| Option    | Type     | Default  | Description                                                              |
| --------- | -------- | -------- | ------------------------------------------------------------------------ |
| `id`      | `String` | —        | Stable identifier, used to match a clicked map feature back to the item. |
| `lng-lat` | `Array`  | `[0, 0]` | The store coordinates as `[longitude, latitude]`.                        |

### Refs

| Ref      | Type          | Description                                                                                 |
| -------- | ------------- | ------------------------------------------------------------------------------------------- |
| `select` | `HTMLElement` | The element (typically a `<button>`) whose click selects the store through the coordinator. |

### Getters

| Getter         | Type               | Description                                    |
| -------------- | ------------------ | ---------------------------------------------- |
| `id`           | `string`           | The item's stable identifier.                  |
| `lngLat`       | `[number, number]` | The item's `[lng, lat]` coordinates.           |
| `storeLocator` | `StoreLocator`     | The closest parent `StoreLocator` coordinator. |

### Methods

The state setters below are called by the coordinator; you generally read the resulting data-attributes from CSS rather than calling them yourself.

#### `setInBounds(value)`

- Arguments: `boolean`

Toggle the `data-in-bounds` attribute — the [list-visibility](#styling-contract) signal.

#### `setActive(value)`

- Arguments: `boolean`

Toggle the `data-active` attribute and the `aria-current="true"` state — the [selected](#styling-contract) signal.

## Styling contract {#styling-contract}

The coordinator never styles anything: it only reflects state as attributes on each `StoreLocatorItem`. You own the CSS.

| Attribute                      | Meaning                                                        | Typical CSS                                                                   |
| ------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `data-in-bounds`               | The item is inside the current map viewport (list visibility). | `[data-component='StoreLocatorItem']:not([data-in-bounds]) { display: none }` |
| `data-active` + `aria-current` | The item is the selected one.                                  | `[data-component='StoreLocatorItem'][data-active] { /* highlight */ }`        |

```css
/* Hide out-of-view stores from the list. */
[data-component='StoreLocatorItem']:not([data-in-bounds]) {
  display: none;
}

/* Highlight the selected store. */
[data-component='StoreLocatorItem'][data-active] {
  background-color: #ecfdf5;
}
```

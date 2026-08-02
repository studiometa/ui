---
title: StoreLocator JS API
outline: deep
---

# JS API

The store locator is an **orchestrator** built on the [`MapboxMap` family](/components/MapboxMap/js-api):

- `StoreLocator` — the coordinator, wrapping a [`MapboxMap`](/components/MapboxMap/js-api#map) that contains a [`MapboxCluster`](/components/MapboxMap/js-api#cluster).
- [`MapboxClusterItem`](/components/MapboxMap/js-api#mapboxclusteritem) — a single store entry; it registers with the cluster (the owner of the item registry), and the orchestrator reads and drives it. There is **no** dedicated store-item class.

The `StoreLocator` declares no child components, so nothing is ever double-mounted. Register `StoreLocator`, `MapboxMap`, `MapboxCluster` and `MapboxClusterItem` each independently with [`registerComponent`](https://js-toolkit.studiometa.dev/api/helpers/registerComponent.html) — ideally behind a lazy [`importWhen*` helper](https://js-toolkit.studiometa.dev/api/helpers/importWhenVisible.html) (see [Lazy loading](/components/MapboxMap/#lazy-loading)); registration order does not matter because a child registered before its `MapboxMap` still wires up once the map connects. The orchestrator discovers them in its subtree with `$query` once mounted, retrying a few ticks for asynchronously-mounted children (the geocoder lazy-imports its module).

The orchestrator reads its options **once, at mount time** — they are **not** reactive, like the rest of the [`MapboxMap` family](/components/MapboxMap/js-api#reactivity-and-updates). To change the store set afterwards, change the DOM of the list (add/remove `MapboxClusterItem` elements): the cluster re-derives the map data and emits an `update`, and the orchestrator re-fits and re-filters automatically.

## StoreLocator

The coordinator. It owns no map rendering and no registry: the `MapboxCluster` derives the GeoJSON source from its registered `MapboxClusterItem`s, and the orchestrator reads that item set to filter and sort the list on every map move, wire the geocoder, re-frame the map on item-set changes, and handle selection.

### Options

| Option            | Type      | Default | Description                                                                                            |
| ----------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `item-zoom-level` | `Number`  | `14`    | The zoom level the map flies to when a store is selected.                                              |
| `no-sort`         | `Boolean` | `false` | Disable the distance sort. By default the in-view items are reordered nearest-first on every map move. |
| `fit-on-update`   | `Boolean` | `false` | Fit the map bounds to the whole item set whenever it changes (on load and on any add/remove of items). |
| `popup-options`   | `Object`  | `{}`    | Options forwarded to the `mapboxgl.Popup` opened on selection.                                         |

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

::: warning Boolean options: presence, not value
`no-sort` and `fit-on-update` are `Boolean` options — js-toolkit reads them by **attribute presence**, never by value. Enable one with the bare attribute (`data-option-fit-on-update`) and disable it by **omitting** the attribute; `data-option-fit-on-update="false"` still reads as `true`. Sorting is on by default, so add `data-option-no-sort` to turn it off. See the [Boolean options note](/components/MapboxMap/js-api#reactivity-and-updates).
:::

### Getters

| Getter      | Type                          | Description                                                                     |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------- |
| `isLoaded`  | `boolean`                     | Whether the underlying map has finished loading. (a public field, not a getter) |
| `mapboxMap` | `MapboxMap`                   | The child `MapboxMap` component.                                                |
| `map`       | `mapboxgl.Map`                | The underlying Mapbox `Map` instance. Only valid once the map has loaded.       |
| `cluster`   | `MapboxCluster \| undefined`  | The child `MapboxCluster` (the item registry + map data source).                |
| `geocoder`  | `MapboxGeocoder \| undefined` | The optional child `MapboxGeocoder`.                                            |
| `items`     | `MapboxClusterItem[]`         | The registered items, read from the cluster (their single source of truth).     |

### Methods

#### `selectItem(item)`

- Arguments: `MapboxClusterItem`

Select a store: deactivate the previous one, fly the map to the item at `item-zoom-level`, open a popup from the item's [`popupContent`](/components/MapboxMap/js-api#mapboxclusteritem), mark it active (`data-active` + `aria-current="true"`) and emit [`select`](#select). Called automatically on a sidebar click (delegated on the root), on the cluster's `item-click` (an unclustered pin), and available for you to call directly.

#### `deselect()`

Clear the current selection, close the popup, remove the active state and emit [`deselect`](#deselect).

### Events

#### `select`

Emitted when a store is selected, with the selected `MapboxClusterItem` instance. Wire your detail panel here.

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

## Store entries: `MapboxClusterItem`

A single store entry is a [`MapboxClusterItem`](/components/MapboxMap/js-api#mapboxclusteritem). It registers with the closest `MapboxCluster`, exposes `id`, `lngLat`, `properties` and `popupContent`, and reflects its state through `setInBounds`/`setActive` (driven by the orchestrator). Refer to its [reference](/components/MapboxMap/js-api#mapboxclusteritem) for the full API. The orchestrator itself never reintroduces a separate item class — it drives the cluster's items.

## Styling contract {#styling-contract}

The orchestrator never styles anything: it only reflects state as attributes on each `MapboxClusterItem`. You own the CSS.

| Attribute                      | Meaning                                                        | Typical CSS                                                                    |
| ------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `data-in-bounds`               | The item is inside the current map viewport (list visibility). | `[data-component='MapboxClusterItem']:not([data-in-bounds]) { display: none }` |
| `data-active` + `aria-current` | The item is the selected one.                                  | `[data-component='MapboxClusterItem'][data-active] { /* highlight */ }`        |

```css
/* Hide out-of-view stores from the list. */
[data-component='MapboxClusterItem']:not([data-in-bounds]) {
  display: none;
}

/* Highlight the selected store. */
[data-component='MapboxClusterItem'][data-active] {
  background-color: #ecfdf5;
}
```

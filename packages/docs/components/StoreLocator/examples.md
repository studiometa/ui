---
title: StoreLocator examples
---

# Examples

Both examples register a single root component that declares the `StoreLocator` — its `MapboxMap` and `StoreLocatorItem` children are resolved automatically, and the `MapboxCluster` inside the map is fed by the coordinator once the map has loaded. Each example loads the [Mapbox GL stylesheet](/components/MapboxMap/#installation) from a CDN and picks a Mapbox style through the `map-options` option. Replace the access token with your own [access token](https://docs.mapbox.com/help/getting-started/access-tokens/); the token used here is a public, restricted demo token.

## Basic store locator

A `StoreLocator` wrapping a sidebar list of Paris stores and a clustered map. Note that the `MapboxCluster` has **no** authored data: the coordinator derives a GeoJSON `FeatureCollection` from the list items and pushes it to the cluster after the map loads.

Try it out:

- **Pan or zoom the map** — the sidebar filters to the in-view stores and reorders them nearest-first.
- **Click a store in the list** — the map flies there, the item is marked active and the detail drawer opens.
- **Click a cluster** — the map zooms in and splits it; click an individual pin to select its store.

The detail panel is the integrator's choice. Here it is a [`Dialog`](/components/Dialog/) drawer, opened from the [`select`](./js-api#select) event through a small root component's `onStoreLocatorSelect` handler, which copies the selected item's `<template>` detail into the drawer. A [`MapboxPopup`](/components/MapboxMap/js-api#mapboxpopup) or a static `aside` bound to the same event would work too.

<PreviewPlayground
  :html="() => import('./stories/basic/app.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  :css="() => import('./stories/basic/app.css?raw')"
  />

## Faceted list {#faceted-list}

Because the map data is [derived from the registered items](./#the-three-state-model), replacing the list updates both the list **and** the map. This example swaps the `data-ref="list"` markup when a facet is picked: js-toolkit mounts and terminates the `StoreLocatorItem`s accordingly, the coordinator re-derives the map data from the new item set, and the clusters/markers follow. With `fit-on-update` set, the map also re-frames to the new subset.

<PreviewPlayground
  :html="() => import('./stories/faceted/app.twig')"
  :script="() => import('./stories/faceted/app.js?raw')"
  :css="() => import('./stories/faceted/app.css?raw')"
  />

### Doing it with `Fetch`

The example above swaps the list client-side so it runs on a static page. In a real integration you would instead [`Fetch`](/components/Fetch/) the new list fragment from a server endpoint and let it replace the `data-ref="list"` container — the coordinator reacts to the mounted/terminated items exactly the same way, so nothing else changes. The debounced item-set sync coalesces a whole `Fetch` swap into a single map-data update.

```html
<form data-component="Fetch" action="/stores" method="GET" data-option-selector="[data-ref='list']">
  <button type="submit" name="bank" value="left">Left bank</button>
  <button type="submit" name="bank" value="right">Right bank</button>
</form>

<div data-component="StoreLocator">
  <ul id="store-list" data-ref="list">
    <!-- The server responds with a fresh <ul id="store-list"> of items. -->
  </ul>
  <div data-component="MapboxMap"><!-- … --></div>
</div>
```

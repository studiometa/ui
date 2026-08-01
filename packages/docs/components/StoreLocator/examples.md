---
title: StoreLocator examples
---

# Examples

Both examples register the whole Mapbox family with `registerMapboxComponents` and add a small root component for the detail panel. The `StoreLocator` orchestrates a `MapboxMap` containing a `MapboxCluster` whose `MapboxClusterItem`s are the sidebar entries. Each example loads the [Mapbox GL stylesheet](/components/MapboxMap/#installation) from a CDN and picks a Mapbox style through the `map-options` option. Replace the access token with your own [access token](https://docs.mapbox.com/help/getting-started/access-tokens/); the token used here is a public, restricted demo token.

## Basic store locator

A `StoreLocator` wrapping a clustered map whose `MapboxCluster` holds a sidebar list of Paris `MapboxClusterItem`s. The cluster has **no** authored data: it derives a GeoJSON `FeatureCollection` from its registered items, and the orchestrator adds selection, viewport filtering and the detail drawer on top.

Try it out:

- **Pan or zoom the map** — the sidebar filters to the in-view stores and reorders them nearest-first.
- **Click a store in the list** — the map flies there, the item is marked active, a popup opens and the detail drawer opens.
- **Click a cluster** — the map zooms in and splits it; click an individual pin to select its store.

The detail panel is the integrator's choice. Here it is a [`Dialog`](/components/Dialog/) drawer, opened from the [`select`](./js-api#select) event through a small root component's `onStoreLocatorSelect` handler, which copies the selected item's `<template>` detail into the drawer. A static `aside` bound to the same event would work too.

<PreviewPlayground
  :html="() => import('./stories/basic/app.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  :css="() => import('./stories/basic/app.css?raw')"
  />

## Faceted list {#faceted-list}

Because the map data is [derived from the registered items](./#the-three-state-model), replacing the list updates both the list **and** the map. This example swaps the list markup when a facet is picked: js-toolkit mounts and terminates the `MapboxClusterItem`s accordingly, the cluster re-derives the map data from the new item set and emits an `update`, and the orchestrator re-fits and re-filters. With `fit-on-update` set, the map also re-frames to the new subset.

<PreviewPlayground
  :html="() => import('./stories/faceted/app.twig')"
  :script="() => import('./stories/faceted/app.js?raw')"
  :css="() => import('./stories/faceted/app.css?raw')"
  />

### Doing it with `Fetch`

The example above swaps the list client-side so it runs on a static page. In a real integration you would instead [`Fetch`](/components/Fetch/) the new list fragment from a server endpoint and let it replace the list container — the cluster reacts to the mounted/terminated `MapboxClusterItem`s exactly the same way, so nothing else changes. The cluster's debounced rebuild coalesces a whole `Fetch` swap into a single map-data update and a single `update` the orchestrator reacts to.

```html
<form data-component="Fetch" action="/stores" method="GET" data-option-selector="#store-list">
  <button type="submit" name="bank" value="left">Left bank</button>
  <button type="submit" name="bank" value="right">Right bank</button>
</form>

<div data-component="StoreLocator">
  <div data-component="MapboxMap">
    <div data-component="MapboxCluster">
      <ul id="store-list">
        <!-- The server responds with a fresh <ul id="store-list"> of MapboxClusterItems. -->
      </ul>
    </div>
    <div data-ref="container"><!-- … --></div>
  </div>
</div>
```

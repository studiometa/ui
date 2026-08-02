---
title: MapboxMap examples
---

# Examples

Every component in the family is self-registering, so each example registers exactly the components it uses — `MapboxMap` on its own for a bare map, plus the child components it declares (markers, popups, controls, sources, layers, images, clusters). Each child resolves its parent `MapboxMap` on its own once mounted. Each example loads the [Mapbox GL stylesheet](./#installation) from a CDN and picks a Mapbox style through the `map-options` option, which forwards any [`Map` option](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters) to mapbox-gl. Replace the access token with your own [access token](https://docs.mapbox.com/help/getting-started/access-tokens/); the token used here is a public, restricted demo token.

Child components that should not take part in the normal document flow (markers, popups, controls, sources, layers, images, clusters) are wrapped in a `hidden` element: their markup is only used as a declarative definition, the actual rendering happens on the map canvas.

## Basic map

A minimal interactive map with a `container` ref and a size set through CSS.

<PreviewPlayground
  :html="() => import('./stories/simple/app.twig')"
  :script="() => import('./stories/simple/app.js?raw')"
  :css="() => import('./stories/simple/app.css?raw')"
  />

## Markers and popups

Add a `MapboxMarker` for each point. A `MapboxPopup` nested inside a marker is attached to it and opens on click; a `MapboxPopup` placed directly on the map (with its own `lng-lat`) is displayed as a standalone popup. The popup content is taken from the element's inner HTML.

<PreviewPlayground
  :html="() => import('./stories/markers/app.twig')"
  :script="() => import('./stories/markers/app.js?raw')"
  :css="() => import('./stories/markers/app.css?raw')"
  />

## Navigation, geolocate and fullscreen controls

Controls are added by declaring the matching child component. Each control accepts a `position` option (`top-left`, `top-right`, `bottom-left`, `bottom-right`). This example also demonstrates the `map-options` option beyond the style: it sets a `pitch` and `bearing` for a tilted, rotated camera — click the navigation control's compass to reset the bearing.

<PreviewPlayground
  :html="() => import('./stories/controls/app.twig')"
  :script="() => import('./stories/controls/app.js?raw')"
  :css="() => import('./stories/controls/app.css?raw')"
  />

## Geocoder

The `MapboxGeocoder` component adds an address search field powered by [`@mapbox/mapbox-gl-geocoder`](https://github.com/mapbox/mapbox-gl-geocoder). The `add-to-map` option controls where the input is rendered. The search itself calls the Mapbox Geocoding API, so it needs an access token authorized for geocoding; the examples below are shown as static markup.

With `add-to-map`, the geocoder is added to the map as a Mapbox control, overlaid on the map canvas:

```html
<div
  data-component="MapboxMap"
  data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
  data-option-zoom="5"
  data-option-center="[2.35, 48.86]"
  class="h-96 w-full">
  <div data-ref="container" class="h-full w-full"></div>

  <div
    hidden
    data-component="MapboxGeocoder"
    data-option-add-to-map
    data-option-options='{"placeholder": "Search a place…"}'></div>
</div>
```

Without `add-to-map`, the geocoder is rendered inside the component's own element, so you can place the search field anywhere in your layout, outside the map canvas:

```html
<div
  data-component="MapboxMap"
  data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
  data-option-zoom="5"
  data-option-center="[2.35, 48.86]"
  class="h-96 w-full">
  <!-- The search field renders here, above the map -->
  <div
    data-component="MapboxGeocoder"
    data-option-options='{"placeholder": "Search a place…"}'></div>
  <div data-ref="container" class="h-full w-full"></div>
</div>
```

The access token is inherited from the parent `MapboxMap` when it is not set in the geocoder `options`.

## Source and layer

Add a [source](https://docs.mapbox.com/style-spec/reference/sources/) with `MapboxSource`, then render it with one or more `MapboxLayer` elements referencing the source `id`. The `layer` option accepts a full [layer specification](https://docs.mapbox.com/style-spec/reference/layers/).

<PreviewPlayground
  :html="() => import('./stories/source-layer/app.twig')"
  :script="() => import('./stories/source-layer/app.js?raw')"
  :css="() => import('./stories/source-layer/app.css?raw')"
  />

## Images

Register images against the map sprite so they can be referenced from a symbol layer's `icon-image`. Use `MapboxImage` for a single image, or `MapboxImages` to load several at once through its `sources` option. Both emit a `ready` event once the image(s) are loaded. The symbol layer below pairs each `icon-image` with a `text-field` label.

<PreviewPlayground
  :html="() => import('./stories/images/app.twig')"
  :script="() => import('./stories/images/app.js?raw')"
  :css="() => import('./stories/images/app.css?raw')"
  />

## Cluster

The `MapboxCluster` component is a clustered GeoJSON **source driver**: it derives its source from the `MapboxClusterItem`s in its subtree, wiring the cluster circles, the cluster count labels and the unclustered points, together with the click-to-zoom interaction. Each item is at once a list entry and a map feature — the same markup drives both. The example below declares a hidden list of items; click a cluster to zoom in and split it.

<PreviewPlayground
  :html="() => import('./stories/cluster/app.twig')"
  :script="() => import('./stories/cluster/app.js?raw')"
  :css="() => import('./stories/cluster/app.css?raw')"
  />

### Items drive the source {#cluster-items}

The cluster owns no authored data. Each point is a `MapboxClusterItem` that self-registers with the closest `MapboxCluster` ancestor; the cluster derives a clustered GeoJSON `FeatureCollection` from the registry and rebuilds it (debounced) whenever items mount or unmount:

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
    <li
      data-component="MapboxClusterItem"
      data-option-id="c"
      data-option-lng-lat="[-0.13, 51.51]"></li>
  </ul>
</div>
```

The cluster reports a click on an unclustered point through its `item-click` event but never selects or flies on its own. To turn this into a full "find a store near you" experience — selection, popups, viewport filtering and address search — wrap the cluster in a [`StoreLocator`](/reference/items/StoreLocator/) orchestrator.

## Listening to map events

The `MapboxMap` component re-emits the Mapbox map events. Listen to them from a parent component by defining `on<ComponentName><EventName>` methods — for example `onMapboxMapClick` or `onMapboxMapMapLoad` for the custom `map-load` event.

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

class App extends Base {
  static config = {
    name: 'App',
    components: { MapboxMap },
  };

  onMapboxMapMapLoad(map) {
    console.log('Map loaded', map);
  }

  onMapboxMapClick(event) {
    console.log('Clicked at', event.lngLat);
  }
}

createApp(App);
```

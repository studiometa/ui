---
title: MapboxMap examples
---

# Examples

Every example below registers a single `MapboxMap` component — the child components (markers, popups, controls, sources, layers, images, clusters) are resolved automatically once the map is loaded. Replace `<YOUR_MAPBOX_ACCESS_TOKEN>` with your own [access token](https://docs.mapbox.com/help/getting-started/access-tokens/) and make sure the [Mapbox GL stylesheet](./#installation) is loaded on the page.

Child components that should not take part in the normal document flow (markers, popups, controls, sources, layers, images, clusters) are wrapped in a `hidden` element: their markup is only used as a declarative definition, the actual rendering happens on the map canvas.

## Basic map

A minimal interactive map with a `container` ref and a size set through CSS.

::: code-group

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

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

```css [app.css]
@import 'mapbox-gl/dist/mapbox-gl.css';
```

:::

## Markers and popups

Add a `MapboxMarker` for each point. A `MapboxPopup` nested inside a marker is attached to it and opens on click; a `MapboxPopup` placed directly on the map (with its own `lng-lat`) is displayed as a standalone popup. The popup content is taken from the element's inner HTML.

::: code-group

```html [index.html]
<div
  data-component="MapboxMap"
  data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
  data-option-zoom="12"
  data-option-center="[2.35, 48.86]"
  class="h-96 w-full">
  <div data-ref="container" class="h-full w-full"></div>

  <!-- Marker with an attached popup -->
  <div hidden data-component="MapboxMarker" data-option-lng-lat="[2.35, 48.86]">
    <div data-component="MapboxPopup">
      <h3>Paris</h3>
      <p>Capital of France</p>
    </div>
  </div>

  <!-- Standalone popup, displayed directly on the map -->
  <div hidden data-component="MapboxPopup" data-option-lng-lat="[2.29, 48.86]">
    <p>Near the Eiffel Tower</p>
  </div>
</div>
```

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

:::

## Navigation, geolocate and fullscreen controls

Controls are added by declaring the matching child component. Each control accepts a `position` option (`top-left`, `top-right`, `bottom-left`, `bottom-right`).

::: code-group

```html [index.html]
<div
  data-component="MapboxMap"
  data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
  data-option-zoom="10"
  data-option-center="[2.35, 48.86]"
  class="h-96 w-full">
  <div data-ref="container" class="h-full w-full"></div>

  <div
    hidden
    data-component="MapboxNavigationControl"
    data-option-position="top-right"
    data-option-show-compass
    data-option-show-zoom></div>

  <div
    hidden
    data-component="MapboxGeolocateControl"
    data-option-position="top-right"
    data-option-track-user-location></div>

  <div hidden data-component="MapboxFullscreenControl" data-option-position="top-right"></div>
</div>
```

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

:::

## Geocoder

The `MapboxGeocoder` component adds an address search field powered by [`@mapbox/mapbox-gl-geocoder`](https://github.com/mapbox/mapbox-gl-geocoder). The `add-to-map` option controls where the input is rendered.

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

::: code-group

```html [index.html]
<div
  data-component="MapboxMap"
  data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
  data-option-zoom="9"
  data-option-center="[-77.04, 38.9]"
  class="h-96 w-full">
  <div data-ref="container" class="h-full w-full"></div>

  <div
    hidden
    data-component="MapboxSource"
    data-option-id="points"
    data-option-source='{
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": [
          { "type": "Feature", "geometry": { "type": "Point", "coordinates": [-77.04, 38.9] } }
        ]
      }
    }'></div>

  <div
    hidden
    data-component="MapboxLayer"
    data-option-id="points-circles"
    data-option-layer='{
      "type": "circle",
      "source": "points",
      "paint": { "circle-radius": 8, "circle-color": "#e11d48" }
    }'></div>
</div>
```

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

:::

## Images

Register images against the map sprite so they can be referenced from a symbol layer's `icon-image`. Use `MapboxImage` for a single image, or `MapboxImages` to load several at once through its `sources` option. Both emit a `ready` event once the image(s) are loaded.

::: code-group

```html [index.html]
<div
  data-component="MapboxMap"
  data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
  data-option-zoom="4"
  data-option-center="[2.35, 48.86]"
  class="h-96 w-full">
  <div data-ref="container" class="h-full w-full"></div>

  <!-- A single image -->
  <div
    hidden
    data-component="MapboxImage"
    data-option-name="cat"
    data-option-url="https://docs.mapbox.com/mapbox-gl-js/assets/cat.png"></div>

  <!-- Several images at once -->
  <div
    hidden
    data-component="MapboxImages"
    data-option-sources='[
      { "name": "cat", "url": "https://docs.mapbox.com/mapbox-gl-js/assets/cat.png" },
      { "name": "dog", "url": "https://docs.mapbox.com/mapbox-gl-js/assets/dog.png" }
    ]'></div>
</div>
```

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

:::

## Cluster

The `MapboxCluster` component displays a clustered GeoJSON source, wiring the cluster circles, the cluster count labels and the unclustered points, together with the click-to-zoom interaction. Its `data` option takes the URL of a `.geojson` file, or you can pass inline GeoJSON through a [`geojson` script ref](#inline-geojson-cluster).

::: code-group

```html [index.html]
<div
  data-component="MapboxMap"
  data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
  data-option-zoom="1"
  data-option-center="[0, 20]"
  class="h-96 w-full">
  <div data-ref="container" class="h-full w-full"></div>

  <div
    hidden
    data-component="MapboxCluster"
    data-option-data="https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson"
    data-option-cluster-radius="60"
    data-option-clusters-paint='{ "circle-color": "#51bbd6", "circle-radius": 20 }'
    data-option-unclustered-point-paint='{ "circle-color": "#11b4da", "circle-radius": 5 }'></div>
</div>
```

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

:::

### Inline GeoJSON cluster {#inline-geojson-cluster}

Instead of a `data` URL, pass the GeoJSON inline through a `<script data-ref="geojson" type="application/json">` child. When the ref is present, its parsed content is used as the clustered source data and the `data` option is ignored.

::: code-group

```html [index.html]
<div
  data-component="MapboxMap"
  data-option-access-token="<YOUR_MAPBOX_ACCESS_TOKEN>"
  data-option-zoom="1"
  data-option-center="[0, 20]"
  class="h-96 w-full">
  <div data-ref="container" class="h-full w-full"></div>

  <div
    hidden
    data-component="MapboxCluster"
    data-option-cluster-radius="60"
    data-option-clusters-paint='{ "circle-color": "#51bbd6", "circle-radius": 20 }'
    data-option-unclustered-point-paint='{ "circle-color": "#11b4da", "circle-radius": 5 }'>
    <script data-ref="geojson" type="application/json">
      {
        "type": "FeatureCollection",
        "features": [
          { "type": "Feature", "geometry": { "type": "Point", "coordinates": [2.35, 48.86] } },
          { "type": "Feature", "geometry": { "type": "Point", "coordinates": [2.29, 48.86] } },
          { "type": "Feature", "geometry": { "type": "Point", "coordinates": [-0.13, 51.51] } }
        ]
      }
    </script>
  </div>
</div>
```

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

:::

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

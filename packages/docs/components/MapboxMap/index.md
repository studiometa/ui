---
badges: [JS]
---

# MapboxMap <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

Use this component to display an interactive map with [mapbox-gl](https://github.com/mapbox/mapbox-gl-js). The `MapboxMap` component serves as the parent for all other Mapbox child components.

::: code-group

```js [app.js]
import { Base, createApp } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      MapboxMap,
    },
  };
}

export default createApp(App);
```

```html [index.html]
<div data-component="MapboxMap"
  data-option-access-token="YOUR_MAPBOX_TOKEN"
  data-option-zoom="10"
  data-option-center="[2.35, 48.86]">
  <div data-ref="container"></div>
</div>
```

```css [app.css]
@import 'mapbox-gl/dist/mapbox-gl.css';
```

:::

<PreviewPlayground
  :html="() => import('./stories/map/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/map/app.js?raw')"
  :script-editor="false"
  :css="() => import('./stories/map/app.css?raw')"
  :css-editor="false"
  />

## Components

The `MapboxMap` component includes several child components that can be nested inside it. They are automatically resolved once the map is loaded.

| Component | Description |
|---|---|
| [`MapboxMarker`](#mapboxmarker) | Add markers to the map |
| [`MapboxPopup`](#mapboxpopup) | Display popups on the map or attached to markers |
| [`MapboxNavigationControl`](#mapboxnavigationcontrol) | Zoom and compass controls |
| [`MapboxGeolocateControl`](#mapboxgeolocatecontrol) | User geolocation button |
| [`MapboxGeocoder`](#mapboxgeocoder) | Address search control |
| [`MapboxLayer`](#mapboxlayer) | Add custom map layers |

### MapboxMarker

Adds a marker to the map. Can contain a `MapboxPopup` child.

```html
<div data-component="MapboxMap" data-option-access-token="TOKEN">
  <div data-ref="container"></div>
  <div data-component="MapboxMarker" data-option-lng-lat="[2.35, 48.86]">
    <div data-component="MapboxPopup">
      <p>Hello from Paris!</p>
    </div>
  </div>
</div>
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `lng-lat` | `Array` | `[0, 0]` | Marker position as `[longitude, latitude]` |
| `marker-options` | `Object` | `{}` | [Mapbox Marker options](https://docs.mapbox.com/mapbox-gl-js/api/markers#marker) |

### MapboxPopup

Displays a popup on the map. Can be used standalone (placed directly on the map at a given position) or inside a `MapboxMarker` (attached to the marker).

The popup content is taken from its children.

```html
<!-- Standalone popup -->
<div data-component="MapboxPopup" data-option-lng-lat="[2.35, 48.86]">
  <p>Popup content</p>
</div>

<!-- Inside a marker (no lng-lat needed) -->
<div data-component="MapboxMarker" data-option-lng-lat="[2.35, 48.86]">
  <div data-component="MapboxPopup">
    <p>Marker popup content</p>
  </div>
</div>
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `lng-lat` | `Array` | `[0, 0]` | Popup position (only used for standalone popups) |
| `popup-options` | `Object` | `{}` | [Mapbox Popup options](https://docs.mapbox.com/mapbox-gl-js/api/markers#popup) |

### MapboxNavigationControl

Adds zoom in/out and compass controls to the map.

```html
<div data-component="MapboxNavigationControl"
  data-option-position="top-right">
</div>
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `position` | `String` | `'top-right'` | Control position (`top-left`, `top-right`, `bottom-left`, `bottom-right`) |
| `show-compass` | `Boolean` | `false` | Show the compass button |
| `show-zoom` | `Boolean` | `false` | Show zoom buttons |
| `visualize-pitch` | `Boolean` | `false` | Show pitch visualization on the compass |

### MapboxGeolocateControl

Adds a button that uses the browser's geolocation API to locate the user on the map.

```html
<div data-component="MapboxGeolocateControl"
  data-option-position="top-right"
  data-option-track-user-location>
</div>
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `position` | `String` | `'top-right'` | Control position |
| `position-options` | `Object` | — | [PositionOptions](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions) |
| `fit-bounds-options` | `Object` | — | [FitBoundsOptions](https://docs.mapbox.com/mapbox-gl-js/api/map/#map#fitbounds) |
| `track-user-location` | `Boolean` | `false` | Continuously track user location |
| `show-accuracy-circle` | `Boolean` | `false` | Show accuracy circle |
| `show-user-location` | `Boolean` | `false` | Show user location dot |
| `show-user-heading` | `Boolean` | `false` | Show user heading indicator |

### MapboxGeocoder

Adds an address search control powered by [mapbox-gl-geocoder](https://github.com/mapbox/mapbox-gl-geocoder).

```html
<div data-component="MapboxGeocoder"
  data-option-add-to-map
  data-option-options='{"placeholder": "Search..."}'>
</div>
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `add-to-map` | `Boolean` | `false` | If `true`, adds the geocoder to the map as a control. Otherwise, renders in the component's root element. |
| `options` | `Object` | `{}` | [Geocoder options](https://github.com/mapbox/mapbox-gl-geocoder/blob/master/API.md#parameters) (access token is inherited from the parent `MapboxMap` if not set) |

### MapboxLayer

Adds a custom layer to the map (e.g., GeoJSON, raster tiles).

```html
<div data-component="MapboxLayer"
  data-option-id="my-layer"
  data-option-layer='{"type": "circle", "source": "my-source"}'>
</div>
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `id` | `String` | — | Unique layer ID |
| `layer` | `Object` | — | [Layer specification](https://docs.mapbox.com/style-spec/reference/layers/) |
| `before-id` | `String` | — | Insert the layer before this layer ID |

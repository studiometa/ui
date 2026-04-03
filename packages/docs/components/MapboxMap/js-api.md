---
title: MapboxMap JS API
---

# JS API

## MapboxMap

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `access-token` | `String` | — | Mapbox GL access token (required) |
| `zoom` | `Number` | — | Initial zoom level |
| `center` | `Array` | `[0, 0]` | Initial center as `[longitude, latitude]` |

### Refs

| Ref | Type | Description |
|---|---|---|
| `container` | `HTMLElement` | The element used as the map container (required) |

### Properties

| Property | Type | Description |
|---|---|---|
| `map` | `mapboxgl.Map` | The underlying Mapbox GL map instance |
| `isLoaded` | `Boolean` | Whether the map has finished loading |

### Events

The `MapboxMap` component emits a `map-load` event when the map is loaded, along with all common Mapbox GL map events:

| Event | Description |
|---|---|
| `map-load` | Emitted when the map finishes loading |
| `click` | A click on the map |
| `dblclick` | A double-click on the map |
| `mouseenter` | Mouse enters the map canvas |
| `mouseleave` | Mouse leaves the map canvas |
| `mousemove` | Mouse moves over the map |
| `movestart` | Map movement starts (pan, zoom, rotate) |
| `move` | Map is moving |
| `moveend` | Map movement ends |
| `zoomstart` | Zoom transition starts |
| `zoom` | Zoom level changes |
| `zoomend` | Zoom transition ends |
| `rotatestart` | Rotation starts |
| `rotate` | Map is rotating |
| `rotateend` | Rotation ends |
| `pitchstart` | Pitch transition starts |
| `pitch` | Pitch changes |
| `pitchend` | Pitch transition ends |
| `dragstart` | Drag starts |
| `drag` | Map is being dragged |
| `dragend` | Drag ends |
| `load` | Map resources loaded |
| `idle` | Map is idle after rendering |
| `render` | A frame is rendered |
| `resize` | Map container is resized |
| `remove` | Map is removed |
| `error` | An error occurs |

Each event callback receives the Mapbox GL event object as its argument.

#### Listening to events

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      MapboxMap,
    },
  };

  onMapboxMapClick(event) {
    console.log('Map clicked at', event.lngLat);
  }

  onMapboxMapZoomend(event) {
    console.log('New zoom level:', event.target.getZoom());
  }

  onMapboxMapMapLoad() {
    console.log('Map is ready');
  }
}

export default createApp(App);
```

## MapboxMarker

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `lng-lat` | `Array` | `[0, 0]` | Marker position as `[longitude, latitude]` |
| `marker-options` | `Object` | `{}` | [Mapbox Marker options](https://docs.mapbox.com/mapbox-gl-js/api/markers#marker) |

### Properties

| Property | Type | Description |
|---|---|---|
| `marker` | `mapboxgl.Marker` | The underlying Marker instance |
| `popup` | `MapboxPopup` | The first MapboxPopup child, if any |

## MapboxPopup

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `lng-lat` | `Array` | `[0, 0]` | Popup position (standalone only) |
| `popup-options` | `Object` | `{}` | [Mapbox Popup options](https://docs.mapbox.com/mapbox-gl-js/api/markers#popup) |

### Properties

| Property | Type | Description |
|---|---|---|
| `popup` | `mapboxgl.Popup` | The underlying Popup instance |

## MapboxNavigationControl

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `position` | `String` | `'top-right'` | Control position |
| `show-compass` | `Boolean` | `false` | Show compass button |
| `show-zoom` | `Boolean` | `false` | Show zoom buttons |
| `visualize-pitch` | `Boolean` | `false` | Visualize pitch on compass |

## MapboxGeolocateControl

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `position` | `String` | `'top-right'` | Control position |
| `position-options` | `Object` | — | Browser geolocation options |
| `fit-bounds-options` | `Object` | — | Fit bounds options |
| `track-user-location` | `Boolean` | `false` | Continuously track location |
| `show-accuracy-circle` | `Boolean` | `false` | Show accuracy circle |
| `show-user-location` | `Boolean` | `false` | Show location dot |
| `show-user-heading` | `Boolean` | `false` | Show heading indicator |

## MapboxGeocoder

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `add-to-map` | `Boolean` | `false` | Add as map control vs. render in element |
| `options` | `Object` | `{}` | [Geocoder options](https://github.com/mapbox/mapbox-gl-geocoder/blob/master/API.md#parameters) |

## MapboxLayer

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `id` | `String` | — | Layer ID |
| `layer` | `Object` | — | [Layer specification](https://docs.mapbox.com/style-spec/reference/layers/) |
| `before-id` | `String` | — | Insert before this layer |

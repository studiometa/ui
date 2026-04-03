---
title: MapboxMap examples
---

# Examples

## Simple map

A basic map with navigation controls.

<PreviewPlayground
  :html="() => import('./stories/map/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/map/app.js?raw')"
  :script-editor="false"
  :css="() => import('./stories/map/app.css?raw')"
  :css-editor="false"
  />

## Markers

A map with markers and popups. Markers can be added and removed dynamically.

<PreviewPlayground
  :html="() => import('./stories/markers/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/markers/app.js?raw')"
  :script-editor="false"
  :css="() => import('./stories/markers/app.css?raw')"
  :css-editor="false"
  />

## Listening to map events

You can listen to any map event by defining handler methods in your parent component following the `on<ComponentName><EventName>` pattern:

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: { MapboxMap },
  };

  onMapboxMapClick(event) {
    console.log('Clicked at:', event.lngLat);
  }

  onMapboxMapMoveend(event) {
    const center = event.target.getCenter();
    console.log('Map moved to:', center);
  }

  onMapboxMapMapLoad() {
    console.log('Map loaded, add your custom logic here');
  }
}

export default createApp(App);
```

## Full example with child components

```html
<div data-component="MapboxMap"
  data-option-access-token="YOUR_TOKEN"
  data-option-zoom="12"
  data-option-center="[2.35, 48.86]">
  <div data-ref="container"></div>

  <!-- Navigation control -->
  <template data-component="MapboxNavigationControl"
    data-option-position="top-right">
  </template>

  <!-- Geolocate control -->
  <template data-component="MapboxGeolocateControl"
    data-option-track-user-location>
  </template>

  <!-- Marker with popup -->
  <template data-component="MapboxMarker"
    data-option-lng-lat="[2.35, 48.86]">
    <template data-component="MapboxPopup">
      <h3>Paris</h3>
      <p>Capital of France</p>
    </template>
  </template>

  <!-- Standalone popup -->
  <template data-component="MapboxPopup"
    data-option-lng-lat="[2.29, 48.86]">
    <p>Near the Eiffel Tower</p>
  </template>
</div>
```

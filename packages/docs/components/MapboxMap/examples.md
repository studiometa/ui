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

A complete example featuring navigation controls, geolocation, markers with popups, and standalone popups.

<PreviewPlayground
  :html="() => import('./stories/full/app.twig')"
  :html-editor="false"
  :script="() => import('./stories/full/app.js?raw')"
  :script-editor="false"
  :css="() => import('./stories/full/app.css?raw')"
  :css-editor="false"
  />

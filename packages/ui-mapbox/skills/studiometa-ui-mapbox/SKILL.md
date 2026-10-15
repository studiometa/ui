---
name: studiometa-ui-mapbox
description: Build Mapbox GL maps declaratively with @studiometa/ui-mapbox v2 — MapboxMap, MapboxMarker, MapboxPopup, MapboxSource, MapboxLayer, controls, MapboxGeocoder and StoreLocator on @studiometa/js-toolkit v4. Use when code imports @studiometa/ui-mapbox, when markup uses data-component="MapboxMap" or another Mapbox* component, or when a page needs an interactive map or a store locator.
---

# @studiometa/ui-mapbox

`@studiometa/ui-mapbox` builds Mapbox GL maps from HTML. `MapboxMap` owns the map. Child components (markers, popups, sources, layers, controls) configure it from their attributes. `StoreLocator` is a complete store locator.

This skill matches the installed package version. Read the references in this folder before the online docs.

## References

- [references/index.md](references/index.md): the items of the package.
- `references/items/MapboxMap/`: the map and all its child components. `js-api.md` documents each component in one page.
- `references/items/StoreLocator/`: the store locator.

## Install

```bash
npm install @studiometa/ui-mapbox mapbox-gl
# Only for MapboxGeocoder:
npm install @mapbox/mapbox-gl-geocoder
```

Include the `mapbox-gl` stylesheet, or the map does not render correctly.

## Register and author

Register each component the page uses. The order does not matter: each child finds its parent map.

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { MapboxMap, MapboxMarker, MapboxPopup } from '@studiometa/ui-mapbox';

registerComponents(MapboxMap, MapboxMarker, MapboxPopup);
```

```html
<div
  data-component="MapboxMap"
  data-option-access-token="pk.your-access-token"
  data-option-zoom="10"
  data-option-center="[2.3522, 48.8566]">
  <div data-ref="container" class="h-96 w-full"></div>
  <div hidden data-component="MapboxMarker" data-option-lng-lat="[2.3522, 48.8566]"></div>
</div>
```

- Coordinates are `[lng, lat]` JSON arrays, as in Mapbox GL.
- Put `hidden` on child components that render nothing (markers, sources, layers). Do not put `hidden` on `MapboxGeocoder`: a hidden element never loads with the autoloader.
- `MapboxMap` re-emits the map events with a `map-` prefix. Handle them in a parent with `onMapboxMapMapClick`, `onMapboxMapMapLoad`…
- The `@studiometa/ui-mapbox/autoload` entry registers all components and loads them on demand. `MapboxMap`, `StoreLocator` and `MapboxGeocoder` wait until they are near the viewport.

## Loading mapbox-gl

`mapbox-gl` (about 230 kB gzipped) loads with a dynamic `import()` when the first map mounts. Do not import it in the main bundle. To use a specific build (a CSP-safe worker, an import map, a CDN), inject it once before the components mount:

```js
import mapboxgl from 'mapbox-gl';
import { provideMapboxGl } from '@studiometa/ui-mapbox';

provideMapboxGl(mapboxgl);
```

`provideMapboxGeocoder()` does the same for `@mapbox/mapbox-gl-geocoder`.

## Related skills

- `studiometa-ui`: `Action`, `Fetch`, the `Data*` components and the shared markup rules.
- `studiometa-js-toolkit`: the `Base` class and the component lifecycle.

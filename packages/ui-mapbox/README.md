# @studiometa/ui-mapbox

[![NPM Version](https://img.shields.io/npm/v/@studiometa/ui-mapbox.svg?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui-mapbox/)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/ui-mapbox?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/ui-mapbox/)

> Vanilla [@studiometa/js-toolkit](https://github.com/studiometa/js-toolkit) components to build [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) maps declaratively.

## Installation

Install the package along with its `mapbox-gl` peer dependency:

```bash
npm install @studiometa/ui-mapbox mapbox-gl
```

The geocoder component relies on the optional `@mapbox/mapbox-gl-geocoder` peer dependency, install it only if you need it:

```bash
npm install @mapbox/mapbox-gl-geocoder
```

## Usage

Register each component your page uses: each one registers independently and resolves its parent map on its own.

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { MapboxMap, MapboxMarker, MapboxPopup } from '@studiometa/ui-mapbox';

// Register only the components your page uses; order doesn't matter.
registerComponents(MapboxMap, MapboxMarker, MapboxPopup);
```

`mapbox-gl` is heavy (~230&nbsp;kB gzipped), so import the autoload entry instead to keep it out of your main bundle. It registers a lazy entry for every component of the package, and imports a module only when an element on the page declares its token:

```js
import '@studiometa/ui-mapbox/autoload';
```

Then author the map declaratively in your markup:

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

`MapboxMarker` renders nothing of its own — it configures the map from its attributes — so its element carries `hidden`. Every map child works that way, and the autoload manifest gives them the `eager` mount strategy for that reason: a `hidden` element is never rendered and never intersects the viewport, so a strategy waiting for a viewport crossing would never load them. `MapboxMap` and `StoreLocator` do render and keep `visible`, which is what holds the `mapbox-gl` import back until a map approaches the viewport. Override any of it per element with `data-mount`.

Do not forget to include the `mapbox-gl` stylesheet so the map renders correctly.

## Providing `mapbox-gl`

By default the components resolve `mapbox-gl` (and the optional `@mapbox/mapbox-gl-geocoder`) with a lazy `import()` the first time a map is built, so the dependency stays out of your main bundle until it is needed. You never have to configure anything for the default to work — just keep `mapbox-gl` installed.

When you need to control which `mapbox-gl` the components use — a specific version, a self-hosted build (e.g. a same-origin worker under a strict CSP), or a module served from an import map or a CDN — inject your own instance once, before the components mount:

```js
import mapboxgl from 'mapbox-gl';
import { provideMapboxGl, provideMapboxGeocoder } from '@studiometa/ui-mapbox';

provideMapboxGl(mapboxgl);

// Optional: inject the geocoder control constructor as well.
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
provideMapboxGeocoder(MapboxGeocoder);
```

Once provided, `@studiometa/ui-mapbox` never imports `mapbox-gl` by specifier — it uses the instance you handed it. `resolveMapboxGl()` / `resolveMapboxGeocoder()` are also exported if you want to trigger (and await) resolution yourself, for example to preload the module.

Heads up to [ui.studiometa.dev](https://ui.studiometa.dev/reference/items/MapboxMap/) for the full documentation.

## Contributing

Please read the [contribution docs](https://ui.studiometa.dev/guide/contributing/).

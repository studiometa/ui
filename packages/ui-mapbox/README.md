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

Every component is self-registering: `MapboxMap` no longer declares its children, so each component registers independently and resolves its parent map on its own. Register the whole family in one call with `registerMapboxComponents`, then author the map declaratively in your markup:

```js
import { registerMapboxComponents } from '@studiometa/ui-mapbox';

registerMapboxComponents();
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

When you only need a subset, register those components individually with `registerComponent` from `@studiometa/js-toolkit` instead — each component is exported by name and also available at its own `@studiometa/ui-mapbox/<Component>` subpath (default export = the class) for lazy loading.

Do not forget to include the `mapbox-gl` stylesheet so the map renders correctly.

Heads up to [ui.studiometa.dev](https://ui.studiometa.dev/-/components/MapboxMap/) for the full documentation.

## Contributing

Please read the [contribution docs](https://ui.studiometa.dev/guide/contributing/).

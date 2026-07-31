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

Register the components you need and let js-toolkit bind them to your markup:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponents(MapboxMap);
```

```html
<div
  data-component="MapboxMap"
  data-option-access-token="pk.your-access-token"
  data-option-zoom="10"
  data-option-center="[2.3522, 48.8566]"
>
  <div data-ref="container" class="h-96 w-full"></div>
</div>
```

Do not forget to include the `mapbox-gl` stylesheet so the map renders correctly.

Heads up to [ui.studiometa.dev](https://ui.studiometa.dev/-/components/MapboxMap/) for the full documentation.

## Contributing

Please read the [contribution docs](https://ui.studiometa.dev/guide/contributing/).

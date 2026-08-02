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

Register each component your page uses: each one registers independently and resolves its parent map on its own. `mapbox-gl` is heavy (~230&nbsp;kB gzipped), so the recommended default is to lazy-register each component with js-toolkit's `importWhen*` helpers and the per-component subpaths (each subpath's default export is the component class), keeping the dependency out of your main bundle until a map is actually on the page:

```js
import { registerComponents, importWhenVisible } from '@studiometa/js-toolkit';

// Register only the components your page uses; order doesn't matter.
registerComponents(
  importWhenVisible(() => import('@studiometa/ui-mapbox/MapboxMap'), 'MapboxMap'),
  importWhenVisible(() => import('@studiometa/ui-mapbox/MapboxMarker'), 'MapboxMarker'),
  importWhenVisible(() => import('@studiometa/ui-mapbox/MapboxPopup'), 'MapboxPopup'),
);
```

Other triggers are available too — `importWhenIdle`, `importOnInteraction` and `importOnMediaQuery` — see the [`importWhen*` helper docs](https://js-toolkit.studiometa.dev/api/helpers/importWhenVisible.html). Then author the map declaratively in your markup:

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

If you do not need code-splitting, register eagerly instead — each component is exported by name from the package:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponent(MapboxMap);
```

Do not forget to include the `mapbox-gl` stylesheet so the map renders correctly.

Heads up to [ui.studiometa.dev](https://ui.studiometa.dev/-/components/MapboxMap/) for the full documentation.

## Contributing

Please read the [contribution docs](https://ui.studiometa.dev/guide/contributing/).

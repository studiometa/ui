# @studiometa/ui-autoload

Generic, side-effect-free declarative autoloader for [`@studiometa/ui`](https://ui.studiometa.dev) component manifests. It discovers components from `data-component` attributes and loads each component's JavaScript on demand, and behaves identically whether you install it from npm and bundle it or load it from the [browser CDN](https://ui.studiometa.dev/guide/browser-cdn/).

## Installation

```bash
npm install @studiometa/ui-autoload
```

`@studiometa/js-toolkit` is a peer dependency.

## Usage

### Side-effect entries

Import one entry per component package you use. Importing an entry registers that package's manifest with the shared runtime and starts discovery — the import is the whole contract, there is nothing to call:

```js
import '@studiometa/ui-autoload/ui';          // auto-load @studiometa/ui components
import '@studiometa/ui-autoload/ui-mapbox';   // auto-load @studiometa/ui-mapbox components
```

Importing both entries at the top of a module registers both manifests before the runtime starts, so they coalesce into a single loader over the composed set — never two loaders both scanning the DOM.

The same entries resolve from the CDN, where the package is served from its own versioned tree:

```html
<script type="module">
  import 'https://cdn.studiometa.dev/ui-autoload@next/ui';
  import 'https://cdn.studiometa.dev/ui-autoload@next/ui-mapbox';
</script>
```

### Eager components

By default each component follows the load strategy declared in its manifest (`eager`, `visible`, `idle`, or `interaction`), overridable per element with a `data-load` attribute. To force specific components to load and mount eagerly regardless of their strategy, declare them with a `<meta>` element:

```html
<meta name="studiometa-ui:eager" content="Accordion, Action, Modal" />
```

The `content` is a comma-separated list of component tokens. Multiple `studiometa-ui:eager` metas concatenate, whitespace is trimmed, and duplicate and empty tokens are dropped.

### Programmatic API

Importing the package root has no side effects — nothing touches the DOM until you call `autoload()`. Use it for custom composition: a curated subset of packages, your own manifest layered on top, or discovery scoped to a `root` element.

```js
import { autoload, composeManifests } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';

const handle = autoload({
  manifests: [uiManifest, mapboxManifest],
  root: document, // optional, defaults to `document`
  eager: ['Action', 'Modal'], // optional, force-load these tokens eagerly
});

handle.stop(); // stop discovery and release every scheduled trigger
```

`autoload({ manifests, root?, eager? })` composes the manifests, starts discovery, and returns a handle exposing the underlying `loader`, the composed `manifest`, and a `stop()` method. When two manifests declare the same token, the manifest that appears later in the array wins. `composeManifests(...)` performs that same merge without starting a loader.

Each component package exports its manifest as a named `manifest` export — `@studiometa/ui/manifest` and `@studiometa/ui-mapbox/manifest` (served on the CDN at `/ui@<version>/manifest.js` and `/ui-mapbox@<version>/manifest.js`). The side-effect entries above are thin wrappers that import a package's manifest and register it.

## Documentation

See the [Browser CDN guide](https://ui.studiometa.dev/guide/browser-cdn/) for loading strategies, component discovery, diagnostics, and limitations.

## License

[MIT](https://github.com/studiometa/ui/blob/master/LICENSE) © [Studio Meta](https://www.studiometa.fr)

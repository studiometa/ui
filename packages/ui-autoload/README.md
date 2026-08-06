# @studiometa/ui-autoload

Generic, side-effect-free declarative autoloader for [`@studiometa/ui`](https://ui.studiometa.dev) component manifests. It discovers components from `data-component` attributes and loads each component's JavaScript on demand, and behaves identically whether you install it from npm and bundle it or load it from an ESM CDN such as [esm.sh](https://esm.sh). See the [Autoloading guide](https://ui.studiometa.dev/guide/autoloading/).

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

The same entries resolve from an ESM CDN, which serves the package as native ES modules and resolves its peer dependencies for you:

```html
<script type="module">
  import 'https://esm.sh/@studiometa/ui-autoload@next/ui';
  import 'https://esm.sh/@studiometa/ui-autoload@next/ui-mapbox';
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

Each component package exports its manifest as a named `manifest` export — `@studiometa/ui/manifest` and `@studiometa/ui-mapbox/manifest`. The side-effect entries above are thin wrappers that import a package's manifest and register it.

### Custom component manifests

Autoload your own js-toolkit components alongside `@studiometa/ui` by building a manifest from your app's component files. `defineManifest(...)` turns a record of lazy importers into a manifest, `fromWebpackContext(...)` and `fromMetaGlob(...)` adapt a bundler glob into that record, and `registerManifests(...)` registers several manifests at once with the shared runtime.

With webpack, feed it an `import.meta.webpackContext` — pass `mode: 'lazy'` so each component is code-split and loaded on demand:

```js
import { registerManifests, defineManifest, fromWebpackContext } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';

const manifest = defineManifest({
  packageName: '@my/app',
  strategy: 'visible',
  modules: fromWebpackContext(
    import.meta.webpackContext('./components', { recursive: true, regExp: /\.ts$/, mode: 'lazy' }),
  ),
});

registerManifests(uiManifest, mapboxManifest, manifest);
```

With Vite, feed it an `import.meta.glob` instead — keep it lazy, `fromMetaGlob(...)` throws on an eager glob (`{ eager: true }`):

```js
import { registerManifests, defineManifest, fromMetaGlob } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';

const manifest = defineManifest({
  packageName: '@my/app',
  strategy: 'visible',
  modules: fromMetaGlob(import.meta.glob('./components/*/*.ts')),
});

registerManifests(uiManifest, manifest);
```

The token is derived from the filename — `MyWidget.ts` becomes the `MyWidget` token, and a file named `index.ts` takes its parent directory name (`Foo/index.ts` becomes `Foo`). Override any derived token — its strategy, group, resolved export name, or the token itself — through the `components` map, keyed by the derived token:

```js
defineManifest({
  modules: fromMetaGlob(import.meta.glob('./components/*/*.ts')),
  components: {
    MyWidget: { strategy: 'idle', exportName: 'Widget', children: ['MyWidgetItem'] },
  },
});
```

Each custom component must be a js-toolkit `Base` subclass, resolved from the named export matching its token (or the module's `default` export as a fallback). Child components listed in an entry's `children` are resolved from the parent's `config.components`, so a component nested only inside another needs no manifest entry of its own. When two module keys derive the same token a warning is logged and the later file wins.

`registerManifests(...manifests)` registers each manifest in order and, because the runtime composes them later-wins, the LAST manifest wins on token collisions — so passing your custom manifest last lets it override any packaged component that shares a token.

## Documentation

See the [Autoloading guide](https://ui.studiometa.dev/guide/autoloading/) for loading strategies, component discovery, diagnostics, and limitations.

## License

[MIT](https://github.com/studiometa/ui/blob/master/LICENSE) © [Studio Meta](https://www.studiometa.fr)

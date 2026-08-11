# Autoloading

`@studiometa/ui` ships a declarative autoloader entry. You import one side-effect module. The [`@studiometa/js-toolkit`](https://js-toolkit.studiometa.dev) autoload runtime then finds components from their `data-component` attribute and loads each component's JavaScript when it is needed.

The autoloader works the same way with a bundler and from a CDN. The same markup runs in a bundled application, a content site, a prototype, or a CMS template. The `@studiometa/ui/autoload` entry ships JavaScript only — no Twig templates and no stylesheets. Read [Limitations](#limitations) before you use it in an application.

For a no-build setup, load the entry from an ESM CDN such as [esm.sh](https://esm.sh). esm.sh serves any npm package as native ES modules and resolves the `@studiometa/js-toolkit` peer dependency. The examples below use esm.sh.

## Quick start

Add a module script. Import the `@studiometa/ui/autoload` entry. The import registers the `@studiometa/ui` manifest and starts discovery. There is nothing more to call.

```html
<script type="module">
  import 'https://esm.sh/@studiometa/ui@latest/autoload';
</script>

<button
  data-component="Action"
  data-option-on="click"
  data-option-effect="alert('Hello from the CDN!')">
  Click me
</button>
```

The runtime scans the document for `data-component` tokens, imports the matching modules, and registers them with the [js-toolkit](https://js-toolkit.studiometa.dev) runtime. The declarative contract (`data-component`, `data-ref`, `data-option-*`) is the same one that [Declarative runtime](/guide/concepts/declarative-runtime) describes.

Pin an exact version in production. See [Version pinning](#version-pinning).

## Activate a package

Import one side-effect entry for each component package you use. Each import registers that package's manifest with the shared runtime.

```html
<script type="module">
  import 'https://esm.sh/@studiometa/ui@latest/autoload'; // @studiometa/ui components
  import 'https://esm.sh/@studiometa/ui-mapbox@latest/autoload'; // @studiometa/ui-mapbox components
</script>
```

The same entries resolve from `node_modules` when you install the packages and let your bundler resolve them:

```js
import '@studiometa/ui/autoload';
import '@studiometa/ui-mapbox/autoload';
```

Import both entries at the top of one module. The two manifests register before the runtime starts, so they join into one loader over the composed set. Import `@studiometa/ui-mapbox/autoload` only when you use the Mapbox family — see [Mapbox integration](#mapbox-integration).

Every component on the page must resolve to one `@studiometa/js-toolkit` runtime. `@studiometa/ui` and `@studiometa/ui-mapbox` share the same `@studiometa/js-toolkit` peer, so one pin on that peer resolves the whole set.

### Version pinning

A version reference follows the package's npm tags and semver ranges:

```html
<script type="module">
  import 'https://esm.sh/@studiometa/ui@latest/autoload'; // latest stable release
  import 'https://esm.sh/@studiometa/ui@1.10.0/autoload'; // exact version
  import 'https://esm.sh/@studiometa/ui@^1/autoload'; // semver range
</script>
```

Pin an exact version in production. An exact-version URL is immutable and stays cached the longest, and it makes every entry on the page resolve to the same version. A versionless URL and `@latest` follow the latest stable release.

## Loading strategies

Each component has a default loading strategy in its manifest. Override it per element with `data-load`. There are four strategies:

| Strategy      | The component loads when…                                                                    |
| ------------- | -------------------------------------------------------------------------------------------- |
| `eager`       | the runtime starts.                                                                          |
| `visible`     | the element is near the viewport (200px margin, `IntersectionObserver`). Default for Mapbox. |
| `idle`        | the browser is idle (`requestIdleCallback`, 2-second timeout).                               |
| `interaction` | the first `pointerover`, `pointerdown`, or `focusin` on the element.                         |

```html
<div data-component="Dialog" data-load="interaction">Loads on hover, touch, or focus</div>
```

When a browser API is not available, the strategy falls back to eager loading.

The runtime resolves the strategy in this order:

1. An [eager `<meta>`](#eager-components) declaration. It always wins.
2. A valid `data-load` attribute. An invalid value logs a warning and uses the manifest default.
3. The manifest default.

### Eager components

Make a component load and mount at once, whatever its strategy, with a `<meta>` element:

```html
<meta name="js-toolkit:eager" content="Accordion, Action, Modal" />
```

The `content` is a comma-separated list of tokens. Several metas concatenate. The runtime trims whitespace and drops empty and duplicate tokens. It ignores an unknown token and logs a warning.

## Component discovery

The runtime scans the document at startup and then observes it with a `MutationObserver`. It discovers:

- **Initial markup** — every `[data-component]` present when the script runs.
- **Added subtrees** — elements inserted after startup.
- **Multiple tokens** — space-separated values such as `data-component="Action Timer"`.

The runtime imports and registers each token once for the whole document. When a component registers, it also registers the child components it exposes. For example, `Accordion` brings in `AccordionItem`, so nested families work without a list of every child.

The runtime cleans up observers and listeners when an element leaves the DOM. Discovery follows node insertion and removal, so the runtime does not observe a change to the `data-component` attribute of an element already in the DOM. Add or replace the element instead.

When `MutationObserver` is not available, the initial scan still runs, but the runtime does not discover added components.

## Programmatic API

The autoload runtime and its helpers live in `@studiometa/js-toolkit`. The `@studiometa/ui/autoload` entry is only the side-effect wrapper that registers the `@studiometa/ui` manifest; the programmatic API — `autoload`, `registerManifests`, `defineManifest`, and the glob adapters — is imported directly from `@studiometa/js-toolkit`. Use it to compose a subset of packages, to scope discovery to a `root` element, or to build your own entry.

```js
import { autoload } from '@studiometa/js-toolkit';
import { manifest as uiManifest } from '@studiometa/ui/manifest';

const handle = autoload({ manifests: [uiManifest], eager: ['Action'] });
handle.stop(); // stop discovery
```

To autoload your own js-toolkit components, build a manifest from your component files with `defineManifest` and register it with `registerManifests`, both from `@studiometa/js-toolkit`. See the [js-toolkit autoload guide](https://js-toolkit.studiometa.dev) and the [autoload API reference](https://js-toolkit.studiometa.dev/api/autoload) for every export.

## Manual imports

You can also import components directly from the CDN, without the autoloader. This suits a script that builds components itself.

```js
import { Action, Modal } from 'https://esm.sh/@studiometa/ui@1.10.0'; // the whole surface
import { Action } from 'https://esm.sh/@studiometa/ui@1.10.0/Action'; // one component
```

Manual imports and the autoloader do not conflict, while every import on the page resolves to one js-toolkit runtime. Pin the same version everywhere.

## Mapbox integration

Mapbox components load like any other component, but the autoloader does not bundle `mapbox-gl`. You provide it. This keeps you in control of the Mapbox version and its Web Worker.

Declare an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) before the autoload script. Point the bare specifiers at a source of your choice. Add the geocoder entry only when you use `MapboxGeocoder`.

```html
<script type="importmap">
  {
    "imports": {
      "mapbox-gl": "https://esm.sh/mapbox-gl@3",
      "@mapbox/mapbox-gl-geocoder": "https://esm.sh/@mapbox/mapbox-gl-geocoder@5"
    }
  }
</script>
<script type="module">
  import 'https://esm.sh/@studiometa/ui@latest/autoload';
  import 'https://esm.sh/@studiometa/ui-mapbox@latest/autoload';
</script>
```

Load the Mapbox stylesheet yourself, and the geocoder stylesheet only when you use `MapboxGeocoder`. Give each map a valid access token through its `data-option-map-options`. Mapbox components default to the `visible` strategy, so the map code loads when a map nears the viewport.

You own the `mapbox-gl` module, so its Web Worker is same-origin and a strict Content Security Policy works. When you load `mapbox-gl` from a CDN that builds its worker from a `blob:` URL, allow it: `Content-Security-Policy: worker-src blob:;`.

## Shopify integration

Most Shopify components autoload as they do in a bundled build. `FetchShopifyPartial` is the exception. The `@shopify/partial-rendering` adapter is not resolved in a no-build setup, so the component logs a diagnostic and falls back to the base [`Fetch`](/reference/items/Fetch/) behavior. Use a bundled build when you need partial rendering.

## Diagnostics

The runtime logs warnings under the `[@studiometa/js-toolkit/autoload]` prefix for recoverable conditions: a conflicting runtime version, an unknown token, an unknown eager component, an invalid `data-load` value, an invalid manifest strategy, or an unavailable browser API.

When a component fails to import or register, the runtime logs an error and dispatches a bubbling `js-toolkit:error` `CustomEvent` on the document element. Its `detail` carries the `token`, the `stage` (`import` or `registration`), and the `error`:

```js
document.addEventListener('js-toolkit:error', (event) => {
  const { token, stage, error } = event.detail;
  console.error(`Component ${token} failed at ${stage}:`, error);
});
```

esm.sh serves a source map with every asset, so developer tools show the original sources. The autoloader targets ES2020 module browsers (Chrome 63+, Firefox 67+, Safari 11.1+, Edge 79+).

## Limitations

A no-build install trades flexibility for a zero-build setup. Its constraints are deliberate:

- **One runtime version per page.** Several imports of the entries are safe; they share one runtime. Two different `@studiometa/js-toolkit` autoload runtimes cannot coexist — the second activation warns and does nothing. Pin one version.
- **One js-toolkit runtime.** Every component on the page must resolve to one `@studiometa/js-toolkit` runtime. Do not mix CDN components with a separate npm build that bundles its own copy.
- **No `data-component` mutation.** The runtime observes inserted and removed nodes only.
- **No Shadow DOM.** Components own standard light-DOM elements.
- **No templates or stylesheets.** No Twig, no `data-mount`, and no CSS — including no Mapbox CSS.
- **ES2020 module browsers only.**
- **Mapbox is not provided.** You supply `mapbox-gl` and its CSS through an import map.
- **Shopify partial rendering is excluded.** `FetchShopifyPartial` falls back to base `Fetch`.

## Next steps

- [js-toolkit autoload guide](https://js-toolkit.studiometa.dev) — autoload your own components.
- [autoload API reference](https://js-toolkit.studiometa.dev/api/autoload) — every export.
- [Declarative runtime](/guide/concepts/declarative-runtime) — the `data-component` / `data-option-*` contract.

# Autoloading

`@studiometa/ui` ships a declarative autoloader entry. You import one side-effect module. The [`@studiometa/js-toolkit`](https://js-toolkit-v4.studiometa.dev) registry then finds components from their `data-component` attribute and loads each component's JavaScript when it is needed.

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

The runtime scans the document for `data-component` tokens, imports the matching modules, and registers them with the [js-toolkit](https://js-toolkit-v4.studiometa.dev) runtime. The declarative contract (`data-component`, `data-ref`, `data-option-*`) is the same one that [Declarative runtime](/guide/concepts/declarative-runtime) describes.

Pin an exact version in production. See [Version pinning](#version-pinning).

## Activate a package

Import one side-effect entry for each component package you use. Each import registers that package's manifest with the shared runtime.

```html
<script type="module">
  import 'https://esm.sh/@studiometa/ui@latest/autoload'; // @studiometa/ui components
  import 'https://esm.sh/@studiometa/ui-mapbox@latest/autoload'; // @studiometa/ui-mapbox components
  import 'https://esm.sh/@studiometa/ui-motion@latest/autoload'; // @studiometa/ui-motion components
</script>
```

The same entries resolve from `node_modules` when you install the packages and let your bundler resolve them:

```js
import '@studiometa/ui/autoload';
import '@studiometa/ui-mapbox/autoload';
import '@studiometa/ui-motion/autoload';
```

Import the entries at the top of one module. The manifests register before the runtime starts, so they join into one loader over the composed set. Import `@studiometa/ui-mapbox/autoload` only when you use the Mapbox family — see [Mapbox integration](#mapbox-integration) — and `@studiometa/ui-motion/autoload` only when you use [Motion](#motion-integration).

Every component on the page must resolve to one `@studiometa/js-toolkit` runtime. `@studiometa/ui`, `@studiometa/ui-mapbox` and `@studiometa/ui-motion` share the same `@studiometa/js-toolkit` peer, so one pin on that peer resolves the whole set.

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

## Mount strategies

Each manifest entry carries a default mount strategy. Override it per element with `data-mount`. There are six:

| Strategy        | The component mounts when…                                                |
| --------------- | ------------------------------------------------------------------------- |
| `eager`         | the runtime starts. The default for every `@studiometa/ui` component.     |
| `visible`       | the element crosses into the viewport, once.                              |
| `in-view`       | the element is in the viewport, and unmounts when it leaves. Reversible.  |
| `idle`          | the browser is idle.                                                      |
| `interaction`   | the first `pointerenter`, `pointerdown` or `focusin` on the element.      |
| `media:<query>` | the media query matches, and unmounts when it stops matching. Reversible. |

```html
<div data-component="Dialog" data-mount="interaction">Mounts on hover, touch, or focus</div>
```

`visible` and `in-view` take an optional `IntersectionObserver` root margin — `data-mount="in-view:50%"`. `interaction` takes an optional `page` scope — `data-mount="interaction:page"` — which waits for the first deliberate interaction anywhere in the document rather than on the element.

The element's `data-mount` always wins over the manifest default. An invalid value reports a `component.invalid-mount-strategy` diagnostic and the entry's default is used.

The `@studiometa/ui` manifest ships every component as `eager`; `@studiometa/ui-mapbox` and `@studiometa/ui-motion` ship theirs as `visible`, so their heavy dependencies stay off the critical path.

## Component discovery

The runtime scans the document at startup and then observes it with a `MutationObserver`. It discovers:

- **Initial markup** — every `[data-component]` present when the script runs.
- **Added subtrees** — elements inserted after startup.
- **Multiple tokens** — space-separated values such as `data-component="Action Timer"`.

The runtime imports and registers each token once for the whole document. When a component registers, it also registers the child components it exposes. For example, `Slider` brings in `SliderItem` and `SliderDrag`, so nested families work without a list of every child.

The runtime cleans up observers and listeners when an element leaves the DOM. Discovery follows node insertion and removal, so the runtime does not observe a change to the `data-component` attribute of an element already in the DOM. Add or replace the element instead.

When `MutationObserver` is not available, the initial scan still runs, but the runtime does not discover added components.

## Programmatic API

The manifest runtime lives in `@studiometa/js-toolkit`. The `@studiometa/ui/autoload` entry is only the side-effect wrapper that hands the `@studiometa/ui` manifest to `registerManifest()`; the programmatic API — `registerManifest`, `defineManifest`, and the glob adapters — is imported directly from `@studiometa/js-toolkit`. Use it to compose a subset of packages or to build your own entry.

```js
import { registerManifest } from '@studiometa/js-toolkit';
import { manifest as uiManifest } from '@studiometa/ui/manifest';

registerManifest(uiManifest);
```

A manifest maps `data-component` tokens to a lazy importer and an optional mount strategy:

```js
import { registerManifest } from '@studiometa/js-toolkit';

registerManifest({
  Gallery: {
    mountStrategy: 'visible',
    load: () => import('./components/Gallery.js').then(({ Gallery }) => Gallery),
  },
});
```

To autoload your own components from their files, build the manifest with `defineManifest` and one of the glob adapters — `fromMetaGlob` for Vite, `fromWebpackContext` for webpack — then register it the same way. See the [js-toolkit documentation](https://js-toolkit-v4.studiometa.dev) for every export.

## Manual imports

You can also import components directly from the CDN, without the autoloader. This suits a script that builds components itself.

```js
import { Action, Dialog } from 'https://esm.sh/@studiometa/ui@1.10.0'; // the whole surface
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

Load the Mapbox stylesheet yourself, and the geocoder stylesheet only when you use `MapboxGeocoder`. Give each map a valid access token through its `data-option-map-options`. Mapbox components default to the `visible` mount strategy, so the map code loads when a map crosses into the viewport.

You own the `mapbox-gl` module, so its Web Worker is same-origin and a strict Content Security Policy works. When you load `mapbox-gl` from a CDN that builds its worker from a `blob:` URL, allow it: `Content-Security-Policy: worker-src blob:;`.

## Motion integration

The `Motion` component loads like any other component, but the autoloader does not bundle the [`motion`](https://motion.dev) library. You provide it through an import map, which keeps you in control of the Motion version:

```html
<script type="importmap">
  {
    "imports": {
      "motion": "https://esm.sh/motion@13"
    }
  }
</script>
<script type="module">
  import 'https://esm.sh/@studiometa/ui@latest/autoload';
  import 'https://esm.sh/@studiometa/ui-motion@latest/autoload';
</script>
```

The component resolves `motion` lazily the first time an animation is built. In a bundled build you can inject a specific entry — such as the smaller `motion/mini` — with `provideMotion()`; see the [Motion JS API](/reference/items/Motion/js-api#providing-the-motion-dependency).

## Shopify integration

Most Shopify components autoload as they do in a bundled build. `FetchShopifyPartial` is the exception. The `@shopify/partial-rendering` adapter is not resolved in a no-build setup, so the component logs a diagnostic and falls back to the base [`Fetch`](/reference/items/Fetch/) behavior. Use a bundled build when you need partial rendering.

## Diagnostics

Recoverable conditions — a duplicate manifest token, an invalid `data-mount` value, a registry conflict, a component that fails to load or mount — are reported on js-toolkit's diagnostic channel rather than written straight to the console. Each one is a bubbling `js-toolkit:diagnostic` `CustomEvent` whose `detail` carries a stable `code`, a `severity` of `warning` or `error`, a `message`, the `component` name, and, for an error, the original `error`:

```js
import { DIAGNOSTICS, EVENTS } from '@studiometa/js-toolkit';

document.addEventListener(EVENTS.diagnostic, (event) => {
  const { code, severity, message, component, error } = event.detail;
  if (code === DIAGNOSTICS.component.loadFailed) {
    console.error(`Component ${component} failed to load: ${message}`, error);
  }
});
```

`DIAGNOSTICS` enumerates every code core reports. A component outside core mints its own in the same `namespace.detail` shape, which is what makes a listener able to filter.

esm.sh serves a source map with every asset, so developer tools show the original sources. The autoloader targets ES2020 module browsers (Chrome 63+, Firefox 67+, Safari 11.1+, Edge 79+).

## Limitations

A no-build install trades flexibility for a zero-build setup. Its constraints are deliberate:

- **One runtime version per page.** Several imports of the entries are safe; they share one runtime. Two different `@studiometa/js-toolkit` autoload runtimes cannot coexist — the second activation warns and does nothing. Pin one version.
- **One js-toolkit runtime.** Every component on the page must resolve to one `@studiometa/js-toolkit` runtime. Do not mix CDN components with a separate npm build that bundles its own copy.
- **No `data-component` mutation.** The runtime observes inserted and removed nodes only.
- **No Shadow DOM.** Components own standard light-DOM elements.
- **No templates or stylesheets.** No Twig and no CSS — including no Mapbox CSS.
- **ES2020 module browsers only.**
- **Mapbox is not provided.** You supply `mapbox-gl` and its CSS through an import map.
- **Motion is not provided.** You supply `motion` through an import map.
- **Shopify partial rendering is excluded.** `FetchShopifyPartial` falls back to base `Fetch`.

## Next steps

- [js-toolkit documentation](https://js-toolkit-v4.studiometa.dev) — the registry, manifests and mount strategies.
- [Declarative runtime](/guide/concepts/declarative-runtime) — the `data-component` / `data-option-*` contract.

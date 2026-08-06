# Autoloading

`@studiometa/ui-autoload` is the declarative autoloader for the library. A short module script imports one of its side-effect entries; from there the runtime discovers components from `data-component` attributes and loads each component's JavaScript on demand. It behaves identically whether you install it from npm and bundle it or load it from a CDN — so the same markup works in a bundled app, a content site, a prototype, or a CMS template.

The autoloader is a single package — `@studiometa/ui-autoload` — with no build-specific behavior. Activating a component package is one import of its side-effect entry; there is nothing to register by hand. The package ships the JavaScript behavior only (no Twig templates or general stylesheets). See [Limitations](#limitations) before adopting it for an application.

For a no-build install, load the package from an ESM CDN such as [esm.sh](https://esm.sh), which serves any npm package as native ES modules and resolves the `@studiometa/js-toolkit` and `@studiometa/ui` peer dependencies for you. The examples below use esm.sh; any CDN that serves npm packages as ESM and honors a package's `exports` map works the same way.

## Quick start

Add a module script that imports the `@studiometa/ui-autoload/ui` entry from the CDN. Importing it is the whole contract: it registers the `@studiometa/ui` component manifest with the autoload runtime and starts discovery.

```html
<script type="module">
  import 'https://esm.sh/@studiometa/ui-autoload@next/ui';
</script>

<!-- Components mount automatically from their data-component attribute -->
<button
  data-component="Action"
  data-option-on="click"
  data-option-effect="alert('Hello from the CDN!')">
  Click me
</button>
```

The runtime scans the document for `data-component` tokens, imports the matching component modules from the CDN, and registers them with the [js-toolkit](https://js-toolkit.studiometa.dev) runtime that the library uses. No manual registration or bundling step is involved. The declarative contract (`data-component`, `data-ref`, `data-option-*`) is the same one described in [Declarative runtime](/guide/concepts/declarative-runtime).

The `@next` tag resolves to the current prerelease. During the current prerelease line, use `@next` or an exact version — see [Version pinning](#version-pinning).

## How autoloading works

`@studiometa/ui-autoload` is the single autoloading surface for the whole library. Each component package publishes its own manifest (a map of `data-component` tokens to lazy `import()` loaders), and the autoloader composes the manifests you activate into one lookup table. You activate a package's manifest by importing its side-effect entry; for advanced setups, a small [programmatic API](#programmatic-api) exposes the same machinery.

Import one side-effect entry per component package you use. Each import registers that package's manifest with the shared runtime.

### From a CDN

```html
<script type="module">
  import 'https://esm.sh/@studiometa/ui-autoload@next/ui'; // auto-load @studiometa/ui components
  import 'https://esm.sh/@studiometa/ui-autoload@next/ui-mapbox'; // auto-load @studiometa/ui-mapbox components
</script>
```

Importing both entries at the top of a module registers both manifests before the runtime starts, so the two coalesce into a single loader over the composed set — never two loaders both scanning the DOM. Importing only `./ui` loads just the `@studiometa/ui` components; add `./ui-mapbox` only when you use the Mapbox family (and provide `mapbox-gl` yourself, see [Mapbox integration](#mapbox-integration)).

Both entries resolve `@studiometa/js-toolkit` to the same URL on the CDN, so they share a single runtime instance on the page — this is what lets the two manifests coalesce (see [Limitations](#limitations)). The three packages — `ui-autoload`, `ui`, and `ui-mapbox` — are versioned in lockstep and always share the same version, and `ui-autoload` pins its matching `ui`/`ui-mapbox` peer exactly, so a single pin on the autoload entry resolves the whole set.

### From an npm install

The exact same entries resolve from `node_modules` when you install the package and let your bundler resolve them:

```js
import '@studiometa/ui-autoload/ui';
import '@studiometa/ui-autoload/ui-mapbox';
```

The activation-on-import semantics are identical; your bundler resolves each package's manifest from `node_modules` and the composed runtime behaves exactly as it does on the CDN. This is the recommended path when a build step is available.

### Version pinning

On esm.sh a version reference follows the package's npm distribution tags and semver ranges:

```html
<script type="module">
  // Current prerelease (the `next` dist-tag)
  import 'https://esm.sh/@studiometa/ui-autoload@next/ui';

  // Exact version (best for production — immutable, cached for a year)
  import 'https://esm.sh/@studiometa/ui-autoload@1.10.0-beta.3/ui';

  // Latest stable release, or a semver range
  import 'https://esm.sh/@studiometa/ui-autoload@latest/ui';
  import 'https://esm.sh/@studiometa/ui-autoload@^1/ui';
</script>
```

Pin an exact version in production: exact-version URLs are immutable and cached the longest, and they guarantee every entry on the page resolves to the same version. A bare, versionless URL follows the `latest` stable tag, so during the current prerelease line — before a stable `1.x` release exists — use `@next` or an exact version instead.

### Eager components

By default each component follows the load strategy declared in its manifest (see [Loading strategies](#loading-strategies)). To force specific components to load and mount eagerly regardless of that strategy — for above-the-fold components that must be available without waiting — declare them with a `<meta>` element:

```html
<meta name="studiometa-ui:eager" content="Accordion, Action, Modal" />
```

The `content` is a comma-separated list of component tokens. Multiple `studiometa-ui:eager` metas concatenate, whitespace around each token is trimmed, and duplicate and empty tokens are dropped. An eager token that matches no known component is ignored with a console warning.

### Programmatic API

Importing the package root (`@studiometa/ui-autoload`) has no side effects — it only exposes the machinery, and nothing touches the DOM until you call `autoload()`. This is the seam for custom composition: registering a curated subset of packages, layering your own manifest, or scoping discovery to a `root` element.

```js
import { autoload, composeManifests } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';

const handle = autoload({
  manifests: [uiManifest, mapboxManifest],
  root: document.querySelector('#app') ?? document, // optional, defaults to `document`
  eager: ['Action', 'Modal'], // optional, force-load these tokens eagerly
});

// Later, to stop discovery and release every scheduled trigger:
handle.stop();
```

`autoload({ manifests, root?, eager? })` composes the given manifests, starts discovery, and returns a handle exposing the underlying `loader`, the composed `manifest`, and a `stop()` method. When two manifests declare the same token, the entry from the manifest that appears later in the array wins. `composeManifests(...)` performs that same merge on its own if you need the composed table without starting a loader.

Each package exports its own manifest as a named `manifest` export — `@studiometa/ui/manifest` and `@studiometa/ui-mapbox/manifest`. The side-effect entries above are thin wrappers that import their package's manifest and register it; the programmatic API lets you compose them yourself. The individual functions and classes are documented under [Helpers and utilities](/reference/helpers/).

## Manual imports

The declarative autoloader is the primary way to use the library without a build step, but every package is also a set of plain ESM entry points you can import directly from the CDN. This suits scripted setups that construct components themselves, register a curated subset, or bundle nothing at all.

The full `@studiometa/ui` surface is available from the barrel, exactly like the npm package's main entry, and individual components are importable by the subpath that mirrors the npm subpath exports (`@studiometa/ui/Action`):

```js
// The whole @studiometa/ui surface from the barrel.
import { Action, Dialog, Modal } from 'https://esm.sh/@studiometa/ui@1.10.0-beta.3';

// A single component by its subpath.
import { Action } from 'https://esm.sh/@studiometa/ui@1.10.0-beta.3/Action';
```

The `@studiometa/ui-mapbox` components follow the same convention (provide `mapbox-gl` yourself, see [Mapbox integration](#mapbox-integration)):

```js
import { MapboxMap, StoreLocator } from 'https://esm.sh/@studiometa/ui-mapbox@1.10.0-beta.3';
```

Manual imports do not conflict with the autoloader — a page can either import modules itself or rely on the side-effect entry — as long as everything on the page resolves to a single js-toolkit runtime (see [Limitations](#limitations)). Because esm.sh resolves the shared `@studiometa/js-toolkit` peer to one URL across every `@studiometa/ui` import, that holds automatically when you pin the same version everywhere.

## Loading strategies

Every component has a default loading strategy defined in its package manifest. Override it per element with `data-load`. The four strategies are:

### Eager

Loads as soon as the runtime starts:

```html
<div data-component="Action" data-load="eager">Loads immediately</div>
```

### Visible

Loads shortly before the element enters the viewport (a 200px root margin is applied via `IntersectionObserver`). This is the default for Mapbox components:

```html
<div data-component="ScrollAnimation" data-load="visible">Loads when near the viewport</div>
```

If `IntersectionObserver` is unavailable, the component falls back to eager loading.

### Idle

Loads when the browser is idle, with a 2-second timeout so it still loads on a busy main thread. Uses `requestIdleCallback` when available, otherwise a timeout:

```html
<div data-component="Timer" data-load="idle">Loads when the browser is idle</div>
```

### Interaction

Loads on the first `pointerover`, `pointerdown`, or `focusin` on the element:

```html
<button data-component="Dialog" data-load="interaction">Loads on hover, touch, or focus</button>
```

### Strategy precedence

When more than one source specifies a strategy, the runtime resolves it in this order:

1. **Eager declaration** — a component listed in a [`<meta name="studiometa-ui:eager">`](#eager-components) always loads eagerly, overriding everything below.
2. **`data-load` attribute** — a valid per-element value wins over the manifest default. An invalid value logs a warning and falls back to the manifest default.
3. **Manifest default** — the component's built-in strategy.

## Component discovery

The runtime scans the document on startup and then observes it with a `MutationObserver`. Discovery covers:

- **Initial markup** — every `[data-component]` present when the script runs.
- **Dynamically added subtrees** — elements inserted after startup are scanned and scheduled the same way.
- **Multiple tokens** — space-separated values such as `data-component="Action Timer"` schedule each token.

Each component token is imported and registered exactly once for the whole document, no matter how many elements reference it. When a component registers, any of its declared child components that the parent exposes are registered automatically (for example, `Accordion` brings in `AccordionItem`), so nested families work without listing every child.

When an element is removed from the DOM, the runtime cleans up any pending observers or listeners it had scheduled for that element. Because discovery is driven by node insertion and removal, **mutating the `data-component` attribute of an element already in the DOM is not observed** — the runtime will not pick up the change. Add or replace the element instead.

If `MutationObserver` is unavailable, the initial scan still runs but dynamically added components are not discovered.

## Mapbox integration

Mapbox components (`MapboxMap`, `MapboxMarker`, `StoreLocator`, and the rest of the `@studiometa/ui-mapbox` surface described in [Packages and surfaces](/guide/concepts/packages-and-surfaces)) load from the CDN like any other component, but **`mapbox-gl` itself is not bundled** — you provide it. This keeps you in control of the Mapbox version and its Web Worker.

### Provide `mapbox-gl` with an import map

The Mapbox components import `mapbox-gl` (and, for `MapboxGeocoder`, `@mapbox/mapbox-gl-geocoder`) as bare module specifiers. Declare an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) — before the autoload script — that points those specifiers at a source of your choosing (a pinned ESM CDN such as esm.sh, or a copy you host yourself):

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
  import 'https://esm.sh/@studiometa/ui-autoload@next/ui';
  import 'https://esm.sh/@studiometa/ui-autoload@next/ui-mapbox';
</script>
```

Only add the geocoder entry if you use `MapboxGeocoder`.

### Stylesheets

Load the Mapbox stylesheet yourself from the same source, and the geocoder stylesheet only when you use `MapboxGeocoder`:

```html
<link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" />
<!-- Only when using MapboxGeocoder -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@mapbox/mapbox-gl-geocoder@5/lib/mapbox-gl-geocoder.css" />
```

### Access token and options

Mapbox components need a valid access token and are configured through their js-toolkit options, exactly as in a bundled setup:

```html
<div
  data-component="MapboxMap"
  data-option-map-options='{"accessToken":"pk.eyJ1...","style":"mapbox://styles/mapbox/streets-v11"}'>
  <div data-ref="container"></div>
</div>
```

### Lazy loading

Mapbox components default to the `visible` strategy, so the map code only loads when a map approaches the viewport rather than on initial page load. `mapbox-gl` is fetched (from your import-map source) the first time a map mounts, and `MapboxGeocoder` resolves its geocoder the same way, so core map components stay free of the geocoder's weight.

### Content Security Policy

Because you own the `mapbox-gl` module, its GL Web Worker is same-origin with your page (or wherever you host `mapbox-gl`), so a strict Content Security Policy is fully supported — self-host `mapbox-gl` and its worker needs no `blob:` exception. If instead you load `mapbox-gl` from an ESM CDN that creates its worker from a `blob:` URL, allow it explicitly:

```
Content-Security-Policy: worker-src blob:;
```

Either way the choice is yours.

## Shopify integration

Most Shopify-oriented components (such as `FetchShopifySection`, `FigureShopify`, and `TrackShopify`) autoload as they do in a bundled build.

The one exception is `FetchShopifyPartial`. Its optional `@shopify/partial-rendering` adapter is not resolved in a no-build CDN setup, so at runtime the component logs a diagnostic and falls back to the behavior of the base [`Fetch`](/reference/items/Fetch/) component — that is, a plain `fetch` of the target URL rather than the partial-rendering path. If your integration depends on the partial-rendering adapter, use a bundled build instead.

## Error handling and diagnostics

### Console messages

The runtime logs warnings under the `[@studiometa/ui-autoload]` prefix for recoverable conditions, including: a conflicting runtime version already active (the later version is ignored), an unknown component token, an unknown eager component, an invalid `data-load` value, an invalid manifest strategy, and an unavailable browser API (`MutationObserver`, `IntersectionObserver`, or `requestIdleCallback`).

### Error events

When a component fails to import or register, the runtime logs an error and dispatches a bubbling `studiometa-ui:error` `CustomEvent` on the document element. Its `detail` carries the failing `token`, the `stage` (`import` or `registration`), and the underlying `error`:

```js
document.addEventListener('studiometa-ui:error', (event) => {
  const { token, stage, error } = event.detail;
  console.error(`Component ${token} failed at ${stage}:`, error);
});
```

### Source maps

Every JavaScript asset served by esm.sh ships with a source map, so browser developer tools show the original sources and package boundaries. No extra configuration is needed.

### Browser support

The autoloader targets ES2020 module browsers — roughly Chrome 63+, Firefox 67+, Safari 11.1+, and Edge 79+. Older browsers that do not support ES modules receive ordinary script errors, without autoloader-specific diagnostics.

## Limitations

A no-build install trades flexibility for a zero-build setup. Its constraints are deliberate:

- **One runtime version per page.** Importing the side-effect entries several times (or across bundle copies) is safe — they coordinate through a single shared runtime and coalesce into one loader. But two different `@studiometa/ui-autoload` versions cannot coexist: the second activation warns and no-ops. Pin one version across every import.
- **A single js-toolkit runtime.** Every autoloaded and manually-imported component on a page must resolve to one `@studiometa/js-toolkit` runtime. On the CDN this holds when every import pins the same version, so the shared peer resolves to one URL. Mixing CDN-loaded components with a separate npm build that bundles its own js-toolkit copy on the same page is unsupported.
- **No `data-component` mutation.** Changing the attribute on an element already in the DOM is not observed; only inserted and removed nodes are.
- **No Shadow DOM.** Components assume ownership of standard light-DOM elements.
- **No templates or stylesheets.** No Twig or server-side templates, no per-instance `data-mount`, and no stylesheets — including no Mapbox CSS. The package ships JavaScript only.
- **ES2020 module browsers only.**
- **Mapbox is not provided.** You supply `mapbox-gl` (and its CSS) through an import map — see [Mapbox integration](#mapbox-integration). Import maps require an ES2020 module browser, which the CDN already assumes.
- **Shopify partial rendering is excluded.** `FetchShopifyPartial` falls back to base `Fetch`.

## Migrating from a bundled install

The markup contract is shared with the bundled runtime, so most templates carry over. To move a page to a no-build CDN install:

1. Remove the npm imports and `registerComponent`/`registerComponents` calls.
2. Add a module script that imports the `@studiometa/ui-autoload/ui` entry from the CDN (and `/ui-mapbox` if you use map components).
3. Confirm your `data-component` tokens match the component names.
4. If you use map components, add an import map for `mapbox-gl` (and the geocoder) and link the Mapbox stylesheet yourself — see [Mapbox integration](#mapbox-integration).
5. Tune loading with `data-load` (and a [`<meta name="studiometa-ui:eager">`](#eager-components) for critical components) as needed.

Because a page must resolve to a single js-toolkit runtime, migrate a page fully rather than mixing a CDN install with a separate bundled build that ships its own js-toolkit. For a build-based setup instead, see [Installation](/guide/installation/) — the same `@studiometa/ui-autoload` entries work there.

## Next steps

- [Declarative runtime](/guide/concepts/declarative-runtime) — the `data-component` / `data-option-*` contract shared with bundled usage.
- [Packages and surfaces](/guide/concepts/packages-and-surfaces) — how the `@studiometa/ui` and `@studiometa/ui-mapbox` surfaces map to components.
- [Browse components by task](/reference/components/).

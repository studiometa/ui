# Browser CDN

The @studiometa/ui browser CDN provides a no-build way to use the library's components in ES2020 module browsers. A short module script imports the [`@studiometa/ui-autoload`](#autoloading-with-studiometa-ui-autoload) runtime, which discovers components from `data-component` attributes and loads their JavaScript on demand. It suits content sites, prototypes, and any environment where a bundler is not available.

The autoloader is a single package — `@studiometa/ui-autoload` — that behaves identically whether you install it from npm and bundle it or load it from the CDN. On the CDN it is served from its own versioned tree and activated by importing a side-effect entry; there is nothing to register by hand. The CDN ships the JavaScript behavior only (no Twig templates or general stylesheets). For scripted use the same versioned trees also expose plain ESM entry points — individual components and the full barrel are importable by pinned URL, see [Manual imports](#manual-imports). See [Limitations](#limitations) before adopting it for an application.

The intended public host is `https://cdn.studiometa.dev`. The version numbers used in the examples below are illustrative; use a version that the CDN actually serves. Until the stable `1.10.0` release ships, prefer the `@next` alias or an exact version (`@<version>`) over a bare, versionless URL — see [Version resolution](#version-resolution).

## Quick start

Add a module script that imports the `@studiometa/ui-autoload/ui` entry. Importing it is the whole contract: it registers the `@studiometa/ui` component manifest with the autoload runtime and starts discovery.

```html
<script type="module">
  import 'https://cdn.studiometa.dev/ui-autoload@next/ui';
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

## Autoloading with @studiometa/ui-autoload

`@studiometa/ui-autoload` is the single autoloading surface for the whole library. Each component package publishes its own manifest (a map of `data-component` tokens to lazy `import()` loaders), and the autoloader composes the manifests you activate into one lookup table. You activate a package's manifest by importing its side-effect entry; for advanced setups, a small [programmatic API](#programmatic-api) exposes the same machinery.

### From the CDN

Import one side-effect entry per package you use. Each import registers that package's manifest with the shared runtime:

```html
<script type="module">
  import 'https://cdn.studiometa.dev/ui-autoload@next/ui';          // auto-load @studiometa/ui components
  import 'https://cdn.studiometa.dev/ui-autoload@next/ui-mapbox';   // auto-load @studiometa/ui-mapbox components
</script>
```

Importing both entries at the top of a module registers both manifests before the runtime starts, so the two coalesce into a single loader over the composed set — never two loaders both scanning the DOM. Importing only `./ui` loads just the `@studiometa/ui` components; add `./ui-mapbox` only when you use the Mapbox family (and provide `mapbox-gl` yourself, see [Mapbox integration](#mapbox-integration)).

The `ui-autoload` tree is versioned in lockstep with `ui` and `ui-mapbox` — the three always share the same version — so pin all your imports to the same reference.

### From an npm install

The exact same entries resolve from `node_modules` when you install the package and let your bundler resolve them:

```js
import '@studiometa/ui-autoload/ui';
import '@studiometa/ui-autoload/ui-mapbox';
```

The activation-on-import semantics are identical; your bundler resolves each package's manifest from `node_modules` and the composed runtime behaves exactly as it does on the CDN. This is the recommended path when a build step is available.

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

Each package exports its own manifest as a named `manifest` export — `@studiometa/ui/manifest` and `@studiometa/ui-mapbox/manifest` — served on the CDN at `/ui@<version>/manifest.js` and `/ui-mapbox@<version>/manifest.js`. The side-effect entries above are thin wrappers that import their package's manifest and register it; the programmatic API lets you compose them yourself.

## Installation patterns

### Exact version (immutable)

Pin an exact version for the longest-lived caching. Exact-version URLs are immutable and cached for one year:

```html
<script type="module">
  import 'https://cdn.studiometa.dev/ui-autoload@1.10.0-beta.1/ui';
</script>
```

### Version aliases (mutable)

Alias URLs resolve to the current matching exact version and redirect to it. They are convenient but carry a short cache lifetime, so prefer an exact version in production:

```html
<script type="module">
  // Latest prerelease (current preview channel)
  import 'https://cdn.studiometa.dev/ui-autoload@next/ui';

  // Latest 1.x release
  import 'https://cdn.studiometa.dev/ui-autoload@1/ui';

  // Latest 1.10.x patch
  import 'https://cdn.studiometa.dev/ui-autoload@1.10/ui';

  // Latest stable release
  import 'https://cdn.studiometa.dev/ui-autoload@latest/ui';
</script>
```

A bare, versionless URL (`/ui-autoload/ui`) follows the `latest` stable tag and therefore only resolves once a stable release exists. During the current prerelease line, use `@next` or an exact version instead.

## Manual imports

The declarative autoloader is the primary way to use the CDN, but every versioned tree is also a set of plain ESM entry points you can import directly. This suits scripted setups that construct components themselves, register a curated subset, or bundle nothing at all while still pinning to the CDN.

The full `@studiometa/ui` surface is available from the barrel, exactly like the npm package's main entry:

```js
import { Action, Dialog, Modal } from 'https://cdn.studiometa.dev/ui@1.9.0/index.js';
```

Individual components are importable by a subpath that mirrors the npm subpath exports — `@studiometa/ui/Action` becomes `/ui@1.9.0/Action.js`:

```js
import { Action } from 'https://cdn.studiometa.dev/ui@1.9.0/Action.js';
```

Both the `.js` extension and the version are optional on a subpath, and the two shortenings combine. A request that omits the extension is resolved against the release's own output inventory and redirected (307) to the canonical asset — `/ui@1.9.0/Action` to `/ui@1.9.0/Action.js`, and a directory-style subpath such as `/js-toolkit@3.8.0/utils` to its `/utils/index.js` barrel. A request that omits the version resolves it the same way a [bare root](#bare-root-redirects) does — `ui`/`ui-mapbox`/`ui-autoload` follow their `latest` tag, `js-toolkit` its highest release — so `/ui/Action` lands on `/ui@<latest>/Action.js` in a single hop. Pin an exact, extensioned URL in production to skip the redirect; the shortened forms are conveniences for authoring and quick experiments:

```js
// Extensionless: redirects to /ui@1.9.0/Action.js
import { Action } from 'https://cdn.studiometa.dev/ui@1.9.0/Action';

// Versionless + extensionless: redirects to /ui@<latest>/Action.js
import { Action } from 'https://cdn.studiometa.dev/ui/Action';
```

This resolution is generic and driven by each release's published output map, so it works identically for every package — `ui`, `ui-mapbox`, `ui-autoload`, `js-toolkit`, and any future one — with no per-package special-casing. A subpath that matches no output (directly, as `<path>.js`, or as `<path>/index.js`) is a `404`.

Each component package also exposes its autoload manifest as a plain module — `/ui@<version>/manifest.js` and `/ui-mapbox@<version>/manifest.js`, each exporting a named `manifest`. These are what the `ui-autoload` side-effect entries import; you only need them directly for the [programmatic API](#programmatic-api).

The `@studiometa/ui-mapbox` components live in their own first-class tree at `/ui-mapbox@<version>/`, versioned in lockstep with `@studiometa/ui` (the trees always share the same version). They follow the same subpath convention as `@studiometa/ui`, and the whole surface is importable from the ui-mapbox barrel (provide `mapbox-gl` yourself, see [Mapbox integration](#mapbox-integration)):

```js
// A single Mapbox component by its subpath, mirroring the npm subpath export.
import { MapboxMap } from 'https://cdn.studiometa.dev/ui-mapbox@1.9.0/MapboxMap.js';

// Or the whole @studiometa/ui-mapbox surface from its barrel.
import { MapboxMap, StoreLocator } from 'https://cdn.studiometa.dev/ui-mapbox@1.9.0/index.js';
```

The ui-mapbox tree resolves versions, aliases (`ui-mapbox@1`, `ui-mapbox@latest`), and preview channels (`ui-mapbox@next`/`ui-mapbox@main`) exactly like the ui tree. Because both trees share the single externalized js-toolkit runtime, autoloaded and manually-imported Mapbox components interoperate with the rest of `@studiometa/ui` on one page.

The `@studiometa/js-toolkit` runtime the components build on ships as its own barrel, and its subpaths follow the same versionless and extensionless shortenings (a versionless js-toolkit request resolves to its highest published release, since js-toolkit carries no `latest` tag):

```js
// Exact-versioned barrel.
import { Base, createApp } from 'https://cdn.studiometa.dev/js-toolkit@3.8.0/index.js';

// Directory-style subpath: redirects to /js-toolkit@3.8.0/utils/index.js
import { isObject } from 'https://cdn.studiometa.dev/js-toolkit@3.8.0/utils';

// Versionless: redirects to /js-toolkit@<highest>/utils/index.js
import { isObject } from 'https://cdn.studiometa.dev/js-toolkit/utils';
```

These entry points are the immutable, versioned assets described under [URL structure and caching](#url-structure-and-caching), so pin an exact version (aliases redirect the same way as the autoloader entries). Use the [Registry](#registry) to discover which components, subpath URLs, and versions a deployment serves. Manual imports do not conflict with the autoloader — a page can either import modules itself or rely on the side-effect entry — as long as everything on the page resolves to a single js-toolkit runtime (see [Limitations](#limitations)).

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

## URL structure and caching

CDN URLs follow a single predictable shape, with one versioned tree per package (`ui`, `ui-mapbox`, `ui-autoload`, and `js-toolkit`):

```
https://cdn.studiometa.dev/{package}@{version}/{file}
```

The `ui`, `ui-mapbox` and `ui-autoload` trees are versioned in lockstep and share the version-resolution rules below; `js-toolkit` is exact-version only.

### Version resolution

| Pattern     | Resolves to                        | Response                     | Use case           |
| ----------- | ---------------------------------- | ---------------------------- | ------------------ |
| `ui@1.9.0`  | That exact release                 | Immutable asset (cached 1 y) | Production pinning |
| `ui@1.9`    | Latest `1.9.x` release             | Redirect to exact version    | Patch updates      |
| `ui@1`      | Latest `1.x` release               | Redirect to exact version    | Major series       |
| `ui@latest` | Current stable release             | Redirect to exact version    | Always current     |
| `ui@next`   | Current preview channel            | Redirect to exact channel    | Preview / testing  |
| `ui@main`   | Current preview channel (= `next`) | Redirect to exact channel    | Preview / testing  |

An alias responds with an HTTP 307 redirect to the fully-resolved, immutable URL (an exact release such as `ui@1.9.0`, or an exact preview channel such as `ui@main-<commit>`). The redirect itself is cached briefly — `max-age=300` for browsers (5 minutes) and `s-maxage=3600` at the edge (1 hour) — while the resolved asset it points to is immutable and cached for a year. Pin an exact version in production so the browser fetches the asset directly without the redirect hop.

Exact versions and exact channels never change once published; only the aliases move.

#### Bare-root redirects

A bare package root — the package name with no version and no file — redirects (307, same short cache as the aliases above) to that package's most useful entry point:

| Bare root      | Redirects to                     | Use case                       |
| -------------- | -------------------------------- | ------------------------------ |
| `/ui`          | `/ui@<latest>/index.js`          | Shortest ui barrel URL         |
| `/ui-mapbox`   | `/ui-mapbox@<latest>/index.js`   | Shortest ui-mapbox barrel URL  |
| `/ui-autoload` | `/ui-autoload@<latest>/index.js` | Shortest ui-autoload barrel URL |
| `/js-toolkit`  | `/js-toolkit@<highest>/index.js` | Shortest js-toolkit barrel URL |

`/ui`, `/ui-mapbox` and `/ui-autoload` follow their `latest` stable tag to the `index.js` barrel; the side-effect autoload entries live at explicit subpaths (`/ui-autoload@<latest>/ui` and `/ui-autoload@<latest>/ui-mapbox`). `/js-toolkit` follows its highest published release to `index.js` (js-toolkit is exact-version only, so this bare root is its only moving pointer). All resolve to the immutable target the [Registry](#registry) reports under `current`.

A package root may also carry a ref but no file — `/ui@<ref>` (with an optional trailing slash) — and redirects (307, same short cache) to that ref's `index.js` barrel. The ref resolves with the full version-resolution rules above, exactly as a `/ui@<ref>/…` asset request does, so the barrel is reachable by every supported ref shape:

| Package root with ref | Redirects to                 | Resolution                        |
| --------------------- | ---------------------------- | --------------------------------- |
| `/ui@1.9.0`           | `/ui@1.9.0/index.js`         | Exact release                     |
| `/ui@1`               | `/ui@<latest 1.x>/index.js`  | Major alias                       |
| `/ui@latest`          | `/ui@<latest>/index.js`      | `latest` dist-tag                 |
| `/ui@next`            | `/ui@<next>/index.js`        | `next` preview channel or release |
| `/ui@main`            | `/ui@main-<commit>/index.js` | `main` preview channel            |

A ref that resolves to nothing is a `404` — the same outcome as the matching asset request (for example `/js-toolkit@main`, since js-toolkit has no channels, or an unpublished `/ui@9.9.9`).

#### Versionless and extensionless subpaths

A subpath may drop the version, the `.js` extension, or both — the Worker resolves each independently and redirects (307, same short cache) to the canonical immutable asset:

| Request                   | Redirects to                           | Resolution                                      |
| ------------------------- | -------------------------------------- | ----------------------------------------------- |
| `/ui@1.9.0/Action`        | `/ui@1.9.0/Action.js`                  | Extensionless output lookup (`<path>.js`)       |
| `/js-toolkit@3.8.0/utils` | `/js-toolkit@3.8.0/utils/index.js`     | Extensionless output lookup (`<path>/index.js`) |
| `/ui/Action`              | `/ui@<latest>/Action.js`               | Versionless (bare-root ladder) + extensionless  |
| `/ui-mapbox/MapboxMap`    | `/ui-mapbox@<latest>/MapboxMap.js`     | Versionless + extensionless                     |
| `/js-toolkit/utils`       | `/js-toolkit@<highest>/utils/index.js` | Versionless + extensionless                     |

A versionless subpath resolves its version exactly like the bare root of the same package (`ui`/`ui-mapbox`/`ui-autoload` by `latest`, `js-toolkit` by highest release). The extensionless step is driven by the release's own published output map: the requested path is served as-is when it names an output, otherwise `<path>.js` is tried, then `<path>/index.js`, otherwise the request is a `404`. This is how `/ui-autoload@<version>/ui` and `/ui-autoload@<version>/ui-mapbox` resolve to their `.js` entries. Both steps are generic across every package and any future one — there is no per-package or per-component list. Pin an exact, extensioned URL in production to avoid the redirect hop; the exact-version, extensioned `.js` and `.map` assets are unaffected and served directly.

### Asset types

Each release directory contains:

- **JavaScript modules** — ES2020 ESM entry points and code-split component chunks. The `ui-autoload` tree ships the `ui` and `ui-mapbox` side-effect entries and the shared runtime; the `ui` and `ui-mapbox` trees ship their components plus a `manifest.js`.
- **Source maps** — a `.map` file next to every `.js` file.
- **Metadata** — `build.json` and `integrity.json` describing the build and its SHA-384 digests.

The CDN ships no stylesheets: the only components that needed one — the Mapbox family — resolve `mapbox-gl` (and its CSS) from your own source (see [Mapbox integration](#mapbox-integration)).

### Transport headers

The Worker serves every asset with permissive cross-origin headers so the modules load from any origin: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`, and `Cross-Origin-Resource-Policy: cross-origin`. `GET`, `HEAD`, and preflight `OPTIONS` are supported. Conditional requests are honored: a matching `If-None-Match` returns `304 Not Modified`.

## Registry

The CDN root is a JSON registry describing everything the deployment serves: which versions and preview channels are published, which references are current, and the absolute URL of every barrel and per-component subpath module. It is the machine-readable index behind [Manual imports](#manual-imports) — fetch it to discover valid versions and component URLs instead of hard-coding them.

```
GET https://cdn.studiometa.dev/
```

It responds with `200` and `Content-Type: application/json; charset=utf-8`, the same cross-origin headers as every other asset, and the short mutable cache the aliases use (`max-age=300` for browsers, `s-maxage=3600` at the edge). `HEAD` returns the same headers with no body.

```json
{
  "packages": {
    "ui": {
      "releases": ["1.9.0"],
      "channels": ["main-<sha>", "pr-<n>-<sha>"],
      "distTags": { "latest": "1.9.0", "next": "main-<sha>", "main": "main-<sha>" }
    },
    "ui-mapbox": {
      "releases": ["1.9.0"],
      "channels": ["main-<sha>", "pr-<n>-<sha>"],
      "distTags": { "latest": "1.9.0", "next": "main-<sha>", "main": "main-<sha>" }
    },
    "ui-autoload": {
      "releases": ["1.9.0"],
      "channels": ["main-<sha>", "pr-<n>-<sha>"],
      "distTags": { "latest": "1.9.0", "next": "main-<sha>", "main": "main-<sha>" }
    },
    "js-toolkit": { "releases": ["3.8.0"] }
  },
  "current": {
    "ui": "1.9.0",
    "ui-mapbox": "1.9.0",
    "ui-autoload": "1.9.0",
    "js-toolkit": "3.8.0"
  },
  "entries": {
    "index": "https://cdn.studiometa.dev/ui@1.9.0/index.js",
    "ui-mapbox": "https://cdn.studiometa.dev/ui-mapbox@1.9.0/index.js",
    "js-toolkit": "https://cdn.studiometa.dev/js-toolkit@3.8.0/index.js"
  },
  "components": [
    {
      "token": "Action",
      "package": "@studiometa/ui",
      "url": "https://cdn.studiometa.dev/ui@1.9.0/Action.js"
    },
    {
      "token": "MapboxMap",
      "package": "@studiometa/ui-mapbox",
      "url": "https://cdn.studiometa.dev/ui-mapbox@1.9.0/MapboxMap.js"
    }
  ]
}
```

The fields are:

- **`packages`** — the published inventory per package: for ui, ui-mapbox and ui-autoload each, their `releases`, immutable `channels`, and `latest`/`next`/`main` distribution tags (the three are versioned in lockstep, so their inventories match), plus js-toolkit's `releases`.
- **`current`** — the reference each package resolves to right now: `current.ui`, `current.ui-mapbox` and `current.ui-autoload` are each the `latest` stable tag (falling back to the current `main` channel, then the highest stable release, then `null`), and `current.js-toolkit` is the highest published release (or `null`).
- **`entries`** — absolute URLs for the current barrels (the ui barrel as `index`, plus `ui-mapbox` and `js-toolkit`). Each package's entry is omitted when that surface is not currently resolvable. The autoload side-effect entries are reachable at `/ui-autoload@<ref>/ui` and `/ui-autoload@<ref>/ui-mapbox`, and each package's manifest at `/ui@<ref>/manifest.js` and `/ui-mapbox@<ref>/manifest.js`.
- **`components`** — one entry per component across the current ui and ui-mapbox builds, sorted by `token`, each with its owning `package` and the absolute subpath URL to import it from — `@studiometa/ui` components from `/ui@<ref>/…` and `@studiometa/ui-mapbox` components from `/ui-mapbox@<ref>/…`. Empty when neither surface is currently resolvable.

## Mapbox integration

Mapbox components (`MapboxMap`, `MapboxMarker`, `StoreLocator`, and the rest of the `@studiometa/ui-mapbox` surface described in [Packages and surfaces](/guide/concepts/packages-and-surfaces)) are served by the CDN from their own `/ui-mapbox@<version>/` tree (see [Manual imports](#manual-imports)), but **`mapbox-gl` itself is not**. The CDN neither bundles nor serves Mapbox GL JS or the Mapbox geocoder — you provide them, which keeps the CDN a neutral mirror of `@studiometa/ui-mapbox` and lets you control the Mapbox version and its Web Worker.

### Provide `mapbox-gl` with an import map

The Mapbox components import `mapbox-gl` (and, for `MapboxGeocoder`, `@mapbox/mapbox-gl-geocoder`) as bare module specifiers. Declare an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) — before the autoload script — that points those specifiers at a source of your choosing (a pinned ESM CDN such as [esm.sh](https://esm.sh), or a copy you host yourself):

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
  import 'https://cdn.studiometa.dev/ui-autoload@next/ui';
  import 'https://cdn.studiometa.dev/ui-autoload@next/ui-mapbox';
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

Either way the choice is yours: the CDN no longer dictates the Mapbox worker's origin.

## Shopify integration

Most Shopify-oriented components (such as `FetchShopifySection`, `FigureShopify`, and `TrackShopify`) work on the CDN as they do in a bundled build.

The one exception is `FetchShopifyPartial`. Its optional `@shopify/partial-rendering` adapter is not available to the CDN build, so the CDN excludes it. At runtime the component logs a diagnostic and falls back to the behavior of the base [`Fetch`](/reference/items/Fetch/) component — that is, a plain `fetch` of the target URL rather than the partial-rendering path. If your integration depends on the partial-rendering adapter, use a bundled build instead.

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

### HTTP errors

Bad requests surface as plain-text HTTP responses from the Worker: `400` for a malformed request, `404` for an unknown package, an unresolved version, or a missing asset, `405` for an unsupported method, and `502` if the version index cannot be read.

### Source maps

Every JavaScript asset ships with a source map referenced from the file, so browser developer tools show the original TypeScript sources and package boundaries. No extra configuration is needed.

### Browser support

The CDN targets ES2020 module browsers — roughly Chrome 63+, Firefox 67+, Safari 11.1+, and Edge 79+. Older browsers that do not support ES modules receive ordinary script errors, without CDN-specific diagnostics.

## Limitations

The CDN trades flexibility for a zero-build install. Its constraints are deliberate:

- **One runtime version per page.** Importing the side-effect entries several times (or across bundle copies) is safe — they coordinate through a single shared runtime and coalesce into one loader. But two different `@studiometa/ui-autoload` versions cannot coexist: the second activation warns and no-ops.
- **A single js-toolkit runtime.** Every autoloaded and manually-imported component on a page must resolve to one js-toolkit runtime. Mixing CDN-loaded components with a separate npm build that bundles its own js-toolkit copy on the same page is unsupported.
- **No `data-component` mutation.** Changing the attribute on an element already in the DOM is not observed; only inserted and removed nodes are.
- **No Shadow DOM.** Components assume ownership of standard light-DOM elements.
- **No templates or stylesheets.** No Twig or server-side templates, no per-instance `data-mount`, and no stylesheets — including no Mapbox CSS. The CDN ships JavaScript only.
- **ES2020 module browsers only.**
- **Mapbox is not provided.** You supply `mapbox-gl` (and its CSS) through an import map — see [Mapbox integration](#mapbox-integration). Import maps require an ES2020 module browser, which the CDN already assumes.
- **Shopify partial rendering is excluded.** `FetchShopifyPartial` falls back to base `Fetch`.

## Migrating from a bundled install

The markup contract is shared with the bundled runtime, so most templates carry over. To move a page to the CDN:

1. Remove the npm imports and `registerComponent`/`registerComponents` calls.
2. Add a module script that imports the `@studiometa/ui-autoload/ui` entry (and `/ui-mapbox` if you use map components).
3. Confirm your `data-component` tokens match the component names.
4. If you use map components, add an import map for `mapbox-gl` (and the geocoder) and link the Mapbox stylesheet yourself — see [Mapbox integration](#mapbox-integration).
5. Tune loading with `data-load` (and a [`<meta name="studiometa-ui:eager">`](#eager-components) for critical components) as needed.

Because a page must resolve to a single js-toolkit runtime, migrate a page fully rather than mixing a CDN install with a separate bundled build that ships its own js-toolkit. For a build-based setup instead, see [Installation](/guide/installation/) — the same `@studiometa/ui-autoload` entries work there.

## Next steps

- [Declarative runtime](/guide/concepts/declarative-runtime) — the `data-component` / `data-option-*` contract shared with bundled usage.
- [Packages and surfaces](/guide/concepts/packages-and-surfaces) — how the `@studiometa/ui` and `@studiometa/ui-mapbox` surfaces map to CDN components.
- [Browse components by task](/reference/components/).

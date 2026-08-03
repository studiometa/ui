# Browser CDN

The @studiometa/ui browser CDN provides a one-script, no-build way to use the library's components in ES2020 module browsers. A single marked script boots a small runtime that discovers components from `data-component` attributes and loads their JavaScript on demand. It suits content sites, prototypes, and any environment where a bundler is not available.

The CDN is a distinct runtime from the bundled package. It is not a drop-in replacement for a JavaScript build: it exposes no programmatic API, cannot be combined with bundled component constructors on the same page, and only ships the JavaScript behavior (no Twig templates or general stylesheets). See [Limitations](#limitations) before adopting it for an application.

The intended public host is `https://cdn.studiometa.dev`. The version numbers used in the examples below are illustrative; use a version that the CDN actually serves.

## Quick start

Add a single marked script. The `data-studiometa-ui` attribute identifies it as the CDN runtime entry:

```html
<script type="module" src="https://cdn.studiometa.dev/ui@1/autoload.js" data-studiometa-ui></script>

<!-- Components mount automatically from their data-component attribute -->
<button
  data-component="Action"
  data-option-on="click"
  data-option-effect="alert('Hello from the CDN!')">
  Click me
</button>
```

The runtime scans the document for `data-component` tokens, imports the matching component modules from the CDN, and registers them with the [js-toolkit](https://js-toolkit.studiometa.dev) runtime that the library uses. No manual registration or bundling step is involved. The declarative contract (`data-component`, `data-ref`, `data-option-*`) is the same one described in [Declarative runtime](/guide/concepts/declarative-runtime).

## Installation patterns

### Exact version (immutable)

Pin an exact version for the longest-lived caching. Exact-version URLs are immutable and cached for one year:

```html
<script
  type="module"
  src="https://cdn.studiometa.dev/ui@1.9.0/autoload.js"
  data-studiometa-ui></script>
```

### Version aliases (mutable)

Alias URLs resolve to the current matching exact version and redirect to it. They are convenient but carry a short cache lifetime, so prefer an exact version in production:

```html
<!-- Latest 1.x release -->
<script type="module" src="https://cdn.studiometa.dev/ui@1/autoload.js" data-studiometa-ui></script>

<!-- Latest 1.9.x patch -->
<script
  type="module"
  src="https://cdn.studiometa.dev/ui@1.9/autoload.js"
  data-studiometa-ui></script>

<!-- Latest stable release -->
<script
  type="module"
  src="https://cdn.studiometa.dev/ui@latest/autoload.js"
  data-studiometa-ui></script>

<!-- Current preview channel (next and main are equivalent aliases) -->
<script
  type="module"
  src="https://cdn.studiometa.dev/ui@next/autoload.js"
  data-studiometa-ui></script>
<script
  type="module"
  src="https://cdn.studiometa.dev/ui@main/autoload.js"
  data-studiometa-ui></script>
```

### Eager component preloading

Append `?components=` to the `autoload.js` URL to force specific components to load immediately, regardless of their default strategy. This is useful for above-the-fold components that must be available without waiting:

```html
<script
  type="module"
  src="https://cdn.studiometa.dev/ui@1/autoload.js?components=Action,Dialog,Menu"
  data-studiometa-ui></script>
```

Rules enforced by the CDN for this query:

- **Maximum of 20 tokens.** More than 20 is rejected with an HTTP 400 and the script will not load.
- **Known components only.** An unknown or malformed token is rejected with an HTTP 400.
- **Canonical form.** Tokens are de-duplicated and sorted alphabetically. A non-canonical query (unsorted, duplicated, or with extra parameters) is redirected to the canonical URL. Only `autoload.js` accepts the `components` parameter; any query string on another asset is redirected away.

## Loading strategies

Every component has a default loading strategy defined in the CDN manifest. Override it per element with `data-load`. The four strategies are:

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

1. **Eager preload** — a component named in the script's `?components=` query always loads eagerly, overriding everything below.
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

CDN URLs follow a single predictable shape:

```
https://cdn.studiometa.dev/ui@{version}/{file}
```

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

### Asset types

Each release directory contains:

- **JavaScript modules** — `autoload.js` plus code-split component chunks (ES2020, ESM).
- **Source maps** — a `.map` file next to every `.js` file.
- **Stylesheets** — Mapbox CSS, served but not auto-injected (see below).
- **Metadata** — `build.json` and `integrity.json` describing the build and its SHA-384 digests.

### Transport headers

The Worker serves every asset with permissive cross-origin headers so the modules load from any origin: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`, and `Cross-Origin-Resource-Policy: cross-origin`. `GET`, `HEAD`, and preflight `OPTIONS` are supported. Conditional requests are honored: a matching `If-None-Match` returns `304 Not Modified`.

## Mapbox integration

Mapbox components (`MapboxMap`, `MapboxMarker`, `StoreLocator`, and the rest of the `@studiometa/ui-mapbox` surface described in [Packages and surfaces](/guide/concepts/packages-and-surfaces)) are bundled into the CDN and loaded lazily. They carry extra requirements.

### Stylesheets

Mapbox CSS is **not** auto-injected. Link it yourself, and only add the geocoder stylesheet if you use `MapboxGeocoder`:

```html
<link rel="stylesheet" href="https://cdn.studiometa.dev/ui@1/styles/mapbox-gl.css" />
<!-- Only when using MapboxGeocoder -->
<link rel="stylesheet" href="https://cdn.studiometa.dev/ui@1/styles/mapbox-gl-geocoder.css" />
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

Mapbox components default to the `visible` strategy, so the heavy map code only loads when a map approaches the viewport rather than on initial page load. `MapboxGeocoder` loads its geocoder dependency as a separate dynamic import, so core map components stay free of the geocoder's weight.

### Content Security Policy

The standard Mapbox GL bundle creates its Web Worker from a `blob:` URL. A page with a Content Security Policy must therefore allow blob workers:

```
Content-Security-Policy: worker-src blob:;
```

No strict-CSP build (one that avoids `blob:` workers by loading an external worker script) is shipped on the CDN. Supporting a strict CSP that forbids `blob:` workers would require serving the Mapbox worker from the consumer's own origin, which a future release could enable via a consumer same-origin deployment. Until then, pages that cannot allow `worker-src blob:` cannot run the CDN's Mapbox components.

### Redistribution gate

The CDN bundles Mapbox GL JS and the Mapbox geocoder. Their build metadata carries a release gate marking public redistribution of those libraries as requiring explicit review before the CDN serves them publicly. This is an operational gate recorded in the build, not a legal determination, and it is handled as part of the CDN's internal release process.

## Shopify integration

Most Shopify-oriented components (such as `FetchShopifySection`, `FigureShopify`, and `TrackShopify`) work on the CDN as they do in a bundled build.

The one exception is `FetchShopifyPartial`. Its optional `@shopify/partial-rendering` adapter is not available to the CDN build, so the CDN excludes it. At runtime the component logs a diagnostic and falls back to the behavior of the base [`Fetch`](/reference/items/Fetch/) component — that is, a plain `fetch` of the target URL rather than the partial-rendering path. If your integration depends on the partial-rendering adapter, use a bundled build instead.

## Error handling and diagnostics

### Console messages

The runtime logs warnings under the `[@studiometa/ui-cdn]` prefix for recoverable conditions, including: no marked script found, more than one marked script (loading stops), a conflicting runtime already active, an unknown component token, an unknown eager component, and an invalid `data-load` value.

### Error events

When a component fails to import or register, the runtime logs an error and dispatches a bubbling `studiometa-ui:error` `CustomEvent` on the document element. Its `detail` carries the failing `token`, the `stage` (`import` or `registration`), and the underlying `error`:

```js
document.addEventListener('studiometa-ui:error', (event) => {
  const { token, stage, error } = event.detail;
  console.error(`Component ${token} failed at ${stage}:`, error);
});
```

### HTTP errors

Bad requests surface as plain-text HTTP responses from the Worker: `400` for a malformed request or an invalid `?components=` query, `404` for an unknown package, an unresolved version, or a missing asset, `405` for an unsupported method, and `502` if the version index cannot be read.

### Source maps

Every JavaScript asset ships with a source map referenced from the file, so browser developer tools show the original TypeScript sources and package boundaries. No extra configuration is needed.

### Browser support

The CDN targets ES2020 module browsers — roughly Chrome 63+, Firefox 67+, Safari 11.1+, and Edge 79+. Older browsers that do not support ES modules receive ordinary script errors, without CDN-specific diagnostics.

## Limitations

The CDN trades flexibility for a zero-build install. Its constraints are deliberate:

- **One runtime, one script.** Exactly one `data-studiometa-ui` script is allowed per page. A second marked script, or a second CDN version, stops loading.
- **No mixed usage.** You cannot combine CDN-loaded components with bundled component constructors from an npm build on the same page.
- **No multiple versions.** Two CDN versions cannot coexist in one document.
- **No `data-component` mutation.** Changing the attribute on an element already in the DOM is not observed; only inserted and removed nodes are.
- **No Shadow DOM.** Components assume ownership of standard light-DOM elements.
- **No programmatic API.** The runtime exposes no supported extension points or public methods; discovery is entirely declarative.
- **JavaScript only.** No Twig or server-side templates, no per-instance `data-mount`, and no general stylesheets — only the Mapbox CSS files are provided.
- **ES2020 module browsers only.**
- **Mapbox needs `worker-src blob:`.** Strict CSPs that forbid blob workers are not supported.
- **Shopify partial rendering is excluded.** `FetchShopifyPartial` falls back to base `Fetch`.

## Migrating from a bundled install

The markup contract is shared with the bundled runtime, so most templates carry over. To move a page to the CDN:

1. Remove the npm imports and `registerComponent`/`registerComponents` calls.
2. Add the single marked CDN script.
3. Confirm your `data-component` tokens match the component names.
4. Link the Mapbox stylesheets manually if you use map components.
5. Allow `worker-src blob:` in your CSP if you use Mapbox.
6. Tune loading with `data-load` (and `?components=` for critical components) as needed.

The CDN and a bundled build cannot be mixed on one page, so migrate a page fully rather than partially. For a build-based setup instead, see [Installation](/guide/installation/).

## Next steps

- [Declarative runtime](/guide/concepts/declarative-runtime) — the `data-component` / `data-option-*` contract shared with bundled usage.
- [Packages and surfaces](/guide/concepts/packages-and-surfaces) — how the `@studiometa/ui` and `@studiometa/ui-mapbox` surfaces map to CDN components.
- [Browse components by task](/reference/components/).

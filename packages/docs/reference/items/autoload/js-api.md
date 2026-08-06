---
title: autoload JS API
outline: deep
---

# JS API

Every export of `@studiometa/ui-autoload`. The high-level functions — [`autoload`](#autoload), [`composeManifests`](#composemanifests) and [`registerManifest`](#registermanifest) — cover almost every use case; [`ComponentLoader`](#componentloader) is the low-level engine they build on, exposed for full control. See the [Autoloading guide](/guide/autoloading/) for the declarative, no-call setup.

Each component package exports its manifest as a named `manifest` export — `@studiometa/ui/manifest` and `@studiometa/ui-mapbox/manifest` — which is what you pass to these functions.

## autoload

```ts
function autoload(options: AutoloadOptions): AutoloadHandle;
```

Composes the given manifests, creates a [`ComponentLoader`](#componentloader), starts discovery, and returns a handle. Calling this function is the only thing that touches the DOM — importing the module does nothing on its own.

```js
import { autoload } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';

const handle = autoload({ manifests: [uiManifest] });
```

The returned [`AutoloadHandle`](#autoloadhandle) exposes the underlying `loader`, the composed `manifest`, and a `stop()` method that ends discovery and releases every scheduled trigger. See [`AutoloadOptions`](#autoloadoptions) for the accepted options.

## composeManifests

```ts
function composeManifests(manifests: readonly ComponentManifest[]): ComponentManifest;
```

Merges several manifests into one lookup table without starting a loader. When two manifests declare the same token, the entry from the manifest that appears later in the array wins, so callers can layer overrides on top of a base manifest. `autoload()` uses this internally; call it directly when you need the composed table on its own.

```js
import { composeManifests } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';

const manifest = composeManifests([uiManifest, mapboxManifest]);
```

## registerManifest

```ts
function registerManifest(
  manifest: ComponentManifest,
  options?: RegisterManifestOptions,
): AutoloadRuntime | undefined;
```

Registers a component manifest with a shared, cross-copy runtime stored on `globalThis`, and ensures the autoloader starts exactly once over the accumulated set. This is the shared engine behind the per-package side-effect entries (`@studiometa/ui-autoload/ui` and `.../ui-mapbox`); reach for it only when you build your own side-effect entry.

It is safe to call from several entries and several bundle copies at once:

- The first registration schedules a single start through a microtask. Because every ES module import in a graph evaluates before microtasks flush, registering several manifests at the top of a module results in exactly one [`autoload`](#autoload) call over the composed set — never two loaders both scanning the DOM.
- A manifest registered after the start already fired is not dropped: it triggers a fresh start over the accumulated manifests, stopping the previous loader first so a single loader stays active.
- A conflicting activation — a different [`version`](#registermanifestoptions) claiming an already-owned runtime — logs a warning and no-ops, returning `undefined`.

Returns the shared [`AutoloadRuntime`](#autoloadruntime), or `undefined` when a conflicting version already owns it. See [`RegisterManifestOptions`](#registermanifestoptions) for the injectable seams.

## readEagerTokens

```ts
function readEagerTokens(documentObject: Document): string[];
```

Reads the eager tokens declared by `<meta name="studiometa-ui:eager" content="A, B, C">`. The `content` values of every matching meta (in document order) are concatenated, split on commas, trimmed, stripped of empties and de-duplicated. When no such meta exists the list is empty. `registerManifest()` calls this to resolve the eager set for its start; call it yourself only when composing a custom entry.

## ComponentLoader

```ts
class ComponentLoader {
  constructor(options: ComponentLoaderOptions);
  start(options?: ComponentLoaderStartOptions): void;
  stop(): void;
}
```

The low-level loader that scans a root for `[data-component]` elements, schedules each token according to its [strategy](/guide/autoloading/#loading-strategies), imports the matching module, and registers it with js-toolkit exactly once per document. [`autoload`](#autoload) constructs and starts one for you; instantiate it directly only when you need to own its lifecycle.

```js
import { ComponentLoader } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';

const loader = new ComponentLoader({ manifest: uiManifest });
loader.start({ eagerComponents: ['Action'] });
// loader.stop();
```

See [`ComponentLoaderOptions`](#componentloaderoptions) and [`ComponentLoaderStartOptions`](#componentloaderstartoptions) for the accepted options.

## Constants

The loader's built-in tuning values, exported so a custom loader or diagnostics can reuse them:

| Constant                    | Value                         | Description                                                                                                       |
| --------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `DEFAULT_DIAGNOSTIC_PREFIX` | `'[@studiometa/ui-autoload]'` | The prefix prepended to every diagnostic message when the host does not inject its own.                           |
| `VISIBLE_ROOT_MARGIN`       | `'200px 0px'`                 | The `IntersectionObserver` root margin used to start loading `visible` components before they enter the viewport. |
| `IDLE_TIMEOUT`              | `2000`                        | The timeout (ms) that guarantees `idle` components eventually load even when the main thread stays busy.          |

## Types

The exported types, all importable from `@studiometa/ui-autoload`.

- **`ComponentLoadStrategy`** — `'eager' | 'visible' | 'idle' | 'interaction'`: when a component's constructor is imported and registered.
- **`ComponentManifestEntry`** — everything the loader needs to discover a `data-component` token and load its constructor on demand (`token`, `packageName`, `subpath`, `exportName`, `strategy`, `group`, optional `children`/`styles`/`integrations`, and the `load()` importer).
- **`ComponentManifest`** — a `Record<string, ComponentManifestEntry>` mapping tokens to their entries.
- **`CuratedComponentMetadata`** — the authoring metadata for one component, consumed by the manifest generator.
- **`ComponentCatalog`** — the authoring catalog for a component package: its components, their shared default strategy, and the abstract exports excluded from the manifest.
- **`AutoloadOptions`** — the options accepted by [`autoload`](#autoload): `manifests` (required), optional `root`, `eager` and `dependencies`.
- **`AutoloadHandle`** — the handle returned by [`autoload`](#autoload): `loader`, `manifest`, and `stop()`.
- **`RegisterManifestOptions`** — the injectable seams for [`registerManifest`](#registermanifest): `document`, `globalObject`, `version`, `root`, `dependencies`, `console` and `scheduleMicrotask`.
- **`AutoloadRuntime`** — the shared, cross-copy runtime object [`registerManifest`](#registermanifest) stores on `globalThis`.
- **`ComponentLoaderOptions`** — the options accepted by the [`ComponentLoader`](#componentloader) constructor: `manifest` (required), optional `root` and `dependencies`.
- **`ComponentLoaderStartOptions`** — the options accepted by `ComponentLoader.start()`: an optional `eagerComponents` iterable.
- **`LoaderDependencies`** — the dependency-injection seams a loader resolves (browser globals, `registerComponent`, `console`, `CustomEvent`, and the `diagnosticPrefix`), all optional and testability-oriented.

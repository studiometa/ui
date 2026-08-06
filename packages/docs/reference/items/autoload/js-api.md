---
title: autoload JS API
outline: deep
---

# JS API

Every export of `@studiometa/ui-autoload`. The high-level functions — [`autoload`](#autoload), [`composeManifests`](#composemanifests), [`registerManifest`](#registermanifest) and [`registerManifests`](#registermanifests) — cover almost every use case; [`defineManifest`](#definemanifest) with the [`fromMetaGlob`](#frommetaglob) / [`fromWebpackContext`](#fromwebpackcontext) adapters builds a manifest from your own component files; and [`ComponentLoader`](#componentloader) is the low-level engine they build on, exposed for full control. See the [Autoloading guide](/guide/autoloading/) for the declarative, no-call setup, and [Custom manifests](./custom-manifests) for the worked custom-component workflow.

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

## registerManifests

```ts
function registerManifests(...manifests: ComponentManifest[]): AutoloadRuntime | undefined;
```

Registers several manifests with the shared runtime in one call, then lets the single coalesced start flush over the composed set. It is the variadic convenience wrapper an application uses to layer its own components on top of the packaged ones.

```js
import { registerManifests, defineManifest, fromMetaGlob } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';

const custom = defineManifest({
  packageName: '@my/app',
  modules: fromMetaGlob(import.meta.glob('./components/*/*.ts')),
});

registerManifests(uiManifest, mapboxManifest, custom);
```

Each manifest is registered in call order and, because the runtime composes them later-wins, the **last** manifest wins on token collisions — so a custom manifest passed last overrides any packaged component that shares a token. Returns the shared [`AutoloadRuntime`](#autoloadruntime) from the final registration, or `undefined` when a conflicting version already owns the runtime (or when no manifest was passed). See [Custom manifests](./custom-manifests) for the full workflow.

## defineManifest

```ts
function defineManifest(options: DefineManifestOptions): ComponentManifest;
```

Builds a [`ComponentManifest`](#types) from a record of lazy importers — the pure counterpart of the generated per-package manifests, for autoloading your own js-toolkit components. It is pure: it never touches the DOM and never registers anything, so pass its result to [`registerManifests`](#registermanifests) or [`autoload`](#autoload) to start discovery.

```js
import { defineManifest, fromWebpackContext } from '@studiometa/ui-autoload';

const manifest = defineManifest({
  packageName: '@my/app',
  strategy: 'visible',
  modules: fromWebpackContext(
    import.meta.webpackContext('./components', { recursive: true, regExp: /\.ts$/, mode: 'lazy' }),
  ),
  components: {
    MyComponent: { strategy: 'idle', children: ['MyComponentItem'] },
  },
});
```

For each `[key, importer]` in `options.modules` it derives a `token` from the module key — the basename without its extension, or the parent directory name when the basename is `index` (so `./a/b/Foo/index.ts` yields `Foo`) — resolves the named export matching the token (falling back to the module's `default` export), and applies the option-level and per-token defaults. When two module keys derive the same token a warning is logged under the `[@studiometa/ui-autoload]` prefix and the later key wins. See [`DefineManifestOptions`](#types) and [`ComponentOverride`](#types), and the worked examples in [Custom manifests](./custom-manifests).

## fromMetaGlob

```ts
function fromMetaGlob(glob: Record<string, unknown>): ModuleRecord;
```

Normalizes the record returned by Vite's `import.meta.glob('./x/*.ts')` into a [`ModuleRecord`](#types) for [`defineManifest`](#definemanifest). The lazy form of `import.meta.glob` already returns `Record<string, () => Promise<Module>>`, so this is an identity pass with a guard: it throws when any value is not a function, which means an eager glob (`import.meta.glob('...', { eager: true })`) was passed — an unsupported shape, because eager globs resolve the modules synchronously and defeat on-demand loading.

```js
import { fromMetaGlob } from '@studiometa/ui-autoload';

const modules = fromMetaGlob(import.meta.glob('./components/*/*.ts'));
```

## fromWebpackContext

```ts
function fromWebpackContext(context: WebpackContextLike): ModuleRecord;
```

Normalizes a webpack context — the value returned by `import.meta.webpackContext(dir, { recursive, regExp, mode })` — into a [`ModuleRecord`](#types) for [`defineManifest`](#definemanifest). A webpack context is a callable with a `keys()` method rather than a record of importers, so this wraps each key in `() => Promise.resolve(context(key))`; `Promise.resolve` tolerates both a synchronous module (`mode: 'sync'`) and a promise (`mode: 'lazy'`). Pass `mode: 'lazy'` for real code-splitting and on-demand loading — the other modes bundle every match eagerly.

```js
import { fromWebpackContext } from '@studiometa/ui-autoload';

const modules = fromWebpackContext(
  import.meta.webpackContext('./components', { recursive: true, regExp: /\.ts$/, mode: 'lazy' }),
);
```

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
- **`ComponentManifestEntry`** — everything the loader needs to discover a `data-component` token and load its constructor on demand. Only `token`, `strategy` and the `load()` importer are required; `packageName`, `subpath`, `exportName` and `group` are optional informational metadata never read by the loader, and `children`/`styles`/`integrations` are optional too.
- **`ComponentManifest`** — a `Record<string, ComponentManifestEntry>` mapping tokens to their entries.
- **`ModuleRecord`** — `Record<string, () => Promise<Record<string, unknown>>>`: a map of module keys to lazy importers, the shape [`fromMetaGlob`](#frommetaglob) and [`fromWebpackContext`](#fromwebpackcontext) produce and [`defineManifest`](#definemanifest) consumes.
- **`DefineManifestOptions`** — the options accepted by [`defineManifest`](#definemanifest): `modules` (required), optional `packageName`, `strategy` (defaults to `'eager'`), `group`, and a `components` map of per-token overrides.
- **`ComponentOverride`** — a per-token override applied on top of the values [`defineManifest`](#definemanifest) derives from a module key: optional `token`, `strategy`, `group`, `exportName`, `children`, `styles` and `integrations`.
- **`WebpackContextLike`** — the structural shape of a webpack context accepted by [`fromWebpackContext`](#fromwebpackcontext): a callable `(id: string) => unknown` that also exposes `keys(): string[]`.
- **`CuratedComponentMetadata`** — the authoring metadata for one component, consumed by the manifest generator.
- **`ComponentCatalog`** — the authoring catalog for a component package: its components, their shared default strategy, and the abstract exports excluded from the manifest.
- **`AutoloadOptions`** — the options accepted by [`autoload`](#autoload): `manifests` (required), optional `root`, `eager` and `dependencies`.
- **`AutoloadHandle`** — the handle returned by [`autoload`](#autoload): `loader`, `manifest`, and `stop()`.
- **`RegisterManifestOptions`** — the injectable seams for [`registerManifest`](#registermanifest): `document`, `globalObject`, `version`, `root`, `dependencies`, `console` and `scheduleMicrotask`.
- **`AutoloadRuntime`** — the shared, cross-copy runtime object [`registerManifest`](#registermanifest) stores on `globalThis`.
- **`ComponentLoaderOptions`** — the options accepted by the [`ComponentLoader`](#componentloader) constructor: `manifest` (required), optional `root` and `dependencies`.
- **`ComponentLoaderStartOptions`** — the options accepted by `ComponentLoader.start()`: an optional `eagerComponents` iterable.
- **`LoaderDependencies`** — the dependency-injection seams a loader resolves (browser globals, `registerComponent`, `console`, `CustomEvent`, and the `diagnosticPrefix`), all optional and testability-oriented.

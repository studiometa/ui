---
title: Custom manifests
outline: deep
---

# Custom manifests

The autoloader is generic: it knows nothing hard-coded about any component package and works purely from the [manifest](/reference/items/autoload/js-api#types) it is given. That is the seam this page uses — you can hand it a manifest built from your own component files and have your custom js-toolkit components autoload from `data-component` attributes exactly like the packaged `@studiometa/ui` ones.

This page documents the custom-component workflow: [`defineManifest`](/reference/items/autoload/js-api#definemanifest) builds a manifest from a record of lazy importers, the [`fromMetaGlob`](/reference/items/autoload/js-api#frommetaglob) and [`fromWebpackContext`](/reference/items/autoload/js-api#fromwebpackcontext) adapters produce that record from a bundler glob, and [`registerManifests`](/reference/items/autoload/js-api#registermanifests) registers several manifests at once. For the declarative setup, loading strategies, component discovery and diagnostics — all shared with this workflow — see the [Autoloading guide](/guide/autoloading/).

## Mental model

Autoloading is one pipeline, whatever the manifest's source: a `data-component` token is discovered in the DOM, looked up in the composed manifest, its module is dynamically imported when the token's [load strategy](/guide/autoloading/#loading-strategies) fires, and the resolved constructor is mounted with js-toolkit's `registerComponent`. At runtime the loader reads only four fields of each entry — `token`, `strategy`, `children` and `load()`. The rest (`packageName`, `subpath`, `exportName`, `group`) is optional informational metadata that helper-built manifests may omit.

`defineManifest` is the pure factory that assembles those entries for you from a folder of components; it never touches the DOM and never registers anything, so it composes cleanly with the [programmatic API](/reference/items/autoload/js-api). You register the manifest it returns to actually start discovery.

## Building a manifest with `defineManifest`

[`defineManifest`](/reference/items/autoload/js-api#definemanifest) takes a record of lazy importers keyed by module path and turns each entry into a manifest entry.

```js
import { defineManifest } from '@studiometa/ui-autoload';

const manifest = defineManifest({
  packageName: '@my/app',
  strategy: 'visible',
  modules: {
    './components/MyComponent.ts': () => import('./components/MyComponent.ts'),
    './components/MyMenu.ts': () => import('./components/MyMenu.ts'),
  },
});
```

Writing the `modules` record by hand quickly becomes tedious, so in practice you feed it a bundler glob through one of the adapters below. Everything on this page applies whichever way the record is produced.

### Token derivation

The `data-component` token is derived from each module key: the basename without its extension, or the parent directory name when the basename is `index`. So `./components/MyComponent.ts` becomes the `MyComponent` token, and `./components/Foo/index.ts` becomes `Foo`. Name your files after the token you want in the markup and there is nothing else to configure.

### Export resolution

The generated `load()` resolves the named export matching the token, falling back to the module's `default` export. Both of these resolve to the same `MyComponent` token:

```js
// MyComponent.ts — named export matching the token
export class MyComponent extends Base {
  static config = { name: 'MyComponent' };
}

// MyComponent.ts — default export, resolved as a fallback
export default class MyComponent extends Base {
  static config = { name: 'MyComponent' };
}
```

Override the resolved export with `exportName` when the class name differs from the token (see [Overrides](#per-token-overrides)).

### Per-token overrides

The optional `components` map tweaks individual entries, keyed by the **derived** token. Every field is optional and overrides the value `defineManifest` would otherwise derive:

```js
const manifest = defineManifest({
  strategy: 'eager',
  modules: fromMetaGlob(import.meta.glob('./components/*/*.ts')),
  components: {
    // Load this one lazily and pull in a child it configures.
    Gallery: { strategy: 'idle', children: ['GalleryItem'] },
    // The file is Card.ts but the exported class is `SpecialCard`.
    Card: { exportName: 'SpecialCard' },
    // Rename the token exposed in the markup.
    Legacy: { token: 'LegacyComponent' },
  },
});
```

The `strategy`, `group` and `exportName` overrides replace the option-level or derived defaults; `token` renames the manifest key; and `children`, `styles` and `integrations` attach the corresponding metadata.

### Defaults

- **`strategy`** — an entry's strategy is `override.strategy ?? options.strategy ?? 'eager'`.
- **`group`** — `override.group ?? options.group ?? token`.
- **`packageName`** — `options.packageName`, or omitted entirely when you do not pass one.

### Duplicate tokens

When two module keys derive the same token — for example `./a/Card.ts` and `./b/Card.ts` — a warning is logged under the `[@studiometa/ui-autoload]` prefix and the later key wins. Keep component filenames unique across the folders you glob, or disambiguate with a `token` override.

## Feeding a bundler glob

`defineManifest` needs a `ModuleRecord` — a map of keys to lazy importers. Vite and webpack each expose a glob primitive, but they return different shapes, so there is one adapter for each.

### Vite — `fromMetaGlob`

Vite's `import.meta.glob('./x/*.ts')` already returns `Record<string, () => Promise<Module>>`, so [`fromMetaGlob`](/reference/items/autoload/js-api#frommetaglob) is an identity pass with a guard. Keep the glob lazy — it throws on an eager glob (`{ eager: true }`), which would resolve every module synchronously and defeat on-demand loading.

```js
import { defineManifest, fromMetaGlob } from '@studiometa/ui-autoload';

const manifest = defineManifest({
  packageName: '@my/app',
  strategy: 'visible',
  modules: fromMetaGlob(import.meta.glob('./components/*/*.ts')),
});
```

### webpack — `fromWebpackContext`

webpack's `import.meta.webpackContext(dir, options)` returns a **context function** — a callable with a `keys()` method — rather than a record, so [`fromWebpackContext`](/reference/items/autoload/js-api#fromwebpackcontext) wraps each key into an importer. Pass `mode: 'lazy'` so each component is code-split and loaded on demand; the other modes bundle every match eagerly.

```js
import { defineManifest, fromWebpackContext } from '@studiometa/ui-autoload';

const manifest = defineManifest({
  packageName: '@my/app',
  strategy: 'visible',
  modules: fromWebpackContext(
    import.meta.webpackContext('./components', { recursive: true, regExp: /\.ts$/, mode: 'lazy' }),
  ),
});
```

A broad glob is cheap: `defineManifest` only wraps each match in a lazy importer, and an entry's module is fetched solely when a matching token actually appears in the DOM and its strategy fires. Matching a whole `components` directory does not eagerly load anything.

## Registering alongside the packaged manifests

[`registerManifests`](/reference/items/autoload/js-api#registermanifests) registers several manifests with the shared runtime in one call. Because the runtime composes them later-wins, the **last** manifest wins on token collisions — so passing your custom manifest last lets it override any packaged component that shares a token.

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

That single call registers all three manifests before the runtime's coalesced start flushes, so exactly one loader scans the DOM over the composed set. Your `./components/MyComponent.ts` now mounts wherever `data-component="MyComponent"` appears, right next to the packaged `@studiometa/ui` and `@studiometa/ui-mapbox` components.

## Constraints and gotchas

- **Components must be js-toolkit `Base` subclasses.** The loader validates the resolved value and, when it is not a `Base` constructor, logs an error and dispatches a bubbling `studiometa-ui:error` event instead of mounting it (see [Diagnostics](#diagnostics)). `defineManifest` does not validate — the loader is the single source of truth.
- **Children need no separate entry.** A token listed in an entry's `children` is resolved from the parent's `config.components` when the parent registers, so a component nested only inside another (for example `GalleryItem` inside `Gallery`) does not need its own manifest entry — list it under the parent's `children` and expose it through the parent's `config.components`.
- **Broad globs stay cheap.** Entries only `load()` when a matching token is discovered in the DOM and its strategy fires, so globbing an entire component directory adds no upfront cost.
- **One token per file across the glob.** Duplicate derived tokens warn and the later file wins; keep filenames unique or use a `token` override.
- **`data-component` mutations are not observed.** As with the packaged components, only inserted and removed nodes are discovered — see the guide's [Component discovery](/guide/autoloading/#component-discovery).

## Diagnostics

The runtime surfaces problems two ways, identically to the packaged flow:

- **Console messages** under the `[@studiometa/ui-autoload]` prefix for recoverable conditions — an unknown token, an invalid `data-load` value, a duplicate derived token, or an unavailable browser API.
- **Error events** — when a component fails to import or register (including a resolved value that is not a `Base` constructor), a bubbling `studiometa-ui:error` `CustomEvent` is dispatched on the document element. Its `detail` carries the failing `token`, the `stage` (`import` or `registration`), and the underlying `error`:

```js
document.addEventListener('studiometa-ui:error', (event) => {
  const { token, stage, error } = event.detail;
  console.error(`Component ${token} failed at ${stage}:`, error);
});
```

## Next steps

- [JS API](./js-api) — the full signature of every export, including [`defineManifest`](/reference/items/autoload/js-api#definemanifest) and the adapters.
- [Autoloading guide](/guide/autoloading/) — loading strategies, the eager `<meta>`, component discovery and the declarative contract shared with this workflow.
- [Declarative runtime](/guide/concepts/declarative-runtime) — the `data-component` / `data-option-*` contract your custom components use.

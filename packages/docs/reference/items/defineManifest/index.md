---
badges: [JS]
outline: deep
---

# defineManifest <Badges :texts="$frontmatter.badges" />

`defineManifest` builds a [`ComponentManifest`](/reference/items/autoload/js-api#types) from a record of lazy importers, so your own js-toolkit components autoload from `data-component` attributes exactly like the packaged `@studiometa/ui` ones. It is the pure counterpart of the generated per-package manifests: it never touches the DOM and never registers anything. Pass its result to [`registerManifests`](/reference/items/registerManifests/) or [`autoload`](/reference/items/autoload/js-api#autoload) to start discovery.

This page also documents the two adapters that produce the `modules` record it consumes — [`fromMetaGlob`](#frommetaglob) for Vite and [`fromWebpackContext`](#fromwebpackcontext) for webpack. For the end-to-end narrative, see [Custom manifests](/reference/items/autoload/custom-manifests); for the mental model shared with the packaged components, see the [Autoloading guide](/guide/autoloading/).

## Signature

```ts
function defineManifest(options: DefineManifestOptions): ComponentManifest;
```

## Parameters

### `options`

The single `DefineManifestOptions` argument.

| Property      | Type                                | Required | Default                | Description                                                                                             |
| ------------- | ----------------------------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `modules`     | `ModuleRecord`                      | yes      | —                      | The lazy importers to build entries from, keyed by module path. Feed a bundler glob through an adapter. |
| `packageName` | `string`                            | no       | omitted                | The npm package the components belong to. Informational only — the loader never reads it.               |
| `strategy`    | `ComponentLoadStrategy`             | no       | `'eager'`              | The default [load strategy](/guide/autoloading/#loading-strategies) applied to every component.         |
| `group`       | `string`                            | no       | each component's token | The default grouping key applied to every component. Informational only.                                |
| `components`  | `Record<string, ComponentOverride>` | no       | `{}`                   | Per-token overrides, keyed by the **derived** token (see [Token derivation](#token-derivation)).        |

### `ComponentOverride`

Every field is optional; an omitted field keeps the derived or option-level default.

| Property       | Type                    | Default            | Description                                                                          |
| -------------- | ----------------------- | ------------------ | ------------------------------------------------------------------------------------ |
| `token`        | `string`                | the derived token  | Replace the token derived from the module key (renames the manifest entry).          |
| `strategy`     | `ComponentLoadStrategy` | `options.strategy` | Override the load strategy for this one component.                                   |
| `group`        | `string`                | `options.group`    | Override the grouping key for this one component.                                    |
| `exportName`   | `string`                | the token          | The named export to resolve from the module.                                         |
| `children`     | `readonly string[]`     | omitted            | Tokens of the constructor's configured child components, for recursive registration. |
| `styles`       | `readonly string[]`     | omitted            | Stylesheet paths associated with this component. Informational only.                 |
| `integrations` | `readonly string[]`     | omitted            | Integration keys associated with this component. Informational only.                 |

## Return value

Returns a [`ComponentManifest`](/reference/items/autoload/js-api#types) — a `Record<string, ComponentManifestEntry>` mapping each derived `data-component` token to its entry. For every `[key, importer]` in `options.modules`, `defineManifest` produces one entry:

- **`token`** — derived from the module key, or the `token` override.
- **`strategy`** — `override.strategy ?? options.strategy ?? 'eager'`.
- **`group`** — `override.group ?? options.group ?? token`.
- **`load`** — a thunk that calls the importer and resolves the export named by `exportName` (defaulting to the token), falling back to the module's `default` export.
- **`packageName`**, **`children`**, **`styles`**, **`integrations`** — set only when provided through the options or the override.

The factory is pure: no DOM access, no registration. It also does **not** validate that the resolved value is a js-toolkit `Base` constructor — the loader does that on load and dispatches a [`studiometa-ui:error`](/reference/items/autoload/custom-manifests#diagnostics) event when it is not.

## Token derivation

The `data-component` token comes from each module key: the basename without its extension, or the parent directory name when the basename is `index`.

| Module key                      | Derived token |
| ------------------------------- | ------------- |
| `./components/MyComponent.ts`   | `MyComponent` |
| `./components/Card/Card.ts`     | `Card`        |
| `./components/Gallery/index.ts` | `Gallery`     |

Name each file after the token you want in the markup and there is nothing else to configure. When a file's exported class name differs from the token, set `exportName`; to expose a different token than the filename, set `token`.

## Export resolution

The generated `load()` resolves the export named by the token (or `exportName`), falling back to `default`. Both of these resolve to the `MyComponent` token:

```js
// components/MyComponent.ts — named export matching the token
export class MyComponent extends Base {
  static config = { name: 'MyComponent' };
}

// components/MyComponent.ts — default export, resolved as a fallback
export default class MyComponent extends Base {
  static config = { name: 'MyComponent' };
}
```

## Duplicate tokens

When two module keys derive the same token (for example `./a/Card.ts` and `./b/Card.ts`), a warning is logged under the `[@studiometa/ui-autoload]` prefix and the later key wins. Keep component filenames unique across the folders you glob, or disambiguate with a `token` override.

## Examples

### Vite

```js
import { defineManifest, fromMetaGlob } from '@studiometa/ui-autoload';

const manifest = defineManifest({
  packageName: '@my/app',
  strategy: 'visible',
  modules: fromMetaGlob(import.meta.glob('./components/*/*.ts')),
});
```

### webpack

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

### Per-token overrides

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

### Registering the result

`defineManifest` only builds data. Register it to start discovery:

```js
import { registerManifests } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';

registerManifests(uiManifest, manifest); // the last manifest wins on token collisions
```

## Adapters

`defineManifest` needs a [`ModuleRecord`](#types) — a map of keys to lazy importers. Vite and webpack each expose a glob primitive, but they return different shapes, so there is one adapter for each.

### fromMetaGlob

```ts
function fromMetaGlob(glob: Record<string, unknown>): ModuleRecord;
```

Normalizes the record returned by Vite's `import.meta.glob('./x/*.ts')` into a [`ModuleRecord`](#types).

| Parameter | Type                      | Required | Description                                                     |
| --------- | ------------------------- | -------- | --------------------------------------------------------------- |
| `glob`    | `Record<string, unknown>` | yes      | The record returned by a **lazy** `import.meta.glob(...)` call. |

**Returns** the same record typed as a `ModuleRecord`. The lazy form of `import.meta.glob` already returns `Record<string, () => Promise<Module>>`, so this is an identity pass with a guard.

**Throws** a `TypeError` when any value is not a function — that means an eager glob (`import.meta.glob('...', { eager: true })`) was passed, which resolves the modules synchronously and defeats on-demand loading.

```js
import { fromMetaGlob } from '@studiometa/ui-autoload';

const modules = fromMetaGlob(import.meta.glob('./components/*/*.ts'));
```

### fromWebpackContext

```ts
function fromWebpackContext(context: WebpackContextLike): ModuleRecord;
```

Normalizes a webpack context — the value returned by `import.meta.webpackContext(dir, options)` — into a [`ModuleRecord`](#types). A webpack context is a callable with a `keys()` method rather than a record of importers, so this wraps each key in `() => Promise.resolve(context(key))`.

| Parameter | Type                 | Required | Description                                                                          |
| --------- | -------------------- | -------- | ------------------------------------------------------------------------------------ |
| `context` | `WebpackContextLike` | yes      | A webpack context: a callable `(id) => module` that also exposes `keys(): string[]`. |

**Returns** a `ModuleRecord`. `Promise.resolve` tolerates both a synchronous module (`mode: 'sync'`) and a promise (`mode: 'lazy'`). Pass `mode: 'lazy'` for real code-splitting and on-demand loading; the other modes bundle every match eagerly.

```js
import { fromWebpackContext } from '@studiometa/ui-autoload';

const modules = fromWebpackContext(
  import.meta.webpackContext('./components', { recursive: true, regExp: /\.ts$/, mode: 'lazy' }),
);
```

## Types

- **`ModuleRecord`** — `Record<string, () => Promise<Record<string, unknown>>>`: a map of module keys to lazy importers, the shape the adapters produce and `defineManifest` consumes.
- **`DefineManifestOptions`** — the [options](#options) object.
- **`ComponentOverride`** — a [per-token override](#componentoverride).
- **`WebpackContextLike`** — the structural shape of a webpack context accepted by [`fromWebpackContext`](#fromwebpackcontext).
- **`ComponentManifest`**, **`ComponentManifestEntry`**, **`ComponentLoadStrategy`** — documented in the [autoload JS API](/reference/items/autoload/js-api#types).

## See also

- [Custom manifests](/reference/items/autoload/custom-manifests) — the end-to-end workflow, constraints and diagnostics.
- [`registerManifests`](/reference/items/registerManifests/) — register the manifest you build here.
- [Autoloading guide](/guide/autoloading/) — the `data-component` discovery and load-strategy model.
- [autoload JS API](/reference/items/autoload/js-api) — every export of `@studiometa/ui-autoload`.

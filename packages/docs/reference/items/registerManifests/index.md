---
badges: [JS]
outline: deep
---

# registerManifests <Badges :texts="$frontmatter.badges" />

`registerManifests` registers several component manifests with the shared autoload runtime in one call, then lets a single coalesced start flush over the composed set. Use it to layer your own components (built with [`defineManifest`](/reference/items/defineManifest/)) on top of the packaged `@studiometa/ui` and `@studiometa/ui-mapbox` manifests, from an application entry point.

It is the variadic convenience wrapper over [`registerManifest`](/reference/items/autoload/js-api#registermanifest): it calls `registerManifest` on each argument in order and returns the runtime from the final call.

## Signature

```ts
function registerManifests(...manifests: ComponentManifest[]): AutoloadRuntime | undefined;
```

## Parameters

| Parameter      | Type                  | Required | Description                                                                                  |
| -------------- | --------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `...manifests` | `ComponentManifest[]` | yes      | One or more manifests, registered in argument order. Passing none is allowed and is a no-op. |

Each manifest is a `Record<string, ComponentManifestEntry>` — either a package's exported `manifest` (`@studiometa/ui/manifest`, `@studiometa/ui-mapbox/manifest`) or one built with [`defineManifest`](/reference/items/defineManifest/).

## Return value

Returns the shared [`AutoloadRuntime`](/reference/items/autoload/js-api#types) from the final registration, or `undefined` when a conflicting runtime version already owns `globalThis` (the version guard warns and no-ops) or when no manifest was passed.

## Behaviour

- **One coalesced start.** The first registration schedules a single start through a microtask. Because every ES module import in a graph evaluates before microtasks flush, registering several manifests in one call — or across side-effect entries imported at the top of a module — results in exactly one [`autoload`](/reference/items/autoload/js-api#autoload) call over the composed set. Only one loader ever scans the DOM.
- **Last manifest wins.** The runtime composes the accumulated manifests later-wins, and `registerManifests` registers its arguments in order, so the **last** manifest wins on token collisions. Pass your custom manifest last to override a packaged component that shares a token.
- **Shared runtime.** Registration goes through the same cross-copy runtime as the [`@studiometa/ui-autoload/ui`](/guide/autoloading/#activate-a-package) side-effect entries, so a programmatic call coexists with them and still coalesces into one loader.
- **Version guard.** A manifest registered by a conflicting `@studiometa/ui-autoload` version is ignored with a console warning, and the call returns `undefined`.

## Examples

### Layer your own components onto the packaged ones

```js
import { registerManifests, defineManifest, fromMetaGlob } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';

const app = defineManifest({
  packageName: '@my/app',
  modules: fromMetaGlob(import.meta.glob('./components/*/*.ts')),
});

// `app` is last, so it wins on any token it shares with the packaged manifests.
registerManifests(uiManifest, mapboxManifest, app);
```

### Register a curated subset

```js
import { registerManifests } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';

// Only the @studiometa/ui components, no Mapbox.
registerManifests(uiManifest);
```

## Related APIs

- [`registerManifest`](/reference/items/autoload/js-api#registermanifest) — register a single manifest (with injectable options); use it to build your own side-effect entry.
- [`autoload`](/reference/items/autoload/js-api#autoload) — start a standalone loader without the shared runtime, e.g. to scope discovery to a `root` element or to keep a `stop()` handle.

## Types

- **`ComponentManifest`** — a `Record<string, ComponentManifestEntry>`; see the [autoload JS API](/reference/items/autoload/js-api#types).
- **`AutoloadRuntime`** — the shared, cross-copy runtime object stored on `globalThis`; see the [autoload JS API](/reference/items/autoload/js-api#types).

## See also

- [`defineManifest`](/reference/items/defineManifest/) — build the manifest you pass here from your component files.
- [Custom manifests](/reference/items/autoload/custom-manifests) — the end-to-end workflow.
- [Autoloading guide](/guide/autoloading/) — discovery, load strategies and limitations.

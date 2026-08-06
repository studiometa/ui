---
badges: [JS]
---

# registerManifests <Badges :texts="$frontmatter.badges" />

`registerManifests` registers several component manifests with the shared autoload runtime in one call, then starts discovery once over the composed set. Use it to layer your own components on top of the packaged `@studiometa/ui` and `@studiometa/ui-mapbox` manifests.

Because the runtime composes the manifests later-wins, the **last** manifest wins on token collisions — pass your custom manifest last to override a packaged component that shares a token.

## Usage

```js
import { registerManifests, defineManifest, fromMetaGlob } from '@studiometa/ui-autoload';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';

const custom = defineManifest({
  packageName: '@my/app',
  modules: fromMetaGlob(import.meta.glob('./widgets/*/*.ts')),
});

registerManifests(uiManifest, mapboxManifest, custom);
```

One call registers every manifest before the runtime's coalesced start flushes, so exactly one loader scans the DOM. For a single manifest or a custom side-effect entry, use [`registerManifest`](/reference/items/autoload/js-api#registermanifest).

See [Custom manifests](/reference/items/autoload/custom-manifests) for the full workflow, [`defineManifest`](/reference/items/defineManifest/) to build a manifest from your component files, and the [JS API](/reference/items/autoload/js-api#registermanifests) for the signature.

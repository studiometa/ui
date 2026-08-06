---
badges: [JS]
---

# defineManifest <Badges :texts="$frontmatter.badges" />

`defineManifest` builds an autoload [manifest](/reference/items/autoload/js-api#types) from your own component files, so your custom js-toolkit components autoload from `data-component` attributes like the packaged `@studiometa/ui` ones. It is pure: it returns a manifest and never touches the DOM. Pass its result to [`registerManifests`](/reference/items/registerManifests/) or [`autoload`](/reference/items/autoload/js-api#autoload) to start discovery.

The `fromMetaGlob` and `fromWebpackContext` adapters turn a bundler glob into the record `defineManifest` reads. There is one adapter per bundler, because Vite returns a record of importers and webpack returns a context function.

## Usage

```js
import { defineManifest, fromMetaGlob } from '@studiometa/ui-autoload';

const manifest = defineManifest({
  packageName: '@my/app',
  strategy: 'visible',
  modules: fromMetaGlob(import.meta.glob('./components/*/*.ts')),
});
```

`defineManifest` derives each component's `data-component` token from its module path — the file basename, or the parent directory name for an `index` file — and resolves the export that matches the token, falling back to the module's `default` export. The optional `components` map overrides any entry, keyed by the derived token.

See [Custom manifests](/reference/items/autoload/custom-manifests) for the full webpack and Vite workflow — token derivation, overrides, constraints and diagnostics — and the [JS API](/reference/items/autoload/js-api#definemanifest) for the signatures of [`defineManifest`](/reference/items/autoload/js-api#definemanifest), [`fromMetaGlob`](/reference/items/autoload/js-api#frommetaglob) and [`fromWebpackContext`](/reference/items/autoload/js-api#fromwebpackcontext).

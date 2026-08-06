---
badges: [JS]
---

# autoload <Badges :texts="$frontmatter.badges" />

The `@studiometa/ui-autoload` package exposes the programmatic API behind the declarative autoloader. Importing the package root (`@studiometa/ui-autoload`) has no side effects — nothing touches the DOM until you call `autoload()`. Use it for custom composition: a curated subset of packages, your own manifest layered on top, or discovery scoped to a `root` element.

For the declarative, no-call setup — the per-package side-effect entries, eager `<meta>`, loading strategies and component discovery — see the [Autoloading guide](/guide/autoloading/). To autoload your own js-toolkit components from a folder, see [Custom manifests](./custom-manifests). This page documents the exported functions, the `ComponentLoader` class, the constants, and the types.

## Usage

```js
import { autoload } from '@studiometa/ui-autoload';
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

See the [JS API](./js-api) for the full signature of every export.

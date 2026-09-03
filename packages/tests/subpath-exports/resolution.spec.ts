import { test, expect } from 'vitest';
import { fileURLToPath } from 'node:url';

// Resolution is a property of the published `exports` map, not of the loaded
// classes, so these assertions never import a component — which is what lets
// them run under Node while the identity assertions beside them run in the
// browser the components need.

// A component subpath must resolve to its MAIN component module (`X/X.js`), not
// the `index.js` barrel — the subpath exposes the lean component module
// directly. "Family" directories (e.g. `Data`, `decorators`, `Prefetch`) have
// no single main file; instead each of their exported members is exposed at its
// own flat top-level subpath resolving straight to the member module. The
// published package maps each subpath to its built `dist/` artefact; strict Node
// resolution (`import.meta.resolve`) honours that `exports` map without importing
// the target.
test.each([
  ['@studiometa/ui/Carousel', '/dist/Carousel/Carousel.js'],
  ['@studiometa/ui/Defer', '/dist/Defer/Defer.js'],
  ['@studiometa/ui/Disclosure', '/dist/Disclosure/Disclosure.js'],
  // Family members resolve to their own module at a flat top-level subpath.
  ['@studiometa/ui/DataBind', '/dist/Data/DataBind.js'],
  ['@studiometa/ui/DisclosureGroup', '/dist/Disclosure/DisclosureGroup.js'],
  ['@studiometa/ui/withIndex', '/dist/decorators/withIndex.js'],
  ['@studiometa/ui/withTransition', '/dist/decorators/withTransition.js'],
  ['@studiometa/ui/PrefetchWhenVisible', '/dist/Prefetch/PrefetchWhenVisible.js'],
  // Sub-components resolve to their own module at a flat top-level subpath too,
  // distinct from their parent component's main module.
  ['@studiometa/ui/MenuBtn', '/dist/Menu/MenuBtn.js'],
  ['@studiometa/ui/CarouselItem', '/dist/Carousel/CarouselItem.js'],
  ['@studiometa/ui/TrackContext', '/dist/Track/TrackContext.js'],
  // The nested deep path still resolves too (backward-compat with the wildcard).
  ['@studiometa/ui/Carousel/CarouselItem', '/dist/Carousel/CarouselItem.js'],
])('%s resolves to its main module (not the index barrel)', (specifier, suffix) => {
  // @ts-expect-error import.meta.resolve is available under Node's ESM loader.
  const url: string = import.meta.resolve(specifier);
  const path = fileURLToPath(url);
  expect(path.endsWith(suffix)).toBe(true);
});

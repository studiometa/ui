import { test, expect } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as barrel from '@studiometa/ui';
// Deep sub-component import: `@studiometa/ui/Carousel/CarouselItem` resolved
// before the `exports` field was introduced and must keep resolving to the same
// class exposed by the barrel.
import { CarouselItem as CarouselItemDeep } from '@studiometa/ui/Carousel/CarouselItem';
// Deep helper import documented in `decorators/withTransition`.
import { withTransition as transitionDeep } from '@studiometa/ui/decorators/withTransition';
// A `Data*` primitive whose directory has no single "main" component and thus
// exposes no default export, but which is exposed at its own flat top-level
// member subpath (`@studiometa/ui/DataBind`, not a `.../Data` family aggregate).
import { DataBind as DataBindSubpath } from '@studiometa/ui/DataBind';

test('deep sub-component subpaths still resolve after adding exports', () => {
  expect(CarouselItemDeep).toBe(barrel.CarouselItem);
  expect('$isBase' in CarouselItemDeep).toBe(true);
});

test('documented deep helper subpath still resolves', () => {
  expect(typeof transitionDeep).toBe('function');
  expect(transitionDeep).toBe(barrel.withTransition);
});

test('flat member subpath resolves for a package without a default export', () => {
  expect(DataBindSubpath).toBe(barrel.DataBind);
  expect('$isBase' in DataBindSubpath).toBe(true);
});

// The former `@studiometa/ui/Data` family-aggregate subpath was removed in
// favour of flat per-member subpaths. With no explicit key, it now falls through
// to the greedy `./*` wildcard, which points at a nonexistent `dist/Data.js` — so
// it no longer resolves to the family `Data/index` barrel and no importable
// module lives at that path.
test('the removed family-aggregate subpath no longer resolves to a real module', () => {
  // @ts-expect-error import.meta.resolve is available under Node's ESM loader.
  const url: string = import.meta.resolve('@studiometa/ui/Data');
  const path = fileURLToPath(url);
  expect(path.endsWith('/Data/index.js')).toBe(false);
  expect(fs.existsSync(path)).toBe(false);
});

// The published package maps subpaths to its built `dist/`, with two pass-through
// entries for non-JS assets that must resolve to the asset itself rather than
// being rewritten to a `.js` module by the greedy `./*` wildcard:
// `./package.json` (so tooling can read the manifest) and `./*.twig` (the shipped
// templates, whose literal suffix beats `./*`). These assertions use strict Node
// resolution (`import.meta.resolve`, which honours the `exports` map without
// loading the target) to prove those paths resolve to the asset, not a `.js`
// sibling. SVG assets and `.ts` sources are no longer exported subpaths (SVG is
// in-repo only via the `@svg` Twig namespace; the published tree ships no `.ts`).
test.each([
  ['@studiometa/ui/package.json', '/package.json'],
  ['@studiometa/ui/Figure/Figure.twig', '/dist/Figure/Figure.twig'],
  ['@studiometa/ui/Button/Button.twig', '/dist/Button/Button.twig'],
])('non-JS published path %s resolves to the asset itself', (specifier, suffix) => {
  // @ts-expect-error import.meta.resolve is available under Node's ESM loader.
  const url: string = import.meta.resolve(specifier);
  const path = fileURLToPath(url);
  // Resolves to the asset, not a rewritten `<asset>.js` module.
  expect(path.endsWith(suffix)).toBe(true);
  expect(path.endsWith('.js')).toBe(false);
});

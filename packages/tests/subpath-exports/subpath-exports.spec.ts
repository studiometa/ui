import { test, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import * as barrel from '@studiometa/ui';
// Extensionless `@studiometa/ui/<Component>` subpaths must expose the main
// component both as the default export and as a named export, matching the
// class re-exported from the barrel.
import CarouselDefault, { Carousel as CarouselNamed } from '@studiometa/ui/Carousel';
import DeferDefault, { Defer as DeferNamed } from '@studiometa/ui/Defer';
import DialogDefault, { Dialog as DialogNamed } from '@studiometa/ui/Dialog';
import DisclosureDefault, { Disclosure as DisclosureNamed } from '@studiometa/ui/Disclosure';
import FetchDefault, { Fetch as FetchNamed } from '@studiometa/ui/Fetch';
import TabsDefault, { Tabs as TabsNamed } from '@studiometa/ui/Tabs';
// A "family" member has no default export — only its named export — exposed at
// a flat top-level subpath (`@studiometa/ui/DataBind`, not `.../Data`).
import { DataBind as DataBindNamed } from '@studiometa/ui/DataBind';
import { DisclosureGroup as DisclosureGroupNamed } from '@studiometa/ui/DisclosureGroup';
// Sub-components of a main component are likewise exposed at their own flat
// top-level subpath (`@studiometa/ui/CarouselItem`, not only the nested
// `@studiometa/ui/Carousel/CarouselItem`). Like family members they carry no
// default export, only their named export.
import { MenuBtn as MenuBtnNamed } from '@studiometa/ui/MenuBtn';
import { CarouselItem as CarouselItemNamed } from '@studiometa/ui/CarouselItem';
import { TrackContext as TrackContextNamed } from '@studiometa/ui/TrackContext';

test.each([
  ['Carousel', CarouselDefault, CarouselNamed, barrel.Carousel],
  ['Defer', DeferDefault, DeferNamed, barrel.Defer],
  ['Dialog', DialogDefault, DialogNamed, barrel.Dialog],
  ['Disclosure', DisclosureDefault, DisclosureNamed, barrel.Disclosure],
  ['Fetch', FetchDefault, FetchNamed, barrel.Fetch],
  ['Tabs', TabsDefault, TabsNamed, barrel.Tabs],
])(
  '%s is available at its own subpath as default and named export',
  (_name, def, named, fromBarrel) => {
    // The default export is a js-toolkit `Base` subclass.
    expect('$isBase' in def).toBe(true);
    // The default, named and barrel exports all reference the exact same class.
    expect(def).toBe(named);
    expect(def).toBe(fromBarrel);
  },
);

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

// Family members carry no default export, only their named export, which must
// match the class/function re-exported from the barrel.
test('family member flat subpath exposes the named export matching the barrel', () => {
  expect(DataBindNamed).toBeDefined();
  expect(DataBindNamed).toBe(barrel.DataBind);
  expect(DisclosureGroupNamed).toBeDefined();
  expect(DisclosureGroupNamed).toBe(barrel.DisclosureGroup);
});

// Sub-components carry no default export, only their named export, which must
// match the class re-exported from the barrel. Cover sub-components from three
// different parent directories.
test.each([
  ['MenuBtn', MenuBtnNamed, barrel.MenuBtn],
  ['CarouselItem', CarouselItemNamed, barrel.CarouselItem],
  ['TrackContext', TrackContextNamed, barrel.TrackContext],
])(
  'sub-component flat subpath %s exposes the named export matching the barrel',
  (_name, named, fromBarrel) => {
    expect(named).toBeDefined();
    expect(named).toBe(fromBarrel);
  },
);

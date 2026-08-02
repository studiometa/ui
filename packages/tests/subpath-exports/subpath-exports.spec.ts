import { test, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import * as barrel from '@studiometa/ui';
// Extensionless `@studiometa/ui/<Component>` subpaths must expose the main
// component both as the default export and as a named export, matching the
// class re-exported from the barrel.
import AccordionDefault, { Accordion as AccordionNamed } from '@studiometa/ui/Accordion';
import ModalDefault, { Modal as ModalNamed } from '@studiometa/ui/Modal';
import DisclosureDefault, { Disclosure as DisclosureNamed } from '@studiometa/ui/Disclosure';
import TabsDefault, { Tabs as TabsNamed } from '@studiometa/ui/Tabs';
import SliderDefault, { Slider as SliderNamed } from '@studiometa/ui/Slider';
import FrameDefault, { Frame as FrameNamed } from '@studiometa/ui/Frame';
// The `.js`-extensioned subpaths must resolve to the same modules as the
// extensionless ones above.
import AccordionJsDefault, { Accordion as AccordionJsNamed } from '@studiometa/ui/Accordion.js';
import ModalJsDefault, { Modal as ModalJsNamed } from '@studiometa/ui/Modal.js';
import DisclosureJsDefault, { Disclosure as DisclosureJsNamed } from '@studiometa/ui/Disclosure.js';
import TabsJsDefault, { Tabs as TabsJsNamed } from '@studiometa/ui/Tabs.js';
import SliderJsDefault, { Slider as SliderJsNamed } from '@studiometa/ui/Slider.js';
import FrameJsDefault, { Frame as FrameJsNamed } from '@studiometa/ui/Frame.js';
// A "family" member has no default export — only its named export — exposed at
// a flat top-level subpath (`@studiometa/ui/DataBind`, not `.../Data`).
import { DataBind as DataBindNamed } from '@studiometa/ui/DataBind';
import { DisclosureGroup as DisclosureGroupNamed } from '@studiometa/ui/DisclosureGroup';
// Sub-components of a main component are likewise exposed at their own flat
// top-level subpath (`@studiometa/ui/AccordionItem`, not only the nested
// `@studiometa/ui/Accordion/AccordionItem`). Like family members they carry no
// default export, only their named export.
import { AccordionItem as AccordionItemNamed } from '@studiometa/ui/AccordionItem';
import { CarouselItem as CarouselItemNamed } from '@studiometa/ui/CarouselItem';
import { TrackContext as TrackContextNamed } from '@studiometa/ui/TrackContext';

test.each([
  ['Accordion', AccordionDefault, AccordionNamed, barrel.Accordion],
  ['Modal', ModalDefault, ModalNamed, barrel.Modal],
  ['Disclosure', DisclosureDefault, DisclosureNamed, barrel.Disclosure],
  ['Tabs', TabsDefault, TabsNamed, barrel.Tabs],
  ['Slider', SliderDefault, SliderNamed, barrel.Slider],
  ['Frame', FrameDefault, FrameNamed, barrel.Frame],
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

test.each([
  ['Accordion', AccordionJsDefault, AccordionJsNamed, barrel.Accordion],
  ['Modal', ModalJsDefault, ModalJsNamed, barrel.Modal],
  ['Disclosure', DisclosureJsDefault, DisclosureJsNamed, barrel.Disclosure],
  ['Tabs', TabsJsDefault, TabsJsNamed, barrel.Tabs],
  ['Slider', SliderJsDefault, SliderJsNamed, barrel.Slider],
  ['Frame', FrameJsDefault, FrameJsNamed, barrel.Frame],
])(
  '%s is available at its `.js`-extensioned subpath as default and named export',
  (_name, def, named, fromBarrel) => {
    // The default export is a js-toolkit `Base` subclass.
    expect('$isBase' in def).toBe(true);
    // The `.js`-extensioned subpath resolves to the same class as the
    // extensionless subpath and the barrel export.
    expect(def).toBe(named);
    expect(def).toBe(fromBarrel);
  },
);

// A component subpath must resolve to its MAIN component module (`X/X.ts`), not
// the `index.ts` barrel — the subpath now exposes the lean component module
// directly. "Family" directories (e.g. `Data`, `decorators`, `Prefetch`) have
// no single main file; instead each of their exported members is exposed at its
// own flat top-level subpath resolving straight to the member module. Strict
// Node resolution (`import.meta.resolve`) honours the package `exports` map
// without importing the target.
test.each([
  ['@studiometa/ui/Accordion', '/Accordion/Accordion.ts'],
  ['@studiometa/ui/Modal', '/Modal/Modal.ts'],
  ['@studiometa/ui/Disclosure', '/Disclosure/Disclosure.ts'],
  // Family members resolve to their own module at a flat top-level subpath.
  ['@studiometa/ui/DataBind', '/Data/DataBind.ts'],
  ['@studiometa/ui/DisclosureGroup', '/Disclosure/DisclosureGroup.ts'],
  ['@studiometa/ui/withTransition', '/decorators/withTransition.ts'],
  ['@studiometa/ui/PrefetchWhenVisible', '/Prefetch/PrefetchWhenVisible.ts'],
  // Sub-components resolve to their own module at a flat top-level subpath too,
  // distinct from their parent component's main module.
  ['@studiometa/ui/AccordionItem', '/Accordion/AccordionItem.ts'],
  ['@studiometa/ui/CarouselItem', '/Carousel/CarouselItem.ts'],
  ['@studiometa/ui/TrackContext', '/Track/TrackContext.ts'],
  // The nested deep path still resolves too (backward-compat with the wildcard).
  ['@studiometa/ui/Accordion/AccordionItem', '/Accordion/AccordionItem.ts'],
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
  ['AccordionItem', AccordionItemNamed, barrel.AccordionItem],
  ['CarouselItem', CarouselItemNamed, barrel.CarouselItem],
  ['TrackContext', TrackContextNamed, barrel.TrackContext],
])(
  'sub-component flat subpath %s exposes the named export matching the barrel',
  (_name, named, fromBarrel) => {
    expect(named).toBeDefined();
    expect(named).toBe(fromBarrel);
  },
);

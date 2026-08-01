import { test, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import * as barrel from '@studiometa/ui';
// Extensionless `@studiometa/ui/<Component>` subpaths must expose the main
// component both as the default export and as a named export, matching the
// class re-exported from the barrel.
import AccordionDefault, { Accordion as AccordionNamed } from '@studiometa/ui/Accordion';
import ModalDefault, { Modal as ModalNamed } from '@studiometa/ui/Modal';
import TabsDefault, { Tabs as TabsNamed } from '@studiometa/ui/Tabs';
import SliderDefault, { Slider as SliderNamed } from '@studiometa/ui/Slider';
import FrameDefault, { Frame as FrameNamed } from '@studiometa/ui/Frame';
// The `.js`-extensioned subpaths must resolve to the same modules as the
// extensionless ones above.
import AccordionJsDefault, { Accordion as AccordionJsNamed } from '@studiometa/ui/Accordion.js';
import ModalJsDefault, { Modal as ModalJsNamed } from '@studiometa/ui/Modal.js';
import TabsJsDefault, { Tabs as TabsJsNamed } from '@studiometa/ui/Tabs.js';
import SliderJsDefault, { Slider as SliderJsNamed } from '@studiometa/ui/Slider.js';
import FrameJsDefault, { Frame as FrameJsNamed } from '@studiometa/ui/Frame.js';

test.each([
  ['Accordion', AccordionDefault, AccordionNamed, barrel.Accordion],
  ['Modal', ModalDefault, ModalNamed, barrel.Modal],
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
// directly. Components without a main file (e.g. `Data`) keep resolving to their
// directory index. Strict Node resolution (`import.meta.resolve`) honours the
// package `exports` map without importing the target.
test.each([
  ['@studiometa/ui/Accordion', '/Accordion/Accordion.ts'],
  ['@studiometa/ui/Modal', '/Modal/Modal.ts'],
  // No single main component → resolves to the directory index.
  ['@studiometa/ui/Data', '/Data/index.ts'],
])('%s resolves to its main module (not the index barrel)', (specifier, suffix) => {
  // @ts-expect-error import.meta.resolve is available under Node's ESM loader.
  const url: string = import.meta.resolve(specifier);
  const path = fileURLToPath(url);
  expect(path.endsWith(suffix)).toBe(true);
});

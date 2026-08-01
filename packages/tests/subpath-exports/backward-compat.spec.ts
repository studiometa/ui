import { test, expect } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as barrel from '@studiometa/ui';
// Deep sub-component import: `@studiometa/ui/Accordion/AccordionItem` resolved
// before the `exports` field was introduced and must keep resolving to the same
// class exposed by the barrel.
import { AccordionItem as AccordionItemDeep } from '@studiometa/ui/Accordion/AccordionItem';
import { AccordionItem as AccordionItemDeepJs } from '@studiometa/ui/Accordion/AccordionItem.js';
// Deep helper import documented in `ScrollAnimation/withScrollAnimationDebug`.
import { withScrollAnimationDebug as debugDeep } from '@studiometa/ui/ScrollAnimation/withScrollAnimationDebug';
// A `Data*` primitive whose directory has no single "main" component and thus
// exposes no default export, but whose directory-index subpath must still work.
import { DataBind as DataBindSubpath } from '@studiometa/ui/Data';

test('deep sub-component subpaths still resolve after adding exports', () => {
  expect(AccordionItemDeep).toBe(barrel.AccordionItem);
  expect(AccordionItemDeepJs).toBe(barrel.AccordionItem);
  expect('$isBase' in AccordionItemDeep).toBe(true);
});

test('documented deep helper subpath still resolves', () => {
  expect(typeof debugDeep).toBe('function');
  expect(debugDeep).toBe(barrel.withScrollAnimationDebug);
});

test('directory-index subpath resolves for a package without a default export', () => {
  expect(DataBindSubpath).toBe(barrel.DataBind);
  expect('$isBase' in DataBindSubpath).toBe(true);
});

// The greedy `./*` wildcard added with the `exports` field rewrites every
// unmatched subpath to a `.js`/`.ts` module. Without explicit pass-through
// entries, published non-JS paths that resolved before the field existed would
// now point at a nonexistent `<path>.js` file. These assertions use strict Node
// resolution (`import.meta.resolve`, which honours the package `exports` map
// without loading the target) to prove those paths resolve to the asset itself.
// Vite/vitest do not transform these specifiers because the module is never
// imported — only resolved. Before the fix each of these would resolve to a
// missing `*.js` sibling and `existsSync` would fail.
test.each([
  // Tools read a package manifest through `@studiometa/ui/package.json`; the
  // explicit `./package.json` entry keeps it exported.
  ['@studiometa/ui/package.json', '/package.json'],
  // The package ships 24 `.twig` templates; `./*.twig` keeps them resolvable
  // through package resolution (the `.twig` suffix beats the greedy `./*`).
  ['@studiometa/ui/Accordion/Accordion.twig', '/Accordion/Accordion.twig'],
  ['@studiometa/ui/Button/Button.twig', '/Button/Button.twig'],
  // SVG assets live under `svg/` in the source tree; `./*.svg` keeps them
  // resolvable in-repo (they are not published to `dist/`).
  ['@studiometa/ui/svg/chevron.svg', '/svg/chevron.svg'],
  // In-repo, `@studiometa/ui` resolves to the `.ts` sources, so the source
  // `package.json` keeps a `./*.ts` entry to preserve `.ts`-extensioned deep
  // imports (otherwise `./*` rewrites them to `<path>.ts.ts`). The published
  // dist ships `.js`/`.d.ts` only, so it has no `./*.ts` entry.
  ['@studiometa/ui/Accordion/Accordion.ts', '/Accordion/Accordion.ts'],
  ['@studiometa/ui/index.ts', '/index.ts'],
])('non-JS published path %s resolves to the asset itself', (specifier, suffix) => {
  // @ts-expect-error import.meta.resolve is available under Node's ESM loader.
  const url: string = import.meta.resolve(specifier);
  const path = fileURLToPath(url);
  // Resolves to the asset, not a rewritten `<asset>.js` module.
  expect(path.endsWith(suffix)).toBe(true);
  expect(path.endsWith('.js')).toBe(false);
  // And the resolved file actually exists on disk.
  expect(fs.existsSync(path)).toBe(true);
});

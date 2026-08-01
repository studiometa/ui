import { test, expect } from 'vitest';
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

import { test, expect } from 'vitest';
import { Base } from '@studiometa/js-toolkit';
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
  expect(CarouselItemDeep.prototype instanceof Base).toBe(true);
});

test('documented deep helper subpath still resolves', () => {
  expect(typeof transitionDeep).toBe('function');
  expect(transitionDeep).toBe(barrel.withTransition);
});

test('flat member subpath resolves for a package without a default export', () => {
  expect(DataBindSubpath).toBe(barrel.DataBind);
  expect(DataBindSubpath.prototype instanceof Base).toBe(true);
});

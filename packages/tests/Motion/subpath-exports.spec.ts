import { test, expect } from 'vitest';
import * as barrel from '@studiometa/ui-motion';
import MotionDefault, { Motion as MotionNamed } from '@studiometa/ui-motion/Motion';

test('Motion is available at its own subpath as default and named export', () => {
  // The default export is a js-toolkit `Base` subclass.
  expect('$isBase' in MotionDefault).toBe(true);
  // The default, named and barrel exports all reference the exact same class.
  expect(MotionDefault).toBe(MotionNamed);
  expect(MotionDefault).toBe(barrel.Motion);
});

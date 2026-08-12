import { test, expect } from 'vitest';
import * as barrel from '@studiometa/ui-motion';
import MotionDefault, { Motion as MotionNamed } from '@studiometa/ui-motion/Motion';
import MotionScrollTimelineDefault, {
  MotionScrollTimeline as MotionScrollTimelineNamed,
} from '@studiometa/ui-motion/MotionScrollTimeline';
import MotionSequenceDefault, {
  MotionSequence as MotionSequenceNamed,
} from '@studiometa/ui-motion/MotionSequence';

test.each([
  ['Motion', MotionDefault, MotionNamed, barrel.Motion],
  [
    'MotionScrollTimeline',
    MotionScrollTimelineDefault,
    MotionScrollTimelineNamed,
    barrel.MotionScrollTimeline,
  ],
  ['MotionSequence', MotionSequenceDefault, MotionSequenceNamed, barrel.MotionSequence],
])('%s is available at its own subpath as default and named export', (_name, def, named, fromBarrel) => {
  // The default export is a js-toolkit `Base` subclass.
  expect('$isBase' in def).toBe(true);
  // The default, named and barrel exports all reference the exact same class.
  expect(def).toBe(named);
  expect(def).toBe(fromBarrel);
});

import { test, expect } from 'vitest';
import { Base } from '@studiometa/js-toolkit';
import * as barrel from '@studiometa/ui-motion';
import MotionDefault, { Motion as MotionNamed } from '@studiometa/ui-motion/Motion';
import MotionScrollTimelineDefault, {
  MotionScrollTimeline as MotionScrollTimelineNamed,
} from '@studiometa/ui-motion/MotionScrollTimeline';
import MotionSequenceDefault, {
  MotionSequence as MotionSequenceNamed,
} from '@studiometa/ui-motion/MotionSequence';
import MotionViewDefault, { MotionView as MotionViewNamed } from '@studiometa/ui-motion/MotionView';

test.each([
  ['Motion', MotionDefault, MotionNamed, barrel.Motion],
  [
    'MotionScrollTimeline',
    MotionScrollTimelineDefault,
    MotionScrollTimelineNamed,
    barrel.MotionScrollTimeline,
  ],
  ['MotionSequence', MotionSequenceDefault, MotionSequenceNamed, barrel.MotionSequence],
  ['MotionView', MotionViewDefault, MotionViewNamed, barrel.MotionView],
])(
  '%s is available at its own subpath as default and named export',
  (_name, def, named, fromBarrel) => {
    // The default export is a js-toolkit `Base` subclass. v3's `$isBase` static
    // is gone in v4 — the brand is a symbol, and it is not public — so the
    // prototype chain is what the assertion reads.
    expect(def.prototype instanceof Base).toBe(true);
    // The default, named and barrel exports all reference the exact same class.
    expect(def).toBe(named);
    expect(def).toBe(fromBarrel);
  },
);

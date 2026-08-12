import { test, expect } from 'vitest';
import * as components from '@studiometa/ui-motion';

test('@studiometa/ui-motion exports', () => {
  expect(Object.keys(components).toSorted()).toMatchInlineSnapshot(`
    [
      "Motion",
      "MotionScrollTimeline",
      "MotionSequence",
      "provideMotion",
      "resolveMotion",
    ]
  `);

  for (const exported of Object.values(components)) {
    expect(exported).toBeDefined();
  }
});

test('@studiometa/ui-motion public events use the motion- prefix', () => {
  expect(components.Motion.config.emits?.every((event) => event.startsWith('motion-'))).toBe(true);
});

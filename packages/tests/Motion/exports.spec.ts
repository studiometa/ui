import { afterEach, test, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { recordEvents, resetDom, settle } from '@studiometa/js-toolkit/test';
// Importing the mock injects the `motion` module double through `provideMotion`
// before the components resolve it below.
import { animations, resetMockMotion } from './mock-motion.js';
import * as components from '@studiometa/ui-motion';
import type { Motion } from '@studiometa/ui-motion';
import { h, wait } from '#test-utils';

registerComponents(components.Motion);

afterEach(async () => {
  await resetDom();
  resetMockMotion();
});

test('@studiometa/ui-motion exports', () => {
  expect(Object.keys(components).toSorted()).toMatchInlineSnapshot(`
    [
      "Motion",
      "MotionScrollTimeline",
      "MotionSequence",
      "MotionView",
      "provideMotion",
      "resolveMotion",
    ]
  `);

  for (const exported of Object.values(components)) {
    expect(exported).toBeDefined();
  }
});

/**
 * Event names live in each component's `$emits` props type, which is erased at
 * runtime, so the prefix rule is asserted against what a component actually
 * dispatches.
 *
 * That fails both on an event renamed away from the prefix and on one
 * dispatched without being declared at all. The unprefixed names are recorded
 * alongside the prefixed ones precisely so the assertion has a way to fail.
 */
test('@studiometa/ui-motion public events use the motion- prefix', async () => {
  const el = h('div', { dataComponent: 'Motion', dataOptionAnimate: '{ "x": 100 }' });
  document.body.append(el);
  await settle();

  const instance = getInstance<Motion>(el, 'Motion')!;
  const log = recordEvents(
    el,
    'motion-play',
    'motion-pause',
    'motion-complete',
    'motion-cancel',
    'motion-stop',
    'play',
    'pause',
    'complete',
    'cancel',
    'stop',
  );

  // The mock never settles on its own — happy-dom has no Web Animations API —
  // so each playback promise is settled here, by hand, the way every other
  // spec in this directory drives it.
  const played = instance.play();
  await wait(0);
  instance.pause();
  instance.stop();
  await played;

  const replayed = instance.play();
  await wait(0);
  animations.at(-1)!.finish();
  await replayed;

  instance.cancel();

  const names = [...new Set(log.events.map(({ type }) => type))].toSorted();

  expect(names).toEqual([
    'motion-cancel',
    'motion-complete',
    'motion-pause',
    'motion-play',
    'motion-stop',
  ]);
  expect(names.every((name) => name.startsWith('motion-'))).toBe(true);

  log.stop();
});

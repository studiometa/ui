import { test, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { mount, recordEvents, waitFor } from '@studiometa/js-toolkit/test';
import { gsap, ready } from './fake-gsap.js';
import * as components from '@studiometa/ui-gsap';
import type { Gsap } from '@studiometa/ui-gsap';

registerComponents(components.Gsap);

test('@studiometa/ui-gsap exports', () => {
  expect(Object.keys(components).toSorted()).toMatchInlineSnapshot(`
    [
      "Gsap",
      "GsapStep",
      "GsapTimeline",
      "provideGsap",
      "resolveGsap",
    ]
  `);

  for (const exported of Object.values(components)) {
    expect(exported).toBeDefined();
  }
});

/**
 * Event names live in the `$emits` props type, which is erased at runtime, so
 * the prefix rule is asserted against what the component dispatches. The
 * unprefixed names are recorded too, so the assertion has a way to fail.
 */
test('@studiometa/ui-gsap public events use the gsap- prefix', async () => {
  const names = ['ready', 'play', 'pause', 'complete', 'reverse-complete', 'interrupt'];
  const log = recordEvents(document, ...names, ...names.map((name) => `gsap-${name}`));
  const root = await mount(
    `<div data-component="Gsap" data-option-to='{ "x": 10, "duration": 1 }'></div>`,
  );
  const el = root.firstElementChild as HTMLElement;
  const instance = await waitFor(() => getInstance<Gsap>(el, 'Gsap'));
  await ready(instance);

  instance.play();
  instance.pause();
  instance.complete();
  instance.reverse();
  instance.animation!.progress(0);
  instance.restart();
  gsap.killTweensOf(el);

  const types = [...new Set(log.events.map(({ type }) => type))].toSorted();
  expect(types).toEqual(names.map((name) => `gsap-${name}`).toSorted());
  log.stop();
});

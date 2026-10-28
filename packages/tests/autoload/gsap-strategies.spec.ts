// The double injects GSAP through `provideGsap`, with the real engine.
import { ready, resetFakeGsap } from '../Gsap/fake-gsap.js';
import { getInstance, registerManifest } from '@studiometa/js-toolkit';
import { mount, resetRegistry, waitFor } from '@studiometa/js-toolkit/test';
import type { Gsap, GsapTimeline } from '@studiometa/ui-gsap';
import { manifest } from '@studiometa/ui-gsap/manifest';
import { beforeEach, describe, expect, it } from 'vitest';

/**
 * These specs run the shipped `@studiometa/ui-gsap` manifest. Each case is
 * one reason why the components mount because their element exists, not when
 * it nears the viewport.
 */
beforeEach(() => {
  resetRegistry();
  registerManifest(manifest);
  resetFakeGsap();
});

describe('autoloading @studiometa/ui-gsap', () => {
  it('applies the starting state of a Gsap below the fold before it is seen', async () => {
    const root = await mount(`
      <div style="height: 300vh"></div>
      <div data-component="Gsap" data-option-from='{ "opacity": 0 }'></div>
    `);
    const el = root.querySelector<HTMLElement>('[data-component="Gsap"]')!;

    const instance = await waitFor(() => getInstance<Gsap>(el, 'Gsap'));
    await ready(instance);
    expect(el.style.opacity).toBe('0');
  });

  it('composes a GsapStep far below the fold into its timeline', async () => {
    const root = await mount(`
      <section data-component="GsapTimeline">
        <div data-component="GsapStep" data-option-to='{ "x": 10, "duration": 1 }'></div>
        <div style="height: 300vh"></div>
        <div data-component="GsapStep" data-option-to='{ "x": 20, "duration": 2 }'></div>
      </section>
    `);
    const el = root.querySelector<HTMLElement>('[data-component="GsapTimeline"]')!;

    const timeline = await waitFor(() => getInstance<GsapTimeline>(el, 'GsapTimeline'));
    await waitFor(() => timeline.duration === 3);
    expect(timeline.steps).toHaveLength(2);
  });
});

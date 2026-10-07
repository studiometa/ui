// The mock injects the `motion` module double through `provideMotion`, so no
// component below reaches for the real library.
import { animations, mockAnimate, resetMockMotion, scrollLinks } from '../Motion/mock-motion.js';
import { getInstance, registerManifest } from '@studiometa/js-toolkit';
import { mount, resetRegistry, settle, waitFor } from '@studiometa/js-toolkit/test';
import type { Motion, MotionScrollTimeline, MotionView } from '@studiometa/ui-motion';
import { manifest } from '@studiometa/ui-motion/manifest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * These specs run the shipped `@studiometa/ui-motion` manifest. Each case is
 * one reason why the motion components mount because their element exists,
 * not when it nears the viewport.
 */
beforeEach(() => {
  // Once a lazy entry loads, the registry keeps the class instead. Start
  // every test from the manifest entries again.
  resetRegistry();
  registerManifest(manifest);
  resetMockMotion();
});

afterEach(() => {
  window.scrollTo(0, 0);
});

describe('autoloading @studiometa/ui-motion', () => {
  it('mounts a MotionView whose element starts out not rendered, so it can enter', async () => {
    // `leaveTo` is usually also the initial class, so the element starts in
    // its hidden state. Here that state is `display: none`, which never
    // intersects the viewport.
    const root = await mount(`
      <style>.is-hidden { display: none; }</style>
      <div
        data-component="MotionView"
        class="is-hidden"
        data-option-leave-to="is-hidden"
        data-option-enter-to="is-shown">
        Content
      </div>
    `);
    const el = root.querySelector<HTMLElement>('[data-component="MotionView"]')!;

    const view = await waitFor(() => getInstance<MotionView>(el, 'MotionView'));
    await view.enter();

    expect(el.classList.contains('is-shown')).toBe(true);
    expect(el.classList.contains('is-hidden')).toBe(false);
    expect(getComputedStyle(el).display).not.toBe('none');
  });

  it('mounts a Motion inside a closed dialog before the dialog opens', async () => {
    // A closed `<dialog>` is not rendered. The `Motion` inside it must already
    // be mounted when the dialog opens: its `initial` styles must be in place
    // before the first frame shows it, and an `Action` that plays it when the
    // dialog opens must find it.
    const root = await mount(`
      <dialog>
        <div
          data-component="Motion"
          data-option-initial='{ "opacity": 0 }'
          data-option-animate='{ "opacity": 1 }'></div>
      </dialog>
    `);
    const dialog = root.querySelector('dialog')!;
    const el = root.querySelector<HTMLElement>('[data-component="Motion"]')!;

    const motion = await waitFor(() => getInstance<Motion>(el, 'Motion'));
    await waitFor(() => mockAnimate.mock.calls.length > 0);

    expect(dialog.open).toBe(false);
    expect(mockAnimate).toHaveBeenCalledWith(el, { opacity: 0 }, { duration: 0 });

    dialog.showModal();
    const playing = motion.play();

    // Poll for a boolean, then read the animation: the animation is a
    // thenable, so returning it from `waitFor()` would wait for it to finish,
    // which the double never does on its own.
    await waitFor(() => animations.some((entry) => entry.playCount > 0));
    const played = animations.find((entry) => entry.playCount > 0)!;

    try {
      expect(played.element).toBe(el);
      // The `initial` styles are the starting point of the declared animation.
      expect(played.keyframes).toEqual({ opacity: [0, 1] });
    } finally {
      played.finish();
      await playing;
      dialog.close();
    }
  });

  it('links a Motion child far below the fold to its scroll timeline', async () => {
    // The timeline links its children once, when it mounts. A child deep in a
    // tall timeline is far below the viewport at that moment, so it must
    // already be mounted.
    const root = await mount(`
      <section data-component="MotionScrollTimeline">
        <div data-component="Motion" data-option-animate='{ "x": 100 }'></div>
        <div style="height: 300vh"></div>
        <div data-component="Motion" data-option-animate='{ "x": 200 }'></div>
      </section>
    `);
    const el = root.querySelector<HTMLElement>('[data-component="MotionScrollTimeline"]')!;
    const deepChild = root.querySelectorAll<HTMLElement>('[data-component="Motion"]')[1];

    await waitFor(() => getInstance<MotionScrollTimeline>(el, 'MotionScrollTimeline'));
    await waitFor(() => scrollLinks.length === 2);
    await settle();

    expect(getInstance(deepChild, 'Motion')).toBeDefined();
    expect(scrollLinks.map((link) => link.animation.keyframes)).toEqual([{ x: 100 }, { x: 200 }]);
  });
});

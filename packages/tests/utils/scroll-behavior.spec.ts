import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';
import { scrollBehavior } from '#private/utils/scroll-behavior.js';

/**
 * Flip the real `prefers-reduced-motion` setting through the DevTools
 * protocol, so the media query the helper reads actually changes.
 */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

afterEach(async () => {
  await emulateReducedMotion(false);
});

describe('scrollBehavior', () => {
  it('is `smooth` without a reduced-motion preference', async () => {
    await emulateReducedMotion(false);
    expect(scrollBehavior()).toBe('smooth');
  });

  it('is `instant` under `prefers-reduced-motion: reduce`', async () => {
    await emulateReducedMotion(true);
    expect(scrollBehavior()).toBe('instant');
  });

  it('follows a change of the setting, call after call', async () => {
    await emulateReducedMotion(false);
    expect(scrollBehavior()).toBe('smooth');

    // A single sample would leave this at `smooth` for good.
    await emulateReducedMotion(true);
    expect(scrollBehavior()).toBe('instant');

    await emulateReducedMotion(false);
    expect(scrollBehavior()).toBe('smooth');
  });
});

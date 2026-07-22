import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { InView, InViewOnce } from '@studiometa/ui';
import type { Base } from '@studiometa/js-toolkit';
import {
  h,
  mount,
  mockIsIntersecting,
  intersectionMockInstance,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
} from '#test-utils';

/**
 * Instantiate and mount a single component (`InView` or `InViewOnce`) from an
 * HTML string.
 */
async function mountComponent<T extends Base>(
  Ctor: new (el: HTMLElement) => T,
  html: string,
): Promise<{ root: HTMLElement; el: HTMLElement; instance: T }> {
  const root = h('div');
  root.innerHTML = html;
  const el = root.querySelector('[data-component]') as HTMLElement;
  const instance = new Ctor(el);
  await mount(instance);

  return { root, el, instance };
}

/**
 * Simulate the element leaving the viewport, tolerating the case where its
 * observer has already been disconnected (e.g. after a one-shot terminate).
 */
async function tryLeave(el: HTMLElement) {
  try {
    await mockIsIntersecting(el, false);
  } catch {
    // The observer was disconnected: the leave can never be delivered, which
    // is exactly the guarantee we are asserting.
  }
}

describe('InView component', () => {
  beforeAll(() => {
    intersectionObserverBeforeAllCallback();
  });

  afterEach(() => {
    intersectionObserverAfterEachCallback();
  });

  it('should have the correct config', () => {
    expect(InView.config.name).toBe('InView');
    expect(InView.config.emits).toEqual(['in-view', 'out-of-view']);
  });

  it('should emit `in-view` when the element enters the viewport', async () => {
    const { el, instance } = await mountComponent(InView, `<div data-component="InView"></div>`);
    const fn = vi.fn();
    instance.$on('in-view', fn);

    await mockIsIntersecting(el, true);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should emit `out-of-view` when the element leaves the viewport', async () => {
    const { el, instance } = await mountComponent(InView, `<div data-component="InView"></div>`);
    const fn = vi.fn();
    instance.$on('out-of-view', fn);

    await mockIsIntersecting(el, true);
    await mockIsIntersecting(el, false);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should re-emit `in-view` on each re-entry (repeating)', async () => {
    const { el, instance } = await mountComponent(InView, `<div data-component="InView"></div>`);
    const inView = vi.fn();
    const outOfView = vi.fn();
    instance.$on('in-view', inView);
    instance.$on('out-of-view', outOfView);

    await mockIsIntersecting(el, true);
    await mockIsIntersecting(el, false);
    await mockIsIntersecting(el, true);

    expect(inView).toHaveBeenCalledTimes(2);
    expect(outOfView).toHaveBeenCalledTimes(1);
  });

  it('should expose the configurable `intersectionObserver` option', async () => {
    const { el } = await mountComponent(
      InView,
      `<div data-component="InView" data-option-intersection-observer='{"rootMargin": "100px"}'></div>`,
    );

    const observer = intersectionMockInstance(el);

    // The option is forwarded to the IntersectionObserver instance.
    expect(observer.rootMargin).toBe('100px');
  });
});

describe('InViewOnce component', () => {
  beforeAll(() => {
    intersectionObserverBeforeAllCallback();
  });

  afterEach(() => {
    intersectionObserverAfterEachCallback();
  });

  it('should have the correct config, emitting only `in-view`', () => {
    expect(InViewOnce.config.name).toBe('InViewOnce');
    expect(InViewOnce.config.emits).toEqual(['in-view']);
  });

  it('should emit `in-view` exactly once and terminate (disconnect the observer)', async () => {
    const { el, instance } = await mountComponent(
      InViewOnce,
      `<div data-component="InViewOnce"></div>`,
    );
    const observer = intersectionMockInstance(el);
    const terminateSpy = vi.spyOn(instance, '$terminate');
    const fn = vi.fn();
    instance.$on('in-view', fn);

    await mockIsIntersecting(el, true);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(terminateSpy).toHaveBeenCalledTimes(1);
    // The decorator disconnects the observer on `terminated`.
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('should NOT emit `out-of-view`, even after leaving the viewport', async () => {
    const { el, instance } = await mountComponent(
      InViewOnce,
      `<div data-component="InViewOnce"></div>`,
    );
    const outOfView = vi.fn();
    instance.$on('out-of-view', outOfView);

    await mockIsIntersecting(el, true);
    // A leave after termination must not resurface an `out-of-view` event.
    // The observer is disconnected on terminate, so the leave can never even
    // be delivered — swallow the resulting "not observed" error.
    await tryLeave(el);

    expect(outOfView).not.toHaveBeenCalled();
    // The observer was disconnected, so no further crossing can be delivered.
    expect(() => intersectionMockInstance(el)).toThrow(
      'Failed to find IntersectionObserver for element',
    );
  });

  it('should not re-emit `in-view` on a later intersection', async () => {
    const { el, instance } = await mountComponent(
      InViewOnce,
      `<div data-component="InViewOnce"></div>`,
    );
    const inView = vi.fn();
    instance.$on('in-view', inView);

    await mockIsIntersecting(el, true);
    await tryLeave(el);
    // Any further intersection cannot be delivered to a disconnected observer.
    await tryLeave(el);

    expect(inView).toHaveBeenCalledTimes(1);
  });
});

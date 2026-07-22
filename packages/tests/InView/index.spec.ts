import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { InView } from '@studiometa/ui';
import {
  h,
  mount,
  mockIsIntersecting,
  intersectionMockInstance,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
} from '#test-utils';

/**
 * Instantiate and mount a single `InView` component from an HTML string.
 */
async function mountInView(html: string) {
  const root = h('div');
  root.innerHTML = html;
  const el = root.querySelector('[data-component="InView"]') as HTMLElement;
  const instance = new InView(el);
  await mount(instance);

  return { root, el, instance };
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
    expect(InView.config.options).toHaveProperty('repeat', Boolean);
  });

  it('should emit `in-view` when the element enters the viewport', async () => {
    const { el, instance } = await mountInView(`<div data-component="InView"></div>`);
    const fn = vi.fn();
    instance.$on('in-view', fn);

    await mockIsIntersecting(el, true);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  describe('default one-shot behavior', () => {
    it('should emit `in-view` once and then terminate (disconnect the observer)', async () => {
      const { el, instance } = await mountInView(`<div data-component="InView"></div>`);
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

    it('should NOT emit `out-of-view` when terminating after a one-shot `in-view`', async () => {
      const { el, instance } = await mountInView(`<div data-component="InView"></div>`);
      const outOfView = vi.fn();
      instance.$on('out-of-view', outOfView);

      await mockIsIntersecting(el, true);

      expect(outOfView).not.toHaveBeenCalled();
    });
  });

  describe('with `repeat` option', () => {
    it('should emit `out-of-view` when the element leaves the viewport', async () => {
      const { el, instance } = await mountInView(
        `<div data-component="InView" data-option-repeat></div>`,
      );
      const fn = vi.fn();
      instance.$on('out-of-view', fn);

      await mockIsIntersecting(el, true);
      await mockIsIntersecting(el, false);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should re-emit `in-view` on each re-entry', async () => {
      const { el, instance } = await mountInView(
        `<div data-component="InView" data-option-repeat></div>`,
      );
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
  });

  it('should expose the configurable `intersectionObserver` option', async () => {
    const { el } = await mountInView(
      `<div data-component="InView" data-option-repeat data-option-intersection-observer='{"rootMargin": "100px"}'></div>`,
    );

    const observer = intersectionMockInstance(el);

    // The option is forwarded to the IntersectionObserver instance.
    expect(observer.rootMargin).toBe('100px');
  });
});

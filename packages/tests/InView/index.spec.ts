import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { InView } from '@studiometa/ui';
import {
  h,
  mount,
  mockIsIntersecting,
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
  });

  it('should emit `in-view` when the element enters the viewport', async () => {
    const { el, instance } = await mountInView(`<div data-component="InView"></div>`);
    const fn = vi.fn();
    instance.$on('in-view', fn);

    await mockIsIntersecting(el, true);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should emit `out-of-view` when the element leaves the viewport', async () => {
    const { el, instance } = await mountInView(`<div data-component="InView"></div>`);
    const fn = vi.fn();
    instance.$on('out-of-view', fn);

    await mockIsIntersecting(el, true);
    await mockIsIntersecting(el, false);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should re-emit `in-view` on each re-entry (repeat by default)', async () => {
    const { el, instance } = await mountInView(`<div data-component="InView"></div>`);
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
    const { el } = await mountInView(
      `<div data-component="InView" data-option-intersection-observer='{"rootMargin": "100px"}'></div>`,
    );

    const observer = globalThis.IntersectionObserver as unknown as { mock: { results: any[] } };
    const created = observer.mock.results.at(-1)?.value as IntersectionObserver;

    // The option is forwarded to the IntersectionObserver instance.
    expect(created.rootMargin).toBe('100px');
    expect(el).toBeInstanceOf(HTMLElement);
  });
});

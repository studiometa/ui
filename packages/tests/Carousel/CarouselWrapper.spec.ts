import { describe, it, expect, vi } from 'vitest';
import { CarouselWrapper } from '@studiometa/ui';
import { h } from '#test-utils';

describe('The CarouselWrapper class', () => {
  it('should return its progress', async () => {
    const div = h('div');
    const carouselWrapper = new CarouselWrapper(div);

    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => false);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => false);

    expect(carouselWrapper.progress).toBe(0);

    // Horizontal but no scroll
    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => true);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => false);
    expect(carouselWrapper.progress).toBe(0);

    // Vertical but no scroll
    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => false);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => true);
    expect(carouselWrapper.progress).toBe(0);

    // Horizontal, size and scrollable, no scroll. `offsetWidth` is larger than
    // `clientWidth` to emulate a scrollbar/border: progress must divide by the
    // real scrollable distance (`scrollWidth - clientWidth`), not `offsetWidth`.
    vi.spyOn(div, 'scrollWidth', 'get').mockImplementation(() => 100);
    vi.spyOn(div, 'clientWidth', 'get').mockImplementation(() => 50);
    vi.spyOn(div, 'offsetWidth', 'get').mockImplementation(() => 65);
    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => true);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => false);
    carouselWrapper.resized();
    expect(carouselWrapper.progress).toBe(0);

    // Horizontal, size and scrollable and scroll
    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => 25);
    expect(carouselWrapper.progress).toBe(0.5);

    // Reaches exactly 1 at the maximum scroll position.
    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => 50);
    expect(carouselWrapper.progress).toBe(1);

    // A sub-pixel-short scroll offset still resolves to a clean 1.
    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => 49.77);
    expect(carouselWrapper.progress).toBe(1);

    // Vertical, size and scrollable, no scroll
    vi.spyOn(div, 'scrollHeight', 'get').mockImplementation(() => 100);
    vi.spyOn(div, 'clientHeight', 'get').mockImplementation(() => 50);
    vi.spyOn(div, 'offsetHeight', 'get').mockImplementation(() => 65);
    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => false);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => true);
    carouselWrapper.resized();
    expect(carouselWrapper.progress).toBe(0);

    // Vertical, size and scrollable and scroll
    vi.spyOn(div, 'scrollTop', 'get').mockImplementation(() => 25);
    expect(carouselWrapper.progress).toBe(0.5);
  });

  it('should cache the scroll distance until resized', () => {
    const div = h('div');
    const carouselWrapper = new CarouselWrapper(div);
    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => true);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => false);
    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => 25);
    const scrollWidth = vi.spyOn(div, 'scrollWidth', 'get').mockImplementation(() => 100);
    vi.spyOn(div, 'clientWidth', 'get').mockImplementation(() => 50);

    // First read measures and caches the layout values.
    expect(carouselWrapper.progress).toBe(0.5);
    const callsAfterFirstRead = scrollWidth.mock.calls.length;

    // Subsequent reads reuse the cache and do not touch the layout again.
    expect(carouselWrapper.progress).toBe(0.5);
    expect(carouselWrapper.progress).toBe(0.5);
    expect(scrollWidth.mock.calls.length).toBe(callsAfterFirstRead);

    // A resize invalidates the cache, so the next read measures again.
    carouselWrapper.resized();
    expect(carouselWrapper.progress).toBe(0.5);
    expect(scrollWidth.mock.calls.length).toBeGreaterThan(callsAfterFirstRead);
  });

  it('should update index when scrolling', () => {
    const div = h('div');
    const carouselWrapper = new CarouselWrapper(div);
    const mock = {
      currentIndex: 0,
      $services: {
        enable: vi.fn(),
      },
      items: [
        {
          state: {
            left: 0,
            top: 0,
          },
        },
        {
          state: {
            left: -100,
            top: -100,
          },
        },
      ],
    };
    const carousel = vi.spyOn(carouselWrapper, 'carousel', 'get');
    // @ts-expect-error partial mock
    carousel.mockImplementation(() => mock);

    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => true);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => false);
    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => 10);
    vi.spyOn(div, 'scrollTop', 'get').mockImplementation(() => 10);

    carouselWrapper.onScroll();

    expect(mock.currentIndex).toBe(0);
    expect(mock.$services.enable).toHaveBeenCalledExactlyOnceWith('ticked');

    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => -100);
    vi.spyOn(div, 'scrollTop', 'get').mockImplementation(() => -100);
    carouselWrapper.onScroll();

    expect(mock.currentIndex).toBe(1);

    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => false);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => true);
    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => -90);
    vi.spyOn(div, 'scrollTop', 'get').mockImplementation(() => -90);
    carouselWrapper.onScroll();

    expect(mock.currentIndex).toBe(1);
  });

  it('should scroll to the matching item on scrollToIndex', async () => {
    const div = h('div');
    const carouselWrapper = new CarouselWrapper(div);
    const mock = {
      items: [
        {
          state: {
            left: 0,
            top: 0,
          },
        },
        {
          state: {
            left: -100,
            top: -100,
          },
        },
      ],
    };
    const carousel = vi.spyOn(carouselWrapper, 'carousel', 'get');
    // @ts-expect-error partial mock
    carousel.mockImplementation(() => mock);

    const spy = vi.spyOn(div, 'scrollTo');
    carouselWrapper.scrollToIndex(0);
    expect(spy).toHaveBeenCalledExactlyOnceWith({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
    spy.mockClear();

    carouselWrapper.scrollToIndex(1);
    expect(spy).toHaveBeenCalledExactlyOnceWith({
      left: -100,
      top: -100,
      behavior: 'smooth',
    });
  });

  it('should not scroll on scrollToIndex when the carousel has no matching item', () => {
    const div = h('div');
    const carouselWrapper = new CarouselWrapper(div);
    const spy = vi.spyOn(div, 'scrollTo');
    // @ts-expect-error partial mock
    vi.spyOn(carouselWrapper, 'carousel', 'get').mockImplementation(() => ({ items: [] }));

    // An empty carousel (or an out-of-range index) must not throw or scroll.
    expect(() => carouselWrapper.scrollToIndex(0)).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});

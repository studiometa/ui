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

    // Horizontal, size and scrollable, no scroll
    vi.spyOn(div, 'scrollWidth', 'get').mockImplementation(() => 100);
    vi.spyOn(div, 'offsetWidth', 'get').mockImplementation(() => 50);
    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => true);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => false);
    expect(carouselWrapper.progress).toBe(0);

    // Horizontal, size and scrollable and scroll
    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => 25);
    expect(carouselWrapper.progress).toBe(0.5);

    // Vertical, size and scrollable, no scroll
    vi.spyOn(div, 'scrollHeight', 'get').mockImplementation(() => 100);
    vi.spyOn(div, 'offsetHeight', 'get').mockImplementation(() => 50);
    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => false);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => true);
    expect(carouselWrapper.progress).toBe(0);

    // Horizontal, size and scrollable and scroll
    vi.spyOn(div, 'scrollTop', 'get').mockImplementation(() => 25);
    expect(carouselWrapper.progress).toBe(0.5);
  });

  it('should update index when scrolling', () => {
    const div = h('div');
    const carouselWrapper = new CarouselWrapper(div);
    const mock = {
      index: 0,
      $emit: vi.fn(),
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

    expect(mock.index).toBe(0);
    expect(mock.$emit).toHaveBeenCalledExactlyOnceWith('progress', 0);

    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => -100);
    vi.spyOn(div, 'scrollTop', 'get').mockImplementation(() => -100);
    carouselWrapper.onScroll();

    expect(mock.index).toBe(1);

    vi.spyOn(carouselWrapper, 'isHorizontal', 'get').mockImplementation(() => false);
    vi.spyOn(carouselWrapper, 'isVertical', 'get').mockImplementation(() => true);
    vi.spyOn(div, 'scrollLeft', 'get').mockImplementation(() => -90);
    vi.spyOn(div, 'scrollTop', 'get').mockImplementation(() => -90);
    carouselWrapper.onScroll();

    expect(mock.index).toBe(1);
  });

  it('should scroll to the matching item when the carousel goes to', async () => {
    const div = h('div');
    const carouselWrapper = new CarouselWrapper(div);
    const mock = {
      index: 0,
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
    carouselWrapper.onParentCarouselGoTo();
    expect(spy).toHaveBeenCalledExactlyOnceWith({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
    spy.mockClear();

    mock.index = 1;

    carouselWrapper.onParentCarouselGoTo();
    expect(spy).toHaveBeenCalledExactlyOnceWith({
      left: -100,
      top: -100,
      behavior: 'smooth',
    });
  });
});

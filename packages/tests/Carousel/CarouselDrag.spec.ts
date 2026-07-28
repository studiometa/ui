import { describe, it, expect, vi } from 'vitest';
import { CarouselDrag } from '@studiometa/ui';
import { h, mount, useMatchMedia, wait } from '#test-utils';

describe('The CarouselDrag class', () => {
  it('should mount only when pointer is fine', async () => {
    const matchMedia = useMatchMedia();
    const div = h('div');
    const carouselDrag = new CarouselDrag(div);
    const fn = vi.fn();
    carouselDrag.$on('mounted', fn);
    await mount(carouselDrag);
    expect(fn).not.toHaveBeenCalled();

    matchMedia.useMediaQuery('(pointer: fine)');

    await wait(10);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should do nothing when not mounted', async () => {
    const div = h('div');
    const carouselDrag = new CarouselDrag(div);
    const spy = vi.spyOn(div, 'scrollTo');
    // @ts-expect-error partial mock
    carouselDrag.dragged({});
    expect(spy).not.toHaveBeenCalled();
  });

  it('should do nothing for stop or inertia mode', async () => {
    const div = h('div');
    const carouselDrag = new CarouselDrag(div);
    vi.spyOn(carouselDrag, '$isMounted', 'get').mockImplementation(() => true);
    const spy = vi.spyOn(div, 'scrollTo');
    // @ts-expect-error partial mock
    carouselDrag.dragged({ mode: 'inertia' });
    expect(spy).not.toHaveBeenCalled();
    // @ts-expect-error partial mock
    carouselDrag.dragged({ mode: 'stop' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('should do nothing if no distance', async () => {
    const div = h('div');
    const carouselDrag = new CarouselDrag(div);

    vi.spyOn(carouselDrag, '$isMounted', 'get').mockImplementation(() => true);
    vi.spyOn(carouselDrag, 'isHorizontal', 'get').mockImplementation(() => true);
    vi.spyOn(carouselDrag, 'isVertical', 'get').mockImplementation(() => false);

    const spy = vi.spyOn(div, 'scrollTo');

    // @ts-expect-error partial mock
    carouselDrag.dragged({ mode: 'drag', distance: { x: 0 } });
    expect(spy).not.toHaveBeenCalled();

    vi.spyOn(carouselDrag, 'isHorizontal', 'get').mockImplementation(() => false);
    vi.spyOn(carouselDrag, 'isVertical', 'get').mockImplementation(() => true);

    // @ts-expect-error partial mock
    carouselDrag.dragged({ mode: 'drag', distance: { y: 0 } });
    expect(spy).not.toHaveBeenCalled();
  });

  it('should scroll instantly when dragging', async () => {
    const div = h('div');
    const carouselDrag = new CarouselDrag(div);
    const spy = vi.spyOn(div, 'scrollTo');

    vi.spyOn(carouselDrag, '$isMounted', 'get').mockImplementation(() => true);
    vi.spyOn(carouselDrag, 'isHorizontal', 'get').mockImplementation(() => true);
    vi.spyOn(carouselDrag, 'isVertical', 'get').mockImplementation(() => false);

    // @ts-expect-error partial mock
    carouselDrag.dragged({ mode: 'drag', distance: { x: 1, y: 0 }, delta: { x: 1, y: 0 } });

    expect(div.style.scrollSnapType).toBe('none');
    expect(spy).toHaveBeenCalledExactlyOnceWith({
      left: -1,
      top: 0,
      behavior: 'instant',
    });
  });

  it('should scroll to a snapped item on drop', async () => {
    const div = h('div');
    const carouselDrag = new CarouselDrag(div);
    const spy = vi.spyOn(div, 'scrollTo');

    vi.spyOn(carouselDrag, '$isMounted', 'get').mockImplementation(() => true);
    vi.spyOn(carouselDrag, 'isHorizontal', 'get').mockImplementation(() => true);
    vi.spyOn(carouselDrag, 'isVertical', 'get').mockImplementation(() => false);
    vi.spyOn(carouselDrag, 'carousel', 'get').mockImplementation(() => ({
      items: [
        {
          // @ts-expect-error partial mock
          state: {
            left: 0,
            top: 0,
          },
        },
        {
          // @ts-expect-error partial mock
          state: {
            left: -100,
            top: -100,
          },
        },
      ],
    }));

    // @ts-expect-error partial mock
    carouselDrag.dragged({ mode: 'drop', distance: { x: 10, y: 0 }, delta: { x: 10, y: 0 } });

    expect(spy).toHaveBeenCalledExactlyOnceWith({
      left: -100,
      behavior: 'smooth',
    });
    spy.mockClear();

    vi.spyOn(carouselDrag, 'isHorizontal', 'get').mockImplementation(() => false);
    vi.spyOn(carouselDrag, 'isVertical', 'get').mockImplementation(() => true);

    // @ts-expect-error partial mock
    carouselDrag.dragged({ mode: 'drop', distance: { x: 0, y: 10 }, delta: { x: 0, y: 10 } });

    expect(spy).toHaveBeenCalledExactlyOnceWith({
      top: -100,
      behavior: 'smooth',
    });
    div.dispatchEvent(new Event('scrollend'));
    expect(div.style.scrollSnapType).toBe('');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Give each item a deterministic scroll target based on its position among the
// CarouselItem siblings, so `getClosestIndex` can map a scroll position back to
// an index without a real layout engine. `geo.scale` is mutable so a resize can
// change the geometry and tests can tell a fresh measurement from a stale one.
const geo = vi.hoisted(() => ({ scale: 100 }));
vi.mock('compute-scroll-into-view', () => ({
  compute: (el: Element) => {
    const items = [...el.parentElement!.querySelectorAll('[data-component~="CarouselItem"]')];
    const index = items.indexOf(el);
    return [{ el, top: index * geo.scale, left: index * geo.scale }];
  },
}));

import { Carousel } from '@studiometa/ui';
import { h, mount, wait, resizeWindow } from '#test-utils';

describe('Carousel navigation', () => {
  beforeEach(() => {
    geo.scale = 100;
  });

  async function getCarousel() {
    const items = [
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
    ];
    const wrapperEl = h('div', { dataComponent: 'CarouselWrapper' }, items);
    const el = h('div', [wrapperEl]);
    const carousel = new Carousel(el);
    await mount(carousel);
    return { carousel, wrapper: carousel.wrapper, items };
  }

  it('should scroll to the target item when navigating programmatically', async () => {
    const { carousel, wrapper } = await getCarousel();
    const scrollTo = vi.spyOn(wrapper.$el, 'scrollTo');

    carousel.goTo(2);

    expect(carousel.currentIndex).toBe(2);
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 200, top: 200, behavior: 'smooth' });
  });

  it('should sync the index from a scroll without scrolling back to it', async () => {
    const { carousel, wrapper } = await getCarousel();
    const scrollTo = vi.spyOn(wrapper.$el, 'scrollTo');

    // Emulate the wrapper being scrolled to the second item, then a scroll event.
    vi.spyOn(wrapper.$el, 'scrollLeft', 'get').mockReturnValue(100);
    wrapper.onScroll();

    // The index reflects the scroll position…
    expect(carousel.currentIndex).toBe(1);
    // …but the wrapper must NOT scroll back to it, otherwise it would hijack a
    // programmatic smooth scroll and never reach the requested item.
    expect(scrollTo).not.toHaveBeenCalled();

    // A subsequent programmatic navigation still scrolls.
    carousel.goTo(0);
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 0, top: 0, behavior: 'smooth' });
  });

  it('should mark item 0 active and disable the prev button after mount alone', async () => {
    // No navigation happens: this asserts the store is seeded on mount, which is
    // what fixes the initial-state race (item 0 not active, prev not disabled).
    const items = [
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
    ];
    const prevBtn = h('button', { dataComponent: 'CarouselBtn', dataOptionAction: 'prev' });
    const wrapperEl = h('div', { dataComponent: 'CarouselWrapper' }, items);
    const el = h('div', [wrapperEl, prevBtn]);
    const carousel = new Carousel(el);
    await mount(carousel);
    await wait(50);

    expect(items[0].style.getPropertyValue('--carousel-item-active')).toBe('1');
    expect(items[1].style.getPropertyValue('--carousel-item-active')).toBe('0');
    expect((prevBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('should update progress on a scroll that is not preceded by a goTo', async () => {
    const { carousel, wrapper } = await getCarousel();
    await wait();

    // A native/touch scroll only reports through onScroll; it must still keep
    // the progress bar animating (the `ticked` service is re-enabled there).
    vi.spyOn(wrapper, 'progress', 'get').mockReturnValue(0.5);
    wrapper.onScroll();
    await wait();

    expect(carousel.$el.style.getPropertyValue('--carousel-progress')).toBe('0.5');
  });

  it('should re-snap to the freshly-measured position on resize', async () => {
    const { carousel, wrapper } = await getCarousel();
    carousel.goTo(1);
    await wait();

    const scrollTo = vi.spyOn(wrapper.$el, 'scrollTo');

    // The geometry changes on resize: item positions halve. Driving the real
    // resize service (not calling `resized()` directly) exercises js-toolkit's
    // parent-first callback order, so a synchronous re-snap would read the stale
    // cached position (100). The deferred re-snap must use the fresh one (50).
    geo.scale = 50;
    await resizeWindow({ width: 800 });

    expect(scrollTo).toHaveBeenCalledWith({ left: 50, top: 50, behavior: 'smooth' });
    expect(scrollTo).not.toHaveBeenCalledWith({ left: 100, top: 100, behavior: 'smooth' });
  });

  it('should refresh controls when items are added after mount', async () => {
    // After appending items, `lastIndex` grows but the stored index is unchanged,
    // so the change-gated store never re-notifies. Controls must still refresh on
    // update, otherwise the `next` button stays stuck disabled.
    const items = [
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
    ];
    const nextBtn = h('button', { dataComponent: 'CarouselBtn', dataOptionAction: 'next' });
    const wrapperEl = h('div', { dataComponent: 'CarouselWrapper' }, items);
    const el = h('div', [wrapperEl, nextBtn]);
    const carousel = new Carousel(el);
    await mount(carousel);

    carousel.goTo(1); // last index of two items -> next disabled
    await wait();
    expect((nextBtn as HTMLButtonElement).disabled).toBe(true);

    wrapperEl.append(
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
    );
    await carousel.$update();
    await wait();

    // lastIndex is now 3, so index 1 is no longer the last -> next re-enables.
    expect((nextBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('should re-normalize the current index when items are removed', async () => {
    const items = [
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
    ];
    const wrapperEl = h('div', { dataComponent: 'CarouselWrapper' }, items);
    const el = h('div', [wrapperEl]);
    const carousel = new Carousel(el);
    await mount(carousel);

    carousel.goTo(3);
    await wait();
    expect(carousel.currentIndex).toBe(3);

    // Remove the last two items so index 3 is now out of range.
    items[3].remove();
    items[2].remove();
    await carousel.$update();
    await wait();

    // The index is clamped to the new last index and the active item follows.
    expect(carousel.currentIndex).toBe(1);
    expect(items[0].style.getPropertyValue('--carousel-item-active')).toBe('0');
    expect(items[1].style.getPropertyValue('--carousel-item-active')).toBe('1');
  });

  it('should refresh progress after an update', async () => {
    const { carousel, wrapper } = await getCarousel();
    await wait();

    // After an update the progress denominator can change; `updated` must
    // re-emit the refreshed progress rather than leave `--carousel-progress`
    // stale until the next scroll.
    vi.spyOn(wrapper, 'progress', 'get').mockReturnValue(0.5);
    carousel.updated();
    await wait();

    expect(carousel.$el.style.getPropertyValue('--carousel-progress')).toBe('0.5');
  });

  describe('boundary option', () => {
    async function mountWith(boundary: string) {
      const items = [
        h('div', { dataComponent: 'CarouselItem' }),
        h('div', { dataComponent: 'CarouselItem' }),
        h('div', { dataComponent: 'CarouselItem' }),
      ];
      const wrapperEl = h('div', { dataComponent: 'CarouselWrapper' }, items);
      const el = h('div', { dataOptionBoundary: boundary }, [wrapperEl]);
      const carousel = new Carousel(el);
      await mount(carousel);
      return carousel;
    }

    it('clamp: goNext stops at the last index', async () => {
      const carousel = await mountWith('clamp');
      carousel.goTo(2);
      carousel.goNext();
      expect(carousel.currentIndex).toBe(2);
    });

    it('loop: navigation wraps around the ends', async () => {
      const carousel = await mountWith('loop');
      carousel.goTo(2);
      carousel.goNext();
      expect(carousel.currentIndex).toBe(0);
      carousel.goPrev();
      expect(carousel.currentIndex).toBe(2);
    });

    it('bounce: navigation reverses at the last index', async () => {
      const carousel = await mountWith('bounce');
      carousel.goTo(2);
      carousel.goNext();
      expect(carousel.currentIndex).toBe(1);
    });
  });
});

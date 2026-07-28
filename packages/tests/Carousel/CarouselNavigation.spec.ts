import { describe, it, expect, vi } from 'vitest';

// Give each item a deterministic scroll target based on its position among the
// CarouselItem siblings, so `getClosestIndex` can map a scroll position back to
// an index without a real layout engine.
vi.mock('compute-scroll-into-view', () => ({
  compute: (el: Element) => {
    const items = [...el.parentElement!.querySelectorAll('[data-component~="CarouselItem"]')];
    const index = items.indexOf(el);
    return [{ el, top: index * 100, left: index * 100 }];
  },
}));

import { Carousel } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('Carousel navigation', () => {
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
    return { carousel, wrapper: carousel.wrapper };
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
});

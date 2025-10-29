import { describe, it, expect, vi } from 'vitest';
import { CarouselItem, Carousel } from '@studiometa/ui';
import { getInstanceFromElement } from '@studiometa/js-toolkit';
import { h, mount, wait } from '#test-utils';

describe('The CarouselItem class', () => {
  it('should know its own index', async () => {
    const items = [
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
      h('div', { dataComponent: 'CarouselItem' }),
    ];
    const wrapper = h('div', { dataComponent: 'CarouselWrapper' }, items);
    const div = h('div', [wrapper]);
    const carousel = new Carousel(div);
    await mount(carousel);

    const firstItem = getInstanceFromElement(items.at(0), CarouselItem);
    const secondItem = getInstanceFromElement(items.at(1), CarouselItem);

    expect(firstItem.index).toBe(0);
    expect(secondItem.index).toBe(1);
  });

  it('should set an active state when active', async () => {
    const div = h('div');
    const carouselItem = new CarouselItem(div);
    vi.spyOn(carouselItem, 'index', 'get').mockImplementation(() => 0);
    // @ts-expect-error partial mock
    vi.spyOn(carouselItem, 'carousel', 'get').mockImplementation(() => ({ currentIndex: 0 }));

    carouselItem.onParentCarouselProgress();
    await wait(20);
    expect(div.style.getPropertyValue('--carousel-item-active')).toBe('1');

    // @ts-expect-error partial mock
    vi.spyOn(carouselItem, 'carousel', 'get').mockImplementation(() => ({ currentIndex: 1 }));
    carouselItem.onParentCarouselProgress();
    expect(div.style.getPropertyValue('--carousel-item-active')).toBe('1');
    await wait(20);
    expect(div.style.getPropertyValue('--carousel-item-active')).toBe('0');
  });

  it('should reset its state on window resize', async () => {
    vi.mock('compute-scroll-into-view', () => ({
      compute: (target: Element) => [{ el: target, top: 0, left: 0 }],
    }));
    const item = h('div', { dataComponent: 'CarouselItem' });
    const wrapper = h('div', { dataComponent: 'CarouselWrapper' }, [item]);
    const div = h('div', [wrapper]);
    const carousel = new Carousel(div);
    await mount(carousel);
    const carouselItem = getInstanceFromElement(item, CarouselItem);
    const { state } = carouselItem;
    expect(carouselItem.state).toBe(state);
    carouselItem.resized();
    expect(carouselItem.state).not.toBe(state);
    expect(carouselItem.state).toEqual(state);
  });
});

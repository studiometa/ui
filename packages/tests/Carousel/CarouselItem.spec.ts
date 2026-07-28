import { describe, it, expect, vi } from 'vitest';
import { CarouselItem, Carousel } from '@studiometa/ui';
import { getInstanceFromElement } from '@studiometa/js-toolkit';
import { h, mount } from '#test-utils';

vi.mock('compute-scroll-into-view', () => ({
  compute: (target: Element) => [{ el: target, top: 0, left: 0 }],
}));

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

  it('should set an active state when its index matches', async () => {
    const div = h('div');
    const carouselItem = new CarouselItem(div);
    vi.spyOn(carouselItem, 'index', 'get').mockImplementation(() => 0);

    // `update` returns the DOM write to run in the scheduler's write phase.
    carouselItem.update(0)?.();
    expect(div.style.getPropertyValue('--carousel-item-active')).toBe('1');

    carouselItem.update(1)?.();
    expect(div.style.getPropertyValue('--carousel-item-active')).toBe('0');
  });

  it('should reset its state on window resize', async () => {
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

  it('should reset its state on update', async () => {
    const item = h('div', { dataComponent: 'CarouselItem' });
    const wrapper = h('div', { dataComponent: 'CarouselWrapper' }, [item]);
    const div = h('div', [wrapper]);
    const carousel = new Carousel(div);
    await mount(carousel);
    const carouselItem = getInstanceFromElement(item, CarouselItem);
    const { state } = carouselItem;
    expect(carouselItem.state).toBe(state);
    // Inserting/removing slides re-measures offsets: a plain `$update` must
    // invalidate the cached scroll target too, not just a window resize.
    carouselItem.updated();
    expect(carouselItem.state).not.toBe(state);
    expect(carouselItem.state).toEqual(state);
  });
});

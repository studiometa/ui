import { describe, it, expect, vi } from 'vitest';
import { Carousel } from '@studiometa/ui';
import { h, mount } from '#test-utils';

describe('The Carousel class', () => {
  it('should have an axis option', async () => {
    const div = h('div');
    const carousel = new Carousel(div);
    await mount(carousel);
    expect(carousel.isHorizontal).toBe(true);
    expect(carousel.isVertical).toBe(false);
    div.setAttribute('data-option-axis', 'y');
    expect(carousel.isHorizontal).toBe(false);
    expect(carousel.isVertical).toBe(true);
  });

  it('should emit go-to and progress events', async () => {
    const div = h('div');
    const carousel = new Carousel(div);
    const goToFn = vi.fn();
    const progressFn = vi.fn();
    carousel.$on('go-to', goToFn);
    carousel.$on('progress', progressFn);
    carousel.goTo(0);
    expect(goToFn).toHaveBeenCalledOnce();
    expect(goToFn.mock.lastCall[0].detail).toEqual([0]);
    expect(progressFn).toHaveBeenCalledOnce();
    carousel.goTo(1);
    expect(goToFn.mock.lastCall[0].detail).toEqual([1]);
  });

  it('should implement an indexable API', async () => {
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

    expect(carousel.index).toBe(0);
    expect(carousel.prevIndex).toBe(0);
    expect(carousel.nextIndex).toBe(1);
    expect(carousel.lastIndex).toBe(3);

    carousel.goTo(1);

    expect(carousel.index).toBe(1);
    expect(carousel.prevIndex).toBe(0);
    expect(carousel.nextIndex).toBe(2);
    expect(carousel.lastIndex).toBe(3);

    carousel.goNext();

    expect(carousel.index).toBe(2);
    expect(carousel.prevIndex).toBe(1);
    expect(carousel.nextIndex).toBe(3);
    expect(carousel.lastIndex).toBe(3);

    carousel.goPrev();

    expect(carousel.index).toBe(1);
    expect(carousel.prevIndex).toBe(0);
    expect(carousel.nextIndex).toBe(2);
    expect(carousel.lastIndex).toBe(3);
  });

  it('should go to the current index on mount', async () => {
    const div = h('div');
    const carousel = new Carousel(div);
    const spy = vi.spyOn(carousel, 'goTo');
    await mount(carousel);
    expect(spy).toHaveBeenCalledExactlyOnceWith(carousel.index);
  });

  it('should go to the current index on resize', async () => {
    const div = h('div');
    const carousel = new Carousel(div);
    const spy = vi.spyOn(carousel, 'goTo');
    carousel.resized();
    expect(spy).toHaveBeenCalledExactlyOnceWith(carousel.index);
  });
});

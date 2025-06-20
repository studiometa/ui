import { describe, it, expect, vi } from 'vitest';
import { AbstractCarouselChild, Carousel } from '@studiometa/ui';
import { h, mount, destroy } from '#test-utils';

describe('The AbstractCarouselChild class', () => {
  it('should not mount if it can not find a parent Carousel', async () => {
    const div = h('div');
    const child = new AbstractCarouselChild(div);
    await mount(child);
    expect(child.$isMounted).toBe(false);
  });

  it('should listen to its parent events and dispatch them', async () => {
    const childElement = h('div');
    const carouselElement = h('div', [childElement]);
    const carousel = new Carousel(carouselElement);
    const child = new AbstractCarouselChild(childElement);
    await mount(carousel, child);
    expect(child.carousel).toBe(carousel);
    const spy = vi.spyOn(child, '$emit');

    for (const eventName of ['go-to', 'progress']) {
      carousel.$emit(eventName, 0);
      expect(spy).toHaveBeenCalledExactlyOnceWith(`parent-carousel-${eventName}`, 0);
      spy.mockClear();
    }

    await destroy(child);
    spy.mockClear();

    for (const eventName of ['go-to', 'progress']) {
      carousel.$emit(eventName, 0);
      expect(spy).not.toHaveBeenCalled();
      spy.mockClear();
    }
  });

  it('should expose the parent carousel isHorizontal and isVertical getters', async () => {
    const childElement = h('div');
    const carouselElement = h('div', [childElement]);
    const carousel = new Carousel(carouselElement);
    const child = new AbstractCarouselChild(childElement);
    await mount(carousel, child);
    expect(child.isHorizontal).toBe(carousel.isHorizontal);
    expect(child.isVertical).toBe(carousel.isVertical);
  });
});

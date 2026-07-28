import { describe, it, expect, vi } from 'vitest';
import { AbstractCarouselChild, Carousel } from '@studiometa/ui';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { h, mount, destroy, wait } from '#test-utils';

/**
 * A concrete subscribing child recording the indexes it is updated with.
 */
class TestChild<T extends BaseProps = BaseProps> extends AbstractCarouselChild<T> {
  static config = { name: 'TestChild' };

  updates: number[] = [];

  update(index: number) {
    this.updates.push(index);
  }
}

/**
 * A Carousel subclass registering `TestChild`, mirroring the documented usage
 * where controls are added through `config.components`.
 */
class TestCarousel extends Carousel {
  static config: BaseConfig = {
    name: 'Carousel',
    components: { TestChild },
    emits: ['progress'],
  };
}

describe('The AbstractCarouselChild class', () => {
  it('should expose the parent carousel isHorizontal and isVertical getters', async () => {
    const childElement = h('div');
    const carouselElement = h('div', [childElement]);
    const carousel = new Carousel(carouselElement);
    const child = new TestChild(childElement);
    await mount(carousel, child);
    expect(child.isHorizontal).toBe(carousel.isHorizontal);
    expect(child.isVertical).toBe(carousel.isVertical);
  });

  it('should default the orientation getters when no carousel is resolvable', async () => {
    const child = new TestChild(h('div'));
    await mount(child);
    expect(child.carousel).toBeUndefined();
    expect(child.isHorizontal).toBe(true);
    expect(child.isVertical).toBe(false);
  });

  it('should subscribe to the store and pull the seeded index on connect', async () => {
    const childElement = h('div');
    const carouselElement = h('div', [childElement]);
    const carousel = new Carousel(carouselElement);
    const child = new TestChild(childElement);
    await mount(carousel, child);

    // The Carousel seeds its store on mount, so the child pulls the initial
    // index as soon as it connects.
    await wait(20);
    expect(child.updates.at(-1)).toBe(0);
    expect(child.carousel).toBe(carousel);

    // A same-value assignment is gated and must not re-notify subscribers.
    child.updates.length = 0;
    carousel.currentIndex = 0;
    await wait(20);
    expect(child.updates).toEqual([]);
  });

  it('should connect even when mounted before its Carousel (parent-side handshake)', async () => {
    const childElement = h('div', { dataComponent: 'TestChild' });
    const carouselElement = h('div', [childElement]);

    // Fully mount the child before the Carousel is even constructed: it cannot
    // resolve a parent and stays unsubscribed.
    const child = new TestChild(childElement);
    await mount(child);
    await wait(20);
    expect(child.updates).toEqual([]);

    // Mounting the Carousel seeds the store and, via `connectChildren`, hands
    // itself over to the pre-mounted child which then pulls the seeded index.
    const carousel = new TestCarousel(carouselElement);
    await mount(carousel);
    await wait(20);
    expect(child.carousel).toBe(carousel);
    expect(child.updates.at(-1)).toBe(0);
  });

  it('should be idempotent: connecting twice subscribes only once', async () => {
    const childElement = h('div');
    const carouselElement = h('div', [childElement]);
    const carousel = new Carousel(carouselElement);
    const child = new TestChild(childElement);
    await mount(carousel, child);

    const subscribe = vi.spyOn(carousel.store, 'subscribe');
    child.__connect(carousel as unknown as Carousel);
    child.__connect(carousel as unknown as Carousel);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('should unsubscribe from the store on destroy', async () => {
    const childElement = h('div');
    const carouselElement = h('div', [childElement]);
    const carousel = new Carousel(carouselElement);
    const child = new TestChild(childElement);
    await mount(carousel, child);
    await wait(20);

    await destroy(child);
    child.updates.length = 0;

    // After destroy the child no longer reacts to store changes.
    carousel.goTo(1);
    await wait(20);
    expect(child.updates).toEqual([]);
  });
});

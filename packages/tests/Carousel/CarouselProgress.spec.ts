import { describe, it, expect, vi } from 'vitest';
import { CarouselProgress } from '@studiometa/ui';
import { h } from '#test-utils';

describe('The AbstractCarouselChild class', () => {
  it('should not mount if it can not find a parent Carousel', async () => {
    const div = h('div');
    const carouselProgress = new CarouselProgress(div);
    const spy = vi.spyOn(carouselProgress, 'carousel', 'get');
    spy.mockImplementation(() => ({ progress: 1 }));
    carouselProgress.onParentCarouselProgress();
    expect(div.style.getPropertyValue('--carousel-progress')).toBe('1');
  });
});

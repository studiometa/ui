import { describe, it, expect, vi } from 'vitest';
import { CarouselBtn, Carousel } from '@studiometa/ui';
import { h } from '#test-utils';

describe('The CarouselBtn class', () => {
  for (const [action, method] of [
    ['prev', 'goPrev'],
    ['next', 'goNext'],
    [2, 'goTo'],
  ] as const) {
    it('should dispatch its action to the carousel', async () => {
      const btn = h('button', { dataOptionAction: action });
      const div = h('div', [btn]);
      const carousel = new Carousel(div);
      const carouselBtn = new CarouselBtn(btn);

      const spy = vi.spyOn(carousel, method);
      spy.mockImplementation(() => {});
      carouselBtn.onClick();
      expect(spy).toHaveBeenCalledOnce();
    });
  }

  for (const [action, index, lastIndex, isDisabled] of [
    ['prev', 0, 10, true],
    ['prev', 1, 10, false],
    ['next', 1, 10, false],
    ['next', 10, 10, true],
    [1, 1, 10, true],
    [1, 2, 10, false],
  ] as const) {
    it(`should set the disabled attribute to ${String(isDisabled)} when action is ${action}, index is ${index} and lastIndex is ${lastIndex}.`, async () => {
      const btn = h('button', { dataOptionAction: action });
      const carouselBtn = new CarouselBtn(btn);
      const spy = vi.spyOn(carouselBtn, 'carousel', 'get');
      // @ts-expect-error mock is partial
      spy.mockImplementation(() => ({ index, lastIndex }));
      carouselBtn.onParentCarouselProgress();
      expect(btn.disabled).toBe(isDisabled);
    });
  }
});

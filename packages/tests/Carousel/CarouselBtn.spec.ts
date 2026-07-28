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
      spy.mockImplementation(() => Promise.resolve());
      carouselBtn.onClick();
      expect(spy).toHaveBeenCalledOnce();
    });
  }

  // The disabled state is derived from `prevIndex`/`nextIndex` (whether the
  // action would actually move), so it honours boundary/reverse options.
  for (const [action, index, carouselMock, isDisabled] of [
    // clamp (default): the reachable end index equals the current index.
    ['prev', 0, { prevIndex: 0 }, true],
    ['prev', 1, { prevIndex: 0 }, false],
    ['next', 1, { nextIndex: 2 }, false],
    ['next', 10, { nextIndex: 10 }, true],
    // numeric action: disabled only on the slide it points to.
    [1, 1, {}, true],
    [1, 2, {}, false],
    // loop/reverse: prev/next still move at the raw ends, so never disabled.
    ['prev', 0, { prevIndex: 10 }, false],
    ['next', 10, { nextIndex: 0 }, false],
  ] as const) {
    it(`should set disabled=${String(isDisabled)} for action=${action} at index=${index} (${JSON.stringify(carouselMock)})`, async () => {
      const btn = h('button', { dataOptionAction: action });
      const carouselBtn = new CarouselBtn(btn);
      const spy = vi.spyOn(carouselBtn, 'carousel', 'get');
      // @ts-expect-error mock is partial
      spy.mockImplementation(() => carouselMock);
      carouselBtn.update(index);
      expect(btn.disabled).toBe(isDisabled);
    });
  }
});

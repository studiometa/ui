import { it, describe, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { Figure } from '@studiometa/ui';
import {
  wait,
  hConnected as h,
  mockIsIntersecting,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
  mockImageLoad,
  unmockImageLoad,
} from '#test-utils';

beforeAll(() => {
  intersectionObserverBeforeAllCallback();
});

beforeEach(() => {
  mockImageLoad();
});

afterEach(() => {
  intersectionObserverAfterEachCallback();
  unmockImageLoad();
});

describe('The Figure component', () => {
  it('should load the original image lazily and terminate the instance', async () => {
    const src = 'http://localhost/img.jpg';
    const img = h('img', {
      dataRef: 'img',
      src: 'data:image/svg+xml,<svg viewport="0 0 1 1"></svg>',
      dataSrc: src,
    });
    const figure = h('figure', { dataOptionLazy: '' }, [img]);

    const instance = new Figure(figure);
    const fn = vi.fn();
    instance.$on('terminated', fn);
    expect(img.src).not.toBe(src);
    mockIsIntersecting(figure, true);
    await wait(100);
    expect(img.src).toBe(src);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should warn if the `img` ref is misconfigured', async () => {
    const div = h('div');
    const instance = new Figure(div);
    const warnSpy = vi.spyOn(instance, '$warn', 'get');
    mockIsIntersecting(div, true);
    await wait(10);
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});

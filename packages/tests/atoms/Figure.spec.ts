import { it, describe, expect, beforeAll, beforeEach, afterEach } from 'vitest';
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
  it('should load the original image lazily', async () => {
    const src = 'http://localhost/img.jpg';
    const img = h('img', {
      dataRef: 'img',
      src: 'data:image/svg+xml,<svg viewport="0 0 1 1"></svg>',
      dataSrc: src,
    });
    const figure = h('figure', { dataOptionLazy: '' }, [img]);

    const instance = new Figure(figure);
    expect(img.src).not.toBe(src);
    mockIsIntersecting(figure, true);
    await wait(10);
    expect(img.src).toBe(src);
  });
});

import { it, describe, vi, expect, beforeAll, afterEach } from 'vitest';
import { Base } from '@studiometa/js-toolkit';
import { FigureShopify } from '@studiometa/ui';
import {
  wait,
  hConnected as h,
  mockIsIntersecting,
  mount,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
} from '#test-utils';

beforeAll(() => {
  intersectionObserverBeforeAllCallback();
});

afterEach(() => {
  intersectionObserverAfterEachCallback();
});

async function getContext({ figureAttributes = {} } = {}) {
  const img = h('img', {
    dataRef: 'img',
    src: 'data:image/svg+xml,<svg viewport="0 0 1 1" width="1" height="1"></svg>',
    dataSrc: 'https://localhost/image.jpg',
  });
  const figure = h('figure', { dataOptionLazy: '', ...figureAttributes }, [img]);

  const widthSpy = vi.spyOn(img, 'offsetWidth', 'get');
  widthSpy.mockImplementation(() => 100);
  const heightSpy = vi.spyOn(img, 'offsetHeight', 'get');
  heightSpy.mockImplementation(() => 100);

  const instance = new FigureShopify(figure);
  mockIsIntersecting(figure, true);
  await wait(100);

  return {
    img,
    figure,
    instance,
    setSize({ width, height }: { width?: number; height?: number } = {}) {
      if (width) {
        widthSpy.mockImplementation(() => width);
      }
      if (height) {
        heightSpy.mockImplementation(() => height);
      }
    },
  };
}

describe('The FigureShopify component', () => {
  it('should override the original image', async () => {
    const { instance, setSize } = await getContext();
    expect(instance.original).toBe('https://localhost/image.jpg?width=100&height=100');
    setSize({ width: 200, height: 200 });
    expect(instance.original).toBe('https://localhost/image.jpg?width=200&height=200');
  });

  it('should not override the original image when disabled', async () => {
    const { instance, setSize } = await getContext();
    instance.$options.disable = true;
    expect(instance.original).toBe('https://localhost/image.jpg');
  });

  it('should add a crop parameter', async () => {
    const { instance, setSize } = await getContext({
      figureAttributes: { dataOptionCrop: 'center' },
    });

    expect(instance.original).toBe('https://localhost/image.jpg?width=100&height=100&crop=center');
    setSize({ width: 200, height: 200 });
    expect(instance.original).toBe('https://localhost/image.jpg?width=200&height=200&crop=center');
  });
});

import { it, describe, vi, expect, beforeAll, afterEach } from 'vitest';
import { Base } from '@studiometa/js-toolkit';
import { FigureShopify } from '@studiometa/ui';
import { wait, hConnected as h, mockIsIntersecting, mount, intersectionObserverBeforeAllCallback, intersectionObserverAfterEachCallback  } from '#test-utils';

beforeAll(() => {
  intersectionObserverBeforeAllCallback();
});

afterEach(() => {
  intersectionObserverAfterEachCallback();
});

describe('The FigureShopify component', () => {
  it('should override the original image', async () => {
    const img = h('img', {
      dataRef: 'img',
      src: 'data:image/svg+xml,<svg viewport="0 0 1 1" width="1" height="1"></svg>',
      dataSrc: 'https://localhost/image.jpg',
    });
    const figure = h('figure', { dataOptionLazy: '' }, [img]);

    const widthSpy = vi.spyOn(img, 'offsetWidth', 'get');
    widthSpy.mockImplementation(() => 100);
    const height = vi.spyOn(img, 'offsetHeight', 'get');
    height.mockImplementation(() => 100);

    const instance = new FigureShopify(figure);
    mockIsIntersecting(figure, true);
    await wait(100);

    expect(instance.original).toBe('https://localhost/image.jpg?width=100&height=100');

    widthSpy.mockImplementation(() => 200);
    height.mockImplementation(() => 200);

    expect(instance.original).toBe('https://localhost/image.jpg?width=200&height=200');
  });

  it('should add a crop parameter', async () => {
    const img = h('img', {
      dataRef: 'img',
      src: 'data:image/svg+xml,<svg viewport="0 0 1 1" width="1" height="1"></svg>',
      dataSrc: 'https://localhost/image.jpg',
    });
    const figure = h('figure', { dataOptionCrop: 'center' }, [img]);

    const widthSpy = vi.spyOn(img, 'offsetWidth', 'get');
    widthSpy.mockImplementation(() => 100);
    const height = vi.spyOn(img, 'offsetHeight', 'get');
    height.mockImplementation(() => 100);

    const instance = new FigureShopify(figure);
    mockIsIntersecting(figure, true);
    await wait(100);

    expect(instance.original).toBe('https://localhost/image.jpg?width=100&height=100&crop=center');

    widthSpy.mockImplementation(() => 200);
    height.mockImplementation(() => 200);

    expect(instance.original).toBe('https://localhost/image.jpg?width=200&height=200&crop=center');
  });
});

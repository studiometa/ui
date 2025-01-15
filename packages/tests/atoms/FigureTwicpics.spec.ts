import { it, describe, vi, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import { FigureTwicpics } from '@studiometa/ui';
import {
  wait,
  hConnected as h,
  mockIsIntersecting,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
  unmockImageLoad,
  mockImageLoad,
} from '#test-utils';
import { resizeWindow } from '../__utils__/resizeWindow';

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

  const instance = new FigureTwicpics(figure);
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

describe('The FigureTwicpics component', () => {
  it('should override the original image', async () => {
    const { instance, setSize } = await getContext();
    expect(instance.original).toBe('https://localhost/image.jpg?twic=v1/cover=100x100');
    setSize({ width: 200, height: 200 });
    expect(instance.original).toBe('https://localhost/image.jpg?twic=v1/cover=200x200');
  });

  it('should update the image source on resize', async () => {
    const { instance, setSize, img } = await getContext();
    expect(instance.original).toBe('https://localhost/image.jpg?twic=v1/cover=100x100');
    expect(img.src).toBe('https://localhost/image.jpg?twic=v1/cover=100x100');
    setSize({ width: 200, height: 200 });
    await resizeWindow();
    expect(instance.original).toBe('https://localhost/image.jpg?twic=v1/cover=200x200');
    expect(img.src).toBe('https://localhost/image.jpg?twic=v1/cover=200x200');
  });

  it('should set the domain and path', async () => {
    const { instance } = await getContext({
      figureAttributes: {
        dataOptionDomain: 'twic.pics',
        dataOptionPath: 'path',
      }
    });

    expect(instance.$options.domain).toBe('twic.pics');
    expect(instance.domain).toBe('twic.pics');
    expect(instance.$options.path).toBe('path');
    expect(instance.path).toBe('path');
    expect(instance.original).toBe('https://twic.pics/path/image.jpg?twic=v1/cover=100x100');

    instance.$el.removeAttribute('data-option-domain');

    expect(instance.$options.domain).toBe('');
    expect(instance.domain).toBe('localhost');
    expect(instance.original).toBe('https://localhost/path/image.jpg?twic=v1/cover=100x100');
  });

  it('should take the device pixel ratio into account', async () => {
    const { instance } = await getContext();

    window.devicePixelRatio = 2;

    expect(instance.devicePixelRatio).toBe(2);
    expect(instance.original).toBe('https://localhost/image.jpg?twic=v1/cover=200x200');

    instance.$el.setAttribute('data-option-no-dpr', '');

    expect(instance.devicePixelRatio).toBe(1);
    expect(instance.original).toBe('https://localhost/image.jpg?twic=v1/cover=100x100');
  });
});

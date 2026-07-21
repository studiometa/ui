import { it, describe, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { FigureVideoTwicpics } from '@studiometa/ui';
import {
  wait,
  hConnected as h,
  mockIsIntersecting,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
  mockImageLoad,
  mockImageLoadError,
  unmockImageLoad,
  mockVideoLoad,
  unmockVideoLoad,
  resizeWindow,
} from '#test-utils';

beforeAll(() => {
  intersectionObserverBeforeAllCallback();
});

beforeEach(() => {
  mockImageLoad();
  mockVideoLoad();
});

afterEach(() => {
  intersectionObserverAfterEachCallback();
  unmockImageLoad();
  unmockVideoLoad();
});

async function getContext({ figureAttributes = {}, poster = 'poster.jpg' } = {}) {
  const source = h('source', { dataSrc: 'https://localhost/video.mp4' });
  const video = h('video', { dataRef: 'video', dataPoster: poster }, [source]);
  const figure = h('figure', { dataOptionLazy: '', ...figureAttributes }, [video]);

  const widthSpy = vi.spyOn(video, 'offsetWidth', 'get').mockImplementation(() => 100);
  const heightSpy = vi.spyOn(video, 'offsetHeight', 'get').mockImplementation(() => 100);

  const instance = new FigureVideoTwicpics(figure);
  mockIsIntersecting(figure, true);
  await wait(100);

  return {
    source,
    video,
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

describe('The FigureVideoTwicpics component', () => {
  it('should format the sources with the normalized size', async () => {
    const { source } = await getContext();
    expect(source.src).toBe('https://localhost/video.mp4?twic=v1/cover=100x100');
  });

  it('should format the poster with the normalized size', async () => {
    const { video } = await getContext();
    expect(video.poster).toBe('https://localhost/poster.jpg?twic=v1/cover=100x100');
  });

  it('should use the domain and path options', async () => {
    const { source } = await getContext({
      figureAttributes: {
        dataOptionDomain: 'twic.pics',
        dataOptionPath: 'path',
      },
    });
    expect(source.src).toBe('https://twic.pics/path/video.mp4?twic=v1/cover=100x100');
  });

  it('should reformat the sources on resize', async () => {
    const { source, setSize } = await getContext();
    expect(source.src).toContain('cover=100x100');
    setSize({ width: 200, height: 200 });
    await resizeWindow();
    expect(source.src).toContain('cover=200x200');
  });

  it('should warn when the poster fails to load', async () => {
    unmockImageLoad();
    mockImageLoadError();

    const { instance } = await getContext();
    const warnSpy = vi.spyOn(instance, '$warn', 'get');

    // Reload to trigger a fresh poster load with the error mock in place.
    await instance.loadPoster();

    expect(warnSpy).toHaveBeenCalledOnce();
  });
});

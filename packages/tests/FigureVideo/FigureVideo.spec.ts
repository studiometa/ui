import { it, describe, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { FigureVideo } from '@studiometa/ui';
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

function getContext({ poster = 'http://localhost/poster.jpg' } = {}) {
  const source = h('source', { dataSrc: 'http://localhost/video.mp4' });
  const video = h('video', poster ? { dataRef: 'video', dataPoster: poster } : { dataRef: 'video' }, [
    source,
  ]);
  const figure = h('figure', { dataOptionLazy: '' }, [video]);

  return { source, video, figure, instance: new FigureVideo(figure) };
}

describe('The FigureVideo component', () => {
  it('should lazily load the poster and sources then emit load', async () => {
    const { video, source, figure, instance } = getContext();
    const load = vi.fn();
    instance.$on('load', load);

    mockIsIntersecting(figure, true);
    await wait(100);

    expect(video.poster).toBe('http://localhost/poster.jpg');
    expect(source.src).toBe('http://localhost/video.mp4');
    expect(load).toHaveBeenCalledOnce();
  });

  it('should resolve the poster silently when no poster is defined', async () => {
    const { video, figure, instance } = getContext({ poster: '' });
    const load = vi.fn();
    instance.$on('load', load);

    mockIsIntersecting(figure, true);
    await wait(100);

    expect(video.poster).toBeFalsy();
    expect(load).toHaveBeenCalledOnce();
  });

  it('should warn when the poster fails to load', async () => {
    unmockImageLoad();
    mockImageLoadError();

    const { figure, instance } = getContext();
    const warnSpy = vi.spyOn(instance, '$warn', 'get');

    mockIsIntersecting(figure, true);
    await wait(100);

    expect(warnSpy).toHaveBeenCalledOnce();
  });
});

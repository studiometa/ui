import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxImages } from '@studiometa/ui-mapbox';

function createImages(attrs: Record<string, string> = {}) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxImages',
    'data-option-sources':
      '[{"name":"one","url":"/one.png"},{"name":"two","url":"/two.png"}]',
    ...attrs,
  });

  const instance = new MapboxImages(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, $options: { accessToken: 'token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

describe('MapboxImages component', () => {
  it('should load and add every image on mount', async () => {
    const { instance, mockMap } = createImages();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addImage).toHaveBeenCalledTimes(2);
    expect(mockMap.addImage).toHaveBeenCalledWith('one', expect.anything(), undefined);
    expect(mockMap.addImage).toHaveBeenCalledWith('two', expect.anything(), undefined);
  });

  it('should emit a single ready event with every image', async () => {
    const { instance } = createImages();
    const handler = vi.fn();

    vi.useFakeTimers();
    instance.$mount();
    instance.$on('ready', handler);
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(handler).toHaveBeenCalledTimes(1);
    const images = handler.mock.calls[0][0].detail[0];
    expect(images).toHaveLength(2);
  });

  it('should default sources to an empty array', async () => {
    const mockMap = new MockMap();
    const el = h('div', { 'data-component': 'MapboxImages' });
    const instance = new MapboxImages(el);
    instance.$closest = vi.fn((query: string) => {
      if (query === 'MapboxMap') {
        return { map: mockMap, $options: {} } as any;
      }
      return undefined;
    });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.$options.sources).toEqual([]);
    expect(mockMap.addImage).not.toHaveBeenCalled();
  });

  it('should remove every image on destroy', async () => {
    const { instance, mockMap } = createImages();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeImage).toHaveBeenCalledWith('one');
    expect(mockMap.removeImage).toHaveBeenCalledWith('two');
  });
});

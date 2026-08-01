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
      return { map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any;
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
        return { map: mockMap, isLoaded: true, $options: {} } as any;
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

  it('should only remove the images it added on destroy', async () => {
    const { instance, mockMap } = createImages();
    // "one" already exists on the map, added by someone else: this instance does
    // not own it and must not remove it. "two" is new and owned by this instance.
    mockMap.seedImage('one');

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // Only the new sprite was added.
    expect(mockMap.addImage).toHaveBeenCalledTimes(1);
    expect(mockMap.addImage).toHaveBeenCalledWith('two', expect.anything(), undefined);

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Only the newly added sprite is removed; the pre-existing one is preserved.
    expect(mockMap.removeImage).toHaveBeenCalledTimes(1);
    expect(mockMap.removeImage).toHaveBeenCalledWith('two');
    expect(mockMap.removeImage).not.toHaveBeenCalledWith('one');
    expect(mockMap._images).toHaveProperty('one');
  });

  it('should not leave orphan images when destroyed before the loads resolve', async () => {
    const { instance, mockMap } = createImages();
    // Defer every image load so the component can be destroyed while they are
    // still in flight, reproducing the mount/teardown race.
    const callbacks: Array<(error: unknown, image: unknown) => void> = [];
    mockMap.loadImage = vi.fn((_url: string, cb: (error: unknown, image: unknown) => void) => {
      callbacks.push(cb);
    });
    const ready = vi.fn();

    vi.useFakeTimers();
    instance.$mount();
    instance.$on('ready', ready);
    await vi.advanceTimersByTimeAsync(100);

    // The loads are still pending: nothing has been added to the sprite yet.
    expect(mockMap.addImage).not.toHaveBeenCalled();

    // Destroy while the loads are in flight, then let them resolve afterwards.
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    callbacks.forEach((cb) => cb(null, {}));
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Every image added after teardown must be removed again: no orphan sprites
    // and no `ready` event emitted after destroy.
    expect(mockMap.removeImage).toHaveBeenCalledWith('one');
    expect(mockMap.removeImage).toHaveBeenCalledWith('two');
    expect(mockMap._images).toEqual({});
    expect(ready).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxImage } from '@studiometa/ui-mapbox';

function createImage(attrs: Record<string, string> = {}) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxImage',
    'data-option-name': 'my-image',
    'data-option-url': '/marker.png',
    ...attrs,
  });

  const instance = new MapboxImage(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

describe('MapboxImage component', () => {
  it('should load and add the image on mount', async () => {
    const { instance, mockMap } = createImage();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.loadImage).toHaveBeenCalledWith('/marker.png', expect.any(Function));
    expect(mockMap.hasImage).toHaveBeenCalledWith('my-image');
    expect(mockMap.addImage).toHaveBeenCalledWith('my-image', expect.anything(), expect.anything());
  });

  it('should not add the image if it already exists', async () => {
    const { instance, mockMap } = createImage();
    mockMap.hasImage = vi.fn(() => true);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addImage).not.toHaveBeenCalled();
  });

  it('should emit a map-ready event once the image is registered', async () => {
    const { instance } = createImage();
    const handler = vi.fn();

    vi.useFakeTimers();
    instance.$mount();
    instance.$on('map-ready', handler);
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(handler).toHaveBeenCalledTimes(1);
    const payload = handler.mock.calls[0][0].detail[0];
    expect(payload).toMatchObject({ name: 'my-image' });
  });

  it('should remove the image on destroy', async () => {
    const { instance, mockMap } = createImage();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeImage).toHaveBeenCalledWith('my-image');
  });

  it('should not remove a pre-existing image on destroy', async () => {
    const { instance, mockMap } = createImage();
    // The sprite already exists on the map, added by someone else: this instance
    // does not own it and must never remove it on teardown.
    mockMap.seedImage('my-image');

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // The image already existed, so it was never added by this instance.
    expect(mockMap.addImage).not.toHaveBeenCalled();

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // The pre-existing sprite must be preserved.
    expect(mockMap.removeImage).not.toHaveBeenCalled();
    expect(mockMap._images).toHaveProperty('my-image');
  });

  it('should not remove a pre-existing image when destroyed before the load resolves', async () => {
    const { instance, mockMap } = createImage();
    // The sprite already exists on the map, added by someone else.
    mockMap.seedImage('my-image');
    // Defer the image load so the component can be destroyed while it is still
    // in flight, reproducing the mount/teardown race for an unowned sprite.
    let resolveLoad: ((error: unknown, image: unknown) => void) | undefined;
    mockMap.loadImage = vi.fn((_url: string, cb: (error: unknown, image: unknown) => void) => {
      resolveLoad = cb;
    });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // Destroy while the load is in flight, then let it resolve afterwards.
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    resolveLoad?.(null, {});
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // The pre-existing sprite this instance never added must be preserved.
    expect(mockMap.addImage).not.toHaveBeenCalled();
    expect(mockMap.removeImage).not.toHaveBeenCalled();
    expect(mockMap._images).toHaveProperty('my-image');
  });

  it('should keep the sprite on a same-name swap: outgoing does not remove the adopted one (H5)', async () => {
    const mockMap = new MockMap();
    function make() {
      const el = h('div', {
        'data-component': 'MapboxImage',
        'data-option-name': 'shared',
        'data-option-url': '/shared.png',
      });
      const inst = new MapboxImage(el);
      inst.$closest = vi.fn((query: string) =>
        query === 'MapboxMap'
          ? ({ map: mockMap, isLoaded: true, $options: { accessToken: 't' } } as any)
          : undefined,
      );
      return inst;
    }

    const oldInstance = make();
    vi.useFakeTimers();
    oldInstance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addImage).toHaveBeenCalledTimes(1);

    // The replacement mounts while the outgoing instance still owns the sprite.
    const newInstance = make();
    vi.useFakeTimers();
    newInstance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // The sprite already existed (owned by the outgoing instance): the
    // replacement adopts ownership rather than re-adding a duplicate.
    expect(mockMap.addImage).toHaveBeenCalledTimes(1);

    // The outgoing instance tears down: it must NOT remove the sprite the mounted
    // replacement now owns.
    vi.useFakeTimers();
    oldInstance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeImage).not.toHaveBeenCalled();
    expect(mockMap._images).toHaveProperty('shared');

    // The replacement, now the owner, removes the sprite on its own teardown.
    vi.useFakeTimers();
    newInstance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeImage).toHaveBeenCalledWith('shared');
    expect(mockMap._images).toEqual({});
  });

  it('should not leave an orphan image when destroyed before the load resolves', async () => {
    const { instance, mockMap } = createImage();
    // Defer the image load so the component can be destroyed while it is still
    // in flight, reproducing the mount/teardown race.
    let resolveLoad: ((error: unknown, image: unknown) => void) | undefined;
    mockMap.loadImage = vi.fn((_url: string, cb: (error: unknown, image: unknown) => void) => {
      resolveLoad = cb;
    });
    const ready = vi.fn();

    vi.useFakeTimers();
    instance.$mount();
    instance.$on('map-ready', ready);
    await vi.advanceTimersByTimeAsync(100);

    // The load is still pending: nothing has been added to the sprite yet.
    expect(mockMap.addImage).not.toHaveBeenCalled();

    // Destroy while the load is in flight, then let it resolve afterwards.
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    resolveLoad?.(null, {});
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // The image added after teardown must be removed again: no orphan sprite and
    // no `map-ready` event emitted after destroy.
    expect(mockMap.removeImage).toHaveBeenCalledWith('my-image');
    expect(mockMap._images).toEqual({});
    expect(ready).not.toHaveBeenCalled();
  });
});

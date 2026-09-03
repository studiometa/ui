import { describe, it, expect, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { recordEvents, settle } from '@studiometa/js-toolkit/test';
import { MapboxImage, MapboxMap } from '@studiometa/ui-mapbox';
import { append, mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxImage);

function imageHtml(name = 'my-image', url = '/marker.png') {
  return `<div data-component="MapboxImage" data-option-name="${name}" data-option-url="${url}"></div>`;
}

/**
 * Mount a `MapboxMap` holding one `MapboxImage`, WITHOUT loading the map yet.
 *
 * The sprite is registered on `map-load`, so a test seeds the sprite or defers
 * `loadImage` on the map double first, then calls `context.load()`.
 */
async function createImage() {
  const context = await mountMap(imageHtml());
  const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxImage"]')!;

  return {
    context,
    instance: getInstance<MapboxImage>(el, 'MapboxImage')!,
    mockMap: context.mockMap,
  };
}

describe('MapboxImage component', () => {
  it('should load and add the image on mount', async () => {
    const { context, mockMap } = await createImage();
    await context.load();

    expect(mockMap.loadImage).toHaveBeenCalledWith('/marker.png', expect.any(Function));
    expect(mockMap.hasImage).toHaveBeenCalledWith('my-image');
    expect(mockMap.addImage).toHaveBeenCalledWith('my-image', expect.anything(), expect.anything());
  });

  it('should not add the image if it already exists', async () => {
    const { context, mockMap } = await createImage();
    mockMap.hasImage = vi.fn(() => true);
    await context.load();

    expect(mockMap.addImage).not.toHaveBeenCalled();
  });

  it('should emit a map-ready event once the image is registered', async () => {
    const { context, instance } = await createImage();
    const log = recordEvents(instance.$el, 'map-ready');
    await context.load();

    expect(log.events).toHaveLength(1);
    // The payload is one named object: the sprite name is read by name.
    expect(log.events[0].detail).toMatchObject({ name: 'my-image' });
    log.stop();
  });

  it('should remove the image on unmount', async () => {
    const { context, instance, mockMap } = await createImage();
    await context.load();

    instance.$unmount();
    await settle();

    expect(mockMap.removeImage).toHaveBeenCalledWith('my-image');
  });

  it('should not remove a pre-existing image on unmount', async () => {
    const { context, instance, mockMap } = await createImage();
    // The sprite already exists on the map, added by someone else: this instance
    // does not own it and must never remove it on teardown.
    mockMap.seedImage('my-image');
    await context.load();

    // The image already existed, so it was never added by this instance.
    expect(mockMap.addImage).not.toHaveBeenCalled();

    instance.$unmount();
    await settle();

    // The pre-existing sprite must be preserved.
    expect(mockMap.removeImage).not.toHaveBeenCalled();
    expect(mockMap._images).toHaveProperty('my-image');
  });

  it('should not remove a pre-existing image when unmounted before the load resolves', async () => {
    const { context, instance, mockMap } = await createImage();
    // The sprite already exists on the map, added by someone else.
    mockMap.seedImage('my-image');
    // Defer the image load so the component can be unmounted while it is still
    // in flight, reproducing the mount/teardown race for an unowned sprite.
    let resolveLoad: ((error: unknown, image: unknown) => void) | undefined;
    mockMap.loadImage = vi.fn((_url: string, cb: (error: unknown, image: unknown) => void) => {
      resolveLoad = cb;
    });
    await context.load();

    // Unmount while the load is in flight, then let it resolve afterwards.
    instance.$unmount();
    await settle();
    resolveLoad?.(null, {});
    await settle();

    // The pre-existing sprite this instance never added must be preserved.
    expect(mockMap.addImage).not.toHaveBeenCalled();
    expect(mockMap.removeImage).not.toHaveBeenCalled();
    expect(mockMap._images).toHaveProperty('my-image');
  });

  it('should keep the sprite on a same-name swap: outgoing does not remove the adopted one (H5)', async () => {
    const context = await mountMap(imageHtml('shared', '/shared.png'));
    await context.load();

    const { mockMap } = context;
    const oldEl = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxImage"]')!;
    const oldInstance = getInstance<MapboxImage>(oldEl, 'MapboxImage')!;

    expect(mockMap.addImage).toHaveBeenCalledTimes(1);

    // The replacement mounts while the outgoing instance still owns the sprite.
    const newEl = await append(context.mapEl, imageHtml('shared', '/shared.png'));
    const newInstance = getInstance<MapboxImage>(newEl, 'MapboxImage')!;

    // The sprite already existed (owned by the outgoing instance): the
    // replacement adopts ownership rather than re-adding a duplicate.
    expect(mockMap.addImage).toHaveBeenCalledTimes(1);

    // The outgoing instance tears down: it must NOT remove the sprite the mounted
    // replacement now owns.
    oldInstance.$unmount();
    await settle();

    expect(mockMap.removeImage).not.toHaveBeenCalled();
    expect(mockMap._images).toHaveProperty('shared');

    // The replacement, now the owner, removes the sprite on its own teardown.
    newInstance.$unmount();
    await settle();

    expect(mockMap.removeImage).toHaveBeenCalledWith('shared');
    expect(mockMap._images).toEqual({});
  });

  it('should not leave an orphan image when unmounted before the load resolves', async () => {
    const { context, instance, mockMap } = await createImage();
    // Defer the image load so the component can be unmounted while it is still
    // in flight, reproducing the mount/teardown race.
    let resolveLoad: ((error: unknown, image: unknown) => void) | undefined;
    mockMap.loadImage = vi.fn((_url: string, cb: (error: unknown, image: unknown) => void) => {
      resolveLoad = cb;
    });
    const log = recordEvents(instance.$el, 'map-ready');
    await context.load();

    // The load is still pending: nothing has been added to the sprite yet.
    expect(mockMap.addImage).not.toHaveBeenCalled();

    // Unmount while the load is in flight, then let it resolve afterwards.
    instance.$unmount();
    await settle();
    resolveLoad?.(null, {});
    await settle();

    // The image added after teardown must be removed again: no orphan sprite and
    // no `map-ready` event emitted after unmount.
    expect(mockMap.removeImage).toHaveBeenCalledWith('my-image');
    expect(mockMap._images).toEqual({});
    expect(log.events).toHaveLength(0);
    log.stop();
  });
});

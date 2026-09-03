import { describe, it, expect, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, recordEvents, settle } from '@studiometa/js-toolkit/test';
import { MapboxImages, MapboxMap } from '@studiometa/ui-mapbox';
import { mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxImages);

const SOURCES = '[{"name":"one","url":"/one.png"},{"name":"two","url":"/two.png"}]';

/**
 * Mount a `MapboxMap` holding one `MapboxImages`, WITHOUT loading the map yet:
 * the sprites are registered on `map-load`, so a test seeds or stubs the map
 * double first and then calls `context.load()`.
 */
async function createImages(sources: string | null = SOURCES) {
  const context = await mountMap(
    `<div data-component="MapboxImages" ${sources === null ? '' : `data-option-sources='${sources}'`}></div>`,
  );
  const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxImages"]')!;

  return {
    context,
    instance: getInstance<MapboxImages>(el, 'MapboxImages')!,
    mockMap: context.mockMap,
  };
}

describe('MapboxImages component', () => {
  it('should load and add every image on mount', async () => {
    const { context, mockMap } = await createImages();
    await context.load();

    expect(mockMap.addImage).toHaveBeenCalledTimes(2);
    expect(mockMap.addImage).toHaveBeenCalledWith('one', expect.anything(), undefined);
    expect(mockMap.addImage).toHaveBeenCalledWith('two', expect.anything(), undefined);
  });

  it('should emit a single map-ready event with every image', async () => {
    const { context, instance } = await createImages();
    const log = recordEvents(instance.$el, 'map-ready');
    await context.load();

    expect(log.events).toHaveLength(1);
    // The payload is one named object: the batch travels as `detail.images`.
    const { images } = log.events[0].detail as { images: unknown[] };
    expect(images).toHaveLength(2);
    log.stop();
  });

  it('should default sources to an empty array', async () => {
    const { context, instance, mockMap } = await createImages(null);
    await context.load();

    expect(instance.$options.sources).toEqual([]);
    expect(mockMap.addImage).not.toHaveBeenCalled();
  });

  it('should remove every image on unmount', async () => {
    const { context, instance, mockMap } = await createImages();
    await context.load();

    instance.$unmount();
    await settle();

    expect(mockMap.removeImage).toHaveBeenCalledWith('one');
    expect(mockMap.removeImage).toHaveBeenCalledWith('two');
  });

  it('should only remove the images it added on unmount', async () => {
    const { context, instance, mockMap } = await createImages();
    // "one" already exists on the map, added by someone else: this instance does
    // not own it and must not remove it. "two" is new and owned by this instance.
    mockMap.seedImage('one');
    await context.load();

    // Only the new sprite was added.
    expect(mockMap.addImage).toHaveBeenCalledTimes(1);
    expect(mockMap.addImage).toHaveBeenCalledWith('two', expect.anything(), undefined);

    instance.$unmount();
    await settle();

    // Only the newly added sprite is removed; the pre-existing one is preserved.
    expect(mockMap.removeImage).toHaveBeenCalledTimes(1);
    expect(mockMap.removeImage).toHaveBeenCalledWith('two');
    expect(mockMap.removeImage).not.toHaveBeenCalledWith('one');
    expect(mockMap._images).toHaveProperty('one');
  });

  it('should clean up already-added sprites when a later image in the batch fails (H5)', async () => {
    const { context, instance, mockMap } = await createImages();
    // `one` loads fine and is added; `two` fails to load, rejecting the batch
    // after `one` was already added.
    mockMap.loadImage = vi.fn((url: string, cb: (error: unknown, image: unknown) => void) => {
      if (url === '/two.png') {
        cb(new Error('load failed'), null);
      } else {
        cb(null, {});
      }
    });
    // A recovered failure is reported on the diagnostic channel, so the
    // assertion reads the namespaced code instead of the sink the default
    // handler happens to write to.
    const diagnostics = captureDiagnostics();
    const log = recordEvents(instance.$el, 'map-error');

    await context.load();

    // `one` was added before `two` rejected; the rejection is contained (routed
    // to the `map-error` event and the diagnostic channel, not an unhandled
    // rejection).
    expect(mockMap.addImage).toHaveBeenCalledWith('one', expect.anything(), undefined);
    expect(diagnostics.codes).toContain('mapbox-map-child.failed');
    expect(log.events).toHaveLength(1);

    // Teardown removes the sprite that WAS added, even though the batch failed
    // before completing — no orphan survives.
    instance.$unmount();
    await settle();

    expect(mockMap.removeImage).toHaveBeenCalledWith('one');
    expect(mockMap._images).toEqual({});

    log.stop();
    diagnostics.stop();
  });

  it('should not leave orphan images when unmounted before the loads resolve', async () => {
    const { context, instance, mockMap } = await createImages();
    // Defer every image load so the component can be unmounted while they are
    // still in flight, reproducing the mount/teardown race.
    const callbacks: Array<(error: unknown, image: unknown) => void> = [];
    mockMap.loadImage = vi.fn((_url: string, cb: (error: unknown, image: unknown) => void) => {
      callbacks.push(cb);
    });
    const log = recordEvents(instance.$el, 'map-ready');
    await context.load();

    // The loads are still pending: nothing has been added to the sprite yet.
    expect(mockMap.addImage).not.toHaveBeenCalled();

    // Unmount while the loads are in flight, then let them resolve afterwards.
    instance.$unmount();
    await settle();
    callbacks.forEach((cb) => cb(null, {}));
    await settle();

    // Every image added after teardown must be removed again: no orphan sprites
    // and no `map-ready` event emitted after unmount.
    expect(mockMap.removeImage).toHaveBeenCalledWith('one');
    expect(mockMap.removeImage).toHaveBeenCalledWith('two');
    expect(mockMap._images).toEqual({});
    expect(log.events).toHaveLength(0);
    log.stop();
  });
});

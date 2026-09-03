import { describe, it, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { settle } from '@studiometa/js-toolkit/test';
import { MockFullscreenControl } from './mock-mapbox-gl.js';
import { MapboxFullscreenControl, MapboxMap } from '@studiometa/ui-mapbox';
import { mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxFullscreenControl);

/** Mount a loaded `MapboxMap` holding one `MapboxFullscreenControl`. */
async function createControl(attrs = '') {
  const context = await mountMap(`<div data-component="MapboxFullscreenControl" ${attrs}></div>`);
  await context.load();
  const el = context.mapEl.querySelector<HTMLElement>(
    '[data-component="MapboxFullscreenControl"]',
  )!;

  return {
    instance: getInstance<MapboxFullscreenControl>(el, 'MapboxFullscreenControl')!,
    mockMap: context.mockMap,
  };
}

describe('MapboxFullscreenControl component', () => {
  it('should mount and add control to map', async () => {
    const { instance, mockMap } = await createControl();

    expect(instance.control).toBeInstanceOf(MockFullscreenControl);
    expect(mockMap.addControl).toHaveBeenCalledWith(instance.control, 'top-right');
  });

  it('should default position to top-right', async () => {
    const { instance } = await createControl();

    // `position` is declared by `AbstractMapboxControl` and reaches this
    // subclass through the prototype-chain config merge.
    expect(instance.$options.position).toBe('top-right');
  });

  it('should use custom position', async () => {
    const { instance, mockMap } = await createControl('data-option-position="bottom-left"');

    expect(mockMap.addControl).toHaveBeenCalledWith(instance.control, 'bottom-left');
  });

  it('should remove control on unmount', async () => {
    const { instance, mockMap } = await createControl();

    const { control } = instance;
    instance.$unmount();
    await settle();

    expect(mockMap.removeControl).toHaveBeenCalledWith(control);
  });

  it('should reuse the same control instance', async () => {
    const { instance } = await createControl();

    expect(instance.control).toBe(instance.control);
  });
});

import { describe, it, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { settle } from '@studiometa/js-toolkit/test';
import { MapboxGeolocateControl, MapboxMap } from '@studiometa/ui-mapbox';
import { mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxGeolocateControl);

/** Mount a loaded `MapboxMap` holding one `MapboxGeolocateControl`. */
async function createControl(attrs = '') {
  const context = await mountMap(`<div data-component="MapboxGeolocateControl" ${attrs}></div>`);
  await context.load();
  const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxGeolocateControl"]')!;

  return {
    instance: getInstance<MapboxGeolocateControl>(el, 'MapboxGeolocateControl')!,
    mockMap: context.mockMap,
  };
}

describe('MapboxGeolocateControl component', () => {
  it('should mount and add control to map', async () => {
    const { instance, mockMap } = await createControl();

    expect(mockMap.addControl).toHaveBeenCalledWith(instance.control, 'top-right');
  });

  it('should default position to top-right', async () => {
    const { instance } = await createControl();

    // `position` is declared by `AbstractMapboxControl` and reaches this
    // subclass through the prototype-chain config merge.
    expect(instance.$options.position).toBe('top-right');
  });

  it('should use custom position', async () => {
    const { instance, mockMap } = await createControl('data-option-position="bottom-right"');

    expect(mockMap.addControl).toHaveBeenCalledWith(instance.control, 'bottom-right');
  });

  it('should remove control on unmount', async () => {
    const { instance, mockMap } = await createControl();

    instance.$unmount();
    await settle();

    expect(mockMap.removeControl).toHaveBeenCalled();
  });

  it('should reuse the same control instance', async () => {
    const { instance } = await createControl();

    expect(instance.control).toBe(instance.control);
  });
});

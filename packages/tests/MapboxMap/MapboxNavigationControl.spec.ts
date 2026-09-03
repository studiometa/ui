import { describe, it, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { settle } from '@studiometa/js-toolkit/test';
import { MockNavigationControl } from './mock-mapbox-gl.js';
import { MapboxMap, MapboxNavigationControl } from '@studiometa/ui-mapbox';
import { mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxNavigationControl);

/** Mount a loaded `MapboxMap` holding one `MapboxNavigationControl`. */
async function createControl(attrs = '') {
  const context = await mountMap(`<div data-component="MapboxNavigationControl" ${attrs}></div>`);
  await context.load();
  const el = context.mapEl.querySelector<HTMLElement>(
    '[data-component="MapboxNavigationControl"]',
  )!;

  return {
    instance: getInstance<MapboxNavigationControl>(el, 'MapboxNavigationControl')!,
    mockMap: context.mockMap,
  };
}

describe('MapboxNavigationControl component', () => {
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
    const { instance, mockMap } = await createControl('data-option-position="bottom-left"');

    expect(mockMap.addControl).toHaveBeenCalledWith(instance.control, 'bottom-left');
  });

  it('should remove control on unmount', async () => {
    const { instance, mockMap } = await createControl();

    instance.$unmount();
    await settle();

    expect(mockMap.removeControl).toHaveBeenCalled();
  });

  it('should not construct a control on unmount when the control was never created', async () => {
    const { instance, mockMap } = await createControl();

    // Simulate a teardown where the lazy `get control()` getter has never
    // populated the backing field (e.g. `$unmount()` called before the control
    // is used, or a second `$unmount()`): the control does not exist at teardown
    // time, while the component stays mounted so `__onDestroyed()` still runs.
    instance.__control = undefined as unknown as (typeof instance)['__control'];
    const instanceCountBeforeUnmount = MockNavigationControl.instanceCount;

    instance.$unmount();
    await settle();

    // Teardown must be side-effect free: it must not go through the lazy getter
    // and construct a brand-new control just to remove it.
    expect(MockNavigationControl.instanceCount).toBe(instanceCountBeforeUnmount);
    expect(mockMap.removeControl).not.toHaveBeenCalled();
  });

  it('should reuse the same control instance', async () => {
    const { instance } = await createControl();

    expect(instance.control).toBe(instance.control);
  });
});

import { describe, it, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { settle } from '@studiometa/js-toolkit/test';
import { MockMarker, MockPopup } from './mock-mapbox-gl.js';
import { MapboxMap, MapboxMarker, MapboxPopup } from '@studiometa/ui-mapbox';
import { mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxMarker, MapboxPopup);

/**
 * Mount a loaded `MapboxMap` holding one `MapboxMarker`, and return both the
 * marker instance and the map double it injected itself into.
 */
async function createMarker(attrs = 'data-option-lng-lat="[2.35, 48.85]"', children = '') {
  const context = await mountMap(`<div data-component="MapboxMarker" ${attrs}>${children}</div>`);
  await context.load();
  const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxMarker"]')!;

  return {
    instance: getInstance<MapboxMarker>(el, 'MapboxMarker')!,
    mockMap: context.mockMap,
  };
}

describe('MapboxMarker component', () => {
  it('should mount and create a marker', async () => {
    const { instance } = await createMarker();

    expect(instance.marker).toBeInstanceOf(MockMarker);
  });

  it('should set lngLat and add to map', async () => {
    const { instance, mockMap } = await createMarker();

    const mockMarker = instance.marker as unknown as MockMarker;
    expect(mockMarker.setLngLat).toHaveBeenCalledWith([2.35, 48.85]);
    expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('should default lngLat to [0, 0]', async () => {
    const { instance } = await createMarker('');

    expect(instance.$options.lngLat).toEqual([0, 0]);
  });

  it('should default markerOptions to an empty object', async () => {
    const { instance } = await createMarker();

    expect(instance.$options.markerOptions).toEqual({});
  });

  it('should attach a child popup that is present at mount (H8 pull side)', async () => {
    // The popup is in the markup from the start, so it mounts with the marker
    // and the marker resolves it through `$query` on ready.
    const { instance } = await createMarker(
      'data-option-lng-lat="[2.35, 48.85]"',
      '<div data-component="MapboxPopup" data-option-lng-lat="[2.35, 48.85]"></div>',
    );

    const marker = instance.marker as unknown as MockMarker;
    expect(instance.popup).toBeInstanceOf(MapboxPopup);
    expect(marker.setPopup).toHaveBeenCalledWith(instance.popup.popup);
    // The popup handed itself to the marker rather than adding itself to the map.
    expect((instance.popup.popup as unknown as MockPopup).addTo).not.toHaveBeenCalled();
  });

  it('should attach a child popup pushed after mount via setChildPopup (H8 push side)', async () => {
    // No popup present when the marker mounts (dynamic append: the popup mounts
    // later and pushes itself).
    const { instance } = await createMarker();

    const marker = instance.marker as unknown as MockMarker;
    expect(instance.popup).toBeUndefined();
    expect(marker.setPopup).not.toHaveBeenCalled();

    // The popup mounts afterwards and pushes itself onto the marker.
    instance.$el.insertAdjacentHTML(
      'beforeend',
      '<div data-component="MapboxPopup" data-option-lng-lat="[1, 2]"></div>',
    );
    await settle();

    expect(marker.setPopup).toHaveBeenCalledWith(instance.popup.popup);
  });

  it('should remove marker on unmount', async () => {
    const { instance } = await createMarker();

    const mockMarker = instance.marker as unknown as MockMarker;
    instance.$unmount();
    await settle();

    expect(mockMarker.remove).toHaveBeenCalled();
  });

  it('should not construct a marker on unmount when the marker was never created', async () => {
    const { instance } = await createMarker();

    // Simulate a teardown where the lazy `get marker()` getter has never
    // populated the backing field (e.g. `$unmount()` called before the marker
    // is used, or a second `$unmount()`): the marker does not exist at teardown
    // time, while the component stays mounted so `__onDestroyed()` still runs.
    (instance as unknown as { __marker: unknown }).__marker = undefined;
    const instanceCountBeforeUnmount = MockMarker.instanceCount;

    instance.$unmount();
    await settle();

    // Teardown must be side-effect free: it must not go through the lazy getter
    // and construct a brand-new marker just to remove it.
    expect(MockMarker.instanceCount).toBe(instanceCountBeforeUnmount);
    expect((instance as unknown as { __marker: unknown }).__marker).toBeUndefined();
  });

  it('should reuse the same marker instance', async () => {
    const { instance } = await createMarker();

    expect(instance.marker).toBe(instance.marker);
  });
});

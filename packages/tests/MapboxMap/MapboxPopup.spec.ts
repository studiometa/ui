import { describe, it, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { settle } from '@studiometa/js-toolkit/test';
import { MockPopup } from './mock-mapbox-gl.js';
import { MapboxMap, MapboxMarker, MapboxPopup } from '@studiometa/ui-mapbox';
import { mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxMarker, MapboxPopup);

/**
 * Mount a loaded `MapboxMap` holding one `MapboxPopup`, optionally nested in a
 * `MapboxMarker` so the popup resolves an ancestor marker through `$closest`.
 */
async function createPopup(
  attrs = 'data-option-lng-lat="[2.35, 48.85]"',
  { insideMarker = false, content = '' } = {},
) {
  const popup = `<div data-component="MapboxPopup" ${attrs}>${content}</div>`;
  const context = await mountMap(
    insideMarker
      ? `<div data-component="MapboxMarker" data-option-lng-lat="[2.35, 48.85]">${popup}</div>`
      : popup,
  );
  await context.load();
  const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxPopup"]')!;
  const markerEl = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxMarker"]');

  return {
    instance: getInstance<MapboxPopup>(el, 'MapboxPopup')!,
    marker: markerEl ? getInstance<MapboxMarker>(markerEl, 'MapboxMarker')! : undefined,
    mockMap: context.mockMap,
  };
}

describe('MapboxPopup component', () => {
  it('should mount and create a popup', async () => {
    const { instance } = await createPopup();

    expect(instance.popup).toBeInstanceOf(MockPopup);
  });

  it('should set lngLat on popup', async () => {
    const { instance } = await createPopup();

    const mockPopup = instance.popup as unknown as MockPopup;
    expect(mockPopup.setLngLat).toHaveBeenCalledWith([2.35, 48.85]);
  });

  it('should default lngLat to [0, 0]', async () => {
    const { instance } = await createPopup('');

    expect(instance.$options.lngLat).toEqual([0, 0]);
  });

  it('should add to map when parent is MapboxMap', async () => {
    const { instance } = await createPopup();

    const mockPopup = instance.popup as unknown as MockPopup;
    expect(mockPopup.addTo).toHaveBeenCalled();
  });

  it('should pass popupOptions to the Popup constructor', async () => {
    const { instance } = await createPopup(
      'data-option-lng-lat="[2.35, 48.85]" data-option-popup-options=\'{"closeButton":false,"offset":25}\'',
    );

    const mockPopup = instance.popup as unknown as MockPopup;
    expect(mockPopup._options).toEqual({ closeButton: false, offset: 25 });
  });

  it('should hide the source element after extracting its content', async () => {
    const { instance } = await createPopup('data-option-lng-lat="[2.35, 48.85]"', {
      content: '<p>Popup content</p>',
    });

    const mockPopup = instance.popup as unknown as MockPopup;
    expect(mockPopup.setHTML).toHaveBeenCalledWith('<p>Popup content</p>');
    expect(instance.$el.hidden).toBe(true);
  });

  it('should push itself to an ancestor marker instead of adding to the map (H8)', async () => {
    const { instance, marker } = await createPopup('data-option-lng-lat="[1, 2]"', {
      insideMarker: true,
    });

    // The popup handed itself to the marker (covers the dynamic-append case where
    // the marker mounted first and found no popup to query) rather than adding
    // itself to the map directly.
    expect((marker!.marker as unknown as { setPopup: unknown }).setPopup).toHaveBeenCalledWith(
      instance.popup,
    );
    expect((instance.popup as unknown as MockPopup).addTo).not.toHaveBeenCalled();
  });

  it('should restore the source element visibility on teardown when it hid it (minor)', async () => {
    const { instance } = await createPopup('data-option-lng-lat="[2.35, 48.85]"', {
      content: '<p>Popup content</p>',
    });
    expect(instance.$el.hidden).toBe(true);

    instance.$unmount();
    await settle();

    // The element it hid is made visible again so a reused/remounted element
    // keeps its original state.
    expect(instance.$el.hidden).toBe(false);
  });

  it('should remove popup on unmount', async () => {
    const { instance } = await createPopup();

    const mockPopup = instance.popup as unknown as MockPopup;
    instance.$unmount();
    await settle();

    expect(mockPopup.remove).toHaveBeenCalled();
  });

  it('should not construct a popup on unmount when the popup was never created', async () => {
    const { instance } = await createPopup();

    // Simulate a teardown where the lazy `get popup()` getter has never
    // populated the backing field (e.g. `$unmount()` called before the popup
    // is used, or a second `$unmount()`): the popup does not exist at teardown
    // time, while the component stays mounted so `__onDestroyed()` still runs.
    (instance as unknown as { __popup: unknown }).__popup = undefined;
    const instanceCountBeforeUnmount = MockPopup.instanceCount;

    instance.$unmount();
    await settle();

    // Teardown must be side-effect free: it must not go through the lazy getter
    // and construct a brand-new popup just to remove it.
    expect(MockPopup.instanceCount).toBe(instanceCountBeforeUnmount);
    expect((instance as unknown as { __popup: unknown }).__popup).toBeUndefined();
  });

  it('should reuse the same popup instance', async () => {
    const { instance } = await createPopup();

    expect(instance.popup).toBe(instance.popup);
  });
});

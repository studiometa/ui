import { describe, it, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { settle } from '@studiometa/js-toolkit/test';
import { MapboxMap, MapboxMarker } from '@studiometa/ui-mapbox';
import { append, mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxMarker);

const MARKER_HTML = '<div data-component="MapboxMarker" data-option-lng-lat="[2.35, 48.85]"></div>';

/** The `addTo` spy of a marker's `mapbox-gl` `Marker` double. */
function addTo(marker: MapboxMarker) {
  return (marker.marker as unknown as { addTo: unknown }).addTo;
}

describe('AbstractMapboxMapChild.whenMapReady', () => {
  it('should run the callback synchronously when the map is already loaded', async () => {
    // The map is loaded before the child exists, so `whenMapReady` resolves on
    // the spot instead of parking on `map-load`.
    const context = await mountMap();
    await context.load();

    const el = await append(context.mapEl, MARKER_HTML);
    const instance = getInstance<MapboxMarker>(el, 'MapboxMarker')!;

    // The marker injected itself against the ready map right away.
    expect(addTo(instance)).toHaveBeenCalledWith(context.mockMap);
  });

  it('should defer the callback until map-load fires when the map is not loaded yet', async () => {
    const context = await mountMap(MARKER_HTML);
    const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxMarker"]')!;
    const instance = getInstance<MapboxMarker>(el, 'MapboxMarker')!;

    // Nothing injected yet: the map has not loaded.
    expect(addTo(instance)).not.toHaveBeenCalled();
    expect((instance as unknown as { __offMapReady?: unknown }).__offMapReady).toBeDefined();

    await context.load();

    expect(addTo(instance)).toHaveBeenCalledWith(context.mockMap);
  });

  it('should not run the callback after the child has been unmounted', async () => {
    const context = await mountMap(MARKER_HTML);
    const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxMarker"]')!;
    const instance = getInstance<MapboxMarker>(el, 'MapboxMarker')!;
    const marker = instance.marker as unknown as { addTo: unknown };

    // Unmount before the map ever loads: the pending subscription is flushed.
    instance.$unmount();
    await settle();

    expect((instance as unknown as { __offMapReady?: unknown }).__offMapReady).toBeUndefined();

    // Firing map-load now must not inject anything on an unmounted child.
    await context.load();
    expect(marker.addTo).not.toHaveBeenCalled();
  });
});

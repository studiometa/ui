import { describe, it, expect, vi } from 'vitest';
import { getInstance, registerComponent } from '@studiometa/js-toolkit';
import { mount, settle, waitFor } from '@studiometa/js-toolkit/test';

/**
 * A `MapboxGeocoder` inside a `MapboxMap` element that has no instance yet — a
 * lazily mounted map — must wait for the map rather than go standalone: it
 * decides from the DOM, not from the mounted instances.
 *
 * This spec declares its own mocks (mocks are file-scoped) so it can register
 * `MapboxMap` only after the geocoder mounted, and read the options the control
 * was built with.
 */
const mapboxGl = vi.hoisted(() => {
  /**
   * A `mapbox-gl` `Map` double with just enough of an event emitter for
   * `MapboxMap` to forward events and for its children to bind their watches.
   */
  class StubMap {
    _listeners: Record<string, Array<(payload?: unknown) => void>> = {};
    remove = vi.fn();
    removeControl = vi.fn();

    on(type: string, listener: (payload?: unknown) => void) {
      (this._listeners[type] ??= []).push(listener);
      return this;
    }

    off(type: string, listener: (payload?: unknown) => void) {
      this._listeners[type] = (this._listeners[type] ?? []).filter((fn) => fn !== listener);
      return this;
    }

    fire(type: string, payload?: unknown) {
      (this._listeners[type] ?? []).forEach((listener) => listener(payload));
    }
  }

  return { StubMap, namespace: { Map: StubMap } };
});

vi.mock('mapbox-gl', () => ({ default: mapboxGl.namespace }));

vi.mock('@mapbox/mapbox-gl-geocoder', () => {
  class MockGeocoder {
    options: Record<string, unknown>;
    addTo = vi.fn();
    onRemove = vi.fn();
    on = vi.fn();

    constructor(options: Record<string, unknown>) {
      this.options = options;
    }
  }
  return { default: MockGeocoder };
});

const { MapboxGeocoder, MapboxMap } = await import('@studiometa/ui-mapbox');

registerComponent(MapboxGeocoder);

// Real timers: let the geocoder's lazy import settle with a short real delay.
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

describe('MapboxGeocoder inside a lazily mounted MapboxMap', () => {
  it('should wait for the map and use it once it mounts', async () => {
    const root = await mount(`
      <div data-component="MapboxMap" data-option-access-token="map-token">
        <div data-ref="container"></div>
        <div data-component="MapboxGeocoder"></div>
      </div>
    `);
    const el = root.querySelector<HTMLElement>('[data-component="MapboxGeocoder"]')!;
    const instance = getInstance<InstanceType<typeof MapboxGeocoder>>(el, 'MapboxGeocoder')!;
    await tick();

    // The map element is in the DOM but not mounted yet: the geocoder waits for
    // it instead of going standalone.
    expect(instance.control).toBeUndefined();

    registerComponent(MapboxMap);
    await settle();
    const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
    const mapbox = getInstance<InstanceType<typeof MapboxMap>>(mapEl, 'MapboxMap')!;
    await waitFor(() => mapbox.map);
    (mapbox.map as unknown as InstanceType<typeof mapboxGl.StubMap>).fire('load');
    await waitFor(() => instance.control);

    const { options } = instance.control as unknown as { options: Record<string, unknown> };
    expect(options.mapboxgl).toBe(mapboxGl.namespace);
    expect(options.accessToken).toBe('map-token');
    expect(instance.control!.addTo).toHaveBeenCalledWith(el);
  });
});

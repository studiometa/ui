import { describe, it, expect, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, mount, recordEvents, waitFor } from '@studiometa/js-toolkit/test';

/**
 * Where a `MapboxGeocoder` gets its access token from, with and without a
 * parent `MapboxMap`.
 *
 * The order mirrors `MapboxMap`, which builds `{ accessToken, ...mapOptions }`:
 * an `accessToken` in `options` wins, then the `accessToken` option, then the
 * parent map's token.
 *
 * This spec declares its own mocks (mocks are file-scoped) so the geocoder double
 * can record the options it was built with and render real DOM.
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

const geocoder = vi.hoisted(() => {
  /**
   * A geocoder control double that records its options and renders like the
   * real one: `addTo(element)` appends its container, holding the search input.
   */
  class MockGeocoder {
    static instances: MockGeocoder[] = [];

    options: Record<string, unknown>;
    container = document.createElement('div');
    _handlers: Record<string, Array<(event: unknown) => void>> = {};
    addTo = vi.fn((target: unknown) => {
      if (target instanceof HTMLElement) {
        target.append(this.container);
      }
    });
    onRemove = vi.fn(() => this.container.remove());

    constructor(options: Record<string, unknown>) {
      this.options = options;
      this.container.className = 'mapboxgl-ctrl-geocoder';
      this.container.append(document.createElement('input'));
      MockGeocoder.instances.push(this);
    }

    on(type: string, callback: (event: unknown) => void) {
      (this._handlers[type] ??= []).push(callback);
    }

    /** Simulate the control emitting an event, such as a picked `result`. */
    fire(type: string, event: unknown) {
      (this._handlers[type] ?? []).forEach((callback) => callback(event));
    }
  }

  return { MockGeocoder };
});

vi.mock('mapbox-gl', () => ({ default: mapboxGl.namespace }));
vi.mock('@mapbox/mapbox-gl-geocoder', () => ({ default: geocoder.MockGeocoder }));

const { MapboxGeocoder, MapboxMap } = await import('@studiometa/ui-mapbox');

registerComponents(MapboxMap, MapboxGeocoder);

type Geocoder = InstanceType<typeof MapboxGeocoder>;
type MockGeocoder = InstanceType<typeof geocoder.MockGeocoder>;

// Real timers: let the geocoder's lazy import settle with a short real delay.
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

/** The options the geocoder control was built with. */
function controlOptions(instance: Geocoder) {
  return (instance.control as unknown as MockGeocoder).options;
}

/**
 * Mount a `MapboxGeocoder` with no parent map. The class mounts when its element
 * nears the viewport; `data-mount="eager"` mounts it with the rest of the page,
 * so the tests do not depend on layout.
 */
async function mountStandalone(attrs: string) {
  const root = await mount(
    `<div data-component="MapboxGeocoder" data-mount="eager" ${attrs}></div>`,
  );
  const el = root.querySelector<HTMLElement>('[data-component="MapboxGeocoder"]')!;

  return { el, instance: getInstance<Geocoder>(el, 'MapboxGeocoder')! };
}

/**
 * Mount a `MapboxGeocoder` inside a loaded `MapboxMap` whose token is
 * `map-token`, and wait for its control.
 */
async function mountInMap(attrs: string) {
  const root = await mount(`
    <div data-component="MapboxMap" data-mount="eager" data-option-access-token="map-token">
      <div data-ref="container"></div>
      <div data-component="MapboxGeocoder" data-mount="eager" ${attrs}></div>
    </div>
  `);
  const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
  const el = root.querySelector<HTMLElement>('[data-component="MapboxGeocoder"]')!;
  const mapbox = getInstance<InstanceType<typeof MapboxMap>>(mapEl, 'MapboxMap')!;

  await waitFor(() => mapbox.map);
  (mapbox.map as unknown as InstanceType<typeof mapboxGl.StubMap>).fire('load');

  const instance = getInstance<Geocoder>(el, 'MapboxGeocoder')!;
  await waitFor(() => instance.control);

  return { el, instance };
}

describe('MapboxGeocoder access token without a parent map', () => {
  it('should create its control with only `data-option-access-token`', async () => {
    const { el, instance } = await mountStandalone('data-option-access-token="attr-token"');
    await waitFor(() => instance.control);

    expect(controlOptions(instance).accessToken).toBe('attr-token');
    expect(instance.control!.addTo).toHaveBeenCalledWith(el);
    expect(el.querySelector('.mapboxgl-ctrl-geocoder input')).not.toBeNull();

    const log = recordEvents(el, 'map-result');
    try {
      const result = { center: [1, 2] };
      (instance.control as unknown as MockGeocoder).fire('result', { result });

      expect(log.events).toHaveLength(1);
      expect((log.events[0].detail as { result: unknown }).result).toBe(result);
    } finally {
      log.stop();
    }
  });

  it('should still accept `accessToken` in `options`', async () => {
    const { instance } = await mountStandalone(
      `data-option-options='{"accessToken":"opt-token","language":"fr"}'`,
    );
    await waitFor(() => instance.control);

    expect(controlOptions(instance)).toEqual({ accessToken: 'opt-token', language: 'fr' });
  });

  it('should prefer `accessToken` in `options` over `data-option-access-token`', async () => {
    const { instance } = await mountStandalone(
      `data-option-access-token="attr-token" data-option-options='{"accessToken":"opt-token"}'`,
    );
    await waitFor(() => instance.control);

    expect(controlOptions(instance).accessToken).toBe('opt-token');
  });

  it('should warn and create no control without any token', async () => {
    const diagnostics = captureDiagnostics();
    try {
      const count = geocoder.MockGeocoder.instances.length;

      // An empty attribute counts as absent.
      const { el, instance } = await mountStandalone(
        `data-option-access-token="" data-option-options='{"language":"fr"}'`,
      );
      await tick();

      expect(diagnostics.codes).toEqual(['mapbox-geocoder.missing-access-token']);
      expect(instance.control).toBeUndefined();
      expect(geocoder.MockGeocoder.instances).toHaveLength(count);
      expect(el.querySelector('input')).toBeNull();
    } finally {
      diagnostics.stop();
    }
  });
});

describe('MapboxGeocoder access token inside a MapboxMap', () => {
  it('should use the map token when the geocoder sets none', async () => {
    const { instance } = await mountInMap('');

    expect(controlOptions(instance).accessToken).toBe('map-token');
    expect(controlOptions(instance).mapboxgl).toBe(mapboxGl.namespace);
  });

  it('should prefer `data-option-access-token` over the map token', async () => {
    const { instance } = await mountInMap('data-option-access-token="attr-token"');

    expect(controlOptions(instance).accessToken).toBe('attr-token');
  });

  it('should prefer `accessToken` in `options` over both', async () => {
    const { instance } = await mountInMap(
      `data-option-access-token="attr-token" data-option-options='{"accessToken":"opt-token"}'`,
    );

    expect(controlOptions(instance).accessToken).toBe('opt-token');
  });
});

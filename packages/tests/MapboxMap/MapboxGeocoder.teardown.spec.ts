import { describe, it, expect, vi } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { mount, settle } from '@studiometa/js-toolkit/test';

/**
 * The geocoder module is loaded lazily via a dynamic `import()` inside
 * `MapboxGeocoder.mounted()`. To reproduce the mount/teardown race we gate that
 * import behind a controllable promise so the component can be unmounted while
 * the import is still pending.
 *
 * This spec deliberately declares its own mocks instead of reusing the
 * synchronous ones from `mock-mapbox-gl.ts` (mocks are file-scoped, so the other
 * geocoder specs keep their instant import).
 */
const gate = vi.hoisted(() => {
  let release!: () => void;
  function make() {
    return new Promise<void>((resolve) => (release = resolve));
  }
  return {
    promise: make(),
    open() {
      release();
    },
    reset() {
      this.promise = make();
    },
  };
});

/**
 * A `mapbox-gl` `Map` double with just enough of an event emitter for
 * `MapboxMap` to forward events and for the map children to bind their `remove`
 * and `style.load` watches.
 */
const stub = vi.hoisted(() => {
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

  return { StubMap };
});

vi.mock('mapbox-gl', () => ({ default: { Map: stub.StubMap } }));

vi.mock('@mapbox/mapbox-gl-geocoder', async () => {
  await gate.promise;
  class MockGeocoder {
    addTo = vi.fn();
    onRemove = vi.fn();
  }
  return { default: MockGeocoder };
});

const { MapboxGeocoder, MapboxMap, provideMapboxGl } = await import('@studiometa/ui-mapbox');

// Inject the stub namespace so the mounted `MapboxMap` builds a `StubMap`
// without reaching for the real library.
provideMapboxGl({ Map: stub.StubMap } as unknown as Parameters<typeof provideMapboxGl>[0]);

registerComponents(MapboxMap, MapboxGeocoder);

/**
 * Mount a loaded `MapboxMap` holding one `MapboxGeocoder`. The geocoder's
 * `mounted()` is still awaiting the gated import when this resolves.
 */
async function mountGeocoder() {
  const root = await mount(`
    <div data-component="MapboxMap" data-option-access-token="test-token">
      <div data-ref="container"></div>
      <div data-component="MapboxGeocoder" data-option-options='{"accessToken":"geo-token"}'></div>
    </div>
  `);
  const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
  const el = root.querySelector<HTMLElement>('[data-component="MapboxGeocoder"]')!;
  const mapbox = getInstance<InstanceType<typeof MapboxMap>>(mapEl, 'MapboxMap')!;

  (mapbox.map as unknown as InstanceType<typeof stub.StubMap>).fire('load');
  await settle();

  return {
    mapbox,
    instance: getInstance<InstanceType<typeof MapboxGeocoder>>(el, 'MapboxGeocoder')!,
    stubMap: mapbox.map as unknown as InstanceType<typeof stub.StubMap>,
  };
}

// Real timers: the gated dynamic import does not settle cleanly under fake
// timers, so drive the async work with a short real delay instead.
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

describe('MapboxGeocoder teardown race', () => {
  it('should not create or add the control when unmounted before the import resolves', async () => {
    gate.reset();
    const { instance, stubMap } = await mountGeocoder();
    await tick();

    // The dynamic import is still pending: no control has been created yet.
    expect(instance.control).toBeUndefined();

    // Unmount while the import is in flight, then let it resolve afterwards.
    instance.$unmount();
    await tick();
    gate.open();
    await tick();

    // The control must never be created nor added to the map after teardown.
    expect(instance.control).toBeUndefined();
    expect(stubMap.removeControl).not.toHaveBeenCalled();
  });

  it('should create and add the control on a normal mount', async () => {
    gate.reset();
    const { instance } = await mountGeocoder();

    gate.open();
    await tick();

    expect(instance.control).toBeDefined();
    expect(instance.control!.addTo).toHaveBeenCalledWith(instance.$el);
  });
});

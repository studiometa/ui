import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { getInstance, registerComponent } from '@studiometa/js-toolkit';
import {
  captureDiagnostics,
  mount,
  recordEvents,
  settle,
  waitFor,
} from '@studiometa/js-toolkit/test';

/**
 * A `MapboxGeocoder` with no ancestor `MapboxMap` works on its own: the
 * `@mapbox/mapbox-gl-geocoder` control renders its input into the component's
 * root element and needs no map.
 *
 * This spec declares its own mocks instead of reusing `mock-mapbox-gl.ts`
 * (mocks are file-scoped). The geocoder double renders real DOM so the tests can
 * assert on what lands in `$el`. The package's `dependencies` module is wrapped:
 * `resolveMapboxGeocoder()` waits on a gate a test can close to race the import,
 * and the `mapbox-gl` accessors are spies so the tests can assert that a
 * standalone geocoder never reaches for `mapbox-gl`.
 *
 * The real `resolveMapboxGeocoder()` memoizes its import, so a gated import
 * could only be raced once per file. Gating the wrapper instead gives every test
 * its own pending import, so each test runs alone and survives a retry.
 */
const gate = vi.hoisted(() => {
  function noop() {}
  let release: () => void = noop;
  const state = {
    promise: Promise.resolve(),
    /** Hold every `resolveMapboxGeocoder()` call made from now on. */
    close() {
      state.promise = new Promise<void>((resolve) => (release = resolve));
    },
    /** Release the held calls. */
    open() {
      release();
    },
  };
  return state;
});

const geocoder = vi.hoisted(() => {
  /**
   * A geocoder control double that renders like the real one: `addTo(element)`
   * appends its container (holding the search input) to the element, and
   * `onRemove()` detaches it again. A `throwOnAddTo` option makes `addTo` throw.
   */
  class MockGeocoder {
    static instances: MockGeocoder[] = [];

    options: Record<string, unknown>;
    container = document.createElement('div');
    _handlers: Record<string, Array<(event: unknown) => void>> = {};

    constructor(options: Record<string, unknown>) {
      this.options = options;
      this.container.className = 'mapboxgl-ctrl-geocoder';
      this.container.append(document.createElement('input'));
      MockGeocoder.instances.push(this);
    }

    addTo = vi.fn((target: unknown) => {
      if (this.options.throwOnAddTo) {
        throw new Error('addTo failed');
      }
      if (target instanceof HTMLElement) {
        target.append(this.container);
      }
    });

    onRemove = vi.fn(() => {
      this.container.remove();
    });

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

vi.mock('../../ui-mapbox/src/dependencies.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('@studiometa/ui-mapbox/dependencies')>();
  return {
    ...original,
    resolveMapboxGeocoder: vi.fn(() => gate.promise.then(() => geocoder.MockGeocoder)),
    resolveMapboxGl: vi.fn(original.resolveMapboxGl),
    getMapboxGl: vi.fn(original.getMapboxGl),
  };
});

const { MapboxGeocoder, MAPBOX_MAP_CONNECTED } = await import('@studiometa/ui-mapbox');
const dependencies = await import('../../ui-mapbox/src/dependencies.ts');

registerComponent(MapboxGeocoder);

type Geocoder = InstanceType<typeof MapboxGeocoder>;
type MockGeocoder = InstanceType<typeof geocoder.MockGeocoder>;

/**
 * Mount a standalone `MapboxGeocoder` with the given options.
 */
async function mountGeocoder(
  options: Record<string, unknown> = { accessToken: 'geo-token' },
  attrs = '',
) {
  const root = await mount(
    `<div data-component="MapboxGeocoder" data-mount="eager" data-option-options='${JSON.stringify(options)}' ${attrs}></div>`,
  );
  const el = root.querySelector<HTMLElement>('[data-component="MapboxGeocoder"]')!;

  return { root, el, instance: getInstance<Geocoder>(el, 'MapboxGeocoder')! };
}

// Real timers: the gated dynamic import does not settle cleanly under fake
// timers, so drive the async work with a short real delay instead.
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

describe('MapboxGeocoder without a parent map', () => {
  it('should render the geocoder input in its root element', async () => {
    const { el, instance } = await mountGeocoder();
    await waitFor(() => instance.control);

    expect(instance.target).toBe(el);
    expect(instance.control!.addTo).toHaveBeenCalledWith(el);
    expect(el.querySelector('.mapboxgl-ctrl-geocoder input')).not.toBeNull();
  });

  it('should pass its options to the control, without the mapbox-gl namespace', async () => {
    const { instance } = await mountGeocoder({ accessToken: 'geo-token', language: 'fr' });
    await waitFor(() => instance.control);

    const { options } = instance.control as unknown as MockGeocoder;
    expect(options).toEqual({ accessToken: 'geo-token', language: 'fr' });
    expect(options).not.toHaveProperty('mapboxgl');
  });

  it('should not load mapbox-gl', async () => {
    vi.mocked(dependencies.resolveMapboxGl).mockClear();
    vi.mocked(dependencies.getMapboxGl).mockClear();

    const { instance } = await mountGeocoder();
    await waitFor(() => instance.control);

    expect(dependencies.resolveMapboxGl).not.toHaveBeenCalled();
    expect(dependencies.getMapboxGl).not.toHaveBeenCalled();
  });

  it('should emit `map-result` with the geocoded result', async () => {
    const { el, instance } = await mountGeocoder();
    await waitFor(() => instance.control);
    const log = recordEvents(el, 'map-result');

    const payload = { center: [1, 2] };
    (instance.control as unknown as MockGeocoder).fire('result', { result: payload });

    expect(log.events).toHaveLength(1);
    expect((log.events[0].detail as { result: unknown }).result).toBe(payload);
    log.stop();
  });

  it('should neither wait for a map nor report a missing one', async () => {
    const addEventListener = vi.spyOn(document, 'addEventListener');
    const diagnostics = captureDiagnostics();

    const { instance } = await mountGeocoder();
    await waitFor(() => instance.control);

    expect(addEventListener).not.toHaveBeenCalledWith(MAPBOX_MAP_CONNECTED, expect.anything());
    expect(diagnostics.codes).toEqual([]);

    diagnostics.stop();
    addEventListener.mockRestore();
  });

  it('should warn and not create the control without an access token', async () => {
    const diagnostics = captureDiagnostics();
    const count = geocoder.MockGeocoder.instances.length;

    const { el, instance } = await mountGeocoder({ language: 'fr' });
    await tick();

    expect(diagnostics.codes).toEqual(['mapbox-geocoder.missing-access-token']);
    expect(instance.control).toBeUndefined();
    expect(geocoder.MockGeocoder.instances).toHaveLength(count);
    expect(el.querySelector('input')).toBeNull();

    diagnostics.stop();
  });

  it('should remove the control from its root element when destroyed', async () => {
    const { el, instance } = await mountGeocoder();
    await waitFor(() => instance.control);
    const control = instance.control!;

    instance.$unmount();
    await settle();

    expect(control.onRemove).toHaveBeenCalledTimes(1);
    expect(instance.control).toBeUndefined();
    expect(el.querySelector('input')).toBeNull();
  });

  it('should contain a throwing control and report it as `map-error`', async () => {
    const diagnostics = captureDiagnostics();
    // The event bubbles: record it on the document, before the mount, since the
    // control may fail before `mountGeocoder()` returns.
    const log = recordEvents(document, 'map-error');
    const count = geocoder.MockGeocoder.instances.length;

    const { instance } = await mountGeocoder({ accessToken: 'geo-token', throwOnAddTo: true });
    await waitFor(() => log.events.length === 1);

    expect((log.events[0].detail as { error: Error }).error.message).toBe('addTo failed');
    expect(diagnostics.codes).toEqual(['mapbox-map-child.failed']);
    // The control never rendered, so it is not kept: teardown must not call
    // `onRemove()` on it.
    expect(instance.control).toBeUndefined();

    instance.$unmount();
    await settle();

    const [control] = geocoder.MockGeocoder.instances.slice(count);
    expect(control.onRemove).not.toHaveBeenCalled();
    expect(diagnostics.codes).toEqual(['mapbox-map-child.failed']);
    log.stop();
    diagnostics.stop();
  });

  it('should keep waiting for a map when `addToMap` is set', async () => {
    const addEventListener = vi.spyOn(document, 'addEventListener');
    const count = geocoder.MockGeocoder.instances.length;

    const { instance } = await mountGeocoder(
      { accessToken: 'geo-token' },
      'data-option-add-to-map',
    );
    await tick();

    expect(instance.control).toBeUndefined();
    expect(geocoder.MockGeocoder.instances).toHaveLength(count);
    expect(addEventListener).toHaveBeenCalledWith(MAPBOX_MAP_CONNECTED, expect.any(Function));

    addEventListener.mockRestore();
  });
});

describe('MapboxGeocoder without a parent map, while the geocoder module is loading', () => {
  beforeEach(() => {
    gate.close();
  });

  // Open the gate even when a test fails, so no held import leaks into the next.
  afterEach(() => {
    gate.open();
  });

  it('should not create the control when destroyed before the module resolves', async () => {
    const count = geocoder.MockGeocoder.instances.length;
    const { el, instance } = await mountGeocoder();
    await tick();

    // The import is still pending: no control has been created yet.
    expect(instance.control).toBeUndefined();

    // Destroy while the import is in flight, then let it resolve afterwards.
    instance.$unmount();
    await tick();
    gate.open();
    await tick();

    expect(instance.control).toBeUndefined();
    expect(geocoder.MockGeocoder.instances).toHaveLength(count);
    expect(el.querySelector('input')).toBeNull();
  });

  it('should add a single control when remounted before the module resolves', async () => {
    const { el, instance } = await mountGeocoder();
    await tick();

    // Unmount and mount the same instance while the import is in flight, as
    // js-toolkit does when an element moves: both `mounted()` calls resume.
    instance.$unmount();
    instance.$mount();
    await settle();
    gate.open();
    await waitFor(() => instance.control);
    await tick();

    expect(el.querySelectorAll('.mapboxgl-ctrl-geocoder')).toHaveLength(1);
    expect(el.querySelector('.mapboxgl-ctrl-geocoder')).toBe(
      (instance.control as unknown as MockGeocoder).container,
    );
  });
});

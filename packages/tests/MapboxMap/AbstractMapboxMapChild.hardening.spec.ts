import { describe, it, expect } from 'vitest';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { getInstance, registerComponent, registerComponents } from '@studiometa/js-toolkit';
import {
  captureDiagnostics,
  mount,
  recordEvents,
  resetDom,
  resetRegistry,
  settle,
} from '@studiometa/js-toolkit/test';
import { AbstractMapboxMapChild, MapboxMap, MapboxMarker } from '@studiometa/ui-mapbox';
import { append, mountMap } from './harness.js';

/**
 * A concrete child whose ready callback and teardown can be made to throw, used
 * to exercise the guards centralized in `AbstractMapboxMapChild`.
 *
 * v3 declared its events in `static config.emits`; v4 has no runtime emit list,
 * so `map-error` comes from the props type this class inherits.
 */
class ThrowingChild extends AbstractMapboxMapChild {
  static config: BaseConfig = {
    name: 'ThrowingChild',
  };

  readyError?: Error;
  teardownError?: Error;

  mounted() {
    this.whenMapReady(() => {
      if (this.readyError) {
        throw this.readyError;
      }
    });
  }

  __onDestroyed() {
    if (this.teardownError) {
      throw this.teardownError;
    }
  }
}

registerComponents(MapboxMap, MapboxMarker, ThrowingChild);

const MARKER_HTML = '<div data-component="MapboxMarker" data-option-lng-lat="[2, 48]"></div>';
const THROWING_HTML = '<div data-component="ThrowingChild"></div>';

/** Mount a loaded `MapboxMap` holding one `ThrowingChild`. */
async function createChild() {
  const context = await mountMap();
  await context.load();
  const el = await append(context.mapEl, THROWING_HTML);

  return {
    context,
    instance: getInstance<ThrowingChild>(el, 'ThrowingChild')!,
    mockMap: context.mockMap,
  };
}

describe('AbstractMapboxMapChild — B1: guarded lifecycle', () => {
  it('should contain a throwing ready callback: no rethrow, reports + emits map-error', async () => {
    const { instance } = await createChild();

    // v3 asserted on a `console.warn` spy; v4 reports a recovered failure on the
    // diagnostic channel, so the assertion reads the namespaced code rather than
    // whichever sink the default handler writes to.
    const diagnostics = captureDiagnostics();
    const log = recordEvents(instance.$el, 'map-error');
    const boom = new Error('ready boom');

    // Arm the ready callback and remount: `$mount()` returns normally, because
    // the throw is contained instead of escaping into the framework.
    instance.$unmount();
    instance.readyError = boom;
    expect(() => instance.$mount()).not.toThrow();
    await settle();

    expect(diagnostics.codes).toContain('mapbox-map-child.failed');
    expect(log.events).toHaveLength(1);
    // v4 payloads are one named object: the cause travels as `detail.error`.
    expect((log.events[0].detail as { error: unknown }).error).toBe(boom);

    log.stop();
    diagnostics.stop();
  });

  it('should contain a throwing teardown: no rethrow, reports + emits map-error', async () => {
    const { instance } = await createChild();
    const diagnostics = captureDiagnostics();
    const log = recordEvents(instance.$el, 'map-error');
    const boom = new Error('teardown boom');

    instance.teardownError = boom;
    expect(() => instance.$unmount()).not.toThrow();
    await settle();

    expect(diagnostics.codes).toContain('mapbox-map-child.failed');
    expect(log.events).toHaveLength(1);
    expect((log.events[0].detail as { error: unknown }).error).toBe(boom);

    log.stop();
    diagnostics.stop();
  });

  it('should not wedge the framework: a later mount still runs after a throwing one', async () => {
    const context = await mountMap();
    await context.load();
    const diagnostics = captureDiagnostics();

    const firstEl = await append(context.mapEl, THROWING_HTML);
    const first = getInstance<ThrowingChild>(firstEl, 'ThrowingChild')!;
    first.$unmount();
    first.readyError = new Error('boom');
    first.$mount();
    await settle();

    // A second, independent child mounts and injects normally: proof the
    // framework was not wedged by the first child's synchronous throw.
    const secondEl = await append(context.mapEl, THROWING_HTML);
    const second = getInstance<ThrowingChild>(secondEl, 'ThrowingChild')!;

    expect(second.$isMounted).toBe(true);
    diagnostics.stop();
  });
});

describe('AbstractMapboxMapChild — B2: teardown against a removed map', () => {
  it('should not call any map method on teardown after the map was removed', async () => {
    const context = await mountMap(MARKER_HTML);
    await context.load();
    const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxMarker"]')!;
    const instance = getInstance<MapboxMarker>(el, 'MapboxMarker')!;
    const { mockMap } = context;

    // The map is removed first (fires its `remove` event), dropping the child's
    // cached reference. Marker `.remove()` is style-safe, but the guard must be
    // uniform: the cached map is gone so teardown reads no map.
    // Capture the marker before teardown, which nulls the backing field (so the
    // getter would otherwise build a fresh, never-removed marker).
    const marker = instance.marker as unknown as { remove: unknown };

    mockMap.remove();
    expect((instance as unknown as { __readyMap?: unknown }).__readyMap).toBeUndefined();

    // Teardown must not touch the dead map. Track every map method call from
    // here on: none may fire during teardown.
    function mapCalls() {
      return [
        mockMap.removeControl,
        mockMap.removeLayer,
        mockMap.removeSource,
        mockMap.getLayer,
        mockMap.getSource,
      ].reduce((total, spy) => total + spy.mock.calls.length, 0);
    }

    const callsBefore = mapCalls();

    instance.$unmount();
    await settle();

    expect(mapCalls()).toBe(callsBefore);
    // The marker itself is still torn down through its own (style-safe) remove.
    expect(marker.remove).toHaveBeenCalled();
  });
});

describe('AbstractMapboxMapChild — M1: retryable resolution', () => {
  it('should inject once a MapboxMap connects when none existed at mount', async () => {
    // Reproduce the lazily-imported map: only the child's class is registered
    // when the markup mounts, so `$closest` resolves nothing and the child parks
    // on `MAPBOX_MAP_CONNECTED`. Registering `MapboxMap` afterwards mounts it and
    // its announcement is what lets the child bind.
    await resetDom();
    resetRegistry();

    try {
      registerComponent(MapboxMarker);

      const root = await mount(`
        <div data-component="MapboxMap" data-option-access-token="test-token">
          <div data-ref="container"></div>
          ${MARKER_HTML}
        </div>
      `);
      const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
      const markerEl = root.querySelector<HTMLElement>('[data-component="MapboxMarker"]')!;
      const instance = getInstance<MapboxMarker>(markerEl, 'MapboxMarker')!;
      const marker = instance.marker as unknown as { addTo: unknown };

      // Nothing injected: the child is parked on the connected event.
      expect(instance.$closest('MapboxMap')).toBeNull();
      expect(marker.addTo).not.toHaveBeenCalled();

      registerComponent(MapboxMap);
      await settle();

      const mapbox = getInstance<MapboxMap>(mapEl, 'MapboxMap')!;
      // The map announced itself, so the child is bound and injects on load.
      (mapbox.map as unknown as { fire(type: string): void }).fire('load');
      await settle();

      expect(marker.addTo).toHaveBeenCalledWith(mapbox.map);
    } finally {
      // The registry is page-wide: restore it for the rest of the file.
      registerComponents(MapboxMap, MapboxMarker, ThrowingChild);
    }
  });

  it('should ignore a connected map that is not an ancestor of the child', async () => {
    // The marker lives outside every map, so the connecting map's ancestry check
    // rejects it and it stays parked.
    const root = await mount(`
      <div>${MARKER_HTML}</div>
      <div data-component="MapboxMap" data-option-access-token="test-token">
        <div data-ref="container"></div>
      </div>
    `);
    const markerEl = root.querySelector<HTMLElement>('[data-component="MapboxMarker"]')!;
    const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
    const instance = getInstance<MapboxMarker>(markerEl, 'MapboxMarker')!;
    const mapbox = getInstance<MapboxMap>(mapEl, 'MapboxMap')!;

    (mapbox.map as unknown as { fire(type: string): void }).fire('load');
    await settle();

    expect((instance.marker as unknown as { addTo: unknown }).addTo).not.toHaveBeenCalled();
  });
});

describe('AbstractMapboxMapChild — M2: re-inject on map remount', () => {
  it('should re-run injection on a new map after the first is removed', async () => {
    const context = await mountMap(MARKER_HTML);
    await context.load();
    const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxMarker"]')!;
    const instance = getInstance<MapboxMarker>(el, 'MapboxMarker')!;
    const marker = instance.marker as unknown as { addTo: unknown };
    const firstMap = context.mockMap;

    expect(marker.addTo).toHaveBeenCalledWith(firstMap);
    expect(marker.addTo).toHaveBeenCalledTimes(1);

    // The map is destroyed (fires `remove`), then a brand new map connects on a
    // deferred-load path. The still-mounted child must re-inject on it.
    context.mapbox.$unmount();
    await settle();
    context.mapbox.$mount();
    await settle();

    const secondMap = context.mapbox.map;
    expect(secondMap).not.toBe(firstMap);

    // Not loaded yet: nothing new injected.
    expect(marker.addTo).toHaveBeenCalledTimes(1);

    await context.load();

    // Re-injected against the second map.
    expect(marker.addTo).toHaveBeenCalledWith(secondMap);
    expect(marker.addTo).toHaveBeenCalledTimes(2);
  });
});

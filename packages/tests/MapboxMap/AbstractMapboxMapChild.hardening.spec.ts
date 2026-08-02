import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { AbstractMapboxMapChild, MapboxMarker } from '@studiometa/ui-mapbox';

/**
 * A concrete child whose ready callback and teardown can be made to throw, used
 * to exercise the guards centralized in `AbstractMapboxMapChild`.
 */
class ThrowingChild extends AbstractMapboxMapChild {
  static config = {
    name: 'ThrowingChild',
    emits: ['map-error'],
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

/**
 * Build a `ThrowingChild` bound to a ready `MockMap` through a mocked `$closest`.
 */
function createChild(el?: HTMLElement) {
  const mockMap = new MockMap();
  const element =
    el ??
    h('div', {
      'data-component': 'ThrowingChild',
    });
  const instance = new ThrowingChild(element);
  instance.$closest = vi.fn((query: string) =>
    query === 'MapboxMap'
      ? ({ map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any)
      : undefined,
  );
  return { instance, mockMap };
}

/**
 * A `MapboxMap` stand-in whose `map-load` fires on demand, letting a test drive
 * the deferred readiness path.
 */
function createDeferredMap(mockMap: MockMap) {
  const handlers: Function[] = [];
  return {
    map: mockMap,
    isLoaded: false,
    $el: document.createElement('div'),
    $options: { accessToken: 'token' },
    $on(event: string, cb: Function) {
      if (event === 'map-load') handlers.push(cb);
      return () => {
        const index = handlers.indexOf(cb);
        if (index > -1) handlers.splice(index, 1);
      };
    },
    fireLoad() {
      this.isLoaded = true;
      handlers.slice().forEach((cb) => cb());
    },
  };
}

describe('AbstractMapboxMapChild — B1: guarded lifecycle', () => {
  it('should contain a throwing ready callback: no rethrow, warns + emits map-error', async () => {
    const { instance } = createChild();
    instance.$options.log = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onError = vi.fn();
    const boom = new Error('ready boom');
    instance.readyError = boom;
    instance.$on('map-error', onError);

    vi.useFakeTimers();
    // `$mount` resolves even though the ready callback threw: the throw was
    // contained instead of rejecting the queued task.
    await expect(
      (async () => {
        instance.$mount();
        await vi.advanceTimersByTimeAsync(100);
      })(),
    ).resolves.toBeUndefined();
    vi.useRealTimers();

    expect(warn).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as CustomEvent).detail[0]).toBe(boom);

    warn.mockRestore();
  });

  it('should contain a throwing teardown: no rethrow, warns + emits map-error', async () => {
    const { instance } = createChild();
    instance.$options.log = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onError = vi.fn();
    const boom = new Error('teardown boom');
    instance.$on('map-error', onError);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    instance.teardownError = boom;
    await expect(
      (async () => {
        instance.$destroy();
        await vi.advanceTimersByTimeAsync(100);
      })(),
    ).resolves.toBeUndefined();
    vi.useRealTimers();

    expect(warn).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as CustomEvent).detail[0]).toBe(boom);

    warn.mockRestore();
  });

  it('should not wedge the global queue: a later mount still runs after a throwing one', async () => {
    const first = createChild();
    first.instance.readyError = new Error('boom');

    vi.useFakeTimers();
    first.instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // A second, independent child mounts and injects normally: proof the global
    // queue was not frozen by the first child's synchronous throw.
    const second = createChild();
    second.instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(second.instance.$isMounted).toBe(true);
  });
});

describe('AbstractMapboxMapChild — B2: teardown against a removed map', () => {
  it('should not call any map method on teardown after the map was removed', async () => {
    const el = h('div', { 'data-component': 'MapboxMarker', 'data-option-lng-lat': '[2, 48]' });
    const mockMap = new MockMap();
    const instance = new MapboxMarker(el);
    instance.$closest = vi.fn((query: string) =>
      query === 'MapboxMap'
        ? ({ map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any)
        : undefined,
    );

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // The map is removed first (fires its `remove` event), dropping the child's
    // cached reference. Marker `.remove()` is style-safe, but the guard must be
    // uniform: the cached map is gone so teardown reads no map.
    // Capture the marker before teardown, which nulls the backing field (so the
    // getter would otherwise build a fresh, never-removed marker).
    const marker = instance.marker as any;

    mockMap.remove();
    expect((instance as any).__readyMap).toBeUndefined();

    // Teardown must not touch the dead map. Track every map method call from
    // here on: none may fire during destroy.
    const callsBefore = [
      mockMap.removeControl,
      mockMap.removeLayer,
      mockMap.removeSource,
      mockMap.getLayer,
      mockMap.getSource,
    ].reduce((total, mock) => total + mock.mock.calls.length, 0);

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const callsAfter = [
      mockMap.removeControl,
      mockMap.removeLayer,
      mockMap.removeSource,
      mockMap.getLayer,
      mockMap.getSource,
    ].reduce((total, mock) => total + mock.mock.calls.length, 0);

    expect(callsAfter).toBe(callsBefore);
    // The marker itself is still torn down through its own (style-safe) remove.
    expect(marker.remove).toHaveBeenCalled();
  });
});

describe('AbstractMapboxMapChild — M1: retryable resolution', () => {
  it('should inject once a MapboxMap connects when none existed at mount', async () => {
    const mapEl = h('div', { 'data-component': 'MapboxMap' });
    const childEl = h('div', {
      'data-component': 'MapboxMarker',
      'data-option-lng-lat': '[2, 48]',
    });
    mapEl.append(childEl);

    const mockMap = new MockMap();
    const instance = new MapboxMarker(childEl);
    // No map at mount: `$closest` resolves nothing yet.
    instance.$closest = vi.fn(() => undefined);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Nothing injected: the child is parked on the connected event.
    expect((instance.marker as any).addTo).not.toHaveBeenCalled();

    // A map connects; make it resolvable and dispatch the connected event.
    const mapboxMap = { map: mockMap, isLoaded: true, $el: mapEl, $options: { accessToken: 't' } };
    instance.$closest = vi.fn((query: string) =>
      query === 'MapboxMap' ? (mapboxMap as any) : undefined,
    );
    document.dispatchEvent(new CustomEvent('mapbox-map:connected', { detail: mapboxMap }));

    expect((instance.marker as any).addTo).toHaveBeenCalledWith(mockMap);
  });

  it('should ignore a connected map that is not an ancestor of the child', async () => {
    const childEl = h('div', {
      'data-component': 'MapboxMarker',
      'data-option-lng-lat': '[2, 48]',
    });
    const instance = new MapboxMarker(childEl);
    instance.$closest = vi.fn(() => undefined);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // A map elsewhere on the page connects; its element does not contain the
    // child, so the child must stay parked.
    const otherMapEl = h('div', { 'data-component': 'MapboxMap' });
    const mockMap = new MockMap();
    const mapboxMap = {
      map: mockMap,
      isLoaded: true,
      $el: otherMapEl,
      $options: { accessToken: 't' },
    };
    document.dispatchEvent(new CustomEvent('mapbox-map:connected', { detail: mapboxMap }));

    expect((instance.marker as any).addTo).not.toHaveBeenCalled();
  });
});

describe('AbstractMapboxMapChild — M2: re-inject on map remount', () => {
  it('should re-run injection on a new map after the first is removed', async () => {
    const mapEl = h('div', { 'data-component': 'MapboxMap' });
    const childEl = h('div', {
      'data-component': 'MapboxMarker',
      'data-option-lng-lat': '[2, 48]',
    });
    mapEl.append(childEl);

    const firstMap = new MockMap();
    const instance = new MapboxMarker(childEl);
    const firstMapboxMap = {
      map: firstMap,
      isLoaded: true,
      $el: mapEl,
      $options: { accessToken: 't' },
    };
    instance.$closest = vi.fn((query: string) =>
      query === 'MapboxMap' ? (firstMapboxMap as any) : undefined,
    );

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect((instance.marker as any).addTo).toHaveBeenCalledWith(firstMap);
    expect((instance.marker as any).addTo).toHaveBeenCalledTimes(1);

    // The map is destroyed (fires `remove`), then a brand new map connects on a
    // deferred-load path. The still-mounted child must re-inject on it.
    firstMap.remove();

    const secondMock = new MockMap();
    const secondMapboxMap = createDeferredMap(secondMock);
    (secondMapboxMap as any).$el = mapEl;
    instance.$closest = vi.fn((query: string) =>
      query === 'MapboxMap' ? (secondMapboxMap as any) : undefined,
    );
    document.dispatchEvent(new CustomEvent('mapbox-map:connected', { detail: secondMapboxMap }));

    // Not loaded yet: nothing new injected.
    expect((instance.marker as any).addTo).toHaveBeenCalledTimes(1);

    secondMapboxMap.fireLoad();

    // Re-injected against the second map.
    expect((instance.marker as any).addTo).toHaveBeenCalledWith(secondMock);
    expect((instance.marker as any).addTo).toHaveBeenCalledTimes(2);
  });
});

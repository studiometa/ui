import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxMarker } from '@studiometa/ui-mapbox';

/**
 * A minimal `MapboxMap` stand-in whose `map-load` can be fired on demand, used to
 * exercise `AbstractMapboxMapChild.whenMapReady` through a concrete child.
 */
function createDeferredMap() {
  const mockMap = new MockMap();
  const handlers: Function[] = [];

  const mapboxMap = {
    map: mockMap,
    isLoaded: false,
    $options: { accessToken: 'token' },
    $on(event: string, cb: Function) {
      if (event === 'map-load') {
        handlers.push(cb);
      }
      return () => {
        const index = handlers.indexOf(cb);
        if (index > -1) handlers.splice(index, 1);
      };
    },
    fireLoad() {
      this.isLoaded = true;
      handlers.slice().forEach((cb) => cb());
    },
    get pending() {
      return handlers.length;
    },
  };

  return { mapboxMap, mockMap };
}

function createMarker(mapboxMap: unknown) {
  const el = h('div', {
    'data-component': 'MapboxMarker',
    'data-option-lng-lat': '[2.35, 48.85]',
  });
  const instance = new MapboxMarker(el);
  instance.$closest = vi.fn((query: string) =>
    query === 'MapboxMap' ? (mapboxMap as any) : undefined,
  );
  return instance;
}

describe('AbstractMapboxMapChild.whenMapReady', () => {
  it('should run the callback synchronously when the map is already loaded', async () => {
    const { mapboxMap, mockMap } = createDeferredMap();
    mapboxMap.isLoaded = true;
    const instance = createMarker(mapboxMap);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // The marker injected itself against the ready map right away.
    expect((instance.marker as any).addTo).toHaveBeenCalledWith(mockMap);
  });

  it('should defer the callback until map-load fires when the map is not loaded yet', async () => {
    const { mapboxMap, mockMap } = createDeferredMap();
    const instance = createMarker(mapboxMap);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Nothing injected yet: the map has not loaded.
    expect((instance.marker as any).addTo).not.toHaveBeenCalled();
    expect(mapboxMap.pending).toBe(1);

    mapboxMap.fireLoad();
    expect((instance.marker as any).addTo).toHaveBeenCalledWith(mockMap);
  });

  it('should not run the callback after the child has been destroyed', async () => {
    const { mapboxMap } = createDeferredMap();
    const instance = createMarker(mapboxMap);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    // Destroy before the map ever loads: the pending subscription is flushed.
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mapboxMap.pending).toBe(0);

    // Firing map-load now must not inject anything on a destroyed child.
    mapboxMap.fireLoad();
    expect((instance.marker as any).addTo).not.toHaveBeenCalled();
  });
});

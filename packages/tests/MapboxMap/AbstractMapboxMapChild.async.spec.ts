import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { AbstractMapboxMapChild, MapboxMarker } from '@studiometa/ui-mapbox';

/**
 * A concrete child whose async ready callback can be made to reject or to gate on
 * an external promise, used to exercise the async containment and stale-callback
 * invalidation centralised in `AbstractMapboxMapChild`.
 */
class AsyncChild extends AbstractMapboxMapChild {
  static config = {
    name: 'AsyncChild',
    emits: ['map-error', 'done'],
  };

  rejectWith?: Error;
  gate = Promise.resolve();
  ran = 0;
  skipped = 0;

  mounted() {
    this.whenMapReady(async (map) => {
      await this.gate;

      // The map may have been removed/replaced (or the child destroyed) while
      // the callback was awaiting: honour the same identity guard the built-in
      // subclasses use so a stale callback no-ops instead of mutating a dead map.
      if (!this.$isMounted || (this as any).__readyMap !== map) {
        this.skipped += 1;
        return;
      }

      this.ran += 1;

      if (this.rejectWith) {
        throw this.rejectWith;
      }

      this.$emit('done', map);
    });
  }
}

function createAsyncChild(mapboxMap: unknown) {
  const el = h('div', { 'data-component': 'AsyncChild' });
  const instance = new AsyncChild(el);
  instance.$closest = vi.fn((query: string) =>
    query === 'MapboxMap' ? (mapboxMap as any) : undefined,
  );
  return instance;
}

describe('AbstractMapboxMapChild — async ready callbacks (F-async)', () => {
  it('should contain a rejected async callback: no unhandled rejection, warns + emits map-error', async () => {
    const mockMap = new MockMap();
    const mapboxMap = { map: mockMap, isLoaded: true, $options: { accessToken: 't' } };
    const instance = createAsyncChild(mapboxMap);
    instance.$options.log = true;

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onError = vi.fn();
    const boom = new Error('async boom');
    instance.rejectWith = boom;
    instance.$on('map-error', onError);

    // A global unhandledrejection would fail the test run, so assert none fires.
    const onUnhandled = vi.fn();
    process.on('unhandledRejection', onUnhandled);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    // Let the awaited microtasks + the rejection routing settle.
    await Promise.resolve();
    await Promise.resolve();
    vi.useRealTimers();

    process.off('unhandledRejection', onUnhandled);

    expect(instance.ran).toBe(1);
    expect(warn).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect((onError.mock.calls[0][0] as CustomEvent).detail[0]).toBe(boom);
    expect(onUnhandled).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it('should run a resolving async callback to completion', async () => {
    const mockMap = new MockMap();
    const mapboxMap = { map: mockMap, isLoaded: true, $options: { accessToken: 't' } };
    const instance = createAsyncChild(mapboxMap);
    const done = vi.fn();
    instance.$on('done', done);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    vi.useRealTimers();

    expect(instance.ran).toBe(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('should no-op a stale async callback whose map was removed mid-flight', async () => {
    const mockMap = new MockMap();
    const mapboxMap = { map: mockMap, isLoaded: true, $options: { accessToken: 't' } };
    const instance = createAsyncChild(mapboxMap);
    const done = vi.fn();
    instance.$on('done', done);

    // Gate the callback so we can remove the map while it is awaiting.
    let openGate: () => void = () => {};
    instance.gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // The map is removed while the callback is still awaiting the gate: the base
    // clears `__readyMap`, invalidating the in-flight callback.
    mockMap.remove();
    expect((instance as any).__readyMap).toBeUndefined();

    openGate();
    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
    vi.useRealTimers();

    // The stale callback bailed instead of mutating the dead map or emitting.
    expect(instance.skipped).toBe(1);
    expect(instance.ran).toBe(0);
    expect(done).not.toHaveBeenCalled();
  });
});

describe('AbstractMapboxMapChild — removal before initial load (H2)', () => {
  it('should re-inject on a replacement map after the first was removed before it loaded', async () => {
    const mapEl = h('div', { 'data-component': 'MapboxMap' });
    const childEl = h('div', {
      'data-component': 'MapboxMarker',
      'data-option-lng-lat': '[2, 48]',
    });
    mapEl.append(childEl);

    // First map: resolved but NOT loaded yet — the child binds and waits on
    // `map-load`.
    const firstMap = new MockMap();
    const firstMapbox = {
      map: firstMap,
      isLoaded: false,
      $el: mapEl,
      $options: { accessToken: 't' },
      _handlers: [] as Function[],
      $on(event: string, cb: Function) {
        if (event === 'map-load') this._handlers.push(cb);
        return () => {
          const i = this._handlers.indexOf(cb);
          if (i > -1) this._handlers.splice(i, 1);
        };
      },
    };

    const instance = new MapboxMarker(childEl);
    instance.$closest = vi.fn((query: string) =>
      query === 'MapboxMap' ? (firstMapbox as any) : undefined,
    );

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Not injected: the map never loaded.
    expect((instance.marker as any).addTo).not.toHaveBeenCalled();

    // The map is removed BEFORE it ever loaded. Because the child bound the
    // `remove` handler at bind-time (not only after load), it drops the pending
    // `map-load` subscription and re-parks on the connected event.
    firstMap.remove();
    expect((instance as any).__readyMap).toBeUndefined();

    // A replacement map connects and loads: the still-mounted child re-injects.
    const secondMap = new MockMap();
    const secondMapbox = {
      map: secondMap,
      isLoaded: true,
      $el: mapEl,
      $options: { accessToken: 't' },
      $on: () => () => {},
    };
    instance.$closest = vi.fn((query: string) =>
      query === 'MapboxMap' ? (secondMapbox as any) : undefined,
    );
    document.dispatchEvent(new CustomEvent('mapbox-map:connected', { detail: secondMapbox }));

    expect((instance.marker as any).addTo).toHaveBeenCalledWith(secondMap);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { Base } from '@studiometa/js-toolkit';
import { resolveWhenMapboxMapIsLoaded } from '@studiometa/ui-mapbox/utils.js';

/**
 * A minimal `Base` subclass standing in for a `MapboxMap` child constructor. It
 * carries the static `$isBase` flag (inherited from `Base`) that
 * `resolveWhenMapboxMapIsLoaded` uses to tell a constructor from a loader.
 */
class FakeChild extends Base {
  static config = { name: 'FakeChild' };
}

/**
 * A minimal `MapboxMap` stand-in exposing only what the resolver touches:
 * `isLoaded` and a `map-load` subscription.
 */
function fakeMap(isLoaded = false) {
  const handlers: Record<string, Array<() => void>> = {};
  return {
    isLoaded,
    $on(event: string, callback: () => void) {
      (handlers[event] ??= []).push(callback);
      return () => {};
    },
    fire(event: string) {
      (handlers[event] ?? []).forEach((callback) => callback());
    },
  };
}

describe('resolveWhenMapboxMapIsLoaded', () => {
  it('accepts a Base constructor and resolves with it once already loaded', async () => {
    const resolver = resolveWhenMapboxMapIsLoaded(FakeChild);
    await expect(resolver(fakeMap(true) as any)).resolves.toBe(FakeChild);
  });

  it('accepts a Base constructor and waits for map-load before resolving', async () => {
    const map = fakeMap(false);
    const resolver = resolveWhenMapboxMapIsLoaded(FakeChild);

    let resolved = false;
    const promise = resolver(map as any).then((ctor) => {
      resolved = true;
      return ctor;
    });

    // Nothing resolves until the map fires `map-load`.
    await Promise.resolve();
    expect(resolved).toBe(false);

    map.fire('map-load');
    await expect(promise).resolves.toBe(FakeChild);
    expect(resolved).toBe(true);
  });

  it('accepts a loader factory returning the constructor synchronously', async () => {
    const map = fakeMap(false);
    const resolver = resolveWhenMapboxMapIsLoaded(() => FakeChild);

    const promise = resolver(map as any);
    map.fire('map-load');
    await expect(promise).resolves.toBe(FakeChild);
  });

  it('accepts a loader factory returning a promise of the constructor', async () => {
    const map = fakeMap(false);
    const resolver = resolveWhenMapboxMapIsLoaded(() => Promise.resolve(FakeChild));

    const promise = resolver(map as any);
    map.fire('map-load');
    await expect(promise).resolves.toBe(FakeChild);
  });

  it('unwraps a `{ default }` module namespace resolved by the loader', async () => {
    // Mirrors a code-split `() => import('./Child.js')` whose default export is
    // the constructor.
    const map = fakeMap(false);
    const resolver = resolveWhenMapboxMapIsLoaded(() => Promise.resolve({ default: FakeChild }));

    const promise = resolver(map as any);
    map.fire('map-load');
    await expect(promise).resolves.toBe(FakeChild);
  });

  it('invokes the loader only AFTER map-load (lazy import timing)', async () => {
    const map = fakeMap(false);
    const loader = vi.fn(() => FakeChild);
    const resolver = resolveWhenMapboxMapIsLoaded(loader);

    resolver(map as any);
    // The loader (and its dynamic import, in real usage) must not run before the
    // map is ready.
    expect(loader).not.toHaveBeenCalled();

    map.fire('map-load');
    await Promise.resolve();
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

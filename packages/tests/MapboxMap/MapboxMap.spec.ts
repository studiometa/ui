import { describe, it, expect } from 'vitest';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { mount, recordEvents, settle } from '@studiometa/js-toolkit/test';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxMap } from '@studiometa/ui-mapbox';

registerComponents(MapboxMap);

/**
 * Mount a `MapboxMap` and hand back the component plus the `MockMap` its
 * `mounted()` hook built once `mapbox-gl` resolved.
 */
async function createMapboxMap(attrs = '', container = '<div data-ref="container"></div>') {
  const root = await mount(`
    <div
      data-component="MapboxMap"
      data-option-access-token="test-token"
      data-option-zoom="10"
      data-option-center="[2.35, 48.85]"
      ${attrs}>
      ${container}
    </div>
  `);
  const el = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
  const instance = getInstance<MapboxMap>(el, 'MapboxMap')!;

  return { root, el, instance, mockMap: instance.map as unknown as MockMap };
}

describe('MapboxMap component', () => {
  it('should mount and create a map instance', async () => {
    const { instance } = await createMapboxMap();

    expect(instance.map).toBeInstanceOf(MockMap);
  });

  it('should parse options from data attributes', async () => {
    const { instance } = await createMapboxMap();

    expect(instance.$options.accessToken).toBe('test-token');
    expect(instance.$options.zoom).toBe(10);
    expect(instance.$options.center).toEqual([2.35, 48.85]);
  });

  it('should default center to [0, 0]', async () => {
    const root = await mount(`
      <div data-component="MapboxMap" data-option-access-token="token">
        <div data-ref="container"></div>
      </div>
    `);
    const instance = getInstance<MapboxMap>(
      root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!,
      'MapboxMap',
    )!;

    expect(instance.$options.center).toEqual([0, 0]);
  });

  it('should set isLoaded after load event', async () => {
    const { instance, mockMap } = await createMapboxMap();

    expect(instance.isLoaded).toBe(false);
    mockMap.fire('load');
    await settle();
    expect(instance.isLoaded).toBe(true);
  });

  it('should emit map-load event on load', async () => {
    const { instance, mockMap } = await createMapboxMap();
    const log = recordEvents(instance.$el, 'map-load');

    mockMap.fire('load');
    await settle();

    expect(log.events).toHaveLength(1);
    // v4 payloads are one named object: the map travels as `detail.map`.
    expect((log.events[0].detail as { map: unknown }).map).toBe(mockMap);
    log.stop();
  });

  it('should forward map events with a map- prefix', async () => {
    const { instance, mockMap } = await createMapboxMap();
    const log = recordEvents(instance.$el, 'map-click', 'map-zoom', 'map-drag', 'click');

    const clickEvent = { type: 'click' };
    mockMap.fire('click', clickEvent);
    mockMap.fire('zoom', { type: 'zoom' });
    mockMap.fire('drag', { type: 'drag' });
    await settle();

    // Every forwarded mapbox event carries the original under `detail.event`,
    // and none of them is re-emitted under its unprefixed name.
    expect(log.events.map((entry) => entry.type)).toEqual(['map-click', 'map-zoom', 'map-drag']);
    expect((log.events[0].detail as { event: unknown }).event).toEqual(clickEvent);
    log.stop();
  });

  it('should remove map on unmount', async () => {
    const { instance, mockMap } = await createMapboxMap();

    instance.$unmount();
    await settle();

    expect(mockMap.remove).toHaveBeenCalled();
  });

  it('should detach every forwarding listener from the map on unmount (H3)', async () => {
    const { instance, mockMap } = await createMapboxMap();

    // Forwarding listeners are registered for `load` and every forwarded event.
    expect((mockMap._listeners['click'] ?? []).length).toBeGreaterThan(0);
    expect((mockMap._listeners['load'] ?? []).length).toBeGreaterThan(0);

    instance.$unmount();
    await settle();

    // A retained reference to the removed map keeps no forwarding closures — and
    // therefore does not keep this component alive.
    expect(mockMap._listeners['click'] ?? []).toHaveLength(0);
    expect(mockMap._listeners['load'] ?? []).toHaveLength(0);
    expect(mockMap._listeners['moveend'] ?? []).toHaveLength(0);
  });

  it('should not construct a map on unmount when the map was never created', async () => {
    const { instance } = await createMapboxMap();

    // Simulate a teardown where the backing field was never populated (e.g.
    // `$unmount()` called before `mapbox-gl` resolved, or a second
    // `$unmount()`): the map instance does not exist at teardown time.
    instance.__map = undefined;
    const instanceCountBeforeUnmount = MockMap.instanceCount;

    instance.$unmount();
    await settle();

    // Teardown must be side-effect free: it must not build a brand-new map just
    // to remove it.
    expect(MockMap.instanceCount).toBe(instanceCountBeforeUnmount);
  });

  it('should forward mapOptions to the Map constructor', async () => {
    const style = {
      version: 8,
      sources: {},
      layers: [],
    };
    const { el, mockMap } = await createMapboxMap(
      `data-option-map-options='${JSON.stringify({ style, pitch: 45 })}'`,
    );

    expect(mockMap._options.style).toEqual(style);
    expect(mockMap._options.pitch).toBe(45);
    // The convenience options are kept and `container` stays explicit.
    expect(mockMap._options.zoom).toBe(10);
    expect(mockMap._options.container).toBe(el.querySelector('[data-ref="container"]'));
    // No framework option leaks into the Map constructor. v3 had to filter
    // `name`, `debug` and `log` out; v4 no longer defines them at all, so the
    // assertion now records that they are absent rather than filtered.
    expect(mockMap._options.name).toBeUndefined();
    expect(mockMap._options.debug).toBeUndefined();
    expect(mockMap._options.log).toBeUndefined();
  });

  it('should reuse the same map instance', async () => {
    const { instance } = await createMapboxMap();

    expect(instance.map).toBe(instance.map);
  });
});

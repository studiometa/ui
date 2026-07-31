import { describe, it, expect, vi } from 'vitest';
// Importing the mock first registers the `mapbox-gl` module mock before the
// package (and its real `mapbox-gl` dependency) is imported below.
import { MockMap } from './mock-mapbox-gl.js';
import { h } from '#test-utils';
import { StoreLocator, StoreLocatorItem } from '@studiometa/ui-mapbox';

/**
 * A minimal `StoreLocatorItem` stand-in used to exercise the coordinator's
 * registry, coalesced sync and derived data without mounting a real component.
 *
 * It exposes exactly the surface the coordinator touches: `id`, `lngLat`, an
 * `$el` (moved around by `__reorderList`) and the `setInBounds` / `setActive`
 * state setters (spied and reflected as data-attributes, mirroring the real
 * component so DOM assertions stay meaningful).
 */
function fakeItem(id: string, lngLat: [number, number]) {
  const el = h('li', { 'data-component': 'StoreLocatorItem' }) as HTMLElement;
  return {
    id,
    lngLat,
    $el: el,
    setInBounds: vi.fn((value: boolean) => el.toggleAttribute('data-in-bounds', value)),
    setActive: vi.fn((value: boolean) => {
      el.toggleAttribute('data-active', value);
      if (value) {
        el.setAttribute('aria-current', 'true');
      } else {
        el.removeAttribute('aria-current');
      }
    }),
  };
}

/**
 * Build a `StoreLocator` with a sidebar list of `StoreLocatorItem`s and a mocked
 * map plumbing.
 *
 * Like the other `@studiometa/ui-mapbox` child specs (which mock the parent
 * `MapboxMap` rather than mounting a real one), the map, cluster and geocoder and
 * their `map-load` / `feature-click` / `result` events are injected through the
 * `mapboxMap`, `cluster` and `geocoder` getters. This keeps the test deterministic
 * and free of the real `mapbox-gl` (which throws in a headless WebGL-less
 * environment).
 *
 * The child `$on` doubles return real unsubscribe callbacks, so the coordinator's
 * `destroyed()` teardown can be exercised: after destroy, firing an event finds no
 * handler left.
 */
function createStoreLocator(
  items: Array<{ id: string; lngLat: [number, number] }>,
  options: {
    attrs?: Record<string, string>;
    geocoder?: boolean;
    // Simulate a geocoder that mounts *after* the cluster: the `geocoder` getter
    // returns `undefined` for the first N reads (attempts), then the mock. Lets a
    // test drive the cluster-before-geocoder wiring race.
    geocoderReadyAfter?: number;
  } = {},
) {
  const listItems = items.map((item) =>
    h('li', { 'data-component': 'StoreLocatorItem', 'data-option-id': item.id }, [
      h('button', { 'data-ref': 'select' }, [item.id]),
    ]),
  );
  listItems.forEach((el, index) => {
    el.setAttribute('data-option-lng-lat', JSON.stringify(items[index].lngLat));
  });

  const root = h('div', { 'data-component': 'StoreLocator', ...(options.attrs ?? {}) }, [
    h('ul', { 'data-ref': 'list' }, listItems),
  ]);
  const instance = new StoreLocator(root);

  const mockMap = new MockMap();
  const mapLoadHandlers: Array<() => void> = [];
  const clusterHandlers: Record<string, Array<(event: unknown) => void>> = {};
  const geocoderHandlers: Record<string, Array<(event: unknown) => void>> = {};

  function off(bucket: Array<(event: unknown) => void>, callback: (event: unknown) => void) {
    return () => {
      const index = bucket.indexOf(callback);
      if (index > -1) bucket.splice(index, 1);
    };
  }

  const mockMapbox = {
    isLoaded: false,
    map: mockMap,
    $on(event: string, callback: () => void) {
      if (event === 'map-load') {
        mapLoadHandlers.push(callback);
        return off(mapLoadHandlers as any, callback as any);
      }
      return () => {};
    },
  };
  const mockCluster = {
    // The coordinator only wires and feeds the cluster once it is fully mounted
    // (its GeoJSON source is added from `mounted()`), so the mock advertises it.
    $isMounted: true,
    setData: vi.fn(),
    $on(event: string, callback: (event: unknown) => void) {
      (clusterHandlers[event] ??= []).push(callback);
      return off(clusterHandlers[event], callback);
    },
  };
  const mockGeocoder =
    options.geocoder || options.geocoderReadyAfter !== undefined
      ? {
          $on(event: string, callback: (event: unknown) => void) {
            (geocoderHandlers[event] ??= []).push(callback);
            return off(geocoderHandlers[event], callback);
          },
        }
      : undefined;

  // When `geocoderReadyAfter` is set, the geocoder is not queryable yet: return
  // `undefined` for the first N reads (mimicking an async mount that lands after
  // the cluster's), then hand out the mock.
  let geocoderReads = 0;
  function geocoderGetter() {
    if (options.geocoderReadyAfter !== undefined && geocoderReads++ < options.geocoderReadyAfter) {
      return undefined;
    }
    return mockGeocoder;
  }

  Object.defineProperty(instance, 'mapboxMap', { get: () => mockMapbox, configurable: true });
  Object.defineProperty(instance, 'cluster', { get: () => mockCluster, configurable: true });
  Object.defineProperty(instance, 'geocoder', { get: geocoderGetter, configurable: true });

  return {
    instance,
    mockMap: mockMap as unknown as MockMap,
    mockCluster,
    items: () => instance.$query<StoreLocatorItem>('StoreLocatorItem'),
    item: (id: string) =>
      instance.$query<StoreLocatorItem>('StoreLocatorItem').find((entry) => entry.id === id)!,
    fireLoad() {
      mapLoadHandlers.forEach((callback) => callback());
    },
    fireMoveEnd() {
      mockMap.fire('moveend');
    },
    fireFeatureClick(feature: unknown) {
      (clusterHandlers['feature-click'] ?? []).forEach((callback) =>
        callback({ detail: [feature, {}] }),
      );
    },
    fireGeocoderResult(result: unknown) {
      (geocoderHandlers['result'] ?? []).forEach((callback) => callback({ detail: [result] }));
    },
  };
}

/**
 * Mount the component, let the js-toolkit timer-based mount settle, then simulate
 * the map load so the coordinator wires itself. Leaves real timers active.
 */
async function mountAndLoad(ctx: ReturnType<typeof createStoreLocator>) {
  vi.useFakeTimers();
  ctx.instance.$mount();
  await vi.advanceTimersByTimeAsync(100);
  ctx.fireLoad();
  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();
}

/**
 * Configure the mock viewport so only the given longitudes are considered inside
 * bounds, letting a test drive the in-bounds axis independently of the map data.
 */
function boundsContainingLng(ctx: ReturnType<typeof createStoreLocator>, lngs: number[]) {
  ctx.mockMap.getBounds = vi.fn(() => ({
    contains: (lngLat: [number, number]) => lngs.includes(lngLat[0]),
  })) as any;
}

/**
 * Read the current DOM order of item ids inside the `list` ref.
 */
function listOrder(ctx: ReturnType<typeof createStoreLocator>): string[] {
  const list = (ctx.instance as any).$refs.list as HTMLElement;
  return [...list.children]
    .map((child) => child.getAttribute('data-option-id'))
    .filter((id): id is string => id !== null);
}

describe('StoreLocator component', () => {
  // --- 1. Registry & derived data ------------------------------------------
  describe('registry & derived FeatureCollection', () => {
    it('derives one feature per registered item with id + [lng,lat] coordinates', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      expect(ctx.items()).toHaveLength(2);

      const { features } = ctx.instance.featureCollection;
      expect(features).toHaveLength(2);
      expect(features[0]).toMatchObject({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [1, 1] },
        properties: { id: 'a' },
      });
      expect(features.map((feature) => feature.properties.id)).toEqual(['a', 'b']);
    });

    it('removes a feature when an item is unregistered', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      ctx.instance.unregisterItem(ctx.item('a'));

      expect(ctx.instance.featureCollection.features.map((f) => f.properties.id)).toEqual(['b']);
    });

    it('treats a duplicate register of the same item as a no-op', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      const itemA = ctx.item('a');
      ctx.instance.registerItem(itemA);
      ctx.instance.registerItem(itemA);

      expect(ctx.instance.featureCollection.features).toHaveLength(1);
    });

    it('pushes the derived data to the cluster once the item set is registered and loaded', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      expect(ctx.mockCluster.setData).toHaveBeenCalled();
      const lastCall = ctx.mockCluster.setData.mock.calls.at(-1)?.[0] as { features: unknown[] };
      expect(lastCall.features).toHaveLength(1);
    });
  });

  // --- 2. Debounced / coalesced sync (the Fetch-swap case) -----------------
  describe('coalesced item-set sync', () => {
    it('calls cluster.setData ONCE for a batch registered across the same tick', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      ctx.mockCluster.setData.mockClear();

      vi.useFakeTimers();
      // Simulate a Fetch swapping the list: a whole batch registers in one tick.
      const batch = [
        fakeItem('x', [3, 3]),
        fakeItem('y', [4, 4]),
        fakeItem('z', [5, 5]),
      ];
      batch.forEach((item) => ctx.instance.registerItem(item as unknown as StoreLocatorItem));
      // Nothing has flushed yet: the sync is debounced.
      expect(ctx.mockCluster.setData).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);
      vi.useRealTimers();

      expect(ctx.mockCluster.setData).toHaveBeenCalledTimes(1);
      const data = ctx.mockCluster.setData.mock.calls[0][0] as { features: Array<{ properties: { id: string } }> };
      expect(data.features.map((f) => f.properties.id)).toEqual(['a', 'x', 'y', 'z']);
    });

    it('ends a swap (unregister old + register new) with the new set on the map', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      ctx.mockCluster.setData.mockClear();

      vi.useFakeTimers();
      // Swap: drop the two mounted items and register a fresh batch in one tick.
      ctx.instance.unregisterItem(ctx.item('a'));
      ctx.instance.unregisterItem(ctx.item('b'));
      const fresh = [fakeItem('c', [7, 7]), fakeItem('d', [8, 8])];
      fresh.forEach((item) => ctx.instance.registerItem(item as unknown as StoreLocatorItem));

      await vi.advanceTimersByTimeAsync(100);
      vi.useRealTimers();

      expect(ctx.mockCluster.setData).toHaveBeenCalledTimes(1);
      const data = ctx.mockCluster.setData.mock.calls[0][0] as { features: Array<{ properties: { id: string } }> };
      expect(data.features.map((f) => f.properties.id)).toEqual(['c', 'd']);
    });
  });

  // --- 3. Two-axis independence (registered vs in-bounds) ------------------
  describe('two-axis independence: in-bounds filtering never rebuilds map data', () => {
    it('reflects data-in-bounds only for in-view items and emits filter with them', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
        { id: 'c', lngLat: [3, 3] },
      ]);
      await mountAndLoad(ctx);

      // Only `a` and `c` fall inside the viewport.
      boundsContainingLng(ctx, [1, 3]);

      const filter = vi.fn();
      ctx.instance.$on('filter', filter);

      ctx.fireMoveEnd();

      expect(ctx.item('a').$el.hasAttribute('data-in-bounds')).toBe(true);
      expect(ctx.item('b').$el.hasAttribute('data-in-bounds')).toBe(false);
      expect(ctx.item('c').$el.hasAttribute('data-in-bounds')).toBe(true);

      expect(filter).toHaveBeenCalledTimes(1);
      const inView = filter.mock.calls[0][0].detail[0] as StoreLocatorItem[];
      expect(inView.map((entry) => entry.id).sort()).toEqual(['a', 'c']);
    });

    it('does NOT call cluster.setData on a moveend (pan must not rebuild map data)', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      boundsContainingLng(ctx, [1]);

      const before = ctx.mockCluster.setData.mock.calls.length;
      ctx.fireMoveEnd();
      ctx.fireMoveEnd();
      const after = ctx.mockCluster.setData.mock.calls.length;

      // The critical correctness guarantee: panning recomputes the in-view list
      // but never pushes data to the source again.
      expect(after).toBe(before);
    });
  });

  // --- 4. Distance sort ----------------------------------------------------
  describe('distance sort', () => {
    it('orders the filter payload and the list DOM ascending by distance to center (sort ON)', async () => {
      // Center is MockLngLat(0,0); planar distances: b(1,1) < c(2,2) < a(3,3).
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [3, 3] },
        { id: 'b', lngLat: [1, 1] },
        { id: 'c', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      const filter = vi.fn();
      ctx.instance.$on('filter', filter);

      ctx.fireMoveEnd();

      const inView = filter.mock.calls[0][0].detail[0] as StoreLocatorItem[];
      expect(inView.map((entry) => entry.id)).toEqual(['b', 'c', 'a']);
      expect(listOrder(ctx)).toEqual(['b', 'c', 'a']);
    });

    it('preserves registration/DOM order when data-option-no-sort is set', async () => {
      const ctx = createStoreLocator(
        [
          { id: 'a', lngLat: [3, 3] },
          { id: 'b', lngLat: [1, 1] },
          { id: 'c', lngLat: [2, 2] },
        ],
        { attrs: { 'data-option-no-sort': '' } },
      );
      await mountAndLoad(ctx);

      const filter = vi.fn();
      ctx.instance.$on('filter', filter);

      ctx.fireMoveEnd();

      const inView = filter.mock.calls[0][0].detail[0] as StoreLocatorItem[];
      expect(inView.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
      expect(listOrder(ctx)).toEqual(['a', 'b', 'c']);
    });
  });

  // --- 5. Selection --------------------------------------------------------
  describe('selection', () => {
    it('flies to the item, marks it active/aria-current and emits select', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [3, 4] }]);
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      const itemA = ctx.item('a');
      ctx.instance.selectItem(itemA);

      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [3, 4], zoom: 14 });
      expect(itemA.$el.hasAttribute('data-active')).toBe(true);
      expect(itemA.$el.getAttribute('aria-current')).toBe('true');
      expect(select).toHaveBeenCalledTimes(1);
      expect(select.mock.calls[0][0].detail[0]).toBe(itemA);
    });

    it('honors a custom data-option-item-zoom-level on fly-to', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [3, 4] }], {
        attrs: { 'data-option-item-zoom-level': '17' },
      });
      await mountAndLoad(ctx);

      ctx.instance.selectItem(ctx.item('a'));
      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [3, 4], zoom: 17 });
    });

    it('deactivates the previously selected item when a second is selected', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      const itemA = ctx.item('a');
      const itemB = ctx.item('b');
      ctx.instance.selectItem(itemA);
      ctx.instance.selectItem(itemB);

      expect(itemA.$el.hasAttribute('data-active')).toBe(false);
      expect(itemA.$el.hasAttribute('aria-current')).toBe(false);
      expect(itemB.$el.hasAttribute('data-active')).toBe(true);
      expect(itemB.$el.getAttribute('aria-current')).toBe('true');
    });

    it('clears the active state and emits deselect on deselect()', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      const deselect = vi.fn();
      ctx.instance.$on('deselect', deselect);

      const itemA = ctx.item('a');
      ctx.instance.selectItem(itemA);
      ctx.instance.deselect();

      expect(itemA.$el.hasAttribute('data-active')).toBe(false);
      expect(itemA.$el.hasAttribute('aria-current')).toBe(false);
      expect(deselect).toHaveBeenCalledTimes(1);
      expect((ctx.instance as any).__selected).toBeUndefined();
    });

    it('clears the internal selection when the selected item is unregistered', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      const itemA = ctx.item('a');
      ctx.instance.selectItem(itemA);
      expect((ctx.instance as any).__selected).toBe(itemA);

      ctx.instance.unregisterItem(itemA);
      expect((ctx.instance as any).__selected).toBeUndefined();
    });
  });

  // --- 6. Cluster feature-click -> select by id ----------------------------
  describe('cluster feature-click -> select by id', () => {
    it('selects the item whose feature id matches a string id', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      ctx.fireFeatureClick({ properties: { id: 'b' } });

      const itemB = ctx.item('b');
      expect(itemB.$el.hasAttribute('data-active')).toBe(true);
      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [2, 2], zoom: 14 });
      expect(select.mock.calls.at(-1)?.[0].detail[0]).toBe(itemB);
    });

    it('coerces a numeric feature id with String() before matching', async () => {
      const ctx = createStoreLocator([{ id: '42', lngLat: [9, 9] }]);
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      // Numeric id must still match the string id '42' via String(id).
      ctx.fireFeatureClick({ properties: { id: 42 } });

      expect(ctx.item('42').$el.hasAttribute('data-active')).toBe(true);
      expect(select).toHaveBeenCalledTimes(1);
    });

    it('does nothing (no select, no throw) for an unknown feature id', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      expect(() => ctx.fireFeatureClick({ properties: { id: 'nope' } })).not.toThrow();
      expect(select).not.toHaveBeenCalled();
    });

    it('does nothing when the feature or its id is missing', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      expect(() => ctx.fireFeatureClick(undefined)).not.toThrow();
      expect(() => ctx.fireFeatureClick({ properties: {} })).not.toThrow();
      expect(() => ctx.fireFeatureClick({})).not.toThrow();
      expect(select).not.toHaveBeenCalled();
    });
  });

  // --- 6b. Deferred cluster wiring (async mount timing) --------------------
  describe('deferred cluster wiring', () => {
    it('does not wire the cluster until it is mounted, then wires it', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      // The MapboxCluster is an async child of the map: it is queryable before
      // its `mounted()` hook adds the GeoJSON source. Simulate that window.
      ctx.mockCluster.$isMounted = false;
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      // Not wired yet: a feature-click is ignored because pushing/wiring before
      // the source exists would silently no-op.
      expect((ctx.instance as any).__clusterWired).toBe(false);
      ctx.fireFeatureClick({ properties: { id: 'b' } });
      expect(select).not.toHaveBeenCalled();

      // The cluster finishes mounting (source now added): wiring can proceed.
      ctx.mockCluster.$isMounted = true;
      (ctx.instance as any).__wireChildren();

      expect((ctx.instance as any).__clusterWired).toBe(true);
      ctx.fireFeatureClick({ properties: { id: 'b' } });
      expect(select).toHaveBeenCalledTimes(1);
      expect(ctx.mockCluster.setData).toHaveBeenCalled();
    });

    it('keeps polling for the geocoder even after the cluster is wired first', async () => {
      // The cluster is mounted and queryable immediately, but the geocoder only
      // becomes queryable a couple of ticks later. The coordinator must poll
      // until BOTH children are wired — stopping as soon as the cluster is wired
      // would leave the geocoder's `result` listener unattached.
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }], { geocoderReadyAfter: 2 });
      await mountAndLoad(ctx);

      // The cluster wired on the first attempt...
      expect((ctx.instance as any).__clusterWired).toBe(true);
      // ...and the poll continued until the late geocoder was wired too.
      expect((ctx.instance as any).__geocoderWired).toBe(true);

      // Proof the geocoder listener is live: a result frames the map.
      ctx.mockMap.fitBounds.mockClear();
      ctx.fireGeocoderResult({ bbox: [10, 20, 30, 40] });
      expect(ctx.mockMap.fitBounds).toHaveBeenCalledWith([
        [10, 20],
        [30, 40],
      ]);
    });
  });

  // --- 7. Geocoder result --------------------------------------------------
  describe('geocoder result', () => {
    it('fits the map to the bbox when the result has one', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }], { geocoder: true });
      await mountAndLoad(ctx);

      ctx.mockMap.fitBounds.mockClear();
      ctx.fireGeocoderResult({ bbox: [10, 20, 30, 40] });

      expect(ctx.mockMap.fitBounds).toHaveBeenCalledWith([
        [10, 20],
        [30, 40],
      ]);
    });

    it('flies to the center when the result has no bbox', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }], { geocoder: true });
      await mountAndLoad(ctx);

      ctx.mockMap.flyTo.mockClear();
      ctx.fireGeocoderResult({ center: [5, 6] });

      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [5, 6] });
    });

    it('does nothing and does not throw on a missing/empty result', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }], { geocoder: true });
      await mountAndLoad(ctx);

      ctx.mockMap.fitBounds.mockClear();
      ctx.mockMap.flyTo.mockClear();

      expect(() => ctx.fireGeocoderResult(undefined)).not.toThrow();
      expect(() => ctx.fireGeocoderResult(null)).not.toThrow();
      expect(() => ctx.fireGeocoderResult({})).not.toThrow();
      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
      expect(ctx.mockMap.flyTo).not.toHaveBeenCalled();
    });
  });

  // --- 8. fitOnUpdate ------------------------------------------------------
  describe('fitOnUpdate', () => {
    it('fits the map to the item extent on an item-set change when enabled', async () => {
      const ctx = createStoreLocator(
        [
          { id: 'a', lngLat: [1, 2] },
          { id: 'b', lngLat: [3, 4] },
          { id: 'c', lngLat: [5, 0] },
        ],
        { attrs: { 'data-option-fit-on-update': '' } },
      );
      await mountAndLoad(ctx);

      expect(ctx.mockMap.fitBounds).toHaveBeenCalledWith(
        [
          [1, 0],
          [5, 4],
        ],
        { padding: 40 },
      );
    });

    it('does not fit the map on an item-set change when disabled', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 2] },
        { id: 'b', lngLat: [3, 4] },
      ]);
      await mountAndLoad(ctx);

      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
    });
  });

  // --- 9. Lifecycle --------------------------------------------------------
  describe('lifecycle teardown', () => {
    it('detaches listeners and clears the registry on destroy', async () => {
      const ctx = createStoreLocator(
        [
          { id: 'a', lngLat: [1, 1] },
          { id: 'b', lngLat: [2, 2] },
        ],
        { geocoder: true },
      );
      await mountAndLoad(ctx);

      const filter = vi.fn();
      const select = vi.fn();
      ctx.instance.$on('filter', filter);
      ctx.instance.$on('select', select);

      vi.useFakeTimers();
      ctx.instance.$destroy();
      await vi.advanceTimersByTimeAsync(100);
      vi.useRealTimers();

      // Registry cleared.
      expect((ctx.instance as any).__items).toEqual([]);
      expect((ctx.instance as any).__selected).toBeUndefined();
      expect(ctx.instance.isLoaded).toBe(false);

      // Detached listeners: subsequent events are inert.
      ctx.fireMoveEnd();
      ctx.fireFeatureClick({ properties: { id: 'a' } });
      ctx.mockMap.fitBounds.mockClear();
      ctx.mockMap.flyTo.mockClear();
      ctx.fireGeocoderResult({ center: [1, 1] });

      expect(filter).not.toHaveBeenCalled();
      expect(select).not.toHaveBeenCalled();
      expect(ctx.mockMap.flyTo).not.toHaveBeenCalled();
      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
    });
  });
});

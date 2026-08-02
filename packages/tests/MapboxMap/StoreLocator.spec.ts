import { describe, it, expect, vi } from 'vitest';
// Importing the mock first registers the `mapbox-gl` module mock before the
// package (and its real `mapbox-gl` dependency) is imported below.
import { MockMap } from './mock-mapbox-gl.js';
import { h } from '#test-utils';
import { StoreLocator } from '@studiometa/ui-mapbox';
import type { MapboxClusterItem } from '@studiometa/ui-mapbox';

/**
 * A minimal `MapboxClusterItem` stand-in exposing exactly the surface the
 * orchestrator touches: `id`, `lngLat`, an `$el` (moved around by the reorder
 * and matched by delegated clicks), `popupContent`, and the `setInBounds` /
 * `setActive` state setters (spied and reflected as data-attributes, mirroring
 * the real component so DOM assertions stay meaningful).
 */
function fakeItem(el: HTMLElement, id: string, lngLat: [number, number]) {
  return {
    id,
    lngLat,
    $el: el,
    popupContent: `<p>${id}</p>`,
    setInBounds: vi.fn((value: boolean) => el.toggleAttribute('data-in-bounds', value)),
    setActive: vi.fn((value: boolean) => {
      el.toggleAttribute('data-active', value);
      if (value) {
        el.setAttribute('aria-current', 'true');
      } else {
        el.removeAttribute('aria-current');
      }
    }),
  } as unknown as MapboxClusterItem;
}

/**
 * Build a `StoreLocator` with a sidebar list, a mocked `MapboxMap`, and a mocked
 * `MapboxCluster` (owner of the item registry) plus an optional `MapboxGeocoder`.
 *
 * Like the other `@studiometa/ui-mapbox` child specs, the map/cluster/geocoder
 * and their `map-load` / `item-click` / `update` / `result` events are injected
 * through the `mapboxMap`, `cluster` and `geocoder` getters, keeping the test
 * deterministic and free of the real `mapbox-gl`.
 */
function createStoreLocator(
  items: Array<{ id: string; lngLat: [number, number] }>,
  options: {
    attrs?: Record<string, string>;
    geocoder?: boolean;
    clusterMounted?: boolean;
  } = {},
) {
  const listItems = items.map((item) =>
    h('li', { 'data-component': 'MapboxClusterItem', 'data-option-id': item.id }, [
      h('button', { type: 'button' }, [item.id]),
    ]),
  );

  const list = h('ul', { 'data-ref': 'list' }, listItems);
  const root = h('div', { 'data-component': 'StoreLocator', ...(options.attrs ?? {}) }, [list]);
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

  const clusterItems = items.map((item, index) => fakeItem(listItems[index], item.id, item.lngLat));

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
    $isMounted: options.clusterMounted ?? true,
    items: clusterItems,
    $on(event: string, callback: (event: unknown) => void) {
      (clusterHandlers[event] ??= []).push(callback);
      return off(clusterHandlers[event], callback);
    },
  };
  const mockGeocoder = options.geocoder
    ? {
        $on(event: string, callback: (event: unknown) => void) {
          (geocoderHandlers[event] ??= []).push(callback);
          return off(geocoderHandlers[event], callback);
        },
      }
    : undefined;

  Object.defineProperty(instance, 'mapboxMap', { get: () => mockMapbox, configurable: true });
  Object.defineProperty(instance, 'cluster', { get: () => mockCluster, configurable: true });
  Object.defineProperty(instance, 'geocoder', { get: () => mockGeocoder, configurable: true });

  return {
    instance,
    list,
    mockMap: mockMap as unknown as MockMap,
    mockCluster,
    clusterItems,
    item: (id: string) => clusterItems.find((entry) => entry.id === id)!,
    fireLoad() {
      mapLoadHandlers.forEach((callback) => callback());
    },
    fireMoveEnd() {
      mockMap.fire('moveend');
    },
    fireItemClick(item: unknown) {
      (clusterHandlers['item-click'] ?? []).forEach((callback) =>
        callback({ detail: [item, {}, {}] }),
      );
    },
    fireUpdate() {
      (clusterHandlers['update'] ?? []).forEach((callback) =>
        callback({ detail: [mockCluster.items] }),
      );
    },
    fireGeocoderResult(result: unknown) {
      (geocoderHandlers['result'] ?? []).forEach((callback) => callback({ detail: [result] }));
    },
  };
}

/**
 * Mount the component, let the js-toolkit timer-based mount settle, then simulate
 * the map load so the orchestrator wires itself. Leaves real timers active.
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
  return [...ctx.list.children]
    .map((child) => child.getAttribute('data-option-id'))
    .filter((id): id is string => id !== null);
}

describe('StoreLocator orchestrator', () => {
  // --- 1. Selection --------------------------------------------------------
  describe('selection', () => {
    it('flies to the item, marks it active/aria-current, opens a popup and emits select', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [3, 4] }]);
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      const itemA = ctx.item('a');
      ctx.instance.selectItem(itemA);

      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [3, 4], zoom: 14 });
      expect(itemA.$el.hasAttribute('data-active')).toBe(true);
      expect(itemA.$el.getAttribute('aria-current')).toBe('true');
      // The popup was opened from the item's popup content.
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

    it('selects on a delegated sidebar click, resolving the clicked item element', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      // Click the inner button of item `b`: the delegated handler resolves the
      // closest MapboxClusterItem element and selects its instance.
      const button = ctx.item('b').$el.querySelector('button')!;
      button.dispatchEvent(new Event('click', { bubbles: true }));

      expect(ctx.item('b').$el.hasAttribute('data-active')).toBe(true);
      expect(select.mock.calls.at(-1)?.[0].detail[0]).toBe(ctx.item('b'));
    });
  });

  // --- 2. Cluster item-click -> select -------------------------------------
  describe('cluster item-click -> select', () => {
    it('selects the item reported by the cluster', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      ctx.fireItemClick(ctx.item('b'));

      expect(ctx.item('b').$el.hasAttribute('data-active')).toBe(true);
      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [2, 2], zoom: 14 });
      expect(select.mock.calls.at(-1)?.[0].detail[0]).toBe(ctx.item('b'));
    });

    it('does nothing (no select, no throw) when the cluster reports no item', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      expect(() => ctx.fireItemClick(undefined)).not.toThrow();
      expect(select).not.toHaveBeenCalled();
    });
  });

  // --- 3. Viewport filtering (in-bounds + sort + filter) -------------------
  describe('viewport filtering on moveend', () => {
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

      expect(filter).toHaveBeenCalled();
      const inView = filter.mock.calls.at(-1)?.[0].detail[0] as MapboxClusterItem[];
      expect(inView.map((entry) => entry.id).sort()).toEqual(['a', 'c']);
    });

    it('does not fit the map on a moveend (pan must not re-frame)', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      await mountAndLoad(ctx);

      ctx.mockMap.fitBounds.mockClear();
      ctx.fireMoveEnd();
      ctx.fireMoveEnd();

      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
    });

    it('orders the filter payload and the list DOM ascending by distance (sort ON)', async () => {
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

      const inView = filter.mock.calls.at(-1)?.[0].detail[0] as MapboxClusterItem[];
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

      const inView = filter.mock.calls.at(-1)?.[0].detail[0] as MapboxClusterItem[];
      expect(inView.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
      expect(listOrder(ctx)).toEqual(['a', 'b', 'c']);
    });
  });

  // --- 4. Geocoder result --------------------------------------------------
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
      expect(() => ctx.fireGeocoderResult({})).not.toThrow();
      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
      expect(ctx.mockMap.flyTo).not.toHaveBeenCalled();
    });
  });

  // --- 5. fitOnUpdate ------------------------------------------------------
  describe('fitOnUpdate', () => {
    it('fits the map to the item extent on the cluster update when enabled', async () => {
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

    it('does not fit the map when disabled', async () => {
      const ctx = createStoreLocator([
        { id: 'a', lngLat: [1, 2] },
        { id: 'b', lngLat: [3, 4] },
      ]);
      await mountAndLoad(ctx);

      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
    });
  });

  // --- 6. Fetch-swap: list + map update together ---------------------------
  describe('Fetch-swap of the item set', () => {
    it('re-fits and re-filters against the new cluster item set on update', async () => {
      const ctx = createStoreLocator(
        [
          { id: 'a', lngLat: [1, 1] },
          { id: 'b', lngLat: [2, 2] },
        ],
        { attrs: { 'data-option-fit-on-update': '' } },
      );
      await mountAndLoad(ctx);

      // A Fetch swap: the cluster (owner of the registry) now holds a fresh set.
      const freshEls = [
        h('li', { 'data-component': 'MapboxClusterItem', 'data-option-id': 'c' }),
        h('li', { 'data-component': 'MapboxClusterItem', 'data-option-id': 'd' }),
      ];
      freshEls.forEach((el) => ctx.list.append(el));
      ctx.mockCluster.items = [
        fakeItem(freshEls[0], 'c', [7, 7]),
        fakeItem(freshEls[1], 'd', [8, 8]),
      ] as any;

      boundsContainingLng(ctx, [7, 8]);
      const filter = vi.fn();
      ctx.instance.$on('filter', filter);
      ctx.mockMap.fitBounds.mockClear();

      // The cluster announces the item-set change; the orchestrator re-fits and
      // re-filters — list and map move together.
      ctx.fireUpdate();

      expect(ctx.mockMap.fitBounds).toHaveBeenCalledWith(
        [
          [7, 7],
          [8, 8],
        ],
        { padding: 40 },
      );
      const inView = filter.mock.calls.at(-1)?.[0].detail[0] as MapboxClusterItem[];
      expect(inView.map((entry) => entry.id).sort()).toEqual(['c', 'd']);
    });

    it('drops a stale selection whose item is no longer registered', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      ctx.instance.selectItem(ctx.item('a'));
      expect((ctx.instance as any).__selected).toBe(ctx.item('a'));

      // The selected item leaves the registry (Fetch swap).
      ctx.mockCluster.items = [] as any;
      ctx.fireUpdate();

      expect((ctx.instance as any).__selected).toBeUndefined();
    });

    it('runs the full deselect cleanup when the selected item is dropped by a swap (D2)', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      const deselect = vi.fn();
      ctx.instance.$on('deselect', deselect);

      ctx.instance.selectItem(ctx.item('a'));
      const popup = (ctx.instance as any).__popup;
      expect(popup).toBeDefined();

      // The selected store leaves the registry: the popup must be removed and
      // `deselect` emitted, not just `__selected` cleared.
      ctx.mockCluster.items = [] as any;
      ctx.fireUpdate();

      expect((ctx.instance as any).__selected).toBeUndefined();
      expect(popup.remove).toHaveBeenCalled();
      expect(deselect).toHaveBeenCalledTimes(1);
    });

    it('re-wires onto a replacement cluster announced via MAPBOX_CLUSTER_CONNECTED (D1)', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      // Build a replacement cluster inside the locator with its own item set and
      // its own listener registry.
      const clusterEl = h('div', { 'data-component': 'MapboxCluster' });
      ctx.instance.$el.append(clusterEl);
      const newHandlers: Record<string, Array<(event: unknown) => void>> = {};
      const itemEl = h('li', { 'data-component': 'MapboxClusterItem', 'data-option-id': 'z' });
      const newItem = fakeItem(itemEl, 'z', [9, 9]);
      const newCluster = {
        $isMounted: true,
        $el: clusterEl,
        items: [newItem],
        $on(event: string, callback: (event: unknown) => void) {
          (newHandlers[event] ??= []).push(callback);
          return () => {};
        },
      };
      // The orchestrator now resolves the replacement cluster.
      Object.defineProperty(ctx.instance, 'cluster', { get: () => newCluster, configurable: true });

      const select = vi.fn();
      ctx.instance.$on('select', select);

      document.dispatchEvent(new CustomEvent('mapbox-cluster:connected', { detail: newCluster }));

      // The stale wiring was dropped and the new cluster wired: an item-click
      // through the REPLACEMENT cluster selects its item.
      expect((ctx.instance as any).__cluster).toBe(newCluster);
      (newHandlers['item-click'] ?? []).forEach((callback) =>
        callback({ detail: [newItem, {}, {}] }),
      );
      expect(select).toHaveBeenCalledTimes(1);
      expect(select.mock.calls[0][0].detail[0]).toBe(newItem);
    });
  });

  // --- 7. Deferred cluster wiring (async mount timing) ---------------------
  describe('deferred cluster wiring', () => {
    it('does not wire the cluster until it is mounted, then wires it', async () => {
      const ctx = createStoreLocator(
        [
          { id: 'a', lngLat: [1, 1] },
          { id: 'b', lngLat: [2, 2] },
        ],
        { clusterMounted: false },
      );
      await mountAndLoad(ctx);

      const select = vi.fn();
      ctx.instance.$on('select', select);

      // Not wired yet: an item-click is ignored because the listener is not
      // attached until the cluster's source is ready.
      expect((ctx.instance as any).__clusterWired).toBe(false);
      ctx.fireItemClick(ctx.item('b'));
      expect(select).not.toHaveBeenCalled();

      // The cluster finishes mounting: wiring can proceed.
      ctx.mockCluster.$isMounted = true;
      (ctx.instance as any).__wireChildren();

      expect((ctx.instance as any).__clusterWired).toBe(true);
      ctx.fireItemClick(ctx.item('b'));
      expect(select).toHaveBeenCalledTimes(1);
    });
  });

  // --- 8. Lifecycle teardown (dynamic-DOM safety) --------------------------
  describe('lifecycle teardown', () => {
    it('detaches listeners and clears state on destroy', async () => {
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

      expect((ctx.instance as any).__selected).toBeUndefined();
      expect((ctx.instance as any).__map).toBeUndefined();
      expect(ctx.instance.isLoaded).toBe(false);

      // Detached listeners: subsequent events are inert.
      ctx.fireMoveEnd();
      ctx.fireItemClick(ctx.item('a'));
      ctx.mockMap.fitBounds.mockClear();
      ctx.mockMap.flyTo.mockClear();
      ctx.fireGeocoderResult({ center: [1, 1] });

      expect(filter).not.toHaveBeenCalled();
      expect(select).not.toHaveBeenCalled();
      expect(ctx.mockMap.flyTo).not.toHaveBeenCalled();
      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
    });

    it('drops the cached map on its remove event and never calls into the dead map (D3)', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      expect((ctx.instance as any).__map).toBe(ctx.mockMap);

      // The nested map is removed out from under the still-mounted orchestrator.
      ctx.mockMap.remove();

      expect((ctx.instance as any).__map).toBeUndefined();
      expect(ctx.instance.isLoaded).toBe(false);

      // A later selection, viewport recompute or geocoder result must not call
      // into the removed map.
      ctx.mockMap.flyTo.mockClear();
      ctx.mockMap.fitBounds.mockClear();
      ctx.instance.selectItem(ctx.item('a'));
      ctx.fireMoveEnd();

      expect(ctx.mockMap.flyTo).not.toHaveBeenCalled();
      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
    });

    it('tears down without throwing after the map was removed', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      // The map is removed out from under the orchestrator.
      ctx.mockMap.remove();

      vi.useFakeTimers();
      expect(() => {
        ctx.instance.$destroy();
      }).not.toThrow();
      await vi.advanceTimersByTimeAsync(100);
      vi.useRealTimers();
    });

    it('does not throw when destroyed after being detached from the DOM', async () => {
      const ctx = createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      await mountAndLoad(ctx);

      // Detach the root before teardown (e.g. a facet swap replacing the whole
      // locator): teardown relies on cached refs, not a fresh `$query`.
      ctx.instance.$el.remove();

      vi.useFakeTimers();
      expect(() => {
        ctx.instance.$destroy();
      }).not.toThrow();
      await vi.advanceTimersByTimeAsync(100);
      vi.useRealTimers();
    });
  });
});

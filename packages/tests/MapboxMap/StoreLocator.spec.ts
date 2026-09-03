import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// `mapDouble` comes from the harness, which is also what loads the `mapbox-gl`
// mock and injects it through `provideMapboxGl` before the package below builds
// a map.
import { mapDouble } from './harness.js';
import { wait } from '#test-utils';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import type { Base } from '@studiometa/js-toolkit';
import {
  type DiagnosticCapture,
  captureDiagnostics,
  mount,
  recordEvents,
  settle,
  waitFor,
} from '@studiometa/js-toolkit/test';
import {
  MapboxCluster,
  MapboxClusterItem,
  MapboxGeocoder,
  MapboxMap,
  StoreLocator,
} from '@studiometa/ui-mapbox';

registerComponents(MapboxMap, MapboxCluster, MapboxClusterItem, MapboxGeocoder, StoreLocator);

/** The cluster coalesces its rebuilds — and the `map-update` it emits — behind a 100ms debounce. */
const REBUILD_DELAY = 150;

/**
 * `StoreLocator` resolves its children through `$watchChildren()` and
 * `$query()`, which no getter override can stand in for, so these specs mount
 * the real components and drive them through the same seams a page would: the
 * map's `load` and `moveend` events, the cluster's own emits, and DOM
 * insertions/removals for a `Fetch` swap.
 */
interface ItemSpec {
  id: string;
  lngLat: [number, number];
}

function itemHtml({ id, lngLat }: ItemSpec) {
  return `<li data-component="MapboxClusterItem" data-option-id="${id}" data-option-lng-lat="[${lngLat[0]}, ${lngLat[1]}]"><button type="button">${id}</button></li>`;
}

function clusterHtml(items: ItemSpec[]) {
  return `<div data-component="MapboxCluster"><ul>${items.map(itemHtml).join('')}</ul></div>`;
}

const GEOCODER_HTML = `<div data-component="MapboxGeocoder" data-option-options='{"accessToken":"geo-token"}'></div>`;

/**
 * Simulate a child component emitting one of its events.
 *
 * The orchestrator subscribes with `child.$on(type, …)`, which listens on the
 * child's element, so dispatching there is exactly what `$emit()` does — minus
 * the payload types, which a test driving an arbitrary shape does not want.
 */
function emitFrom(child: Base, type: string, detail?: unknown) {
  child.$el.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, detail }));
}

/**
 * Mount a `StoreLocator` wrapping a `MapboxMap`, a `MapboxCluster` of
 * `MapboxClusterItem`s and an optional `MapboxGeocoder`, then fire the map's
 * `load` so the orchestrator binds.
 */
async function createStoreLocator(
  items: ItemSpec[],
  options: { attrs?: string; geocoder?: boolean; cluster?: boolean } = {},
) {
  const { attrs = '', geocoder = false, cluster = true } = options;
  const root = await mount(`
    <div data-component="StoreLocator" ${attrs}>
      <div data-component="MapboxMap" data-option-access-token="test-token">
        <div data-ref="container"></div>
        ${geocoder ? GEOCODER_HTML : ''}
        ${cluster ? clusterHtml(items) : ''}
      </div>
    </div>
  `);

  const el = root.querySelector<HTMLElement>('[data-component="StoreLocator"]')!;
  const mapEl = root.querySelector<HTMLElement>('[data-component="MapboxMap"]')!;
  const instance = getInstance<StoreLocator>(el, 'StoreLocator')!;
  const mapbox = getInstance<MapboxMap>(mapEl, 'MapboxMap')!;
  const mockMap = mapDouble(mapbox);

  // The children collections are seeded in a microtask and the nested map
  // announces itself only once `mapbox-gl` has resolved, so let both land
  // before the map reports itself loaded.
  await settle();
  mockMap.fire('load');
  await settle();

  const context = {
    root,
    el,
    mapEl,
    instance,
    mapbox,
    mockMap,
    get cluster() {
      return instance.cluster!;
    },
    get geocoder() {
      return instance.geocoder!;
    },
    get list() {
      return root.querySelector('ul')!;
    },
    item(id: string) {
      return instance.items.find((entry) => entry.id === id)!;
    },
    fireMoveEnd() {
      mockMap.fire('moveend');
    },
    fireItemClick(item: MapboxClusterItem | undefined) {
      emitFrom(context.cluster, 'map-item-click', { item, feature: undefined, event: {} });
    },
    fireGeocoderResult(result: unknown) {
      emitFrom(context.geocoder, 'map-result', { result });
    },
  };

  return context;
}

type StoreLocatorContext = Awaited<ReturnType<typeof createStoreLocator>>;

/**
 * Configure the mock viewport so only the given longitudes are considered inside
 * bounds, letting a test drive the in-bounds axis independently of the map data.
 */
function boundsContainingLng(ctx: StoreLocatorContext, lngs: number[]) {
  ctx.mockMap.getBounds = vi.fn(() => ({
    contains: (lngLat: [number, number]) => lngs.includes(lngLat[0]),
  })) as never;
}

/** Read the current DOM order of item ids inside the sidebar list. */
function listOrder(ctx: StoreLocatorContext): string[] {
  return [...ctx.list.children]
    .map((child) => child.getAttribute('data-option-id'))
    .filter((id): id is string => id !== null);
}

/**
 * A well-formed locator reports nothing. `store-locator.no-map` is deferred
 * until the DOM has settled and is judged on the *element*, so the ordinary
 * "the nested `MapboxMap` has not mounted yet" state — the registry mounts the
 * wrapper first — is not a diagnostic. Capturing keeps the console clean and
 * lets a test assert that nothing was reported at all.
 */
let diagnostics: DiagnosticCapture;

beforeEach(() => {
  diagnostics = captureDiagnostics();
});

afterEach(() => {
  diagnostics.stop();
});

describe('StoreLocator orchestrator', () => {
  // --- 1. Selection --------------------------------------------------------
  describe('selection', () => {
    it('flies to the item, marks it active/aria-current, opens a popup and emits map-select', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [3, 4] }]);
      const log = recordEvents(ctx.el, 'map-select');

      const itemA = ctx.item('a');
      ctx.instance.selectItem(itemA);

      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [3, 4], zoom: 14 });
      expect(itemA.$el.hasAttribute('data-active')).toBe(true);
      expect(itemA.$el.getAttribute('aria-current')).toBe('true');
      // The popup was opened from the item's popup content.
      expect((ctx.instance as unknown as { __popup?: unknown }).__popup).toBeDefined();
      expect(log.events).toHaveLength(1);
      // The payload is one named object: the item travels as `detail.item`.
      expect((log.events[0].detail as { item: unknown }).item).toBe(itemA);
      log.stop();
    });

    it('honors a custom data-option-item-zoom-level on fly-to', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [3, 4] }], {
        attrs: 'data-option-item-zoom-level="17"',
      });

      ctx.instance.selectItem(ctx.item('a'));
      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [3, 4], zoom: 17 });
    });

    it('deactivates the previously selected item when a second is selected', async () => {
      const ctx = await createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);

      const itemA = ctx.item('a');
      const itemB = ctx.item('b');
      ctx.instance.selectItem(itemA);
      ctx.instance.selectItem(itemB);

      expect(itemA.$el.hasAttribute('data-active')).toBe(false);
      expect(itemA.$el.hasAttribute('aria-current')).toBe(false);
      expect(itemB.$el.hasAttribute('data-active')).toBe(true);
      expect(itemB.$el.getAttribute('aria-current')).toBe('true');
    });

    it('clears the active state and emits map-deselect on deselect()', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      const log = recordEvents(ctx.el, 'map-deselect');

      const itemA = ctx.item('a');
      ctx.instance.selectItem(itemA);
      ctx.instance.deselect();

      expect(itemA.$el.hasAttribute('data-active')).toBe(false);
      expect(itemA.$el.hasAttribute('aria-current')).toBe(false);
      expect(log.events).toHaveLength(1);
      // `map-deselect` carries no payload, so its `detail` is `null`.
      expect(log.events[0].detail).toBeNull();
      expect((ctx.instance as unknown as { __selected?: unknown }).__selected).toBeUndefined();
      log.stop();
    });

    it('selects on a delegated sidebar click, resolving the clicked item element', async () => {
      const ctx = await createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      const log = recordEvents(ctx.el, 'map-select');

      // Click the inner button of item `b`: the delegated handler resolves the
      // closest MapboxClusterItem element and selects its instance.
      const button = ctx.item('b').$el.querySelector('button')!;
      button.dispatchEvent(new Event('click', { bubbles: true }));

      expect(ctx.item('b').$el.hasAttribute('data-active')).toBe(true);
      expect((log.events.at(-1)!.detail as { item: unknown }).item).toBe(ctx.item('b'));
      log.stop();
    });
  });

  // --- 2. Cluster item-click -> select -------------------------------------
  describe('cluster item-click -> select', () => {
    it('selects the item reported by the cluster', async () => {
      const ctx = await createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);
      const log = recordEvents(ctx.el, 'map-select');

      ctx.fireItemClick(ctx.item('b'));

      expect(ctx.item('b').$el.hasAttribute('data-active')).toBe(true);
      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [2, 2], zoom: 14 });
      expect((log.events.at(-1)!.detail as { item: unknown }).item).toBe(ctx.item('b'));
      log.stop();
    });

    it('does nothing (no select, no throw) when the cluster reports no item', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      const log = recordEvents(ctx.el, 'map-select');

      expect(() => ctx.fireItemClick(undefined)).not.toThrow();
      expect(log.events).toHaveLength(0);
      log.stop();
    });
  });

  // --- 3. Viewport filtering (in-bounds + sort + filter) -------------------
  describe('viewport filtering on moveend', () => {
    it('reflects data-in-bounds only for in-view items and emits map-filter with them', async () => {
      const ctx = await createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
        { id: 'c', lngLat: [3, 3] },
      ]);

      // Only `a` and `c` fall inside the viewport.
      boundsContainingLng(ctx, [1, 3]);
      const log = recordEvents(ctx.el, 'map-filter');

      ctx.fireMoveEnd();

      expect(ctx.item('a').$el.hasAttribute('data-in-bounds')).toBe(true);
      expect(ctx.item('b').$el.hasAttribute('data-in-bounds')).toBe(false);
      expect(ctx.item('c').$el.hasAttribute('data-in-bounds')).toBe(true);

      expect(log.events.length).toBeGreaterThan(0);
      // The payload is one named object: the in-view set is `detail.items`.
      const { items } = log.events.at(-1)!.detail as { items: MapboxClusterItem[] };
      expect(items.map((entry) => entry.id).sort()).toEqual(['a', 'c']);
      log.stop();
    });

    it('does not fit the map on a moveend (pan must not re-frame)', async () => {
      const ctx = await createStoreLocator([
        { id: 'a', lngLat: [1, 1] },
        { id: 'b', lngLat: [2, 2] },
      ]);

      ctx.mockMap.fitBounds.mockClear();
      ctx.fireMoveEnd();
      ctx.fireMoveEnd();

      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
    });

    it('orders the filter payload and the list DOM ascending by distance (sort ON)', async () => {
      // Center is MockLngLat(0,0); planar distances: b(1,1) < c(2,2) < a(3,3).
      const ctx = await createStoreLocator([
        { id: 'a', lngLat: [3, 3] },
        { id: 'b', lngLat: [1, 1] },
        { id: 'c', lngLat: [2, 2] },
      ]);
      const log = recordEvents(ctx.el, 'map-filter');

      ctx.fireMoveEnd();

      const { items } = log.events.at(-1)!.detail as { items: MapboxClusterItem[] };
      expect(items.map((entry) => entry.id)).toEqual(['b', 'c', 'a']);
      expect(listOrder(ctx)).toEqual(['b', 'c', 'a']);
      log.stop();
    });

    it('preserves registration/DOM order when data-option-no-sort is set', async () => {
      const ctx = await createStoreLocator(
        [
          { id: 'a', lngLat: [3, 3] },
          { id: 'b', lngLat: [1, 1] },
          { id: 'c', lngLat: [2, 2] },
        ],
        { attrs: 'data-option-no-sort' },
      );
      const log = recordEvents(ctx.el, 'map-filter');

      ctx.fireMoveEnd();

      const { items } = log.events.at(-1)!.detail as { items: MapboxClusterItem[] };
      expect(items.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
      expect(listOrder(ctx)).toEqual(['a', 'b', 'c']);
      log.stop();
    });
  });

  // --- 4. Geocoder result --------------------------------------------------
  describe('geocoder result', () => {
    it('fits the map to the bbox when the result has one', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }], { geocoder: true });

      ctx.mockMap.fitBounds.mockClear();
      ctx.fireGeocoderResult({ bbox: [10, 20, 30, 40] });

      expect(ctx.mockMap.fitBounds).toHaveBeenCalledWith([
        [10, 20],
        [30, 40],
      ]);
    });

    it('flies to the center when the result has no bbox', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }], { geocoder: true });

      ctx.mockMap.flyTo.mockClear();
      ctx.fireGeocoderResult({ center: [5, 6] });

      expect(ctx.mockMap.flyTo).toHaveBeenCalledWith({ center: [5, 6] });
    });

    it('does nothing and does not throw on a missing/empty result', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }], { geocoder: true });

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
      const ctx = await createStoreLocator(
        [
          { id: 'a', lngLat: [1, 2] },
          { id: 'b', lngLat: [3, 4] },
          { id: 'c', lngLat: [5, 0] },
        ],
        { attrs: 'data-option-fit-on-update' },
      );

      expect(ctx.mockMap.fitBounds).toHaveBeenCalledWith(
        [
          [1, 0],
          [5, 4],
        ],
        { padding: 40 },
      );
    });

    it('does not fit the map when disabled', async () => {
      const ctx = await createStoreLocator([
        { id: 'a', lngLat: [1, 2] },
        { id: 'b', lngLat: [3, 4] },
      ]);

      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
    });
  });

  // --- 6. Fetch-swap: list + map update together ---------------------------
  describe('Fetch-swap of the item set', () => {
    it('re-fits and re-filters against the new cluster item set on update', async () => {
      const ctx = await createStoreLocator(
        [
          { id: 'a', lngLat: [1, 1] },
          { id: 'b', lngLat: [2, 2] },
        ],
        { attrs: 'data-option-fit-on-update' },
      );

      boundsContainingLng(ctx, [7, 8]);
      const log = recordEvents(ctx.el, 'map-filter');
      ctx.mockMap.fitBounds.mockClear();

      // A Fetch swap: the whole list is replaced. The items unregister and the
      // fresh ones register, and the cluster announces the new set through its
      // debounced `map-update`.
      ctx.list.innerHTML = [
        itemHtml({ id: 'c', lngLat: [7, 7] }),
        itemHtml({ id: 'd', lngLat: [8, 8] }),
      ].join('');
      await settle();
      await wait(REBUILD_DELAY);

      // The orchestrator re-fits and re-filters — list and map move together.
      expect(ctx.mockMap.fitBounds).toHaveBeenCalledWith(
        [
          [7, 7],
          [8, 8],
        ],
        { padding: 40 },
      );
      const { items } = log.events.at(-1)!.detail as { items: MapboxClusterItem[] };
      expect(items.map((entry) => entry.id).sort()).toEqual(['c', 'd']);
      log.stop();
    });

    it('drops a stale selection whose item is no longer registered', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      function selected() {
        return (ctx.instance as unknown as { __selected?: unknown }).__selected;
      }

      ctx.instance.selectItem(ctx.item('a'));
      expect(selected()).toBeDefined();

      // The selected item leaves the registry (Fetch swap).
      ctx.list.innerHTML = '';
      await settle();
      await wait(REBUILD_DELAY);

      expect(selected()).toBeUndefined();
    });

    it('runs the full deselect cleanup when the selected item is dropped by a swap (D2)', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      const log = recordEvents(ctx.el, 'map-deselect');

      ctx.instance.selectItem(ctx.item('a'));
      const popup = (ctx.instance as unknown as { __popup?: { remove: unknown } }).__popup!;
      expect(popup).toBeDefined();

      // The selected store leaves the registry: the popup must be removed and
      // `map-deselect` emitted, not just `__selected` cleared.
      ctx.list.innerHTML = '';
      await settle();
      await wait(REBUILD_DELAY);

      expect((ctx.instance as unknown as { __selected?: unknown }).__selected).toBeUndefined();
      expect(popup.remove).toHaveBeenCalled();
      expect(log.events).toHaveLength(1);
      log.stop();
    });

    it('re-wires onto a replacement cluster picked up by $watchChildren (D1)', async () => {
      // The orchestrator watches its `MapboxCluster` descendants with
      // `$watchChildren()`, so a cluster that replaces the wired one arrives
      // through the `removed`/`added` callbacks: there is nothing to announce
      // and nothing to poll.
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      const firstCluster = ctx.cluster;

      // Replace the cluster wholesale, as a facet swap of the results panel would.
      firstCluster.$el.remove();
      ctx.mapEl.insertAdjacentHTML('beforeend', clusterHtml([{ id: 'z', lngLat: [9, 9] }]));
      await settle();

      const newCluster = await waitFor(() =>
        ctx.instance.cluster && ctx.instance.cluster !== firstCluster
          ? ctx.instance.cluster
          : undefined,
      );
      expect((ctx.instance as unknown as { __cluster?: unknown }).__cluster).toBe(newCluster);

      // The stale wiring was dropped and the new cluster wired: an item-click
      // through the REPLACEMENT cluster selects its item.
      const log = recordEvents(ctx.el, 'map-select');
      const newItem = ctx.item('z');
      emitFrom(newCluster, 'map-item-click', { item: newItem, feature: undefined, event: {} });

      expect(log.events).toHaveLength(1);
      expect((log.events[0].detail as { item: unknown }).item).toBe(newItem);
      log.stop();
    });
  });

  // --- 7. Deferred cluster wiring -----------------------------------------
  describe('deferred cluster wiring', () => {
    it('does not wire a cluster until one turns up, then wires it', async () => {
      // `$watchChildren()` does the wiring, so the assertion is on its effect:
      // there is no wiring until a cluster mounts, and it wires itself the
      // moment one does.
      const ctx = await createStoreLocator([], { cluster: false });
      function wired() {
        return (ctx.instance as unknown as { __cluster?: unknown }).__cluster;
      }

      expect(wired()).toBeUndefined();
      expect(ctx.instance.items).toEqual([]);

      const log = recordEvents(ctx.el, 'map-select');

      // The cluster mounts late (a lazily imported component, a `Fetch`-injected
      // panel): the collection reports it and the orchestrator wires it.
      ctx.mapEl.insertAdjacentHTML('beforeend', clusterHtml([{ id: 'b', lngLat: [2, 2] }]));
      await settle();

      const cluster = await waitFor(() => ctx.instance.cluster);
      expect(wired()).toBe(cluster);

      ctx.fireItemClick(ctx.item('b'));
      expect(log.events).toHaveLength(1);
      log.stop();
    });
  });

  // --- 8. Lifecycle teardown (dynamic-DOM safety) --------------------------
  describe('lifecycle teardown', () => {
    it('detaches listeners and clears state on unmount', async () => {
      const ctx = await createStoreLocator(
        [
          { id: 'a', lngLat: [1, 1] },
          { id: 'b', lngLat: [2, 2] },
        ],
        { geocoder: true },
      );

      const itemA = ctx.item('a');
      const cluster = ctx.cluster;
      const geocoder = ctx.geocoder;
      const log = recordEvents(ctx.el, 'map-filter', 'map-select');

      ctx.instance.$unmount();
      await settle();

      expect((ctx.instance as unknown as { __selected?: unknown }).__selected).toBeUndefined();
      expect((ctx.instance as unknown as { __map?: unknown }).__map).toBeUndefined();
      expect(ctx.instance.isLoaded).toBe(false);

      // Detached listeners: subsequent events are inert.
      ctx.fireMoveEnd();
      emitFrom(cluster, 'map-item-click', { item: itemA, feature: undefined, event: {} });
      ctx.mockMap.fitBounds.mockClear();
      ctx.mockMap.flyTo.mockClear();
      emitFrom(geocoder, 'map-result', { result: { center: [1, 1] } });

      expect(log.events).toHaveLength(0);
      expect(ctx.mockMap.flyTo).not.toHaveBeenCalled();
      expect(ctx.mockMap.fitBounds).not.toHaveBeenCalled();
      log.stop();
    });

    it('drops the cached map on its remove event and never calls into the dead map (D3)', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);
      function cached() {
        return (ctx.instance as unknown as { __map?: unknown }).__map;
      }

      expect(cached()).toBe(ctx.mockMap);

      // The nested map is removed out from under the still-mounted orchestrator.
      ctx.mockMap.remove();

      expect(cached()).toBeUndefined();
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

    it('tears down without failing after the map was removed', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);

      // The map is removed out from under the orchestrator.
      ctx.mockMap.remove();

      ctx.instance.$unmount();
      await settle();

      // A throwing `unmounted()` is contained and reported as
      // `component.lifecycle-failed`, so `not.toThrow()` would pass either way.
      // The absence of that diagnostic is what says teardown ran clean.
      expect(diagnostics.codes).not.toContain('component.lifecycle-failed');
    });

    it('does not fail when unmounted after being detached from the DOM', async () => {
      const ctx = await createStoreLocator([{ id: 'a', lngLat: [1, 1] }]);

      // Detach the root (e.g. a facet swap replacing the whole locator): the
      // registry unmounts it *after* the removal, so teardown has to rely on the
      // cached references rather than a fresh `$query`.
      ctx.el.remove();
      await settle();

      expect(ctx.instance.$isMounted).toBe(false);
      expect(diagnostics.codes).not.toContain('component.lifecycle-failed');
    });
  });
});

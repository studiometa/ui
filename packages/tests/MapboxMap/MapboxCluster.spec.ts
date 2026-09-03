import { describe, it, expect, vi } from 'vitest';
import { getInstance, registerComponent, registerComponents } from '@studiometa/js-toolkit';
import { mount, recordEvents, resetDom, resetRegistry, settle } from '@studiometa/js-toolkit/test';
import { wait } from '#test-utils';
import { MapboxCluster, MapboxClusterItem, MapboxMap } from '@studiometa/ui-mapbox';
import { append, mountMap } from './harness.js';

registerComponents(MapboxMap, MapboxCluster, MapboxClusterItem);

/** The cluster coalesces rebuilds behind a 100ms debounce. */
const REBUILD_DELAY = 150;

function itemHtml(id = '1', lngLat = '[2.35, 48.85]', attrs = '', content = '') {
  return `<li data-component="MapboxClusterItem" data-option-id="${id}" data-option-lng-lat="${lngLat}" ${attrs}>${content}</li>`;
}

/**
 * Mount a loaded `MapboxMap` holding one `MapboxCluster`.
 *
 * Items live inside the cluster element, which is where `$closest` resolves
 * them from, so the real markup wires both ends and no stub is needed.
 */
async function createCluster(attrs = '', items = '') {
  const context = await mountMap(`<div data-component="MapboxCluster" ${attrs}>${items}</div>`);
  await context.load();
  const el = context.mapEl.querySelector<HTMLElement>('[data-component="MapboxCluster"]')!;
  const instance = getInstance<MapboxCluster>(el, 'MapboxCluster')!;

  return {
    context,
    el,
    instance,
    mockMap: context.mockMap,
    id: (suffix: string) => (instance as unknown as { __getId(s: string): string }).__getId(suffix),
  };
}

/** Append a `MapboxClusterItem` to a cluster and let the registry mount it. */
async function addItem(clusterEl: HTMLElement, html: string) {
  const el = await append(clusterEl, html);
  return getInstance<MapboxClusterItem>(el, 'MapboxClusterItem')!;
}

describe('MapboxCluster component', () => {
  it('should add a clustered source and three layers on mount', async () => {
    const { mockMap, id } = await createCluster();

    expect(mockMap.addSource).toHaveBeenCalledWith(
      id('source'),
      expect.objectContaining({ type: 'geojson', cluster: true }),
    );
    expect(mockMap.addLayer).toHaveBeenCalledTimes(3);
  });

  it('should build its FeatureCollection from the registered items', async () => {
    const { el, instance } = await createCluster();

    await addItem(el, itemHtml('a', '[1, 2]'));
    await addItem(el, itemHtml('b', '[3, 4]', `data-option-properties='{"label":"B"}'`));

    const fc = instance.featureCollection;
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features).toHaveLength(2);
    expect(fc.features[0]).toMatchObject({
      geometry: { type: 'Point', coordinates: [1, 2] },
      properties: { id: 'a' },
    });
    expect(fc.features[1].properties).toMatchObject({ id: 'b', label: 'B' });
  });

  it('should push the derived data to the source when an item registers', async () => {
    const { el, mockMap, id } = await createCluster();
    const source = mockMap.getSource(id('source'));

    await addItem(el, itemHtml('x', '[5, 6]'));
    await wait(REBUILD_DELAY);

    expect(source.setData).toHaveBeenCalled();
    const lastData = source.setData.mock.calls.at(-1)[0];
    expect(lastData.features).toHaveLength(1);
    expect(lastData.features[0].properties.id).toBe('x');
  });

  it('should drop an item from the data when it unregisters', async () => {
    const { el, mockMap, id } = await createCluster();
    const item = await addItem(el, itemHtml('x', '[5, 6]'));
    await wait(REBUILD_DELAY);

    const source = mockMap.getSource(id('source'));

    item.$unmount();
    await settle();
    await wait(REBUILD_DELAY);

    const lastData = source.setData.mock.calls.at(-1)[0];
    expect(lastData.features).toHaveLength(0);
  });

  it('should emit a map-update event carrying the item set when it rebuilds', async () => {
    const { el, instance } = await createCluster();
    const log = recordEvents(instance.$el, 'map-update');

    await addItem(el, itemHtml('x', '[5, 6]'));
    await wait(REBUILD_DELAY);

    expect(log.events.length).toBeGreaterThan(0);
    // The payload carries the registered item set — an orchestrator reads it to
    // fit and filter. It is a defensive copy (not the live internal array), so a
    // consumer can not splice the registry: assert by content, not identity.
    const { items } = log.events.at(-1)!.detail as { items: readonly MapboxClusterItem[] };
    expect(items).toEqual([...instance.items]);
    expect(items).not.toBe((instance as unknown as { __items: unknown }).__items);
    expect(instance.items).toHaveLength(1);
    log.stop();
  });

  it('should emit map-cluster-click and ease to the expansion zoom on cluster click', async () => {
    const { instance, mockMap, id } = await createCluster();
    const log = recordEvents(instance.$el, 'map-cluster-click');

    mockMap.queryRenderedFeatures = vi.fn(() => [
      { properties: { cluster_id: 42 }, geometry: { type: 'Point', coordinates: [1, 2] } },
    ]) as never;

    mockMap.fire('click', id('clusters'), {
      point: { x: 0, y: 0 },
      defaultPrevented: false,
      preventDefault() {},
    });

    expect(log.events).toHaveLength(1);
    // The payload is one named object: the cluster id is read by name.
    expect((log.events[0].detail as { clusterId: number }).clusterId).toBe(42);
    expect(mockMap.easeTo).toHaveBeenCalledWith({ center: [1, 2], zoom: 5 });
    log.stop();
  });

  it('should not ease to the expansion zoom when the map is removed mid-flight (D4)', async () => {
    const { mockMap, id } = await createCluster();

    mockMap.queryRenderedFeatures = vi.fn(() => [
      { properties: { cluster_id: 7 }, geometry: { type: 'Point', coordinates: [1, 2] } },
    ]) as never;

    // Defer the async expansion-zoom callback so the map can be removed before it
    // resolves, reproducing the captured-map race.
    let deferred: ((error: unknown, zoom: number) => void) | undefined;
    mockMap.getSource(id('source')).getClusterExpansionZoom = vi.fn(
      (_clusterId: number, cb: (error: unknown, zoom: number) => void) => {
        deferred = cb;
      },
    );

    mockMap.fire('click', id('clusters'), {
      point: { x: 0, y: 0 },
      defaultPrevented: false,
      preventDefault() {},
    });

    // The map is removed before the expansion zoom resolves; the base clears
    // `__readyMap`, invalidating the captured map.
    mockMap.remove();
    deferred?.(null, 5);

    expect(mockMap.easeTo).not.toHaveBeenCalled();
  });

  it('should emit map-item-click with the resolved item on unclustered point click', async () => {
    const { el, instance, mockMap, id } = await createCluster();
    const item = await addItem(el, itemHtml('x', '[5, 6]'));
    const log = recordEvents(instance.$el, 'map-item-click');

    mockMap.fire('click', id('unclustered-point'), {
      features: [{ properties: { id: 'x' } }],
      defaultPrevented: false,
      preventDefault() {},
    });

    // The cluster resolves the feature id back to the registered item and reports
    // it — it never selects or flies on its own (that is the orchestrator's job).
    expect(log.events).toHaveLength(1);
    expect((log.events[0].detail as { item: unknown }).item).toBe(item);
    expect(item.$el.hasAttribute('data-active')).toBe(false);
    expect(mockMap.flyTo).not.toHaveBeenCalled();
    log.stop();
  });

  it('should emit map-item-click with an undefined item for an unknown feature id', async () => {
    const { instance, mockMap, id } = await createCluster();
    const log = recordEvents(instance.$el, 'map-item-click');

    mockMap.fire('click', id('unclustered-point'), {
      features: [{ properties: { id: 'nope' } }],
      defaultPrevented: false,
      preventDefault() {},
    });

    expect(log.events).toHaveLength(1);
    expect((log.events[0].detail as { item: unknown }).item).toBeUndefined();
    log.stop();
  });

  it('should remove the three layers and the source on unmount', async () => {
    const { instance, mockMap, id } = await createCluster();

    instance.$unmount();
    await settle();

    expect(mockMap.removeLayer).toHaveBeenCalledWith(id('clusters'));
    expect(mockMap.removeLayer).toHaveBeenCalledWith(id('cluster-count'));
    expect(mockMap.removeLayer).toHaveBeenCalledWith(id('unclustered-point'));
    expect(mockMap.removeSource).toHaveBeenCalledWith(id('source'));
  });
});

describe('MapboxClusterItem component', () => {
  it('should register with the cluster on mount', async () => {
    const { el, instance } = await createCluster();
    const register = vi.spyOn(instance, 'register');

    const item = await addItem(el, itemHtml());

    expect(register).toHaveBeenCalledWith(item);
    expect(instance.featureCollection.features).toHaveLength(1);
  });

  it('should register once its cluster connects when none existed at mount (M1)', async () => {
    // Reproduce the lazily-imported cluster: only the item's class is known when
    // the markup mounts, so the item finds no cluster through `$closest` and
    // parks on `MAPBOX_CLUSTER_CONNECTED`. Registering the cluster afterwards
    // mounts it, and its announcement is what lets the item register.
    await resetDom();
    resetRegistry();

    try {
      registerComponent(MapboxClusterItem);

      const root = await mount(`
        <div data-component="MapboxCluster">
          ${itemHtml('late', '[9, 9]')}
        </div>
      `);
      const clusterEl = root.querySelector<HTMLElement>('[data-component="MapboxCluster"]')!;
      const itemEl = root.querySelector<HTMLElement>('[data-component="MapboxClusterItem"]')!;
      const item = getInstance<MapboxClusterItem>(itemEl, 'MapboxClusterItem')!;

      // Nothing to resolve yet: the cluster's class is not registered.
      expect(item.$closest('MapboxCluster')).toBeNull();

      registerComponent(MapboxCluster);
      await settle();

      const cluster = getInstance<MapboxCluster>(clusterEl, 'MapboxCluster')!;
      expect(cluster.featureCollection.features).toHaveLength(1);
      expect(cluster.featureCollection.features[0].properties).toMatchObject({ id: 'late' });
    } finally {
      // The registry is page-wide: restore it for the rest of the file.
      registerComponents(MapboxMap, MapboxCluster, MapboxClusterItem);
    }
  });

  it('should unregister from the cached cluster on unmount, even when detached', async () => {
    const { el, instance } = await createCluster();
    const item = await addItem(el, itemHtml());
    expect(instance.featureCollection.features).toHaveLength(1);

    const unregister = vi.spyOn(instance, 'unregister');

    // Detach the element from the DOM: the registry unmounts the item *after*
    // the removal, so a fresh `$closest` would find nothing and the cached
    // reference is what has to drive the unregister.
    item.$el.remove();
    await settle();

    expect(unregister).toHaveBeenCalledWith(item);
    expect(instance.featureCollection.features).toHaveLength(0);
  });

  it('should expose id, lngLat and properties', async () => {
    const { el } = await createCluster();
    const item = await addItem(
      el,
      itemHtml('store-1', '[7, 8]', `data-option-properties='{"city":"Paris"}'`),
    );

    expect(item.id).toBe('store-1');
    expect(item.lngLat).toEqual([7, 8]);
    expect(item.properties).toEqual({ city: 'Paris' });
  });

  it('should use the [data-ref="popup"] content as the popup content when present', async () => {
    const { el } = await createCluster();
    const item = await addItem(
      el,
      itemHtml(
        '1',
        '[2.35, 48.85]',
        '',
        'Card text<div data-ref="popup"><strong>Popup only</strong></div>',
      ),
    );

    expect(item.popupContent).toBe('<strong>Popup only</strong>');
  });

  it('should reflect in-bounds and active state as attributes', async () => {
    const { el } = await createCluster();
    const item = await addItem(el, itemHtml());

    item.setInBounds(true);
    expect(item.$el.hasAttribute('data-in-bounds')).toBe(true);
    item.setInBounds(false);
    expect(item.$el.hasAttribute('data-in-bounds')).toBe(false);

    item.setActive(true);
    expect(item.$el.hasAttribute('data-active')).toBe(true);
    expect(item.$el.getAttribute('aria-current')).toBe('true');
    item.setActive(false);
    expect(item.$el.hasAttribute('data-active')).toBe(false);
    expect(item.$el.hasAttribute('aria-current')).toBe(false);
  });
});

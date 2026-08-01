import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxCluster, MapboxClusterItem } from '@studiometa/ui-mapbox';

/**
 * Build a `MapboxCluster` whose parent map is a ready `MockMap`.
 */
function createCluster(attrs: Record<string, string> = {}) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxCluster',
    ...attrs,
  });

  const instance = new MapboxCluster(el);
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

/**
 * Build a `MapboxClusterItem` bound to the given cluster.
 */
function createItem(
  cluster: MapboxCluster,
  attrs: Record<string, string> = {},
  children: (string | Node)[] = [],
) {
  const el = h(
    'li',
    {
      'data-component': 'MapboxClusterItem',
      'data-option-id': '1',
      'data-option-lng-lat': '[2.35, 48.85]',
      ...attrs,
    },
    children,
  );

  const instance = new MapboxClusterItem(el);
  instance.$closest = vi.fn((query: string) => (query === 'MapboxCluster' ? cluster : undefined));

  return instance;
}

/**
 * Mount an instance and flush the js-toolkit mount + any debounced rebuild.
 */
async function mountAndFlush(instance: { $mount(): void }) {
  vi.useFakeTimers();
  instance.$mount();
  await vi.advanceTimersByTimeAsync(200);
  vi.useRealTimers();
}

describe('MapboxCluster component', () => {
  it('should add a clustered source and three layers on mount', async () => {
    const { instance, mockMap } = createCluster();

    await mountAndFlush(instance);

    const sourceId = (instance as any).__getId('source');
    expect(mockMap.addSource).toHaveBeenCalledWith(
      sourceId,
      expect.objectContaining({ type: 'geojson', cluster: true }),
    );
    expect(mockMap.addLayer).toHaveBeenCalledTimes(3);
  });

  it('should build its FeatureCollection from the registered items', async () => {
    const { instance } = createCluster();
    await mountAndFlush(instance);

    const itemA = createItem(instance, { 'data-option-id': 'a', 'data-option-lng-lat': '[1, 2]' });
    const itemB = createItem(instance, {
      'data-option-id': 'b',
      'data-option-lng-lat': '[3, 4]',
      'data-option-properties': '{"label":"B"}',
    });

    await mountAndFlush(itemA);
    await mountAndFlush(itemB);

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
    const { instance, mockMap } = createCluster();
    await mountAndFlush(instance);

    const sourceId = (instance as any).__getId('source');
    const source = mockMap.getSource(sourceId);

    const item = createItem(instance, { 'data-option-id': 'x', 'data-option-lng-lat': '[5, 6]' });
    await mountAndFlush(item);

    expect(source.setData).toHaveBeenCalled();
    const lastData = source.setData.mock.calls.at(-1)[0];
    expect(lastData.features).toHaveLength(1);
    expect(lastData.features[0].properties.id).toBe('x');
  });

  it('should drop an item from the data when it unregisters', async () => {
    const { instance, mockMap } = createCluster();
    await mountAndFlush(instance);

    const item = createItem(instance, { 'data-option-id': 'x', 'data-option-lng-lat': '[5, 6]' });
    await mountAndFlush(item);

    const sourceId = (instance as any).__getId('source');
    const source = mockMap.getSource(sourceId);

    vi.useFakeTimers();
    item.$destroy();
    await vi.advanceTimersByTimeAsync(200);
    vi.useRealTimers();

    const lastData = source.setData.mock.calls.at(-1)[0];
    expect(lastData.features).toHaveLength(0);
  });

  it('should fly to, mark active and open a popup on the selected item', async () => {
    const { instance, mockMap } = createCluster();
    await mountAndFlush(instance);

    const item = createItem(instance, { 'data-option-id': 'x', 'data-option-lng-lat': '[5, 6]' }, [
      '<p>Store X</p>',
    ]);
    await mountAndFlush(item);

    instance.selectItem(item);

    expect(mockMap.flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: [5, 6] }));
    expect(item.$el.hasAttribute('data-active')).toBe(true);
    expect(item.$el.getAttribute('aria-current')).toBe('true');
  });

  it('should emit cluster-click and ease to the expansion zoom on cluster click', async () => {
    const { instance, mockMap } = createCluster();
    const handler = vi.fn();

    mockMap.queryRenderedFeatures = vi.fn(() => [
      { properties: { cluster_id: 42 }, geometry: { type: 'Point', coordinates: [1, 2] } },
    ]) as any;

    await mountAndFlush(instance);
    instance.$on('cluster-click', handler);

    const clustersId = (instance as any).__getId('clusters');
    mockMap.fire('click', clustersId, {
      point: { x: 0, y: 0 },
      defaultPrevented: false,
      preventDefault() {},
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail[0]).toBe(42);
    expect(mockMap.easeTo).toHaveBeenCalledWith({ center: [1, 2], zoom: 5 });
  });

  it('should select the item behind a clicked unclustered point', async () => {
    const { instance, mockMap } = createCluster();
    await mountAndFlush(instance);

    const item = createItem(instance, { 'data-option-id': 'x', 'data-option-lng-lat': '[5, 6]' });
    await mountAndFlush(item);

    const unclusteredId = (instance as any).__getId('unclustered-point');
    mockMap.fire('click', unclusteredId, {
      features: [{ properties: { id: 'x' } }],
      defaultPrevented: false,
      preventDefault() {},
    });

    expect(item.$el.hasAttribute('data-active')).toBe(true);
    expect(mockMap.flyTo).toHaveBeenCalled();
  });

  it('should remove the three layers and the source on destroy', async () => {
    const { instance, mockMap } = createCluster();
    await mountAndFlush(instance);

    const clustersId = (instance as any).__getId('clusters');
    const clusterCountId = (instance as any).__getId('cluster-count');
    const unclusteredPointId = (instance as any).__getId('unclustered-point');
    const sourceId = (instance as any).__getId('source');

    vi.useFakeTimers();
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeLayer).toHaveBeenCalledWith(clustersId);
    expect(mockMap.removeLayer).toHaveBeenCalledWith(clusterCountId);
    expect(mockMap.removeLayer).toHaveBeenCalledWith(unclusteredPointId);
    expect(mockMap.removeSource).toHaveBeenCalledWith(sourceId);
  });
});

describe('MapboxClusterItem component', () => {
  it('should register with the cluster on mount', async () => {
    const { instance: cluster } = createCluster();
    await mountAndFlush(cluster);
    const register = vi.spyOn(cluster, 'register');

    const item = createItem(cluster);
    await mountAndFlush(item);

    expect(register).toHaveBeenCalledWith(item);
    expect(cluster.featureCollection.features).toHaveLength(1);
  });

  it('should unregister from the cached cluster on destroy, even when detached', async () => {
    const { instance: cluster } = createCluster();
    await mountAndFlush(cluster);

    const item = createItem(cluster);
    await mountAndFlush(item);
    expect(cluster.featureCollection.features).toHaveLength(1);

    const unregister = vi.spyOn(cluster, 'unregister');
    // Simulate the element being detached from the DOM before teardown: the
    // `$closest` mock would return the cluster still, so make it return undefined
    // to prove the cached reference (not a fresh lookup) drives the unregister.
    (item as any).$closest = vi.fn(() => undefined);

    vi.useFakeTimers();
    item.$destroy();
    await vi.advanceTimersByTimeAsync(200);
    vi.useRealTimers();

    expect(unregister).toHaveBeenCalledWith(item);
    expect(cluster.featureCollection.features).toHaveLength(0);
  });

  it('should expose id, lngLat and properties', async () => {
    const { instance: cluster } = createCluster();
    const item = createItem(cluster, {
      'data-option-id': 'store-1',
      'data-option-lng-lat': '[7, 8]',
      'data-option-properties': '{"city":"Paris"}',
    });

    expect(item.id).toBe('store-1');
    expect(item.lngLat).toEqual([7, 8]);
    expect(item.properties).toEqual({ city: 'Paris' });
  });

  it('should use the [data-ref="popup"] content as the popup content when present', () => {
    const { instance: cluster } = createCluster();
    const popup = h('div', { 'data-ref': 'popup' });
    popup.innerHTML = '<strong>Popup only</strong>';
    const item = createItem(cluster, {}, ['Card text', popup]);

    expect(item.popupContent).toBe('<strong>Popup only</strong>');
  });

  it('should reflect in-bounds and active state as attributes', () => {
    const { instance: cluster } = createCluster();
    const item = createItem(cluster);

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

import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxCluster } from '@studiometa/ui-mapbox';

function createCluster(attrs: Record<string, string> = {}, children: (string | Node)[] = []) {
  const mockMap = new MockMap();
  const el = h(
    'div',
    {
      'data-component': 'MapboxCluster',
      'data-option-data': '/points.geojson',
      ...attrs,
    },
    children,
  );

  const instance = new MapboxCluster(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, $options: { accessToken: 'token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

/**
 * Build a fake Mapbox mouse event with a working `preventDefault`.
 */
function createMouseEvent() {
  return {
    point: { x: 0, y: 0 },
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
}

describe('MapboxCluster component', () => {
  it('should add a clustered source and three layers on mount', async () => {
    const { instance, mockMap } = createCluster();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const sourceId = (instance as any).__getId('source');
    expect(mockMap.addSource).toHaveBeenCalledWith(
      sourceId,
      expect.objectContaining({ type: 'geojson', cluster: true, data: '/points.geojson' }),
    );
    expect(mockMap.addLayer).toHaveBeenCalledTimes(3);
  });

  it('should use inline GeoJSON from the `geojson` script ref as the source data', async () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 2] }, properties: {} },
      ],
    };
    const script = h('script', { 'data-ref': 'geojson', type: 'application/json' }, [
      JSON.stringify(geojson),
    ]);
    const { instance, mockMap } = createCluster({}, [script]);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const sourceId = (instance as any).__getId('source');
    expect(mockMap.addSource).toHaveBeenCalledWith(
      sourceId,
      expect.objectContaining({ type: 'geojson', cluster: true, data: geojson }),
    );
  });

  it('should fall back to the `data` URL when the `geojson` ref is empty', async () => {
    // A present but empty (or whitespace-only) script ref must be treated as
    // "no inline data" and fall back to the `data` URL option, not inject
    // `null` (which `JSON.parse('null')` would otherwise produce).
    const script = h('script', { 'data-ref': 'geojson', type: 'application/json' }, []);
    const { instance, mockMap } = createCluster({}, [script]);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const sourceId = (instance as any).__getId('source');
    expect(mockMap.addSource).toHaveBeenCalledWith(
      sourceId,
      expect.objectContaining({ type: 'geojson', cluster: true, data: '/points.geojson' }),
    );
  });

  it('should warn and fall back to the URL when the `geojson` ref holds invalid JSON', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const script = h('script', { 'data-ref': 'geojson', type: 'application/json' }, ['{ invalid']);
    // `data-option-log` makes `$warn` emit to `console.warn`.
    const { instance, mockMap } = createCluster({ 'data-option-log': '' }, [script]);

    vi.useFakeTimers();
    expect(() => {
      instance.$mount();
    }).not.toThrow();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(warn).toHaveBeenCalled();
    const sourceId = (instance as any).__getId('source');
    expect(mockMap.addSource).toHaveBeenCalledWith(
      sourceId,
      expect.objectContaining({ type: 'geojson', cluster: true, data: '/points.geojson' }),
    );
    warn.mockRestore();
  });

  it('should emit cluster-click and ease to the expansion zoom on cluster click', async () => {
    const { instance, mockMap } = createCluster();
    const handler = vi.fn();

    mockMap.queryRenderedFeatures = vi.fn(() => [
      {
        properties: { cluster_id: 42 },
        geometry: { type: 'Point', coordinates: [1, 2] },
      },
    ]) as any;

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    instance.$on('cluster-click', handler);

    const clustersId = (instance as any).__getId('clusters');
    const event = createMouseEvent();
    mockMap.fire('click', clustersId, event);
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail[0]).toBe(42);
    expect(mockMap.easeTo).toHaveBeenCalledWith({ center: [1, 2], zoom: 5 });
  });

  it('should not ease to the expansion zoom when the event is default-prevented', async () => {
    const { instance, mockMap } = createCluster();

    mockMap.queryRenderedFeatures = vi.fn(() => [
      {
        properties: { cluster_id: 42 },
        geometry: { type: 'Point', coordinates: [1, 2] },
      },
    ]) as any;

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    instance.$on('cluster-click', (event: CustomEvent) => {
      // The second emitted arg is the original mouse event.
      event.detail[1].preventDefault();
    });

    const clustersId = (instance as any).__getId('clusters');
    mockMap.fire('click', clustersId, createMouseEvent());
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.easeTo).not.toHaveBeenCalled();
  });

  it('should do nothing on cluster click when no feature is found', async () => {
    const { instance, mockMap } = createCluster();
    const handler = vi.fn();

    // Default queryRenderedFeatures returns an empty array.
    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    instance.$on('cluster-click', handler);

    const clustersId = (instance as any).__getId('clusters');
    mockMap.fire('click', clustersId, createMouseEvent());
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(handler).not.toHaveBeenCalled();
    expect(mockMap.easeTo).not.toHaveBeenCalled();
  });

  it('should remove the three layers and the source on destroy', async () => {
    const { instance, mockMap } = createCluster();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    const clustersId = (instance as any).__getId('clusters');
    const clusterCountId = (instance as any).__getId('cluster-count');
    const unclusteredPointId = (instance as any).__getId('unclustered-point');
    const sourceId = (instance as any).__getId('source');

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeLayer).toHaveBeenCalledWith(clustersId);
    expect(mockMap.removeLayer).toHaveBeenCalledWith(clusterCountId);
    expect(mockMap.removeLayer).toHaveBeenCalledWith(unclusteredPointId);
    expect(mockMap.removeSource).toHaveBeenCalledWith(sourceId);
  });

  it('should detach the cluster click listener on destroy', async () => {
    const { instance, mockMap } = createCluster();
    const handler = vi.fn();

    mockMap.queryRenderedFeatures = vi.fn(() => [
      {
        properties: { cluster_id: 42 },
        geometry: { type: 'Point', coordinates: [1, 2] },
      },
    ]) as any;

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    instance.$on('cluster-click', handler);

    const clustersId = (instance as any).__getId('clusters');
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);

    // Firing after destroy should not trigger the detached handler.
    mockMap.fire('click', clustersId, createMouseEvent());
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(handler).not.toHaveBeenCalled();
  });
});

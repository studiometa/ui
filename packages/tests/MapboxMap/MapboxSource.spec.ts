import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxSource } from '@studiometa/ui-mapbox';

function createSource(attrs: Record<string, string> = {}, children: (string | Node)[] = []) {
  const mockMap = new MockMap();
  const el = h(
    'div',
    {
      'data-component': 'MapboxSource',
      'data-option-id': 'my-source',
      'data-option-source': '{"type":"geojson","data":{"type":"FeatureCollection","features":[]}}',
      ...attrs,
    },
    children,
  );

  const instance = new MapboxSource(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

describe('MapboxSource component', () => {
  it('should mount and add source to map', async () => {
    const { instance, mockMap } = createSource();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addSource).toHaveBeenCalledWith(
      'my-source',
      expect.objectContaining({ type: 'geojson' }),
    );
  });

  it('should inject inline GeoJSON from the `geojson` script ref as the source data', async () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 2] }, properties: {} },
      ],
    };
    const script = h('script', { 'data-ref': 'geojson', type: 'application/json' }, [
      JSON.stringify(geojson),
    ]);
    const { instance, mockMap } = createSource({}, [script]);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addSource).toHaveBeenCalledWith(
      'my-source',
      expect.objectContaining({ type: 'geojson', data: geojson }),
    );
  });

  it('should keep the option source data when the `geojson` ref is empty', async () => {
    // A present but empty (or whitespace-only) script ref must be treated as
    // "no inline data": the `source` option is used as is, without injecting
    // `data: null` (which `JSON.parse('null')` would otherwise produce).
    const script = h('script', { 'data-ref': 'geojson', type: 'application/json' }, []);
    const { instance, mockMap } = createSource({}, [script]);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addSource).toHaveBeenCalledWith(
      'my-source',
      expect.objectContaining({
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      }),
    );
  });

  it('should not add the source twice if it already exists', async () => {
    const { instance, mockMap } = createSource();
    mockMap.getSource = vi.fn(() => ({ id: 'my-source' }) as any);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addSource).not.toHaveBeenCalled();
  });

  it('should remove tied layers then the source on destroy', async () => {
    const { instance, mockMap } = createSource();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // Two layers reference the source, one does not.
    mockMap._layers = [
      { id: 'tied-layer', source: 'my-source' },
      { id: 'other-layer', source: 'another-source' },
    ];

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeLayer).toHaveBeenCalledWith('tied-layer');
    expect(mockMap.removeLayer).not.toHaveBeenCalledWith('other-layer');
    expect(mockMap.removeSource).toHaveBeenCalledWith('my-source');

    // Layers must be removed before the source they depend on.
    const removeLayerOrder = mockMap.removeLayer.mock.invocationCallOrder[0];
    const removeSourceOrder = mockMap.removeSource.mock.invocationCallOrder[0];
    expect(removeLayerOrder).toBeLessThan(removeSourceOrder);
  });

  it('should not remove a pre-existing source (or its tied layers) it did not add on destroy', async () => {
    const { instance, mockMap } = createSource();

    // The source id is already registered on the map by someone else, so
    // `mounted()` skips `addSource` and this instance never owns it.
    mockMap.seedSource('my-source');

    // A layer tied to the pre-existing source is present too.
    mockMap._layers = [{ id: 'tied-layer', source: 'my-source' }];

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    expect(mockMap.addSource).not.toHaveBeenCalled();

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Ownership guard: teardown must not touch state this instance never added.
    expect(mockMap.removeLayer).not.toHaveBeenCalled();
    expect(mockMap.removeSource).not.toHaveBeenCalled();
  });

  it('should adopt an id owned by a sibling instead of throwing, and not let the old teardown delete it (B3)', async () => {
    // Both instances share ONE map, as a `Fetch` swap of the same-id source would.
    const mockMap = new MockMap();
    function bind(instance: MapboxSource) {
      instance.$closest = vi.fn((query: string) =>
        query === 'MapboxMap'
          ? ({ map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any)
          : undefined,
      );
    }

    const oldEl = h('div', {
      'data-component': 'MapboxSource',
      'data-option-id': 'stores',
      'data-option-source': '{"type":"geojson","data":{"type":"FeatureCollection","features":[]}}',
    });
    const oldInstance = new MapboxSource(oldEl);
    bind(oldInstance);

    vi.useFakeTimers();
    oldInstance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addSource).toHaveBeenCalledTimes(1);
    const source = mockMap.getSource('stores');

    // The replacement mounts (mount scan runs before the terminate scan) while
    // the old instance still owns the id.
    const newData = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 2] }, properties: {} },
      ],
    };
    const newEl = h('div', {
      'data-component': 'MapboxSource',
      'data-option-id': 'stores',
      'data-option-source': JSON.stringify({ type: 'geojson', data: newData }),
    });
    const newInstance = new MapboxSource(newEl);
    bind(newInstance);

    vi.useFakeTimers();
    newInstance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Adopt-or-replace: no second `addSource` (which would throw a duplicate id),
    // the existing source's data is updated instead.
    expect(mockMap.addSource).toHaveBeenCalledTimes(1);
    expect(source.setData).toHaveBeenCalledWith(newData);

    // The old instance now tears down. It must NOT delete the source the new
    // instance has adopted.
    vi.useFakeTimers();
    oldInstance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeSource).not.toHaveBeenCalled();
    expect(mockMap.getSource('stores')).toBeDefined();

    // The new instance, still the owner, removes it on its own teardown.
    vi.useFakeTimers();
    newInstance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeSource).toHaveBeenCalledWith('stores');
  });

  it('should not remove the source on destroy if it does not exist', async () => {
    const { instance, mockMap } = createSource();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // Source is gone by the time the component is destroyed.
    mockMap.getSource = vi.fn(() => undefined);

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeSource).not.toHaveBeenCalled();
  });
});

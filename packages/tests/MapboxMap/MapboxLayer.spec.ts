import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxLayer } from '@studiometa/ui-mapbox';

function createLayer(attrs: Record<string, string> = {}, { withSource = true } = {}) {
  const mockMap = new MockMap();
  // By default the referenced source already exists on the map so the layer is
  // added directly on mount. Pass `withSource: false` to exercise the deferred
  // path where the layer waits for its source to become available.
  if (withSource) {
    mockMap.addSource('test-source', { type: 'geojson' });
  }
  const el = h('div', {
    'data-component': 'MapboxLayer',
    'data-option-id': 'test-layer',
    'data-option-layer': '{"type":"fill","source":"test-source"}',
    ...attrs,
  });

  const instance = new MapboxLayer(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

describe('MapboxLayer component', () => {
  it('should mount and add layer to map', async () => {
    const { instance, mockMap } = createLayer();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addLayer).toHaveBeenCalled();
  });

  it('should set layer id from options', async () => {
    const { instance, mockMap } = createLayer();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const call = mockMap.addLayer.mock.calls[0];
    expect(call[0]).toMatchObject({ id: 'test-layer', type: 'fill', source: 'test-source' });
  });

  it('should pass beforeId option', async () => {
    const { instance, mockMap } = createLayer({
      'data-option-before-id': 'other-layer',
    });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addLayer).toHaveBeenCalledWith(
      expect.anything(),
      'other-layer',
    );
  });

  it('should remove layer on destroy if it exists', async () => {
    const { instance, mockMap } = createLayer();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // The layer was added on mount, so the default mock's `getLayer` (backed by
    // `_layers`) now reports it — no need to force the mock, which would also
    // make the layer look pre-existing at mount and defeat ownership tracking.
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.getLayer).toHaveBeenCalledWith('test-layer');
    expect(mockMap.removeLayer).toHaveBeenCalledWith('test-layer');
  });

  it('should wait for the source before adding the layer when it is missing', async () => {
    const { instance, mockMap } = createLayer({}, { withSource: false });

    await instance.$mount();

    // The source is missing: the layer must not be added yet.
    expect(mockMap.addLayer).not.toHaveBeenCalled();

    // The source becomes available and a `sourcedata` event is fired.
    mockMap.addSource('test-source', { type: 'geojson' });
    mockMap.fire('sourcedata');
    // Flush the microtask scheduling the deferred `addLayer` call.
    await Promise.resolve();
    await Promise.resolve();

    expect(mockMap.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-layer' }),
      '',
    );
  });

  it('should tolerate an id owned by a sibling and not let the old teardown delete it (B3)', async () => {
    // Both instances share ONE map with the referenced source already present.
    const mockMap = new MockMap();
    mockMap.addSource('test-source', { type: 'geojson' });
    function bind(instance: MapboxLayer) {
      instance.$closest = vi.fn((query: string) =>
        query === 'MapboxMap'
          ? ({ map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any)
          : undefined,
      );
    }
    function makeLayer() {
      const el = h('div', {
        'data-component': 'MapboxLayer',
        'data-option-id': 'stores-layer',
        'data-option-layer': '{"type":"fill","source":"test-source"}',
      });
      const instance = new MapboxLayer(el);
      bind(instance);
      return instance;
    }

    const oldInstance = makeLayer();
    vi.useFakeTimers();
    oldInstance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addLayer).toHaveBeenCalledTimes(1);

    // The replacement mounts while the old instance still owns the id.
    const newInstance = makeLayer();
    vi.useFakeTimers();
    newInstance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Tolerate the already-present layer: no second `addLayer` (a duplicate id
    // would throw), ownership passes to the newer instance.
    expect(mockMap.addLayer).toHaveBeenCalledTimes(1);

    // The old instance tears down: it must not delete the adopted layer.
    vi.useFakeTimers();
    oldInstance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeLayer).not.toHaveBeenCalled();
    expect(mockMap.getLayer('stores-layer')).toBeDefined();

    // The new instance, still the owner, removes it on its own teardown.
    vi.useFakeTimers();
    newInstance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeLayer).toHaveBeenCalledWith('stores-layer');
  });

  it('should not remove layer on destroy if it does not exist', async () => {
    const { instance, mockMap } = createLayer();
    mockMap.getLayer = vi.fn(() => undefined);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeLayer).not.toHaveBeenCalled();
  });
});

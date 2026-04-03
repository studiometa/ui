import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import './mock-mapbox-gl.js';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxLayer } from '@studiometa/ui';

function createLayer(attrs: Record<string, string> = {}) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxLayer',
    'data-option-id': 'test-layer',
    'data-option-layer': '{"type":"fill","source":"test-source"}',
    ...attrs,
  });

  const instance = new MapboxLayer(el);
  Object.defineProperty(instance, '$parent', {
    get: () => ({ map: mockMap, $options: { accessToken: 'token' } }),
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
    mockMap.getLayer = vi.fn(() => ({ id: 'test-layer' }));

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.getLayer).toHaveBeenCalledWith('test-layer');
    expect(mockMap.removeLayer).toHaveBeenCalledWith('test-layer');
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

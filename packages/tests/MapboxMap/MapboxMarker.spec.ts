import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import './mock-mapbox-gl.js';
import { MockMap, MockMarker } from './mock-mapbox-gl.js';
import { MapboxMarker } from '@studiometa/ui';

function createMarker(attrs: Record<string, string> = {}) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxMarker',
    'data-option-lng-lat': '[2.35, 48.85]',
    ...attrs,
  });

  const instance = new MapboxMarker(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, $options: { accessToken: 'token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

describe('MapboxMarker component', () => {
  it('should mount and create a marker', async () => {
    const { instance } = createMarker();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.marker).toBeInstanceOf(MockMarker);
  });

  it('should set lngLat and add to map', async () => {
    const { instance, mockMap } = createMarker();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const mockMarker = instance.marker as unknown as MockMarker;
    expect(mockMarker.setLngLat).toHaveBeenCalledWith([2.35, 48.85]);
    expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('should default lngLat to [0, 0]', async () => {
    const mockMap = new MockMap();
    const el = h('div', { 'data-component': 'MapboxMarker' });
    const instance = new MapboxMarker(el);
    instance.$closest = vi.fn((query: string) => {
      if (query === 'MapboxMap') {
        return { map: mockMap, $options: {} } as any;
      }
      return undefined;
    });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.$options.lngLat).toEqual([0, 0]);
  });

  it('should return empty markerOptions by default', async () => {
    const { instance } = createMarker();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.markerOptions).toEqual({});
  });

  it('should remove marker on destroy', async () => {
    const { instance } = createMarker();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    const mockMarker = instance.marker as unknown as MockMarker;
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMarker.remove).toHaveBeenCalled();
  });

  it('should reuse the same marker instance', async () => {
    const { instance } = createMarker();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.marker).toBe(instance.marker);
  });
});

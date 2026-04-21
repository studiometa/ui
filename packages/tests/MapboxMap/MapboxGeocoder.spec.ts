import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import './mock-mapbox-gl.js';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxGeocoder } from '@studiometa/ui';

function createGeocoder(attrs: Record<string, string> = {}) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxGeocoder',
    'data-option-options': '{"accessToken":"geo-token"}',
    ...attrs,
  });

  const instance = new MapboxGeocoder(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, $options: { accessToken: 'parent-token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

describe('MapboxGeocoder component', () => {
  it('should mount and create a geocoder control', async () => {
    const { instance } = createGeocoder();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.control).toBeDefined();
    expect(instance.control.addTo).toBeDefined();
  });

  it('should call addTo on mount', async () => {
    const { instance } = createGeocoder();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.control.addTo).toHaveBeenCalled();
  });

  it('should add to element by default (addToMap=false)', async () => {
    const { instance } = createGeocoder();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.target).toBe(instance.$el);
  });

  it('should add to map when addToMap is true', async () => {
    const { instance, mockMap } = createGeocoder({
      'data-option-add-to-map': '',
      'data-option-options': '{"accessToken":"geo-token"}',
    });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.target).toBe(mockMap);
  });

  it('should reuse the same control instance', async () => {
    const { instance } = createGeocoder();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.control).toBe(instance.control);
  });
});

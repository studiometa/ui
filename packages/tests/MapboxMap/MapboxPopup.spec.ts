import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import './mock-mapbox-gl.js';
import { MockMap, MockPopup } from './mock-mapbox-gl.js';
import { MapboxPopup } from '@studiometa/ui';

function createPopup(attrs: Record<string, string> = {}, isMapParent = true) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxPopup',
    'data-option-lng-lat': '[2.35, 48.85]',
    ...attrs,
  });

  const instance = new MapboxPopup(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, $options: { accessToken: 'token' } } as any;
    }
    if (query === 'MapboxMarker') {
      // If isMapParent is true, we're not inside a marker
      return isMapParent ? undefined : {} as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

describe('MapboxPopup component', () => {
  it('should mount and create a popup', async () => {
    const { instance } = createPopup();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.popup).toBeInstanceOf(MockPopup);
  });

  it('should set lngLat on popup', async () => {
    const { instance } = createPopup();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const mockPopup = instance.popup as unknown as MockPopup;
    expect(mockPopup.setLngLat).toHaveBeenCalledWith([2.35, 48.85]);
  });

  it('should default lngLat to [0, 0]', async () => {
    const mockMap = new MockMap();
    const el = h('div', { 'data-component': 'MapboxPopup' });
    const inst = new MapboxPopup(el);
    inst.$closest = vi.fn((query: string) => {
      if (query === 'MapboxMap') {
        return { map: mockMap, $options: {} } as any;
      }
      if (query === 'MapboxMarker') {
        return undefined;
      }
      return undefined;
    });

    vi.useFakeTimers();
    inst.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(inst.$options.lngLat).toEqual([0, 0]);
  });

  it('should add to map when parent is MapboxMap', async () => {
    const { instance } = createPopup();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const mockPopup = instance.popup as unknown as MockPopup;
    expect(mockPopup.addTo).toHaveBeenCalled();
  });

  it('should return empty popupOptions by default', async () => {
    const { instance } = createPopup();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.popupOptions).toEqual({});
  });

  it('should remove popup on destroy', async () => {
    const { instance } = createPopup();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    const mockPopup = instance.popup as unknown as MockPopup;
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockPopup.remove).toHaveBeenCalled();
  });

  it('should reuse the same popup instance', async () => {
    const { instance } = createPopup();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.popup).toBe(instance.popup);
  });
});

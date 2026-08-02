import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap, MockMarker } from './mock-mapbox-gl.js';
import { MapboxMarker } from '@studiometa/ui-mapbox';

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
      return { map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any;
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
        return { map: mockMap, isLoaded: true, $options: {} } as any;
      }
      return undefined;
    });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.$options.lngLat).toEqual([0, 0]);
  });

  it('should default markerOptions to an empty object', async () => {
    const { instance } = createMarker();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.$options.markerOptions).toEqual({});
  });

  it('should attach a child popup that is present at mount (H8 pull side)', async () => {
    const { instance } = createMarker();
    const fakePopup = { popup: { id: 'popup-instance' } };
    Object.defineProperty(instance, 'popup', { get: () => fakePopup, configurable: true });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const marker = instance.marker as unknown as MockMarker;
    expect(marker.setPopup).toHaveBeenCalledWith(fakePopup.popup);
  });

  it('should attach a child popup pushed after mount via setChildPopup (H8 push side)', async () => {
    const { instance } = createMarker();
    // No popup present when the marker mounts (dynamic append: the popup mounts
    // later and pushes itself).
    Object.defineProperty(instance, 'popup', { get: () => undefined, configurable: true });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const marker = instance.marker as unknown as MockMarker;
    expect(marker.setPopup).not.toHaveBeenCalled();

    // The popup mounts afterwards and pushes itself onto the marker.
    const fakePopup = { popup: { id: 'late-popup' } } as any;
    instance.setChildPopup(fakePopup);
    expect(marker.setPopup).toHaveBeenCalledWith(fakePopup.popup);
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

  it('should not construct a marker on destroy when the marker was never created', async () => {
    const { instance } = createMarker();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // Simulate a teardown where the lazy `get marker()` getter has never
    // populated the backing field (e.g. `$destroy()` called before the marker
    // is used, or a second `$destroy()`): the marker does not exist at teardown
    // time, while the component stays mounted so `destroyed()` still runs.
    (instance as any).__marker = undefined;
    const instanceCountBeforeDestroy = MockMarker.instanceCount;

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Teardown must be side-effect free: it must not go through the lazy getter
    // and construct a brand-new marker just to remove it.
    expect(MockMarker.instanceCount).toBe(instanceCountBeforeDestroy);
    expect((instance as any).__marker).toBeUndefined();
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

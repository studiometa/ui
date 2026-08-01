import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap, MockPopup } from './mock-mapbox-gl.js';
import { MapboxPopup } from '@studiometa/ui-mapbox';

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
      return { map: mockMap, isLoaded: true, $options: { accessToken: 'token' } } as any;
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
        return { map: mockMap, isLoaded: true, $options: {} } as any;
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

  it('should pass popupOptions to the Popup constructor', async () => {
    const { instance } = createPopup({
      'data-option-popup-options': '{"closeButton":false,"offset":25}',
    });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const mockPopup = instance.popup as unknown as MockPopup;
    expect(mockPopup._options).toEqual({ closeButton: false, offset: 25 });
  });

  it('should hide the source element after extracting its content', async () => {
    const { instance } = createPopup();
    instance.$el.innerHTML = '<p>Popup content</p>';

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const mockPopup = instance.popup as unknown as MockPopup;
    expect(mockPopup.setHTML).toHaveBeenCalledWith('<p>Popup content</p>');
    expect(instance.$el.hidden).toBe(true);
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

  it('should not construct a popup on destroy when the popup was never created', async () => {
    const { instance } = createPopup();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    // Simulate a teardown where the lazy `get popup()` getter has never
    // populated the backing field (e.g. `$destroy()` called before the popup
    // is used, or a second `$destroy()`): the popup does not exist at teardown
    // time, while the component stays mounted so `destroyed()` still runs.
    (instance as any).__popup = undefined;
    const instanceCountBeforeDestroy = MockPopup.instanceCount;

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    // Teardown must be side-effect free: it must not go through the lazy getter
    // and construct a brand-new popup just to remove it.
    expect(MockPopup.instanceCount).toBe(instanceCountBeforeDestroy);
    expect((instance as any).__popup).toBeUndefined();
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

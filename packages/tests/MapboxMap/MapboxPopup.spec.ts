import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import './mock-mapbox-gl.js';
import { MockMap, MockPopup } from './mock-mapbox-gl.js';
import { MapboxPopup, MapboxMap } from '@studiometa/ui';

function createPopup(attrs: Record<string, string> = {}, isMapParent = true) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxPopup',
    'data-option-lng-lat': '[2.35, 48.85]',
    ...attrs,
  });

  const instance = new MapboxPopup(el);
  // Use a plain object but make instanceof MapboxMap work via Symbol.hasInstance
  const mockParent: any = { $options: { accessToken: 'token' } };
  Object.defineProperty(mockParent, 'map', { get: () => mockMap, configurable: true });
  if (isMapParent) {
    // Make `mockParent instanceof MapboxMap` return true
    Object.setPrototypeOf(mockParent, MapboxMap.prototype);
  }
  Object.defineProperty(instance, '$parent', { get: () => mockParent, configurable: true });

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
    const mockParent: any = { $options: {} };
    Object.defineProperty(mockParent, 'map', { get: () => mockMap, configurable: true });
    Object.setPrototypeOf(mockParent, MapboxMap.prototype);
    Object.defineProperty(inst, '$parent', { get: () => mockParent, configurable: true });

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

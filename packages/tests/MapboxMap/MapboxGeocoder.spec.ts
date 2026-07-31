import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxGeocoder } from '@studiometa/ui-mapbox';

/**
 * Mount the component and wait for both the timer-based js-toolkit mount and the
 * async `mounted()` hook — which lazily imports `@mapbox/mapbox-gl-geocoder` via
 * a dynamic `import()` — to resolve and create the control.
 * `advanceTimersByTimeAsync` also flushes the microtask queue, so the dynamic
 * import (intercepted by `vi.mock`) settles before we assert.
 */
async function mountAndFlush(instance: MapboxGeocoder) {
  vi.useFakeTimers();
  instance.$mount();
  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();
}

/**
 * Destroy the component and let the timer-based teardown flush.
 */
async function destroyAndFlush(instance: MapboxGeocoder) {
  vi.useFakeTimers();
  instance.$destroy();
  await vi.advanceTimersByTimeAsync(100);
  vi.useRealTimers();
}

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

    await mountAndFlush(instance);

    expect(instance.control).toBeDefined();
    expect(instance.control.addTo).toBeDefined();
  });

  it('should call addTo on mount', async () => {
    const { instance } = createGeocoder();

    await mountAndFlush(instance);

    expect(instance.control.addTo).toHaveBeenCalled();
  });

  it('should add to element by default (addToMap=false)', async () => {
    const { instance } = createGeocoder();

    await mountAndFlush(instance);

    expect(instance.target).toBe(instance.$el);
    expect(instance.control.addTo).toHaveBeenCalledWith(instance.$el);
  });

  it('should add to map when addToMap is true', async () => {
    const { instance, mockMap } = createGeocoder({
      'data-option-add-to-map': '',
      'data-option-options': '{"accessToken":"geo-token"}',
    });

    await mountAndFlush(instance);

    expect(instance.target).toBe(mockMap);
    expect(instance.control.addTo).toHaveBeenCalledWith(mockMap);
  });

  it('should call onRemove on destroy when not added to map', async () => {
    const { instance, mockMap } = createGeocoder();

    await mountAndFlush(instance);

    const { control } = instance;
    await destroyAndFlush(instance);

    expect(control.onRemove).toHaveBeenCalled();
    expect(mockMap.removeControl).not.toHaveBeenCalled();
  });

  it('should call removeControl on destroy when added to map', async () => {
    const { instance, mockMap } = createGeocoder({
      'data-option-add-to-map': '',
      'data-option-options': '{"accessToken":"geo-token"}',
    });

    await mountAndFlush(instance);

    const { control } = instance;
    await destroyAndFlush(instance);

    expect(mockMap.removeControl).toHaveBeenCalledWith(control);
    expect(control.onRemove).not.toHaveBeenCalled();
  });

  it('should not throw when destroyed before the control is created', () => {
    const { instance, mockMap } = createGeocoder();

    // Destroy without mounting: the dynamic import never ran, so no control
    // exists yet. Teardown must be a no-op instead of throwing.
    expect(() => instance.$destroy()).not.toThrow();
    expect(mockMap.removeControl).not.toHaveBeenCalled();
  });

  it('should reuse the same control instance', async () => {
    const { instance } = createGeocoder();

    await mountAndFlush(instance);

    expect(instance.control).toBe(instance.control);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import './mock-mapbox-gl.js';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxMap } from '@studiometa/ui';

function createMapboxMap(attrs: Record<string, string> = {}) {
  return h('div', {
    'data-component': 'MapboxMap',
    'data-option-access-token': 'test-token',
    'data-option-zoom': '10',
    'data-option-center': '[2.35, 48.85]',
    ...attrs,
  }, [
    h('div', { 'data-ref': 'container' }),
  ]);
}

describe('MapboxMap component', () => {
  it('should mount and create a map instance', async () => {
    const root = createMapboxMap();
    const instance = new MapboxMap(root);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.map).toBeInstanceOf(MockMap);
  });

  it('should parse options from data attributes', async () => {
    const root = createMapboxMap();
    const instance = new MapboxMap(root);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.$options.accessToken).toBe('test-token');
    expect(instance.$options.zoom).toBe(10);
    expect(instance.$options.center).toEqual([2.35, 48.85]);
  });

  it('should default center to [0, 0]', async () => {
    const el = h('div', {
      'data-component': 'MapboxMap',
      'data-option-access-token': 'token',
    }, [h('div', { 'data-ref': 'container' })]);
    const instance = new MapboxMap(el);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.$options.center).toEqual([0, 0]);
  });

  it('should set isLoaded after load event', async () => {
    const root = createMapboxMap();
    const instance = new MapboxMap(root);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    expect(instance.isLoaded).toBe(false);
    (instance.map as unknown as MockMap).fire('load');
    await vi.advanceTimersByTimeAsync(100);
    expect(instance.isLoaded).toBe(true);

    vi.useRealTimers();
  });

  it('should emit map-load event on load', async () => {
    const root = createMapboxMap();
    const instance = new MapboxMap(root);
    const handler = vi.fn();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    instance.$on('map-load', handler);
    (instance.map as unknown as MockMap).fire('load');
    await vi.advanceTimersByTimeAsync(100);

    expect(handler).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should forward map events', async () => {
    const root = createMapboxMap();
    const instance = new MapboxMap(root);
    const clickHandler = vi.fn();
    const zoomHandler = vi.fn();
    const dragHandler = vi.fn();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    instance.$on('click', clickHandler);
    instance.$on('zoom', zoomHandler);
    instance.$on('drag', dragHandler);

    const mockMap = instance.map as unknown as MockMap;
    mockMap.fire('click', { type: 'click' });
    mockMap.fire('zoom', { type: 'zoom' });
    mockMap.fire('drag', { type: 'drag' });
    await vi.advanceTimersByTimeAsync(100);

    expect(clickHandler).toHaveBeenCalled();
    expect(zoomHandler).toHaveBeenCalled();
    expect(dragHandler).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should remove map on destroy', async () => {
    const root = createMapboxMap();
    const instance = new MapboxMap(root);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    const mockMap = instance.map as unknown as MockMap;
    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);

    expect(mockMap.remove).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should reuse the same map instance', async () => {
    const root = createMapboxMap();
    const instance = new MapboxMap(root);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    const map1 = instance.map;
    const map2 = instance.map;
    expect(map1).toBe(map2);
  });
});

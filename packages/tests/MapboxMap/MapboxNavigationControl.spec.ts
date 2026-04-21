import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import './mock-mapbox-gl.js';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxNavigationControl } from '@studiometa/ui';

function createControl(attrs: Record<string, string> = {}) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxNavigationControl',
    ...attrs,
  });

  const instance = new MapboxNavigationControl(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, $options: { accessToken: 'token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

describe('MapboxNavigationControl component', () => {
  it('should mount and add control to map', async () => {
    const { instance, mockMap } = createControl();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addControl).toHaveBeenCalledWith(instance.control, 'top-right');
  });

  it('should default position to top-right', async () => {
    const { instance } = createControl();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.$options.position).toBe('top-right');
  });

  it('should use custom position', async () => {
    const { instance, mockMap } = createControl({ 'data-option-position': 'bottom-left' });

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addControl).toHaveBeenCalledWith(instance.control, 'bottom-left');
  });

  it('should remove control on destroy', async () => {
    const { instance, mockMap } = createControl();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeControl).toHaveBeenCalled();
  });

  it('should reuse the same control instance', async () => {
    const { instance } = createControl();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(instance.control).toBe(instance.control);
  });
});

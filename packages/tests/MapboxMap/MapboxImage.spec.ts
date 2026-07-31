import { describe, it, expect, vi } from 'vitest';
import { h } from '#test-utils';
import { MockMap } from './mock-mapbox-gl.js';
import { MapboxImage } from '@studiometa/ui-mapbox';

function createImage(attrs: Record<string, string> = {}) {
  const mockMap = new MockMap();
  const el = h('div', {
    'data-component': 'MapboxImage',
    'data-option-name': 'my-image',
    'data-option-url': '/marker.png',
    ...attrs,
  });

  const instance = new MapboxImage(el);
  // Mock $closest since async component resolution doesn't set it up
  instance.$closest = vi.fn((query: string) => {
    if (query === 'MapboxMap') {
      return { map: mockMap, $options: { accessToken: 'token' } } as any;
    }
    return undefined;
  });

  return { instance, mockMap };
}

describe('MapboxImage component', () => {
  it('should load and add the image on mount', async () => {
    const { instance, mockMap } = createImage();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.loadImage).toHaveBeenCalledWith('/marker.png', expect.any(Function));
    expect(mockMap.hasImage).toHaveBeenCalledWith('my-image');
    expect(mockMap.addImage).toHaveBeenCalledWith('my-image', expect.anything(), expect.anything());
  });

  it('should not add the image if it already exists', async () => {
    const { instance, mockMap } = createImage();
    mockMap.hasImage = vi.fn(() => true);

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.addImage).not.toHaveBeenCalled();
  });

  it('should emit a ready event once the image is registered', async () => {
    const { instance } = createImage();
    const handler = vi.fn();

    vi.useFakeTimers();
    instance.$mount();
    instance.$on('ready', handler);
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(handler).toHaveBeenCalledTimes(1);
    const payload = handler.mock.calls[0][0].detail[0];
    expect(payload).toMatchObject({ name: 'my-image' });
  });

  it('should remove the image on destroy', async () => {
    const { instance, mockMap } = createImage();

    vi.useFakeTimers();
    instance.$mount();
    await vi.advanceTimersByTimeAsync(100);

    instance.$destroy();
    await vi.advanceTimersByTimeAsync(100);
    vi.useRealTimers();

    expect(mockMap.removeImage).toHaveBeenCalledWith('my-image');
  });
});

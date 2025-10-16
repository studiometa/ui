import { describe, it, expect, vi } from 'vitest';
import { Slider } from '@studiometa/ui';
import { h } from '#test-utils';

describe('The Slider component', () => {
  it('should not prevent drag or drop when delta.y is greater than delta.x', async () => {
    const div = h('div', [h('div', { dataComponent: 'SliderItem' })]);
    const slider = new Slider(div);
    const spy = vi.spyOn(slider, '$children', 'get');
    // @ts-expect-error
    spy.mockImplementation(() => ({
      SliderItem: [],
    }));

    slider.onSliderDragDrag({
      args: [
        // @ts-expect-error
        {
          distance: {
            x: 10,
            y: 100,
          },
          delta: {
            x: 10,
            y: 100,
          },
        },
      ],
    });
    expect(slider.__distanceX).toBe(10);
  });
});

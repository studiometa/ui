import { describe, it, expect, vi } from 'vitest';
import {
  Slider as SliderCore,
  SliderBtn,
  SliderCount,
  SliderDrag,
  SliderItem,
} from '@studiometa/ui';
import { getInstanceFromElement } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { h } from '#test-utils';

/**
 * A Slider subclass registering the child controls, mirroring the documented
 * usage where controls are added through `config.components`.
 */
class Slider extends SliderCore {
  static config: BaseConfig = {
    name: 'Slider',
    components: {
      SliderItem,
      SliderDrag,
      SliderCount,
      SliderBtn,
    },
  };
}

function sliderHtml() {
  const root = h('div');
  root.innerHTML = `
    <div data-component="Slider" data-option-contain>
      <div data-component="SliderDrag" data-ref="wrapper">
        <div data-component="SliderItem">1</div>
        <div data-component="SliderItem">2</div>
        <div data-component="SliderItem">3</div>
      </div>
      <button data-component="SliderBtn" data-option-next data-option-contain>Next</button>
      <div data-component="SliderCount"><span data-ref="current">0</span></div>
    </div>
  `;
  return root;
}

describe('The Slider component', () => {
  it('should not prevent drag or drop when delta.y is greater than delta.x', async () => {
    const div = h('div', [h('div', { dataComponent: 'SliderItem' })]);
    const slider = new SliderCore(div);
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

  it('should connect a `contain` SliderBtn on first mount without reading empty geometry', async () => {
    const root = sliderHtml();
    const sliderEl = root.querySelector('[data-component="Slider"]') as HTMLElement;
    const btnEl = root.querySelector('[data-component="SliderBtn"]') as HTMLElement;

    vi.useFakeTimers();
    // A `contain` SliderBtn used to crash on first mount by reading the Slider
    // geometry (`states`) before `Slider.mounted()` had computed it. Reaching
    // the assertions below (rather than an unhandled scheduler error) proves the
    // update no longer runs against a not-yet-initialised Slider.
    const slider = new Slider(sliderEl);
    slider.$mount();
    await vi.advanceTimersByTimeAsync(200);
    vi.useRealTimers();

    const btn = getInstanceFromElement(btnEl, SliderBtn);
    expect(btn?.slider).toBeInstanceOf(SliderCore);
  });
});

describe('A Slider child component', () => {
  it('should synchronise even when fully mounted before its Slider', async () => {
    const root = sliderHtml();
    const sliderEl = root.querySelector('[data-component="Slider"]') as HTMLElement;
    const countEl = root.querySelector('[data-component="SliderCount"]') as HTMLElement;
    const currentRef = countEl.querySelector('[data-ref="current"]') as HTMLElement;

    vi.useFakeTimers();

    // Fully mount the child *before* the Slider is even constructed, so it
    // cannot resolve `$closest('Slider')` on its own.
    const count = new SliderCount(countEl);
    count.$mount();
    await vi.advanceTimersByTimeAsync(200);
    // Not connected yet: the counter still shows its initial markup.
    expect(currentRef.textContent).toBe('0');

    // Mounting the Slider connects the pre-mounted child (parent-side handshake)
    // and seeds the current index (0, rendered as `0 + 1`).
    const slider = new Slider(sliderEl);
    slider.$mount();
    await vi.advanceTimersByTimeAsync(200);
    expect(currentRef.textContent).toBe('1');

    // A later index change propagates through the store subscription, proving
    // the child is genuinely connected (not merely showing the default value).
    slider.goTo(2);
    await vi.advanceTimersByTimeAsync(200);
    expect(currentRef.textContent).toBe('3');

    vi.useRealTimers();
  });
});

describe('The SliderBtn component in `contain` mode', () => {
  function createStates(leftValues: number[]) {
    return leftValues.map((left) => ({ x: { left, center: 0, right: 0 } }));
  }

  it('should be disabled once the parent reaches the max contain state', () => {
    const el = h('button', {
      dataComponent: 'SliderBtn',
      dataOptionNext: true,
      dataOptionContain: true,
    });
    const btn = new SliderBtn(el);

    const states = createStates([0, -10, -20, -100, -100, -100]);
    const fakeSlider = {
      $options: { contain: true, mode: 'left' as const },
      indexMax: 5,
      containMaxState: -100,
      getStates: () => states,
    };
    // Shadow the inherited `slider` getter with a controlled instance.
    Object.defineProperty(btn, 'slider', { configurable: true, get: () => fakeSlider });

    // Index 3 is the first state matching the max contain value → disabled.
    btn.update(3);
    expect(el.hasAttribute('disabled')).toBe(true);

    // Index 2 has not reached the max contain state and is not the last index.
    btn.update(2);
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('should not be disabled when the parent Slider cannot be resolved', () => {
    const el = h('button', {
      dataComponent: 'SliderBtn',
      dataOptionNext: true,
      dataOptionContain: true,
    });
    el.setAttribute('disabled', '');
    const btn = new SliderBtn(el);
    Object.defineProperty(btn, 'slider', { configurable: true, get: () => undefined });

    // With no resolvable Slider the update is a no-op and must not throw.
    expect(() => btn.update(0)).not.toThrow();
    // The pre-existing attribute is left untouched (no dereference happened).
    expect(el.hasAttribute('disabled')).toBe(true);
  });
});

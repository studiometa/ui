import { describe, it, expect, vi, beforeEach } from 'vitest';
// Importing the mock injects the `motion` module double through `provideMotion`
// before the component resolves it below.
import {
  animations,
  mockAnimate,
  mockHover,
  mockPress,
  mockInView,
  mockMotionModule,
  resetMockMotion,
} from './mock-motion.js';
import { Motion } from '@studiometa/ui-motion';
import { h, wait } from '#test-utils';

async function mountMotion(attributes: Record<string, string> = {}) {
  const el = h('div', { dataComponent: 'Motion', ...attributes });
  // Connected on purpose: reading a base value goes through the computed
  // style, which happy-dom only resolves for elements in the document.
  document.body.append(el);
  const instance = new Motion(el);
  await instance.$mount();
  await wait(0);

  return { el, instance };
}

describe('Motion gesture options', () => {
  beforeEach(() => {
    resetMockMotion();
    document.body.innerHTML = '';
  });

  it('should bind nothing without gesture options', async () => {
    await mountMotion({ dataOptionAnimate: '{ "x": 100 }' });

    expect(mockHover.fn).not.toHaveBeenCalled();
    expect(mockPress.fn).not.toHaveBeenCalled();
    expect(mockInView.fn).not.toHaveBeenCalled();
  });

  it('should animate to the hover state and return forward to the base values', async () => {
    const { el, instance } = await mountMotion({
      dataOptionHover: '{ "scale": 1.1 }',
      dataOptionTransition: '{ "duration": 0.2 }',
    });

    expect(mockHover.fn).toHaveBeenCalledTimes(1);
    expect(mockHover.fn.mock.calls[0][0]).toBe(el);

    // Simulate the gesture start: a transient animation to the hover state.
    const end = mockHover.handlers[0](el);
    expect(mockAnimate).toHaveBeenCalledWith(el, { scale: 1.1 }, { duration: 0.2 });
    // The gesture never becomes the current animation.
    expect(instance.controls).toBeNull();

    // Simulate the gesture end: a NEW animation forward to the base value —
    // with no declared `animate`, `scale` returns to Motion's own base of 1.
    const gesture = animations.at(-1);
    (end as () => void)();
    expect(mockAnimate).toHaveBeenLastCalledWith(el, { scale: 1 }, { duration: 0.2 });
    expect(animations).toHaveLength(2);
    // The gesture animation itself is left alone: never rewound, never replayed.
    expect(gesture.speed).toBe(1);
    expect(gesture.playCount).toBe(0);
    // The return stays transient too.
    expect(instance.controls).toBeNull();
  });

  it('should capture the base values once, before the gesture moves the element', async () => {
    const { el } = await mountMotion({ dataOptionHover: '{ "scale": 1.1 }' });

    const firstEnd = mockHover.handlers[0](el) as () => void;
    firstEnd();

    // Hover again while the element sits at the gesture state: the base value
    // is still the one captured on the first gesture, never re-read from an
    // element the gesture already moved.
    el.style.transform = 'matrix(1.1, 0, 0, 1.1, 0, 0)';
    const secondEnd = mockHover.handlers[0](el) as () => void;
    secondEnd();

    expect(animations.at(-1).keyframes).toEqual({ scale: 1 });
  });

  it('should animate to the press state and return forward to the base values', async () => {
    const { el } = await mountMotion({ dataOptionPress: '{ "scale": 0.95 }' });

    expect(mockPress.fn).toHaveBeenCalledTimes(1);
    const end = mockPress.handlers[0](el);
    expect(mockAnimate).toHaveBeenCalledWith(el, { scale: 0.95 }, {});

    const gesture = animations.at(-1);
    (end as () => void)();
    expect(mockAnimate).toHaveBeenLastCalledWith(el, { scale: 1 }, {});
    expect(gesture.speed).toBe(1);
  });

  it('should forward the inView options and return on leave', async () => {
    const { el } = await mountMotion({
      dataOptionInView: '{ "opacity": 1 }',
      dataOptionInViewMargin: '-100px',
      dataOptionInViewAmount: '0.5',
      // The base of a style property is read from the computed style.
      style: 'opacity: 0',
    });

    expect(mockInView.fn).toHaveBeenCalledTimes(1);
    expect(mockInView.optionsCalls[0]).toEqual({ margin: '-100px', amount: 0.5 });

    const leave = mockInView.handlers[0](el);
    expect(mockAnimate).toHaveBeenCalledWith(el, { opacity: 1 }, {});
    expect(typeof leave).toBe('function');

    (leave as () => void)();
    expect(mockAnimate).toHaveBeenLastCalledWith(el, { opacity: 0 }, {});
  });

  it('should keep the reached state and stop watching with once', async () => {
    const { el } = await mountMotion({
      dataOptionInView: '{ "opacity": 1 }',
      dataOptionInViewAmount: 'all',
      dataOptionOnce: '',
    });

    expect(mockInView.optionsCalls[0]).toEqual({ amount: 'all' });

    // No leave handler returned: `inView()` fires once, styles persist.
    const leave = mockInView.handlers[0](el);
    expect(leave).toBeUndefined();
  });

  it('should release the gesture bindings on destroy', async () => {
    const { instance } = await mountMotion({
      dataOptionHover: '{ "scale": 1.1 }',
      dataOptionPress: '{ "scale": 0.95 }',
    });

    await instance.$destroy();
    expect(mockHover.stops[0]).toHaveBeenCalledTimes(1);
    expect(mockPress.stops[0]).toHaveBeenCalledTimes(1);
  });

  it('should warn per gesture option the module cannot honor', async () => {
    // Simulate a `motion/mini` build: no gesture functions.
    mockMotionModule.hover = undefined as never;
    mockMotionModule.press = undefined as never;
    mockMotionModule.inView = undefined as never;

    const el = h('div', {
      dataComponent: 'Motion',
      dataOptionHover: '{ "scale": 1.1 }',
      dataOptionInView: '{ "opacity": 1 }',
    });
    const instance = new Motion(el);
    const warn = vi.fn();
    Object.defineProperty(instance, '$warn', { configurable: true, get: () => warn });

    await instance.$mount();
    await wait(0);

    expect(warn).toHaveBeenCalledTimes(2);
    expect(mockAnimate).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
// Importing the mock injects the `motion` module double through `provideMotion`
// before the components resolve it below.
import {
  viewBuilders,
  mockAnimateView,
  mockAnimateViewState,
  mockMotionModule,
  resetMockMotion,
} from './mock-motion.js';
import { MotionView } from '@studiometa/ui-motion';
import { ViewTransition } from '@studiometa/ui';
import { h } from '#test-utils';

async function mountView(
  attributes: Record<string, string> = {},
  children: HTMLElement[] = [],
) {
  const el = h('div', { dataComponent: 'MotionView', ...attributes }, children);
  const instance = new MotionView(el);
  await instance.$mount();

  return { el, instance };
}

describe('MotionView component', () => {
  beforeEach(() => {
    resetMockMotion();
  });

  it('should have the correct config, mirroring ViewTransition', () => {
    expect(MotionView.config.name).toBe('MotionView');
    expect(MotionView.config.emits).toEqual(ViewTransition.config.emits);
  });

  it('should apply the `view-transition-name` on mount', async () => {
    const { el } = await mountView({ dataOptionViewTransitionName: 'panel' });
    expect(el.style.getPropertyValue('view-transition-name')).toBe('panel');
  });

  it('should run the mutation through a builder targeting its own element', async () => {
    const { el, instance } = await mountView({
      dataOptionTransition: '{ "duration": 0.3 }',
      dataOptionNew: '{ "opacity": [0, 1] }',
      dataOptionOld: '{ "opacity": [1, 0] }',
      dataOptionEnter: '{ "y": [16, 0] }',
      dataOptionExit: '{ "y": [0, -16] }',
      dataOptionLayout: '',
    });
    const mutate = vi.fn();

    await instance.update(mutate);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mockAnimateView).toHaveBeenCalledTimes(1);
    expect(mockAnimateView).toHaveBeenCalledWith(mutate, { duration: 0.3 });
    expect(viewBuilders[0].calls).toEqual([
      ['add', el],
      ['new', { opacity: [0, 1] }],
      ['old', { opacity: [1, 0] }],
      ['enter', { y: [16, 0] }],
      ['exit', { y: [0, -16] }],
      ['layout'],
    ]);
  });

  it('should resolve the `add` selector within its subtree and skip empty options', async () => {
    const cards = [h('div', { class: 'card' }), h('div', { class: 'card' })];
    const { instance } = await mountView({ dataOptionAdd: '.card' }, [
      ...cards,
      h('div', { class: 'not-a-card' }),
    ]);

    await instance.update(() => {});

    // No transition option: the builder receives no root options.
    expect(mockAnimateView.mock.calls[0][1]).toBeUndefined();
    // One `add` per matched element, no layer calls for empty keyframe options.
    expect(viewBuilders[0].calls).toEqual([
      ['add', cards[0]],
      ['add', cards[1]],
    ]);
  });

  it('should warn and still run the mutation without animateView support', async () => {
    // Simulate a `motion/mini` build: the injected module has no `animateView`.
    mockMotionModule.animateView = undefined as never;

    const el = h('div', { dataComponent: 'MotionView' });
    const instance = new MotionView(el);
    const warn = vi.fn();
    Object.defineProperty(instance, '$warn', { configurable: true, get: () => warn });
    await instance.$mount();

    const mutate = vi.fn();
    await instance.update(mutate);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mockAnimateView).not.toHaveBeenCalled();
  });

  it('should swap classes through the builder on enter and leave, emitting in order', async () => {
    const { el, instance } = await mountView({
      class: 'hidden',
      dataOptionLeaveTo: 'hidden',
      dataOptionEnterTo: 'shown',
    });
    const events: string[] = [];
    for (const event of MotionView.config.emits as string[]) {
      el.addEventListener(event, () => events.push(event));
    }

    await instance.enter();
    expect(events).toEqual(['enter', 'enter-start', 'enter-end']);
    expect(instance.state).toBe('entering');
    expect(el.classList.contains('hidden')).toBe(false);
    expect(el.classList.contains('shown')).toBe(true);
    // The class swap ran inside the builder update callback.
    expect(mockAnimateView).toHaveBeenCalledTimes(1);

    events.length = 0;
    await instance.leave();
    expect(events).toEqual(['leave', 'leave-start', 'leave-end']);
    expect(instance.state).toBe('leaving');
    expect(el.classList.contains('shown')).toBe(false);
    expect(el.classList.contains('hidden')).toBe(true);
    expect(mockAnimateView).toHaveBeenCalledTimes(2);
  });

  it('should toggle between enter and leave, entering first', async () => {
    const { instance } = await mountView({ dataOptionEnterTo: 'shown' });

    expect(instance.state).toBe(null);
    await instance.toggle();
    expect(instance.state).toBe('entering');
    await instance.toggle();
    expect(instance.state).toBe('leaving');
    await instance.toggle();
    expect(instance.state).toBe('entering');
  });

  it('should resolve even when the builder rejects, keeping the mutation', async () => {
    // Simulate a graceful-degradation browser: the view animation rejects.
    mockAnimateViewState.reject = true;

    const { instance } = await mountView();
    const mutate = vi.fn();

    await expect(instance.update(mutate)).resolves.toBeUndefined();
    expect(mutate).toHaveBeenCalledTimes(1);
  });
});

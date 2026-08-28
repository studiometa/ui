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
import { captureDiagnostics } from '@studiometa/js-toolkit/test';
import { MotionView } from '@studiometa/ui-motion';
import { ViewTransition } from '@studiometa/ui';
import { h } from '#test-utils';

/**
 * The transition lifecycle both components run, in order.
 *
 * v4 removed the runtime `config.emits` list — the names live in each
 * component's `$emits` props type and are erased at runtime — so "MotionView
 * mirrors ViewTransition" is asserted against what the two actually emit
 * rather than against two arrays neither class carries any more.
 */
const TRANSITION_EVENTS = [
  'enter',
  'enter-start',
  'enter-end',
  'leave',
  'leave-start',
  'leave-end',
];

/** Record the transition events reaching an element, in delivery order. */
function recordTransitionEvents(el: HTMLElement) {
  const events: string[] = [];

  for (const type of TRANSITION_EVENTS) {
    el.addEventListener(type, () => events.push(type));
  }

  return events;
}

async function mountView(attributes: Record<string, string> = {}, children: HTMLElement[] = []) {
  const el = h('div', { dataComponent: 'MotionView', ...attributes }, children);
  const instance = new MotionView(el);
  await instance.$mount();

  return { el, instance };
}

describe('MotionView component', () => {
  beforeEach(() => {
    resetMockMotion();
  });

  it('should have the correct config', () => {
    expect(MotionView.config.name).toBe('MotionView');
  });

  it('should emit the same transition lifecycle as ViewTransition', async () => {
    const { el, instance } = await mountView({ dataOptionEnterTo: 'shown' });
    const viewEl = h('div', { dataComponent: 'ViewTransition', dataOptionEnterTo: 'shown' });
    const viewTransition = new ViewTransition(viewEl);
    await viewTransition.$mount();

    const motionEvents = recordTransitionEvents(el);
    const nativeEvents = recordTransitionEvents(viewEl);

    await instance.enter();
    await instance.leave();
    await viewTransition.enter();
    await viewTransition.leave();

    // Same names, same order: that is what makes MotionView a drop-in
    // replacement, and it is the half of the old `config.emits` comparison that
    // was ever worth asserting.
    expect(motionEvents).toEqual(TRANSITION_EVENTS);
    expect(nativeEvents).toEqual(TRANSITION_EVENTS);

    viewTransition.$unmount();
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
    // `$warn()` reports on the diagnostic channel in v4, so the capture reads
    // the channel rather than stubbing the method or spying on the console.
    const log = captureDiagnostics();
    await instance.$mount();

    const mutate = vi.fn();
    await instance.update(mutate);

    expect(log.codes).toEqual(['motion-view.missing-animate-view']);
    log.stop();
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mockAnimateView).not.toHaveBeenCalled();
  });

  it('should swap classes through the builder on enter and leave, emitting in order', async () => {
    const { el, instance } = await mountView({
      class: 'hidden',
      dataOptionLeaveTo: 'hidden',
      dataOptionEnterTo: 'shown',
    });
    const events = recordTransitionEvents(el);

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

  it('should wrap a `dom-update` announced inside its subtree', async () => {
    const child = h('div');
    const { instance } = await mountView({}, [child]);
    const wrap = vi.fn();

    child.dispatchEvent(new CustomEvent('dom-update', { bubbles: true, detail: { wrap } }));

    expect(wrap).toHaveBeenCalledTimes(1);
    expect(wrap).toHaveBeenCalledWith(instance);

    instance.$unmount();
  });

  it('should not wrap a `dom-update` with the `auto` option disabled', async () => {
    const child = h('div');
    const { instance } = await mountView({ dataOptionNoAuto: '' }, [child]);
    const wrap = vi.fn();

    child.dispatchEvent(new CustomEvent('dom-update', { bubbles: true, detail: { wrap } }));

    expect(wrap).not.toHaveBeenCalled();

    instance.$unmount();
  });

  it('should join the lifecycle of a containing dialog only', async () => {
    const { el, instance } = await mountView();
    const ancestor = h('div', {}, [el]);
    document.body.append(ancestor);
    const sibling = h('div');
    document.body.append(sibling);
    const waitUntil = vi.fn();

    for (const event of ['open', 'close']) {
      ancestor.dispatchEvent(new CustomEvent(event, { bubbles: true, detail: { waitUntil } }));
    }
    expect(waitUntil).toHaveBeenCalledTimes(2);
    expect(waitUntil).toHaveBeenCalledWith(instance);

    waitUntil.mockClear();
    sibling.dispatchEvent(new CustomEvent('open', { bubbles: true, detail: { waitUntil } }));
    el.dispatchEvent(new CustomEvent('open', { bubbles: true, detail: { waitUntil } }));
    expect(waitUntil).not.toHaveBeenCalled();

    instance.$unmount();
    ancestor.remove();
    sibling.remove();
  });

  it('should stop listening once unmounted', async () => {
    const child = h('div');
    const { el, instance } = await mountView({}, [child]);
    const ancestor = h('div', {}, [el]);
    document.body.append(ancestor);
    const wrap = vi.fn();
    const waitUntil = vi.fn();

    instance.$unmount();

    child.dispatchEvent(new CustomEvent('dom-update', { bubbles: true, detail: { wrap } }));
    ancestor.dispatchEvent(new CustomEvent('open', { bubbles: true, detail: { waitUntil } }));
    ancestor.dispatchEvent(new CustomEvent('close', { bubbles: true, detail: { waitUntil } }));

    expect(wrap).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();

    ancestor.remove();
  });
});

import { describe, it, expect, afterEach } from 'vitest';
import { ViewTransition } from '@studiometa/ui';
import { h, mount } from '#test-utils';

/**
 * Install a fake `document.startViewTransition` that runs the update callback
 * and resolves its promises, recording every call. Returns the call list.
 */
function mockStartViewTransition() {
  const calls: Array<() => void | Promise<void>> = [];
  // @ts-expect-error — happy-dom does not implement the View Transitions API.
  document.startViewTransition = (update: () => void | Promise<void>) => {
    calls.push(update);
    const done = Promise.resolve().then(() => update());
    return { finished: done, ready: done, updateCallbackDone: done };
  };
  return calls;
}

afterEach(() => {
  // @ts-expect-error — reset between tests.
  delete document.startViewTransition;
});

describe('The ViewTransition component', () => {
  it('should apply the `view-transition-name` on mount', async () => {
    const transition = new ViewTransition(h('div', { dataOptionViewTransitionName: 'panel' }));
    await mount(transition);
    expect(transition.$el.style.getPropertyValue('view-transition-name')).toBe('panel');
  });

  it('should toggle state classes on enter and leave', async () => {
    mockStartViewTransition();
    const transition = new ViewTransition(
      h('div', { class: 'hidden', dataOptionLeaveTo: 'hidden', dataOptionEnterTo: 'shown' }),
    );
    await mount(transition);

    await transition.enter();
    expect(transition.$el.classList.contains('hidden')).toBe(false);
    expect(transition.$el.classList.contains('shown')).toBe(true);

    await transition.leave();
    expect(transition.$el.classList.contains('shown')).toBe(false);
    expect(transition.$el.classList.contains('hidden')).toBe(true);
  });

  it('should track its state and toggle between enter and leave', async () => {
    mockStartViewTransition();
    const transition = new ViewTransition(h('div', { dataOptionLeaveTo: 'hidden' }));
    await mount(transition);

    expect(transition.state).toBe(null);
    await transition.toggle();
    expect(transition.state).toBe('entering');
    await transition.toggle();
    expect(transition.state).toBe('leaving');
    await transition.toggle();
    expect(transition.state).toBe('entering');
  });

  it('should batch concurrent transitions into a single view transition', async () => {
    const calls = mockStartViewTransition();
    const a = new ViewTransition(h('div', { class: 'hidden', dataOptionLeaveTo: 'hidden' }));
    const b = new ViewTransition(h('div', { class: 'hidden', dataOptionLeaveTo: 'hidden' }));
    await mount(a, b);

    // Both fired synchronously in the same tick -> one coordinated transition.
    await Promise.all([a.enter(), b.enter()]);

    expect(calls.length).toBe(1);
    expect(a.$el.classList.contains('hidden')).toBe(false);
    expect(b.$el.classList.contains('hidden')).toBe(false);
  });

  it('should fall back to a synchronous update when the API is unavailable', async () => {
    // No mock installed: `document.startViewTransition` is undefined.
    const transition = new ViewTransition(h('div', { class: 'hidden', dataOptionLeaveTo: 'hidden' }));
    await mount(transition);

    await transition.enter();
    expect(transition.$el.classList.contains('hidden')).toBe(false);
  });
});
